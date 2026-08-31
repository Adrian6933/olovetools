import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ClipboardCopy,
  Copy,
  Crop as CropIcon,
  Download,
  Eye,
  FlipHorizontal2,
  FlipVertical2,
  Keyboard,
  Layers,
  Link2,
  Link2Off,
  Loader2,
  Package,
  Redo2,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Ruler,
  Scan,
  Scissors,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import {
  CropHeroArt,
  DropArt,
  IconFullRes,
  IconHandoff,
  IconHistory,
  IconLocalCrop,
  IconPresets,
  IconStraighten,
  StepDrop,
  StepExport,
  StepFrame,
  StepTune,
} from './components/Illustrations';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import type {
  AspectRatioPreset,
  BatchItem,
  CropResult,
  EditorSnapshot,
  FitMode,
  GridMode,
  ItemFrame,
  OutputFormat,
  Tab,
} from './types';
import {
  ACCEPTED_INPUT,
  ASPECT_PRESETS,
  CROPPER_TEMPLATE,
  extensionFor,
  formatBytes,
  isHeic,
  matrixAngle,
  mayHaveAlpha,
  ratioFor,
  readImageSize,
  simplifyRatio,
  SIZE_PRESETS,
} from './lib/crop';
import {
  encode,
  encodeToTargetBytes,
  findContentBounds,
  loadImage,
  renderCrop,
  rotatedBounds,
  withDpi,
  type RelRect,
} from './lib/render';

interface CropsnapProps {
  lang: Language;
  dictionary?: any;
}

/** Anything past this and a browser canvas starts refusing to allocate. */
const MAX_EXPORT_SIDE = 16384;

/**
 * One framing, adjusted to one particular photo.
 *
 * The crop travels as fractions, and the same fractions on a differently shaped
 * image are a different aspect ratio — so when the framing has a ratio to keep,
 * the box is shrunk back onto it rather than grown, which would push the frame
 * off the edge of the picture.
 *
 * What is preserved while it shrinks is the *centre*, not the top-left corner:
 * anchoring the corner is what made a crop centred on a square photo sit hard
 * against the left edge of the next 16:9 one. A frame in the middle stays in
 * the middle whatever the shape of the photo, and an off-centre one keeps its
 * relative position. Idempotent, and it deliberately matches what `applyFrame`
 * does on screen: the preview and the exported file have to agree.
 */
function fitFrame(frame: ItemFrame, item: BatchItem): ItemFrame {
  const bounds = rotatedBounds(item.width, item.height, frame.rotation);
  if (!(bounds.width > 0) || !(bounds.height > 0)) return frame;

  const ratio = ratioFor(frame.aspect, item);
  // The centre travels as a fraction too, so "middle of the photo" means the
  // middle of whichever photo this is.
  const centreX = (frame.rel.x + frame.rel.width / 2) * bounds.width;
  const centreY = (frame.rel.y + frame.rel.height / 2) * bounds.height;

  let width = frame.rel.width * bounds.width;
  let height = frame.rel.height * bounds.height;

  if (ratio > 0) {
    if (width / height > ratio) width = height * ratio;
    else height = width / ratio;
    // A ratio far from the photo's own can still overflow the short side after
    // that first pass — pull it back on the other axis, keeping the ratio.
    if (width > bounds.width) {
      width = bounds.width;
      height = width / ratio;
    }
    if (height > bounds.height) {
      height = bounds.height;
      width = height * ratio;
    }
  } else {
    width = Math.min(width, bounds.width);
    height = Math.min(height, bounds.height);
  }

  const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), Math.max(0, max));
  const x = clamp(centreX - width / 2, bounds.width - width);
  const y = clamp(centreY - height / 2, bounds.height - height);

  return {
    ...frame,
    rel: {
      x: x / bounds.width,
      y: y / bounds.height,
      width: width / bounds.width,
      height: height / bounds.height,
    },
  };
}

/**
 * The export size for one image: the pinned numbers when the user typed any,
 * and otherwise the crop's own pixel size *on that particular photo* — which is
 * not the same number for a 6000 px shot and a 900 px one.
 */
function sizeFor(item: BatchItem, frame: ItemFrame): { width: number; height: number } {
  const bounds = rotatedBounds(item.width, item.height, frame.rotation);
  return {
    width: Number(frame.outWidth) || Math.max(1, Math.round(frame.rel.width * bounds.width)),
    height: Number(frame.outHeight) || Math.max(1, Math.round(frame.rel.height * bounds.height)),
  };
}

export const Cropsnap: React.FC<CropsnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};
  const prefersReduced = useReducedMotion();

  // --- Sources --------------------------------------------------------------
  // A queue rather than a single file: the same framing can then be applied to
  // every photo in it, which is the whole point of the batch mode.
  const [sources, setSources] = useState<BatchItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'exporting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);

  const source = sources.find(item => item.id === activeId) || null;

  // --- Framing across the queue ---------------------------------------------
  // One framing rules the whole queue. An image that needs something else opts
  // out of it, one at a time — there is no mode to put the tool into first.
  /** Ids that have opted out of the common framing. */
  const [independent, setIndependent] = useState<Set<string>>(new Set());
  /** What each of those is framed as. Shared images are not in here. */
  const [frames, setFrames] = useState<Record<string, ItemFrame>>({});
  /** Bumped to rebuild the cropper on the image already mounted. */
  const [reinitKey, setReinitKey] = useState(0);

  // --- Editor ---------------------------------------------------------------
  const [tab, setTab] = useState<Tab>('crop');
  const [aspect, setAspect] = useState<AspectRatioPreset>('free');
  const [sizePresetId, setSizePresetId] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [gridMode, setGridMode] = useState<GridMode>('thirds');

  /** Live selection size in real source pixels. */
  const [cropPx, setCropPx] = useState({ width: 0, height: 0 });

  // --- Output ---------------------------------------------------------------
  const [outWidth, setOutWidth] = useState('');
  const [outHeight, setOutHeight] = useState('');
  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [quality, setQuality] = useState(92);
  const [matte, setMatte] = useState('#ffffff');
  const [fit, setFit] = useState<FitMode>('cover');
  const [dpi, setDpi] = useState(72);
  const [targetKb, setTargetKb] = useState(0);
  const [result, setResult] = useState<CropResult | null>(null);
  const [copied, setCopied] = useState(false);

  // --- History --------------------------------------------------------------
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [historyAt, setHistoryAt] = useState(-1);

  // --- Chrome ---------------------------------------------------------------
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // --- Refs -----------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);
  const resultUrlRef = useRef<string | null>(null);
  const listenersRef = useRef<Array<() => void>>([]);
  const restoringRef = useRef(false);
  const historyTimerRef = useRef<number | null>(null);

  const hasImage = !!source;
  const upscaling = cropPx.width > 0 && Number(outWidth) > cropPx.width * 1.02;
  const activeIsIndependent = !!activeId && independent.has(activeId);

  /** The live rotation, readable from callbacks that must not go stale. */
  const rotationRef = useRef(0);
  rotationRef.current = rotation;

  // The queue state, mirrored so the cropper lifecycle — which is deliberately
  // rebuilt as little as possible — can read it without becoming a dependency.
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;
  const independentRef = useRef<Set<string>>(independent);
  independentRef.current = independent;
  const framesRef = useRef<Record<string, ItemFrame>>({});
  framesRef.current = frames;
  /** The framing new and unedited images inherit. */
  const sharedFrameRef = useRef<ItemFrame | null>(null);
  /** True while a freshly built cropper is being put into its starting pose. */
  const seedingRef = useRef(false);

  // ==========================================================================
  // Teardown
  // ==========================================================================
  const detachListeners = useCallback(() => {
    listenersRef.current.forEach(off => off());
    listenersRef.current = [];
  }, []);

  const destroyCropper = useCallback(() => {
    detachListeners();
    try {
      cropperRef.current?.destroy();
    } catch {
      /* already gone */
    }
    cropperRef.current = null;
  }, [detachListeners]);

  /** Every queued file holds an object URL; dropping the queue frees them all. */
  const releaseSources = useCallback((items: BatchItem[]) => {
    items.forEach(item => URL.revokeObjectURL(item.url));
  }, []);

  const releaseResult = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }, []);

  const sourcesRef = useRef<BatchItem[]>([]);
  sourcesRef.current = sources;

  useEffect(
    () => () => {
      destroyCropper();
      releaseSources(sourcesRef.current);
      releaseResult();
      if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
    },
    [destroyCropper, releaseSources, releaseResult]
  );

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Export preferences survive a reload: nobody wants to re-pick WebP at 80%
  // and 300 dpi every single visit.
  const PREFS_KEY = 'cropsnap:prefs';
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
      if (!saved) return;
      if (saved.quality) setQuality(saved.quality);
      if (saved.dpi) setDpi(saved.dpi);
      if (saved.fit) setFit(saved.fit);
      if (saved.gridMode) setGridMode(saved.gridMode);
      if (saved.matte) setMatte(saved.matte);
    } catch {
      /* private mode, or a stale shape — defaults are fine */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ quality, dpi, fit, gridMode, matte }));
    } catch {
      /* storage disabled */
    }
  }, [quality, dpi, fit, gridMode, matte]);

  // ==========================================================================
  // Geometry helpers
  // ==========================================================================
  /**
   * The crop expressed as a fraction of the rotated image, read from the two
   * on-screen boxes. Screen rects already include the rotation and the fit
   * scale, so this one number set works for the image in the editor *and* for
   * any other photo the same framing gets applied to.
   */
  const readCropRect = useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper || !source) return null;
    const selection = cropper.getCropperSelection();
    const image = cropper.getCropperImage();
    if (!selection || !image) return null;

    const imageBox = (image as HTMLElement).getBoundingClientRect();
    const selectionBox = (selection as HTMLElement).getBoundingClientRect();
    if (!imageBox.width || !imageBox.height) return null;

    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const x = clamp((selectionBox.left - imageBox.left) / imageBox.width);
    const y = clamp((selectionBox.top - imageBox.top) / imageBox.height);
    const rel: RelRect = {
      x,
      y,
      width: clamp(selectionBox.width / imageBox.width - Math.max(0, x + selectionBox.width / imageBox.width - 1)),
      height: clamp(selectionBox.height / imageBox.height - Math.max(0, y + selectionBox.height / imageBox.height - 1)),
    };

    // Read through the ref: a rotate updates the matrix before React re-renders,
    // and a stale `rotation` here would size the crop against the old bounds.
    const bounds = rotatedBounds(source.width, source.height, rotationRef.current);
    return {
      selection,
      image,
      rel,
      width: Math.max(1, Math.round(rel.width * bounds.width)),
      height: Math.max(1, Math.round(rel.height * bounds.height)),
    };
  }, [source]);

  const snapshot = useCallback((): EditorSnapshot | null => {
    const rect = readCropRect();
    if (!rect) return null;
    return {
      x: rect.selection.x,
      y: rect.selection.y,
      width: rect.selection.width,
      height: rect.selection.height,
      matrix: Array.from(rect.image.$getTransform() as number[]),
      flipX,
      flipY,
      aspect,
    };
  }, [readCropRect, flipX, flipY, aspect]);

  /**
   * The framing as something that can outlive this image: fractions of the
   * rotated source instead of on-screen pixels, so it can be replayed on any
   * other photo in the queue no matter its size.
   */
  const captureFrame = useCallback((): ItemFrame | null => {
    const rect = readCropRect();
    if (!rect) return null;
    return {
      rel: rect.rel,
      rotation: rotationRef.current,
      flipX,
      flipY,
      aspect,
      outWidth,
      outHeight,
      sizePresetId,
    };
  }, [readCropRect, flipX, flipY, aspect, outWidth, outHeight, sizePresetId]);

  const captureFrameRef = useRef(captureFrame);
  captureFrameRef.current = captureFrame;

  /**
   * Files the current framing against the active image. Everything reads
   * through refs, so this stays stable and can be called from the cropper's own
   * listeners without tearing the cropper down.
   */
  const persistFrame = useCallback(() => {
    const frame = captureFrameRef.current();
    const id = activeIdRef.current;
    if (!frame || !id) return;

    if (independentRef.current.has(id)) {
      setFrames(previous => ({ ...previous, [id]: frame }));
      return;
    }
    // Re-framing any image that still follows the common framing *is* the way
    // to change it. Seeding is excluded: an image merely being fitted to the
    // framing it was handed does not get to redefine it for everyone else.
    if (!seedingRef.current) sharedFrameRef.current = frame;
  }, []);

  /** Lets `commitSelection` reach the latest `pushHistory` without depending on it. */
  const pushHistoryRef = useRef<() => void>(() => {});

  const pushHistory = useCallback(() => {
    if (restoringRef.current) return;
    if (historyTimerRef.current) window.clearTimeout(historyTimerRef.current);
    // Dragging a handle fires dozens of change events; only the resting state
    // is worth an undo entry.
    historyTimerRef.current = window.setTimeout(() => {
      persistFrame();
      const shot = snapshot();
      if (!shot) return;
      setHistory(prev => {
        const trimmed = prev.slice(0, historyAt + 1);
        const last = trimmed[trimmed.length - 1];
        const sameRect =
          last &&
          Math.abs(last.x - shot.x) < 0.5 &&
          Math.abs(last.y - shot.y) < 0.5 &&
          Math.abs(last.width - shot.width) < 0.5 &&
          Math.abs(last.height - shot.height) < 0.5;
        const sameMatrix =
          last && last.matrix.every((n, i) => Math.abs(n - shot.matrix[i]) < 0.0001);
        if (sameRect && sameMatrix) return prev;
        const next = [...trimmed, shot].slice(-40);
        setHistoryAt(next.length - 1);
        return next;
      });
    }, 260);
  }, [snapshot, historyAt, persistFrame]);

  const applySnapshot = useCallback(
    (shot: EditorSnapshot) => {
      const cropper = cropperRef.current;
      if (!cropper) return;
      const selection = cropper.getCropperSelection();
      const image = cropper.getCropperImage();
      if (!selection || !image) return;

      restoringRef.current = true;
      try {
        setAspect(shot.aspect);
        selection.aspectRatio = ratioFor(shot.aspect, source || undefined);
        // Restoring the matrix wholesale keeps the initial fit scale intact;
        // rebuilding it from rotate/flip would drop the image back to 1:1.
        image.$setTransform(...(shot.matrix as [number, number, number, number, number, number]));
        setRotation(matrixAngle(shot.matrix));
        setFlipX(shot.flipX);
        setFlipY(shot.flipY);
        selection.$change(shot.x, shot.y, shot.width, shot.height, undefined, true);
        selection.$render();
      } finally {
        window.setTimeout(() => {
          restoringRef.current = false;
        }, 60);
      }
    },
    [source]
  );

  const undo = useCallback(() => {
    if (historyAt <= 0) return;
    const next = historyAt - 1;
    setHistoryAt(next);
    applySnapshot(history[next]);
  }, [historyAt, history, applySnapshot]);

  const redo = useCallback(() => {
    if (historyAt >= history.length - 1) return;
    const next = historyAt + 1;
    setHistoryAt(next);
    applySnapshot(history[next]);
  }, [historyAt, history, applySnapshot]);

  // ==========================================================================
  // Cropper lifecycle
  // ==========================================================================
  /** Mirrored in a ref so the sync below never has to setState from inside a
   *  setState updater just to find out whether a size is pinned. */
  const sizePresetRef = useRef<string | null>(null);
  sizePresetRef.current = sizePresetId;

  const syncFromSelection = useCallback(() => {
    const rect = readCropRect();
    if (!rect) return;
    setCropPx({ width: rect.width, height: rect.height });
    // The output box follows the selection only while no exact size is pinned.
    if (!sizePresetRef.current) {
      setOutWidth(String(rect.width));
      setOutHeight(String(rect.height));
    }
  }, [readCropRect]);

  /**
   * A programmatic `$change()` does not emit the `change` event the listener
   * relies on, so anything that moves the selection from code has to say so.
   * The timeout lets the element's own styles land before the rects are read.
   */
  const commitSelection = useCallback(() => {
    window.setTimeout(() => {
      syncFromSelection();
      pushHistoryRef.current();
    }, 0);
  }, [syncFromSelection]);

  /**
   * Puts a stored framing back on screen, on whichever image is mounted now.
   * The cropper is freshly built at this point — 0°, unmirrored — so the pose
   * can be replayed from scratch rather than diffed against anything.
   */
  const applyFrame = useCallback((raw: ItemFrame, item: BatchItem): boolean => {
    const frame = fitFrame(raw, item);
    const cropper = cropperRef.current;
    const image = cropper?.getCropperImage();
    const selection = cropper?.getCropperSelection();
    const canvasEl = cropper?.getCropperCanvas() as HTMLElement | null;
    if (!image || !selection || !canvasEl) return false;

    // Rotate first, then mirror: the same order `renderCrop` draws in, so the
    // editor and the exported file cannot disagree about what "flipped" means.
    if (frame.rotation) image.$rotate(`${frame.rotation}deg`);
    if (frame.flipX || frame.flipY) image.$scale(frame.flipX ? -1 : 1, frame.flipY ? -1 : 1);

    const imageBox = (image as unknown as HTMLElement).getBoundingClientRect();
    const canvasBox = canvasEl.getBoundingClientRect();
    if (!imageBox.width || !imageBox.height) return false;

    // `fitFrame` has already reconciled the box with the ratio, so this is a
    // straight scale from fractions into canvas units.
    selection.aspectRatio = ratioFor(frame.aspect, item);
    selection.$change(
      imageBox.left - canvasBox.left + frame.rel.x * imageBox.width,
      imageBox.top - canvasBox.top + frame.rel.y * imageBox.height,
      frame.rel.width * imageBox.width,
      frame.rel.height * imageBox.height,
      undefined,
      true
    );
    selection.$render();

    setRotation(frame.rotation);
    setFlipX(frame.flipX);
    setFlipY(frame.flipY);
    setAspect(frame.aspect);
    setSizePresetId(frame.sizePresetId);
    // Without a pinned size the output box just follows the new selection.
    if (frame.sizePresetId) {
      setOutWidth(frame.outWidth);
      setOutHeight(frame.outHeight);
    }
    return true;
  }, []);

  /** The framing this image should open with, or `null` for a fresh default. */
  const frameToOpenWith = useCallback((): ItemFrame | null => {
    const id = activeIdRef.current;
    if (!id) return null;
    if (independentRef.current.has(id)) return framesRef.current[id] ?? sharedFrameRef.current;
    return sharedFrameRef.current;
  }, []);

  // The cropper must be built once per image. Reading the callbacks through a
  // ref keeps `initCropper` stable — depending on them directly meant every
  // history entry changed `pushHistory`, which tore the cropper down and
  // rebuilt it, silently throwing away the rotation the user had just applied.
  pushHistoryRef.current = pushHistory;

  const handlersRef = useRef({ syncFromSelection, pushHistory, snapshot, applyFrame, frameToOpenWith });
  handlersRef.current = { syncFromSelection, pushHistory, snapshot, applyFrame, frameToOpenWith };

  const initCropper = useCallback(
    async (img: HTMLImageElement, item: BatchItem) => {
      destroyCropper();
      // Nothing that happens between here and the end of `$ready` is the user
      // re-framing anything, so none of it may flag the image as customised.
      seedingRef.current = true;
      const CropperClass = (await import('cropperjs')).default;
      // The template is the only configuration surface in v2, and the library
      // default leaves wheel-zoom and keyboard support switched off.
      const cropper = new CropperClass(img, { template: CROPPER_TEMPLATE });
      cropperRef.current = cropper;

      const selection = cropper.getCropperSelection();
      const image = cropper.getCropperImage();

      if (selection) {
        const onChange = () => {
          handlersRef.current.syncFromSelection();
          handlersRef.current.pushHistory();
        };
        selection.addEventListener('change', onChange);
        listenersRef.current.push(() => selection.removeEventListener('change', onChange));
      }
      const canvasEl = cropper.getCropperCanvas() as unknown as HTMLElement | null;
      if (canvasEl && image) {
        // Cropper's own wheel handler is not anchored on the pointer — the
        // point under the cursor drifts ~34 px per notch. Owning the listener
        // (with `zoomable` left off the image) lets the zoom origin be the
        // cursor, which is what "zoom into that detail" actually means.
        const onWheel = (event: WheelEvent) => {
          event.preventDefault();
          const step = event.deltaY > 0 ? -0.1 : 0.1;
          // `$zoom` measures its origin from the top-left of the *image's own*
          // bounding rect, not the viewport and not the canvas — passing client
          // coordinates straight through puts the anchor hundreds of px off.
          const box = (image as HTMLElement).getBoundingClientRect();
          image.$zoom(step, event.clientX - box.left, event.clientY - box.top);
        };
        canvasEl.addEventListener('wheel', onWheel, { passive: false });
        listenersRef.current.push(() => canvasEl.removeEventListener('wheel', onWheel));
      }

      if (image) {
        const onTransform = () => handlersRef.current.syncFromSelection();
        image.addEventListener('transform', onTransform);
        listenersRef.current.push(() => image.removeEventListener('transform', onTransform));

        image.$ready(() => {
          // The default selection is 85% of the *canvas*, which overflows the
          // letterboxed image and reads a stale scale. Sit it on the image
          // instead, once the initial fit transform has actually been applied.
          window.setTimeout(() => {
            const canvasEl = cropper.getCropperCanvas();
            if (selection && canvasEl) {
              // An image the queue already has a framing for opens with it;
              // only a genuinely new one starts from the default inset.
              const stored = handlersRef.current.frameToOpenWith();
              const restored = stored ? handlersRef.current.applyFrame(stored, item) : false;
              const canvasBox = canvasEl.getBoundingClientRect();
              const imageBox = (image as unknown as HTMLElement).getBoundingClientRect();
              if (!restored && imageBox.width > 0 && imageBox.height > 0) {
                const inset = 0.06;
                selection.$change(
                  imageBox.left - canvasBox.left + imageBox.width * inset,
                  imageBox.top - canvasBox.top + imageBox.height * inset,
                  imageBox.width * (1 - inset * 2),
                  imageBox.height * (1 - inset * 2),
                  undefined,
                  true
                );
                selection.$render();
              }
            }
            setStatus('ready');
            handlersRef.current.syncFromSelection();
            const shot = handlersRef.current.snapshot();
            if (shot) {
              setHistory([shot]);
              setHistoryAt(0);
            }
            // Past the 260 ms history debounce, so the seeding change above has
            // been filed before hand-made changes start counting again.
            window.setTimeout(() => {
              seedingRef.current = false;
            }, 400);
          }, 0);
        });
      }
    },
    [destroyCropper]
  );

  // Mounting the <img> and initialising the cropper have to happen in that
  // order; an effect on the URL guarantees it instead of a setTimeout race.
  // `reinitKey` is how "put the common framing back on this image" is done:
  // replaying a pose needs a cropper that starts at 0° and unmirrored.
  useEffect(() => {
    if (!source || !imageRef.current) return;
    void initCropper(imageRef.current, source);
    return () => destroyCropper();
  }, [source, reinitKey, initCropper, destroyCropper]);

  // The composition guides live on <cropper-grid>; the golden ratio is just a
  // different number of rows and columns on the same element.
  useEffect(() => {
    const grid = cropperRef.current?.getCropperSelection()?.querySelector('cropper-grid') as any;
    if (!grid) return;
    if (gridMode === 'none') {
      grid.hidden = true;
      return;
    }
    grid.hidden = false;
    grid.rows = gridMode === 'golden' ? 5 : 3;
    grid.columns = gridMode === 'golden' ? 5 : 3;
  }, [gridMode, status, source]);

  // ==========================================================================
  // Intake
  // ==========================================================================
  /** Decodes one file into a queue entry, converting Apple formats on the way. */
  const prepare = useCallback(async (file: File): Promise<BatchItem | null> => {
    if (!file || (!file.type.startsWith('image/') && !isHeic(file))) return null;
    let usable = file;
    if (isHeic(file)) {
      const heic2any = (await import('heic2any')).default;
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.94 });
      usable = new File([converted as Blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
        type: 'image/jpeg',
      });
    }
    const url = URL.createObjectURL(usable);
    const size = await readImageSize(url);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: usable,
      url,
      width: size.width,
      height: size.height,
      hasAlpha: mayHaveAlpha(usable),
    };
  }, []);

  const loadFiles = useCallback(
    async (files: File[]) => {
      const usable = files.filter(f => f.type.startsWith('image/') || isHeic(f));
      if (!usable.length) return;

      setError(null);
      setNotice(null);
      setStatus('loading');
      setResult(null);
      releaseResult();

      try {
        const prepared = (await Promise.all(usable.map(prepare))).filter(Boolean) as BatchItem[];
        if (!prepared.length) throw new Error('none decoded');

        setSources(previous => {
          releaseSources(previous);
          return prepared;
        });
        setActiveId(prepared[0].id);
        destroyCropper();
        // A new queue starts with no framing at all, so the first image opens
        // on the default inset rather than inheriting the last session's crop.
        sharedFrameRef.current = null;
        setFrames({});
        setIndependent(new Set());
        setHistory([]);
        setHistoryAt(-1);
        setRotation(0);
        setFlipX(false);
        setFlipY(false);
        setSizePresetId(null);
        setAspect('free');
        // A photo off a phone is a JPEG; a cutout is a PNG and must keep its
        // transparency, so the format defaults to whatever came in.
        setFormat(prepared[0].hasAlpha ? 'image/png' : 'image/jpeg');
      } catch {
        setError(t.errorLoad || 'That image could not be read. Try a different file.');
        setStatus('error');
      }
    },
    [prepare, destroyCropper, releaseSources, releaseResult, t]
  );

  /** Adds to the queue without disturbing the framing already set up. */
  const appendFiles = useCallback(
    async (files: File[]) => {
      const usable = files.filter(f => f.type.startsWith('image/') || isHeic(f));
      if (!usable.length) return;
      const prepared = (await Promise.all(usable.map(prepare))).filter(Boolean) as BatchItem[];
      if (prepared.length) setSources(previous => [...previous, ...prepared]);
    },
    [prepare]
  );

  // Picks up an image handed over by another tool (a cutout, a compressed file).
  useHandoffIntake(file => void loadFiles([file]));

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) void (sources.length ? appendFiles(files) : loadFiles(files));
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) void (sources.length ? appendFiles(files) : loadFiles(files));
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        void loadFiles([file]);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [loadFiles]);

  const removeSource = useCallback(
    (id: string) => {
      setSources(previous => {
        const target = previous.find(item => item.id === id);
        if (target) URL.revokeObjectURL(target.url);
        const next = previous.filter(item => item.id !== id);
        if (id === activeId) setActiveId(next[0]?.id ?? null);
        return next;
      });
      setFrames(previous => {
        const { [id]: dropped, ...rest } = previous;
        return rest;
      });
      setIndependent(previous => {
        if (!previous.has(id)) return previous;
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
    },
    [activeId]
  );

  /**
   * Opts the image in the editor out of the common framing, or puts it back
   * under it. This is the whole per-image story: no mode to switch the tool
   * into, just this one image saying it needs something else.
   */
  const toggleIndependent = useCallback(() => {
    const id = activeId;
    if (!id) return;

    if (independent.has(id)) {
      setIndependent(previous => {
        const next = new Set(previous);
        next.delete(id);
        return next;
      });
      setFrames(previous => {
        const { [id]: dropped, ...rest } = previous;
        return rest;
      });
      // Back under the common framing, and back on screen showing it.
      if (sharedFrameRef.current) setReinitKey(key => key + 1);
      return;
    }

    // Opting out starts from whatever is on screen right now, so nothing jumps.
    const frame = captureFrame();
    setIndependent(previous => new Set(previous).add(id));
    if (frame) setFrames(previous => ({ ...previous, [id]: frame }));
  }, [activeId, independent, captureFrame]);

  /** Makes the framing on screen the common one again, for every image. */
  const applyFrameToAll = useCallback(() => {
    const frame = captureFrame();
    if (!frame || sources.length < 2) return;
    sharedFrameRef.current = frame;
    setFrames({});
    setIndependent(new Set());
    setNotice(
      (t.applyToAllDone || 'That framing is now on all {0} images.').replace('{0}', String(sources.length))
    );
    setReinitKey(key => key + 1);
  }, [captureFrame, sources, t]);

  // ==========================================================================
  // Editor actions
  // ==========================================================================
  const applyAspect = useCallback(
    (preset: AspectRatioPreset) => {
      setAspect(preset);
      setSizePresetId(null);
      const cropper = cropperRef.current;
      const selection = cropper?.getCropperSelection();
      if (!selection) return;
      selection.aspectRatio = ratioFor(preset, source || undefined);
      selection.$render();
      commitSelection();
    },
    [source, pushHistory]
  );

  const applySizePreset = useCallback(
    (id: string) => {
      const preset = SIZE_PRESETS.find(p => p.id === id);
      if (!preset) return;
      setSizePresetId(id);
      setOutWidth(String(preset.width));
      setOutHeight(String(preset.height));
      const cropper = cropperRef.current;
      const selection = cropper?.getCropperSelection();
      if (!selection) return;
      selection.aspectRatio = preset.width / preset.height;
      selection.$render();
      commitSelection();
    },
    [pushHistory]
  );

  /** The matrix is the source of truth; the state only mirrors it for display. */
  const syncRotationFromMatrix = useCallback(() => {
    const image = cropperRef.current?.getCropperImage();
    if (!image) return;
    setRotation(matrixAngle(Array.from(image.$getTransform() as number[])));
  }, []);

  const rotateBy = useCallback(
    (deg: number) => {
      const image = cropperRef.current?.getCropperImage();
      if (!image) return;
      image.$rotate(`${deg}deg`);
      syncRotationFromMatrix();
      commitSelection();
    },
    [syncRotationFromMatrix, pushHistory]
  );

  /** Nearest 90° step, and the tilt away from it that the slider edits. */
  const coarseAngle = Math.round(rotation / 90) * 90;
  const fineAngle = Math.max(-45, Math.min(45, rotation - coarseAngle));

  const setFineRotation = useCallback(
    (deg: number) => {
      const image = cropperRef.current?.getCropperImage();
      if (!image) return;
      const target = Math.round(rotation / 90) * 90 + deg;
      image.$rotate(`${target - rotation}deg`);
      syncRotationFromMatrix();
      commitSelection();
    },
    [rotation, syncRotationFromMatrix, pushHistory]
  );

  const flip = useCallback(
    (axis: 'x' | 'y') => {
      const image = cropperRef.current?.getCropperImage();
      if (!image) return;
      const nextX = axis === 'x' ? !flipX : flipX;
      const nextY = axis === 'y' ? !flipY : flipY;
      image.$scale(axis === 'x' ? -1 : 1, axis === 'y' ? -1 : 1);
      setFlipX(nextX);
      setFlipY(nextY);
      syncRotationFromMatrix();
      commitSelection();
    },
    [flipX, flipY, syncRotationFromMatrix, pushHistory]
  );

  const resetEditor = useCallback(() => {
    const cropper = cropperRef.current;
    const image = cropper?.getCropperImage();
    const selection = cropper?.getCropperSelection();
    if (image) image.$resetTransform().$center('contain');
    if (selection) {
      selection.aspectRatio = 0;
      selection.$reset();
      selection.$render();
    }
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setAspect('free');
    setSizePresetId(null);
    commitSelection();
  }, [commitSelection]);

  /** The manual route: type the numbers, never touch the canvas. */
  const applyManualSize = useCallback(
    (width: number, height: number) => {
      const rect = readCropRect();
      if (!rect || !width || !height || !source) return;
      const imageBox = (rect.image as HTMLElement).getBoundingClientRect();
      const bounds = rotatedBounds(source.width, source.height, rotation);
      // Source pixels -> canvas units, via how big the image is on screen.
      const unitsPerPixel = imageBox.width / bounds.width;
      rect.selection.$change(
        rect.selection.x,
        rect.selection.y,
        width * unitsPerPixel,
        height * unitsPerPixel,
        undefined,
        true
      );
      rect.selection.$render();
      commitSelection();
    },
    [readCropRect, source, rotation, pushHistory]
  );

  /** Portrait <-> landscape in one click, for both the ratio and the size box. */
  const swapOrientation = useCallback(() => {
    const pairs: Partial<Record<AspectRatioPreset, AspectRatioPreset>> = {
      '4:5': '3:2',
      '3:2': '2:3',
      '2:3': '3:2',
      '4:3': '3:4',
      '3:4': '4:3',
      '16:9': '9:16',
      '9:16': '16:9',
    };
    const swapped = pairs[aspect];
    setOutWidth(outHeight);
    setOutHeight(outWidth);
    setSizePresetId(null);

    const selection = cropperRef.current?.getCropperSelection();
    if (!selection) return;
    if (swapped) {
      setAspect(swapped);
      selection.aspectRatio = ratioFor(swapped, source || undefined);
    } else {
      // Free or original: just turn the current box on its side.
      selection.aspectRatio = selection.height / selection.width;
    }
    selection.$render();
    commitSelection();
  }, [aspect, outWidth, outHeight, source, pushHistory]);

  /** Trims a uniform border — transparent padding, or the margin around a scan. */
  const autoTrim = useCallback(async () => {
    const rect = readCropRect();
    if (!rect || !source) return;
    setNotice(null);
    try {
      const image = await loadImage(source.url);
      const bounds = findContentBounds(image, source.width, source.height);
      if (!bounds) {
        setNotice(t.autoTrimNothing || 'No uniform border to trim — the content already fills the frame.');
        return;
      }
      const imageBox = (rect.image as HTMLElement).getBoundingClientRect();
      const canvasEl = cropperRef.current?.getCropperCanvas() as HTMLElement | null;
      if (!canvasEl) return;
      const canvasBox = canvasEl.getBoundingClientRect();
      rect.selection.aspectRatio = 0;
      rect.selection.$change(
        imageBox.left - canvasBox.left + bounds.x * imageBox.width,
        imageBox.top - canvasBox.top + bounds.y * imageBox.height,
        bounds.width * imageBox.width,
        bounds.height * imageBox.height,
        undefined,
        true
      );
      rect.selection.$render();
      setAspect('free');
      setSizePresetId(null);
      commitSelection();
    } catch {
      setNotice(t.autoTrimFailed || 'The border could not be analysed.');
    }
  }, [readCropRect, source, pushHistory, t]);

  // ==========================================================================
  // Output
  // ==========================================================================
  const onDimensionChange = (value: string, axis: 'w' | 'h') => {
    setSizePresetId(null);
    const num = Number(value);
    if (axis === 'w') {
      setOutWidth(value);
      if (lockRatio && num > 0 && cropPx.width > 0) {
        setOutHeight(String(Math.round((num * cropPx.height) / cropPx.width)));
      }
    } else {
      setOutHeight(value);
      if (lockRatio && num > 0 && cropPx.height > 0) {
        setOutWidth(String(Math.round((num * cropPx.width) / cropPx.height)));
      }
    }
  };

  /**
   * Renders one crop from a bitmap. Everything funnels through here — the
   * single export, each item of a batch and each entry of the size pack — so
   * there is exactly one place where the pixels are decided.
   */
  const renderOne = useCallback(
    async (
      item: BatchItem,
      frame: ItemFrame,
      outW: number,
      outH: number
    ): Promise<{ blob: Blob; width: number; height: number }> => {
      const image = await loadImage(item.url);
      const canvas = renderCrop({
        source: image,
        sourceWidth: item.width,
        sourceHeight: item.height,
        // Per image, not per editor: in `each` mode two photos in the same ZIP
        // can be rotated differently.
        rotation: frame.rotation,
        flipX: frame.flipX,
        flipY: frame.flipY,
        crop: frame.rel,
        outWidth: Math.min(MAX_EXPORT_SIDE, Math.max(1, outW)),
        outHeight: Math.min(MAX_EXPORT_SIDE, Math.max(1, outH)),
        fit,
        // JPEG has no alpha, and `contain` needs something behind the bars.
        background: format === 'image/jpeg' || fit === 'contain' ? matte : undefined,
      });

      let blob: Blob;
      if (targetKb > 0) {
        const search = await encodeToTargetBytes(canvas, format, targetKb * 1024);
        blob = search.blob;
        if (search.missed) {
          setNotice(
            (t.targetMissed || 'Could not get under {0} KB even at the lowest quality; this is the smallest.')
              .replace('{0}', String(targetKb))
          );
        }
      } else {
        blob = await encode(canvas, format, quality / 100);
      }

      blob = await withDpi(blob, format, dpi);
      return { blob, width: canvas.width, height: canvas.height };
    },
    [fit, format, matte, targetKb, quality, dpi, t]
  );

  /**
   * The framing one queued image should be exported with. The image in the
   * editor always wins with what is on screen right now — the stored copy is
   * only ever 260 ms behind, but "only slightly stale" is still wrong.
   */
  const frameForExport = useCallback(
    (item: BatchItem, live: ItemFrame): ItemFrame => {
      if (item.id === activeId) return live;
      // An image that opted out keeps its own; everything else follows the
      // common framing — which is what the editor is showing unless the image
      // in it is one of the opted-out ones.
      const base = independent.has(item.id)
        ? frames[item.id] ?? sharedFrameRef.current ?? live
        : sharedFrameRef.current ?? live;
      return fitFrame(base, item);
    },
    [activeId, independent, frames]
  );

  const buildCrop = useCallback(async (): Promise<CropResult | null> => {
    const frame = captureFrame();
    if (!frame || !source) return null;

    const { width, height } = sizeFor(source, frame);
    const rendered = await renderOne(source, frame, width, height);

    releaseResult();
    const url = URL.createObjectURL(rendered.blob);
    resultUrlRef.current = url;
    return {
      blob: rendered.blob,
      url,
      width: rendered.width,
      height: rendered.height,
      bytes: rendered.blob.size,
      format,
    };
  }, [captureFrame, source, renderOne, format, releaseResult]);

  /** Zips the whole queue: one framing for all, or each image with its own. */
  const exportBatch = useCallback(async () => {
    const live = captureFrame();
    if (!live || sources.length === 0) return;
    setStatus('exporting');
    setError(null);
    setNotice(null);
    setBatchProgress({ done: 0, total: sources.length });

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let i = 0; i < sources.length; i++) {
        const item = sources[i];
        const frame = frameForExport(item, live);
        const { width, height } = sizeFor(item, frame);
        const rendered = await renderOne(item, frame, width, height);
        const base = item.file.name.replace(/\.[^.]+$/, '') || `image-${i + 1}`;
        zip.file(`${base}-${rendered.width}x${rendered.height}.${extensionFor(format)}`, rendered.blob);
        setBatchProgress({ done: i + 1, total: sources.length });
      }

      const archive = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(archive);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cropsnap-batch-${sources.length}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('ready');
    } catch {
      setError(t.errorExport || 'The crop could not be rendered. Try a smaller output size.');
      setStatus('error');
    } finally {
      setBatchProgress(null);
    }
  }, [captureFrame, sources, frameForExport, renderOne, format, t]);

  /** The same crop at every named size, in one archive. */
  const exportAllSizes = useCallback(async () => {
    const frame = captureFrame();
    if (!frame || !source) return;
    setStatus('exporting');
    setError(null);
    setNotice(null);
    setBatchProgress({ done: 0, total: SIZE_PRESETS.length });

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const base = source.file.name.replace(/\.[^.]+$/, '') || 'cropsnap';

      for (let i = 0; i < SIZE_PRESETS.length; i++) {
        const preset = SIZE_PRESETS[i];
        const rendered = await renderOne(source, frame, preset.width, preset.height);
        zip.file(`${base}-${preset.id}-${preset.width}x${preset.height}.${extensionFor(format)}`, rendered.blob);
        setBatchProgress({ done: i + 1, total: SIZE_PRESETS.length });
      }

      const archive = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(archive);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${base}-all-sizes.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('ready');
    } catch {
      setError(t.errorExport || 'The crop could not be rendered. Try a smaller output size.');
      setStatus('error');
    } finally {
      setBatchProgress(null);
    }
  }, [captureFrame, source, renderOne, format, t]);

  /** Deliberately manual: rendering a 2480×3508 crop is the expensive step. */
  const generate = useCallback(async () => {
    if (!hasImage) return;
    setStatus('exporting');
    setError(null);
    try {
      const built = await buildCrop();
      if (!built) throw new Error('no selection');
      setResult(built);
      setStatus('ready');
    } catch {
      setError(t.errorExport || 'The crop could not be rendered. Try a smaller output size.');
      setStatus('error');
    }
  }, [hasImage, buildCrop, t]);

  const download = useCallback(() => {
    if (!result || !source) return;
    const base = source.file.name.replace(/\.[^.]+$/, '') || 'cropsnap';
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${base}-${result.width}x${result.height}.${extensionFor(result.format)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [result, source]);

  const getHandoffResult = useCallback(async () => {
    const built = result ?? (await buildCrop());
    if (!built) return null;
    if (!result) setResult(built);
    const base = source?.file.name.replace(/\.[^.]+$/, '') || 'cropsnap';
    return { blob: built.blob, name: `${base}-${built.width}x${built.height}.${extensionFor(built.format)}` };
  }, [result, buildCrop, source]);

  /** Puts the finished crop on the clipboard instead of on disk. */
  const copyToClipboard = useCallback(async () => {
    if (!result) return;
    try {
      // Only PNG is universally accepted by the async clipboard, so a JPEG or
      // WebP result is re-encoded rather than silently failing.
      let blob = result.blob;
      if (blob.type !== 'image/png') {
        const image = await loadImage(result.url);
        const canvas = document.createElement('canvas');
        canvas.width = result.width;
        canvas.height = result.height;
        canvas.getContext('2d')!.drawImage(image, 0, 0);
        blob = await encode(canvas, 'image/png', 1);
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice(t.copyFailed || 'Your browser blocked the clipboard. Download it instead.');
    }
  }, [result, t]);

  const startOver = useCallback(() => {
    destroyCropper();
    releaseSources(sourcesRef.current);
    releaseResult();
    setSources([]);
    setActiveId(null);
    setFrames({});
    setIndependent(new Set());
    sharedFrameRef.current = null;
    setResult(null);
    setError(null);
    setNotice(null);
    setStatus('idle');
    setHistory([]);
    setHistoryAt(-1);
    setCropPx({ width: 0, height: 0 });
    setOutWidth('');
    setOutHeight('');
    setSizePresetId(null);
    setAspect('free');
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setTab('crop');
  }, [destroyCropper, releaseSources, releaseResult]);

  // ==========================================================================
  // Keyboard
  // ==========================================================================
  useEffect(() => {
    if (!hasImage) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        void generate();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        rotateBy(e.shiftKey ? -90 : 90);
      } else if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        flip('x');
      } else if (e.key.toLowerCase() === 'v') {
        e.preventDefault();
        flip('y');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasImage, undo, redo, generate, rotateBy, flip]);

  // ==========================================================================
  // Copy
  // ==========================================================================
  const aspectLabels: Record<AspectRatioPreset, string> = {
    free: t.ratioFree || 'Free',
    original: t.ratioOriginal || 'Original',
    '1:1': '1:1',
    '4:5': '4:5',
    '3:2': '3:2',
    '2:3': '2:3',
    '4:3': '4:3',
    '3:4': '3:4',
    '16:9': '16:9',
    '9:16': '9:16',
    '21:9': '21:9',
  };

  const steps = [
    { art: StepDrop, title: t.step1Title || 'Drop an image', text: t.step1Text || 'JPG, PNG, WebP, AVIF, GIF or an iPhone HEIC. Nothing is uploaded.' },
    { art: StepFrame, title: t.step2Title || 'Frame the crop', text: t.step2Text || 'Drag the handles, pick a ratio, or type the exact pixels you need.' },
    { art: StepTune, title: t.step3Title || 'Straighten and flip', text: t.step3Text || 'Fine rotation, 90° steps, mirroring — with undo on every change.' },
    { art: StepExport, title: t.step4Title || 'Preview, then save', text: t.step4Text || 'You see the real result and its real weight before you download it.' },
  ];

  const featureIcons = [IconFullRes, IconLocalCrop, IconPresets, IconStraighten, IconHistory, IconHandoff];
  const extraFeatures = t.extraFeatures || [
    { title: 'Straighten, flip, undo', text: 'A fine rotation slider for crooked horizons, 90° steps, mirroring, and an undo history that costs nothing.' },
    { title: 'Preview before you commit', text: 'The crop is rendered and shown with its true pixel size and file weight before anything is saved.' },
    { title: 'Chained with the suite', text: 'Send the crop straight to compress, convert, cut out or watermark without downloading it first.' },
  ];

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const legalBody =
    activeModal === 'privacy' ? t.privacyContent : activeModal === 'terms' ? t.termsContent : t.cookiesContent;

  return (
    <div className="min-h-screen flex flex-col bg-[#07050a] text-slate-100 selection:bg-rose-500/30 overflow-x-hidden font-sans">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => (window.location.href = `/${newLang.toLowerCase()}/cropsnap`)}
        onReset={startOver}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-cropsnap-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-rose-950/40 border border-rose-800/30 text-rose-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(244,63,94,0.15)]">
                <CropIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/10 blur-[80px] rounded-full" />
              <CropHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          {/* With no image the drop zone is the only thing on the left, so the
              row is left to stretch and the zone fills it — otherwise it sits
              at half the height of the controls panel beside it. */}
          <section
            className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${hasImage ? 'items-start' : 'lg:items-stretch'}`}
          >
            {/* Stage */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {!hasImage ? (
                <div
                  onDrop={onDrop}
                  onDragOver={e => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 rounded-3xl border-2 border-dashed p-12 md:p-16 flex flex-col items-center justify-center gap-5 cursor-pointer transition-all ${
                    dragging
                      ? 'border-rose-500/60 bg-rose-500/5'
                      : 'border-white/10 hover:border-rose-500/40 bg-black/20 hover:bg-black/40'
                  }`}
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-14 h-14 text-rose-400 animate-spin" />
                  ) : (
                    <DropArt className="w-32 h-auto text-rose-400" animated={!prefersReduced} />
                  )}
                  <div className="space-y-1.5 text-center">
                    <p className="text-base font-black text-white uppercase tracking-wider">
                      {status === 'loading'
                        ? t.statusLoading || 'Reading the image…'
                        : t.labelUploadImages || t.labelUploadImage}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {t.dropHint || 'JPG, PNG, WebP, AVIF, GIF, HEIC — or press Ctrl+V'}
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium">
                      {t.dropHintBatch || 'Drop several at once to crop them all to the same frame.'}
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileInput}
                    accept={ACCEPTED_INPUT}
                    multiple
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="glass-card rounded-3xl p-4 md:p-6 space-y-4 border border-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">
                        {t.editorLabel || 'Editor'}
                      </span>
                      <h2 className="text-sm font-bold text-white truncate">{source?.file.name}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <IconButton onClick={undo} disabled={historyAt <= 0} label={t.undoBtn || 'Undo'}>
                        <Undo2 className="w-3.5 h-3.5" />
                      </IconButton>
                      <IconButton
                        onClick={redo}
                        disabled={historyAt >= history.length - 1}
                        label={t.redoBtn || 'Redo'}
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                      </IconButton>
                      <IconButton onClick={resetEditor} label={t.resetEditorBtn || 'Reset the frame'}>
                        <RefreshCw className="w-3.5 h-3.5" />
                      </IconButton>
                      <IconButton onClick={() => fileInputRef.current?.click()} label={t.addImagesBtn || 'Add images'}>
                        <Upload className="w-3.5 h-3.5" />
                      </IconButton>
                      <IconButton onClick={startOver} label={t.clearAllBtn || 'Clear everything'}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={onFileInput}
                        accept={ACCEPTED_INPUT}
                        multiple
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Queue. One framing rules the lot; an image that needs
                      something else says so from here, on its own. */}
                  {sources.length > 1 && (
                    <div className="space-y-3 rounded-2xl border border-white/5 bg-black/25 p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-auto">
                          {(t.queueLabel || '{0} images').replace('{0}', String(sources.length))}
                        </span>

                        <button
                          onClick={toggleIndependent}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            activeIsIndependent
                              ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {activeIsIndependent ? (
                            <Link2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Link2Off className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {activeIsIndependent
                            ? t.makeSharedBtn || 'Back to the shared framing'
                            : t.makeIndependentBtn || 'Give this one its own framing'}
                        </button>

                        {/* Only worth offering once something has diverged. */}
                        {independent.size > 0 && (
                          <button
                            onClick={applyFrameToAll}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 shrink-0" />
                            {t.applyToAllBtn || 'Copy this one to all'}
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 font-medium leading-snug">
                        {independent.size > 0
                          ? (t.queueMixedHint || '{0} with their own framing; the rest follow the shared one.').replace(
                              '{0}',
                              String(independent.size)
                            )
                          : (
                              t.queueSharedHint ||
                              'All {0} share one framing. If one needs something else, open it and give it its own.'
                            ).replace('{0}', String(sources.length))}
                      </p>

                      {/* The padding is what keeps the badges that hang off the
                          thumbnails from being clipped by the scroll box. */}
                      <div className="flex items-center gap-2.5 overflow-x-auto overflow-y-hidden px-1.5 pt-2 pb-2">
                        {sources.map(item => (
                          <div key={item.id} className="relative shrink-0 group/thumb">
                            <button
                              onClick={() => setActiveId(item.id)}
                              title={item.file.name}
                              className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer block ${
                                item.id === activeId
                                  ? 'border-rose-500'
                                  : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={item.url} alt="" className="w-full h-full object-cover" />
                            </button>
                            {independent.has(item.id) && (
                              <span
                                title={t.customFrameBadge || 'Has its own framing'}
                                className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-500 ring-2 ring-[#0b0810] flex items-center justify-center pointer-events-none"
                              >
                                <Scissors className="w-2.5 h-2.5 text-white" />
                              </span>
                            )}
                            <button
                              onClick={() => removeSource(item.id)}
                              aria-label={t.removeBtn || 'Remove'}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0b0810] ring-2 ring-[#0b0810] border border-white/20 text-slate-300 hover:text-white hover:bg-red-500 hover:border-red-400 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* The cropper canvas needs a real box: the web component
                      defaults to 200×100 and everything downstream inherits it. */}
                  <div className="relative h-[340px] sm:h-[420px] rounded-2xl overflow-hidden checkered-bg border border-white/5">
                    <img
                      ref={imageRef}
                      src={source!.url}
                      alt=""
                      className="block max-w-full"
                      style={{ width: '100%', height: '100%' }}
                    />

                    {comparing && (
                      <div className="absolute inset-0 bg-black/85 flex items-center justify-center p-4 pointer-events-none">
                        <img src={source!.url} alt="" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}

                    {status === 'exporting' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
                        <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {t.statusExporting || 'Rendering the crop…'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500">
                    <span>
                      {t.statSource || 'Source'}{' '}
                      <span className="text-slate-300 font-mono">
                        {source!.width}×{source!.height}
                      </span>
                    </span>
                    <span>
                      {t.statSelection || 'Selection'}{' '}
                      <span className="text-rose-400 font-mono">
                        {cropPx.width}×{cropPx.height}
                      </span>{' '}
                      <span className="opacity-60">({simplifyRatio(cropPx.width, cropPx.height)})</span>
                    </span>
                    <button
                      onMouseDown={() => setComparing(true)}
                      onMouseUp={() => setComparing(false)}
                      onMouseLeave={() => setComparing(false)}
                      onTouchStart={() => setComparing(true)}
                      onTouchEnd={() => setComparing(false)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t.compareBtn || 'Hold to see the original'}
                    </button>
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="glass-card rounded-3xl p-4 md:p-6 space-y-4 border border-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                      <Scan className="w-3.5 h-3.5" />
                      {t.resultTitle || 'Result'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {result.width}×{result.height} · {formatBytes(result.bytes)}
                    </span>
                  </div>

                  <div className="rounded-2xl overflow-hidden checkered-bg border border-white/5 flex items-center justify-center max-h-[320px]">
                    <img src={result.url} alt="" className="max-w-full max-h-[320px] object-contain" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={download}
                      className="w-full sm:flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_25px_rgba(244,63,94,0.25)]"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      {t.btnDownload}
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="w-full sm:w-auto py-3.5 px-6 border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ClipboardCopy className="w-4 h-4" />
                      )}
                      {copied ? t.copiedLabel || 'Copied' : t.copyBtn || 'Copy'}
                    </button>
                  </div>

                  <NextStepBar lang={lang} t={t} getResult={getHandoffResult} />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex p-1 rounded-2xl bg-[#0e0c15]/80 border border-white/5 gap-1 w-full">
                {[
                  { id: 'crop' as Tab, label: t.tabCrop, icon: CropIcon },
                  { id: 'transform' as Tab, label: t.tabAdjust, icon: RotateCw },
                  { id: 'output' as Tab, label: t.tabExport, icon: Download },
                ].map(item => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      // min-w-0 is what lets `truncate` actually shrink: a
                      // flex-1 item defaults to min-width:auto and refuses to
                      // go below its text width, so the row overflows at 375px.
                      className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-3 px-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.35)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-6 text-left min-h-[360px]">
                {!hasImage ? (
                  <div className="flex flex-col items-center justify-center text-center gap-3 py-16 text-slate-600">
                    <CropIcon className="w-10 h-10" />
                    <p className="text-xs font-bold max-w-[220px] leading-relaxed">
                      {t.emptyControls || 'Load an image and the editing controls appear here.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {tab === 'crop' && (
                      <div className="space-y-6">
                        <Field label={t.labelAspectPresets}>
                          <div className="grid grid-cols-3 gap-2">
                            {ASPECT_PRESETS.map(preset => (
                              <button
                                key={preset}
                                onClick={() => applyAspect(preset)}
                                className={`py-2.5 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer truncate ${
                                  aspect === preset && !sizePresetId
                                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-400'
                                    : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                {aspectLabels[preset]}
                              </button>
                            ))}
                          </div>
                        </Field>

                        <div className="flex flex-wrap gap-2">
                          <SmallButton onClick={swapOrientation} icon={<ArrowLeftRight className="w-3.5 h-3.5" />}>
                            {t.swapOrientationBtn || 'Swap orientation'}
                          </SmallButton>
                          <SmallButton onClick={autoTrim} icon={<Scissors className="w-3.5 h-3.5" />}>
                            {t.autoTrimBtn || 'Trim the border'}
                          </SmallButton>
                        </div>

                        <Field label={t.labelGrid || 'Guides'}>
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              [
                                ['thirds', t.gridThirds || 'Thirds'],
                                ['golden', t.gridGolden || 'Golden'],
                                ['none', t.gridNone || 'None'],
                              ] as [GridMode, string][]
                            ).map(([id, label]) => (
                              <button
                                key={id}
                                onClick={() => setGridMode(id)}
                                className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                  gridMode === id
                                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-400'
                                    : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </Field>

                        <Field label={t.labelSizePresets || 'Ready-made sizes'}>
                          <div className="grid grid-cols-1 gap-1.5 max-h-[260px] overflow-y-auto pr-1">
                            {SIZE_PRESETS.map(preset => (
                              <button
                                key={preset.id}
                                onClick={() => applySizePreset(preset.id)}
                                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  sizePresetId === preset.id
                                    ? 'bg-rose-950/30 border-rose-500/40'
                                    : 'bg-[#060408] border-white/5 hover:bg-white/5'
                                }`}
                              >
                                <span
                                  className={`text-[11px] font-bold truncate ${
                                    sizePresetId === preset.id ? 'text-rose-400' : 'text-slate-300'
                                  }`}
                                >
                                  {t[preset.key] || preset.fallback}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                  {preset.width}×{preset.height}
                                </span>
                              </button>
                            ))}
                          </div>
                        </Field>
                      </div>
                    )}

                    {tab === 'transform' && (
                      <div className="space-y-6">
                        <Field label={t.labelRotation || 'Rotation'}>
                          <div className="grid grid-cols-2 gap-2">
                            <ActionButton onClick={() => rotateBy(-90)} icon={<RotateCcw className="w-4 h-4" />}>
                              {t.btnRotateLeft}
                            </ActionButton>
                            <ActionButton onClick={() => rotateBy(90)} icon={<RotateCw className="w-4 h-4" />}>
                              {t.btnRotateRight}
                            </ActionButton>
                          </div>
                        </Field>

                        <Field label={t.labelStraighten || 'Straighten'}>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={-45}
                              max={45}
                              step={0.5}
                              value={fineAngle}
                              onChange={e => setFineRotation(Number(e.target.value))}
                              className="flex-1 accent-rose-500 cursor-pointer"
                            />
                            <span className="text-[11px] font-mono text-rose-400 w-14 text-right shrink-0">
                              {rotation.toFixed(1)}°
                            </span>
                          </div>
                        </Field>

                        <Field label={t.labelFlip || 'Mirror'}>
                          <div className="grid grid-cols-2 gap-2">
                            <ActionButton
                              onClick={() => flip('x')}
                              active={flipX}
                              icon={<FlipHorizontal2 className="w-4 h-4" />}
                            >
                              {t.btnFlipHoriz}
                            </ActionButton>
                            <ActionButton
                              onClick={() => flip('y')}
                              active={flipY}
                              icon={<FlipVertical2 className="w-4 h-4" />}
                            >
                              {t.btnFlipVert}
                            </ActionButton>
                          </div>
                        </Field>

                        <div className="rounded-2xl border border-white/5 bg-black/30 p-3.5 space-y-2">
                          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <Keyboard className="w-3.5 h-3.5 text-rose-400" />
                            {t.shortcutsTitle || 'Shortcuts'}
                          </span>
                          <ul className="text-[11px] text-slate-500 font-medium space-y-1">
                            <li>{t.shortcutArrows || 'Arrow keys — nudge the selection'}</li>
                            <li>{t.shortcutWheel || 'Wheel — zoom the image'}</li>
                            <li>{t.shortcutRotate || 'R / Shift+R — rotate 90°'}</li>
                            <li>{t.shortcutFlip || 'H / V — mirror'}</li>
                            <li>{t.shortcutUndo || 'Ctrl+Z / Ctrl+Shift+Z — undo, redo'}</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {tab === 'output' && (
                      <div className="space-y-6">
                        <Field label={t.labelCustomSize}>
                          <div className="grid grid-cols-2 gap-3">
                            <NumberInput
                              label={t.labelWidth || 'Width'}
                              value={outWidth}
                              onChange={v => onDimensionChange(v, 'w')}
                            />
                            <NumberInput
                              label={t.labelHeight || 'Height'}
                              value={outHeight}
                              onChange={v => onDimensionChange(v, 'h')}
                            />
                          </div>
                        </Field>

                        <div className="flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={lockRatio}
                              onChange={e => setLockRatio(e.target.checked)}
                              className="accent-rose-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            {t.labelMaintainRatio}
                          </label>
                          <button
                            onClick={() => applyManualSize(Number(outWidth), Number(outHeight))}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                          >
                            <Ruler className="w-3.5 h-3.5" />
                            {t.applyToSelectionBtn || 'Apply to the selection'}
                          </button>
                        </div>

                        {/* Cover cuts to fill; contain keeps everything and pads. */}
                        <Field label={t.labelFit || 'When the shapes differ'}>
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                ['cover', t.fitCover || 'Crop to fill'],
                                ['contain', t.fitContain || 'Fit and pad'],
                              ] as [FitMode, string][]
                            ).map(([id, label]) => (
                              <button
                                key={id}
                                onClick={() => setFit(id)}
                                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer truncate ${
                                  fit === id
                                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-400'
                                    : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-600 font-medium leading-snug pt-1">
                            {fit === 'contain'
                              ? t.fitContainHint ||
                                'Nothing is cut: the leftover space is filled with the colour below.'
                              : t.fitCoverHint || 'The frame is filled and whatever sticks out is trimmed.'}
                          </p>
                        </Field>

                        {upscaling && (
                          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-300 leading-snug">
                              {(t.upscaleWarning ||
                                'You are asking for more pixels than the selection has ({0}×{1}). The extra ones are invented, not recovered.')
                                .replace('{0}', String(cropPx.width))
                                .replace('{1}', String(cropPx.height))}
                            </p>
                          </div>
                        )}

                        <Field label={t.labelOutputFormat}>
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              [
                                ['image/jpeg', 'JPEG'],
                                ['image/png', 'PNG'],
                                ['image/webp', 'WebP'],
                              ] as [OutputFormat, string][]
                            ).map(([id, label]) => (
                              <button
                                key={id}
                                onClick={() => setFormat(id)}
                                className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                  format === id
                                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-400'
                                    : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </Field>

                        {format !== 'image/png' && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              <span>{t.labelOutputQuality}</span>
                              <span className="text-rose-400">{quality}%</span>
                            </div>
                            <input
                              type="range"
                              min={40}
                              max={100}
                              value={quality}
                              onChange={e => setQuality(Number(e.target.value))}
                              className="w-full accent-rose-500 cursor-pointer"
                            />
                          </div>
                        )}

                        {/* JPEG has no alpha, and `contain` needs a colour for
                            the bars, so the picker matters in both cases. */}
                        {((format === 'image/jpeg' && source?.hasAlpha) || fit === 'contain') && (
                          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#060408]/60 border border-white/5">
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block">
                                {fit === 'contain'
                                  ? t.labelPadColour || 'Padding colour'
                                  : t.labelMatte || 'Background behind transparency'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                {fit === 'contain'
                                  ? t.padHint || 'Fills the space the image does not cover.'
                                  : t.matteHint || 'JPEG cannot store transparency.'}
                              </span>
                            </div>
                            <input
                              type="color"
                              value={matte}
                              onChange={e => setMatte(e.target.value)}
                              className="w-10 h-10 border-0 rounded-lg bg-transparent cursor-pointer shrink-0"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <label className="space-y-1.5 block">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                              {t.labelTargetSize || 'Max weight (KB)'}
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={targetKb || ''}
                              placeholder={t.targetOff || 'off'}
                              onChange={e => setTargetKb(Math.max(0, Number(e.target.value) || 0))}
                              className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-200 outline-none focus:border-rose-500"
                            />
                          </label>
                          <label className="space-y-1.5 block">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                              {t.labelDpi || 'Print DPI'}
                            </span>
                            <select
                              value={dpi}
                              onChange={e => setDpi(Number(e.target.value))}
                              className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
                            >
                              <option value={72}>72</option>
                              <option value={150}>150</option>
                              <option value={300}>300</option>
                              <option value={600}>600</option>
                            </select>
                          </label>
                        </div>
                        <p className="text-[10px] text-slate-600 font-medium leading-snug -mt-3">
                          {t.dpiHint ||
                            'The DPI is written into the file, so a print shop reads the physical size you intended.'}
                        </p>

                        <p className="text-[10px] text-slate-600 font-medium leading-snug border-t border-white/5 pt-3">
                          {t.exifNote ||
                            'Re-encoding drops the original EXIF data — camera model, date and any GPS coordinates do not travel into the crop.'}
                        </p>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-3">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-red-300 leading-snug">{error}</p>
                      </div>
                    )}

                    {notice && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-amber-300 leading-snug">{notice}</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <button
                        onClick={generate}
                        disabled={status === 'exporting'}
                        className="w-full py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_25px_rgba(244,63,94,0.25)]"
                      >
                        {status === 'exporting' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Scan className="w-4 h-4 stroke-[2.5]" />
                        )}
                        {batchProgress
                          ? `${batchProgress.done} / ${batchProgress.total}`
                          : t.generateBtn || 'Render the crop'}
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <SmallButton
                          onClick={exportAllSizes}
                          disabled={status === 'exporting'}
                          icon={<Layers className="w-3.5 h-3.5" />}
                        >
                          {t.exportAllSizesBtn || 'All sizes (ZIP)'}
                        </SmallButton>
                        <SmallButton
                          onClick={exportBatch}
                          disabled={status === 'exporting' || sources.length < 2}
                          icon={<Package className="w-3.5 h-3.5" />}
                        >
                          {(t.exportBatchBtn || 'Batch of {0} (ZIP)').replace('{0}', String(sources.length))}
                        </SmallButton>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium text-center">
                        {(t.generateHint || 'Exports at {0}×{1} from the original pixels.')
                          .replace('{0}', String(Number(outWidth) || cropPx.width))
                          .replace('{1}', String(Number(outHeight) || cropPx.height))}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-rose-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-rose-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-rose-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-rose-400" />
                    <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          <motion.section
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[...(t.features || []), ...extraFeatures].map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconFullRes;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 group-hover:scale-110 group-hover:border-rose-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-rose-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </motion.section>

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-[11px] font-black uppercase tracking-[0.2em] border border-rose-500/20">
                  {keywords[0]}
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                  {t.seoHeroTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(t.seoHeroList || []).map((point: string, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                    >
                      <span className="w-7 h-7 shrink-0 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-rose-500/10 rounded-full blur-3xl" />
                <IconFullRes className="w-20 h-20 text-rose-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#0d0816] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-rose-500 rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoUseCaseTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
                </div>
                <div className="space-y-3">
                  <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                    <span className="w-6 h-px bg-white/20" />
                    {t.seoPrivacyTitle}
                  </div>
                  <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoPrivacyText}</p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-rose-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-rose-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-rose-400 transition-transform group-open:rotate-45 text-xl leading-none">
                          +
                        </span>
                      </summary>
                      <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {keywords.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.seoKeywordsTitle}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-cropsnap-bottom" />
      </main>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}

      <LegalModal
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={activeModal === 'privacy' ? t.privacyPolicy : activeModal === 'terms' ? t.termsOfService : t.cookiePolicy}
        content={String(legalBody || '')
          .split('\n')
          .map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}
        t={t}
      />

      <Footer lang={lang} t={t} onOpenModal={modal => setActiveModal(modal)} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-2.5">
    <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    {children}
  </div>
);

const IconButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, label, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
  >
    {children}
  </button>
);

const ActionButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, icon, active, children }) => (
  <button
    onClick={onClick}
    className={`py-3 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
      active
        ? 'bg-rose-950/30 border-rose-500/40 text-rose-400'
        : 'bg-[#060408] border-white/5 text-slate-300 hover:text-white hover:bg-white/5'
    }`}
  >
    <span className={active ? 'text-rose-400' : 'text-rose-400'}>{icon}</span>
    <span className="truncate">{children}</span>
  </button>
);

const SmallButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, icon, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-0"
  >
    <span className="text-rose-400 shrink-0">{icon}</span>
    <span className="truncate">{children}</span>
  </button>
);

const NumberInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <label className="space-y-1.5 block">
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{label}</span>
    <input
      type="number"
      min={1}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-3 text-xs font-bold text-slate-200 outline-none focus:border-rose-500"
    />
  </label>
);

export default Cropsnap;
