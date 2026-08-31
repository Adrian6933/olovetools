import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUp,
  Check,
  CheckCheck,
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  FilePlus2,
  FolderArchive,
  FolderOpen,
  FolderPlus,
  Gauge,
  HardDriveDownload,
  Info,
  Loader2,
  Package,
  Pencil,
  Redo2,
  Search,
  ShieldCheck,
  Sliders,
  Square,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { FileTree } from './components/FileTree';
import { EntryPreview } from './components/EntryPreview';
import {
  ZipHeroArt,
  UnzipArt,
  IconWorker,
  IconSmart,
  IconFolderTree,
  IconLocalOnly,
  IconInspect,
  IconHandoff,
  StepAdd,
  StepTune,
  StepPack,
  StepShare,
} from './components/Illustrations';
import { ZipEngine, ZipError } from './lib/zipEngine';
import { countStored, extensionOf, toPackFiles } from './lib/presets';
import {
  buildTree,
  filesFromDrop,
  formatBytes,
  formatMs,
  pathOfInputFile,
  pickDirectory,
  sanitizePath,
  saveBlob,
  supportsDirectoryPicker,
  uniquePath,
  writeInto,
} from './lib/files';
import type { BenchRow, BuildResult, EntryMeta, Method, Preset, QueueItem, TreeNode } from './types';

interface ZipFlowProps {
  lang: string;
  dictionary: any;
}

const PRESETS: Preset[] = ['smart', 'max', 'balanced', 'fast', 'store'];
/** Packing five variants of a huge queue would take minutes; keep the offer honest. */
const BENCH_LIMIT = 64 * 1024 * 1024;
const HISTORY_LIMIT = 50;

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ---------------------------------------------------------------------------
// Queue + undo history in a single reducer.
// ----------------------------------------------------------------------------
// Undo needs the previous list, which only exists inside the state updater —
// and calling setPast() from inside setQueue()'s updater is the bug that makes
// history silently double up under StrictMode. One reducer removes the problem
// and keeps undo cheap: every snapshot is an array of references to the same
// File objects, not a copy of their bytes.
// ---------------------------------------------------------------------------
interface QueueState {
  items: QueueItem[];
  past: QueueItem[][];
  future: QueueItem[][];
}

type QueueAction =
  | { type: 'add'; incoming: Array<{ file: File; path: string }> }
  | { type: 'remove'; id: string }
  | { type: 'clear' }
  | { type: 'rename'; id: string; path: string }
  | { type: 'cycleMethod'; id: string }
  | { type: 'undo' }
  | { type: 'redo' };

const METHOD_CYCLE: Method[] = ['auto', 'deflate', 'store'];

function commit(state: QueueState, items: QueueItem[]): QueueState {
  return { items, past: [...state.past.slice(-(HISTORY_LIMIT - 1)), state.items], future: [] };
}

function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'add': {
      const taken = new Set(state.items.map(item => item.path));
      const added: QueueItem[] = [];
      for (const { file, path } of action.incoming) {
        // Two files called "logo.png" used to overwrite each other inside the
        // archive while both stayed visible in the list.
        const unique = uniquePath(sanitizePath(path) || file.name, taken);
        taken.add(unique);
        added.push({ id: newId(), file, path: unique, method: 'auto' });
      }
      return added.length ? commit(state, [...state.items, ...added]) : state;
    }
    case 'remove':
      return commit(state, state.items.filter(item => item.id !== action.id));
    case 'clear':
      return state.items.length ? commit(state, []) : state;
    case 'rename': {
      const clean = sanitizePath(action.path);
      if (!clean) return state;
      const taken = new Set(state.items.filter(item => item.id !== action.id).map(item => item.path));
      const next = uniquePath(clean, taken);
      return commit(
        state,
        state.items.map(item => (item.id === action.id ? { ...item, path: next } : item))
      );
    }
    case 'cycleMethod':
      return commit(
        state,
        state.items.map(item =>
          item.id === action.id
            ? { ...item, method: METHOD_CYCLE[(METHOD_CYCLE.indexOf(item.method) + 1) % METHOD_CYCLE.length] }
            : item
        )
      );
    case 'undo': {
      if (!state.past.length) return state;
      return {
        items: state.past[state.past.length - 1],
        past: state.past.slice(0, -1),
        future: [state.items, ...state.future].slice(0, HISTORY_LIMIT),
      };
    }
    case 'redo': {
      if (!state.future.length) return state;
      return {
        items: state.future[0],
        past: [...state.past.slice(-(HISTORY_LIMIT - 1)), state.items],
        future: state.future.slice(1),
      };
    }
    default:
      return state;
  }
}

export const ZipFlow: React.FC<ZipFlowProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);
  const prefersReduced = useReducedMotion();

  const engineRef = useRef<ZipEngine | null>(null);
  const getEngine = () => (engineRef.current ||= new ZipEngine());
  useEffect(() => () => engineRef.current?.dispose(), []);

  const [activeTab, setActiveTab] = useState<'compress' | 'extract'>('compress');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ==========================================================================
  // Compress
  // ==========================================================================
  const [queueState, dispatch] = useReducer(queueReducer, { items: [], past: [], future: [] });
  const { items: queue, past, future } = queueState;
  const [zipName, setZipName] = useState('');
  const [comment, setComment] = useState('');
  const [preset, setPreset] = useState<Preset>('smart');
  const [manualMode, setManualMode] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; current: string | null }>({
    percent: 0,
    current: null,
  });
  const [result, setResult] = useState<BuildResult | null>(null);
  const [bench, setBench] = useState<BenchRow[] | null>(null);
  const [benching, setBenching] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [dragCompress, setDragCompress] = useState(false);

  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const totalSize = useMemo(() => queue.reduce((sum, item) => sum + item.file.size, 0), [queue]);
  const storedCount = useMemo(() => countStored(queue, preset), [queue, preset]);

  const addFiles = useCallback((incoming: Array<{ file: File; path: string }>) => {
    if (incoming.length) dispatch({ type: 'add', incoming });
  }, []);

  const onPickFiles = (list: FileList | null) => {
    if (!list) return;
    addFiles(Array.from(list).map(file => ({ file, path: pathOfInputFile(file) })));
  };

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);

  const clearQueue = () => {
    dispatch({ type: 'clear' });
    setZipName('');
    setComment('');
  };

  // Any edit to the queue invalidates the archive that was built from it, so
  // the stats panel never describes files that are no longer there.
  useEffect(() => {
    setResult(null);
    setBench(null);
    setBuildError(null);
  }, [queue]);

  const handleCompressDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragCompress(false);
    const dropped = await filesFromDrop(e.dataTransfer);
    addFiles(dropped);
  };

  const outputName = useMemo(() => {
    const raw = zipName.trim();
    if (!raw) return 'archive.zip';
    return raw.toLowerCase().endsWith('.zip') ? raw : `${raw}.zip`;
  }, [zipName]);

  const describeError = useCallback(
    (err: unknown): string | null => {
      if (err instanceof ZipError) {
        if (err.message === 'cancelled') return null;
        if (err.code === 'encrypted') return t.errorEncrypted || 'This archive is password-protected. ZipFlow cannot open encrypted entries.';
        if (err.code === 'corrupt') return t.errorCorrupt || 'This file is not a readable ZIP archive.';
        if (err.code === 'memory') return t.errorMemory || 'The browser ran out of memory for an archive this big. Try fewer files at a time.';
      }
      return t.errorGeneric || 'Something went wrong. Try again.';
    },
    [t]
  );

  const build = async () => {
    if (!queue.length || building) return;
    setBuilding(true);
    setBuildError(null);
    setResult(null);
    setProgress({ percent: 0, current: null });
    try {
      const { blob, ms } = await getEngine().create(
        toPackFiles(queue),
        preset,
        comment.trim(),
        (percent, current) => setProgress({ percent, current })
      );
      setResult({ blob, original: totalSize, ms, stored: storedCount, total: queue.length });
    } catch (err) {
      setBuildError(describeError(err));
    } finally {
      setBuilding(false);
    }
  };

  const runBench = async () => {
    if (!queue.length || benching || totalSize > BENCH_LIMIT) return;
    setBenching(true);
    setBuildError(null);
    try {
      const rows = await getEngine().bench(toPackFiles(queue), PRESETS, (percent, current) =>
        setProgress({ percent, current })
      );
      setBench(rows);
    } catch (err) {
      setBuildError(describeError(err));
    } finally {
      setBenching(false);
    }
  };

  const cancelBuild = () => {
    getEngine().cancel();
    setBuilding(false);
    setBenching(false);
  };

  // ==========================================================================
  // Extract
  // ==========================================================================
  const [staged, setStaged] = useState<File | null>(null);
  const [checkCrc, setCheckCrc] = useState(false);
  const [opening, setOpening] = useState(false);
  const [entries, setEntries] = useState<EntryMeta[] | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<EntryMeta | null>(null);
  const [activeBlob, setActiveBlob] = useState<Blob | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<{ done: number; total: number } | null>(null);
  const [dragExtract, setDragExtract] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const fileEntries = useMemo(() => (entries || []).filter(entry => !entry.dir), [entries]);
  const tree = useMemo(() => (entries ? buildTree(entries) : null), [entries]);

  /** dir path → every file path underneath, for the folder checkboxes. */
  const filesUnder = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const entry of fileEntries) {
      const parts = entry.path.split('/').filter(Boolean);
      let current = '';
      for (let i = 0; i < parts.length - 1; i++) {
        current = current ? `${current}/${parts[i]}` : parts[i];
        const list = map.get(current);
        if (list) list.push(entry.path);
        else map.set(current, [entry.path]);
      }
    }
    return map;
  }, [fileEntries]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return fileEntries.filter(entry => entry.path.toLowerCase().includes(q));
  }, [query, fileEntries]);

  const totals = useMemo(() => {
    let size = 0;
    let packed = 0;
    for (const entry of fileEntries) {
      size += entry.size;
      packed += entry.packed;
    }
    const folders = (entries || []).filter(entry => entry.dir).length;
    return { size, packed, folders, files: fileEntries.length };
  }, [fileEntries, entries]);

  const selectedSize = useMemo(() => {
    let size = 0;
    for (const entry of fileEntries) if (selected.has(entry.path)) size += entry.size;
    return size;
  }, [fileEntries, selected]);

  const stageZip = (file: File | null | undefined) => {
    if (!file) return;
    closeArchive();
    setStaged(file);
    setActiveTab('extract');
  };

  const closeArchive = () => {
    engineRef.current?.closeArchive();
    setStaged(null);
    setEntries(null);
    setSelected(new Set());
    setExpanded(new Set());
    setQuery('');
    setActive(null);
    setActiveBlob(null);
    setArchiveError(null);
    setExporting(null);
  };

  const openArchive = async () => {
    if (!staged || opening) return;
    setOpening(true);
    setArchiveError(null);
    try {
      const list = await getEngine().open(staged, checkCrc);
      setEntries(list);
      setSelected(new Set(list.filter(entry => !entry.dir).map(entry => entry.path)));
      // Only the first level starts open: a node_modules dump would otherwise
      // render tens of thousands of rows on the first paint.
      const top = new Set<string>();
      for (const entry of list) {
        const first = entry.path.split('/').filter(Boolean)[0];
        if (first && entry.path.split('/').filter(Boolean).length > 1) top.add(first);
      }
      setExpanded(top);
    } catch (err) {
      setArchiveError(describeError(err));
      setEntries(null);
    } finally {
      setOpening(false);
    }
  };

  const toggleExpand = (path: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const toggleSelect = (node: TreeNode) =>
    setSelected(prev => {
      const next = new Set(prev);
      const paths = node.dir ? filesUnder.get(node.path) || [] : [node.path];
      const allPicked = paths.length > 0 && paths.every(p => next.has(p));
      for (const p of paths) {
        if (allPicked) next.delete(p);
        else next.add(p);
      }
      return next;
    });

  const expandAll = () => setExpanded(new Set(filesUnder.keys()));
  const collapseAll = () => setExpanded(new Set());
  const selectAll = () => setSelected(new Set(fileEntries.map(entry => entry.path)));
  const selectNone = () => setSelected(new Set());

  const openEntry = async (entry: EntryMeta) => {
    setActive(entry);
    setActiveBlob(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const blob = await getEngine().read(entry.path);
      setActiveBlob(blob);
    } catch (err) {
      setPreviewError(describeError(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadEntry = async (path: string) => {
    try {
      const blob = await getEngine().read(path);
      saveBlob(blob, path.split('/').pop() || 'file');
    } catch (err) {
      setArchiveError(describeError(err));
    }
  };

  const downloadSelectedZip = async () => {
    const paths = fileEntries.filter(entry => selected.has(entry.path)).map(entry => entry.path);
    if (!paths.length) return;
    setExporting({ done: 0, total: paths.length });
    try {
      const blob = await getEngine().repack(paths, 'smart', percent =>
        setExporting({ done: Math.round((percent / 100) * paths.length), total: paths.length })
      );
      const base = (staged?.name || 'archive').replace(/\.zip$/i, '');
      saveBlob(blob, `${base}-selection.zip`);
    } catch (err) {
      setArchiveError(describeError(err));
    } finally {
      setExporting(null);
    }
  };

  /**
   * Writes the selection straight into a folder the user picks, rebuilding the
   * directory structure. This is what replaced the old "fire N downloads with
   * a 300 ms sleep between them", which browsers block after the tenth file.
   */
  const extractToFolder = async () => {
    const paths = fileEntries.filter(entry => selected.has(entry.path)).map(entry => entry.path);
    if (!paths.length) return;
    const dir = await pickDirectory();
    if (!dir) return;
    setExporting({ done: 0, total: paths.length });
    setArchiveError(null);
    try {
      for (let i = 0; i < paths.length; i++) {
        const blob = await getEngine().read(paths[i]);
        await writeInto(dir, paths[i], blob);
        setExporting({ done: i + 1, total: paths.length });
      }
    } catch (err) {
      setArchiveError(describeError(err));
    } finally {
      setExporting(null);
    }
  };

  const handleExtractDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragExtract(false);
    stageZip(e.dataTransfer.files?.[0]);
  };

  // ==========================================================================
  // Cross-cutting
  // ==========================================================================

  // An incoming file from another tool lands in the queue — unless it is an
  // archive, in which case the obvious intent is to look inside it.
  useHandoffIntake(file => {
    if (extensionOf(file.name) === 'zip') stageZip(file);
    else {
      setActiveTab('compress');
      addFiles([{ file, path: file.name }]);
    }
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && /^(INPUT|TEXTAREA)$/.test(target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && activeTab === 'compress') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && activeTab === 'compress') {
        e.preventDefault();
        redo();
      } else if (e.key === '/' && !typing && activeTab === 'extract' && entries) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, undo, redo, entries]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleReset = () => {
    if (activeTab === 'compress') clearQueue();
    else closeArchive();
  };

  const openLegal = (type: 'privacy' | 'terms' | 'cookies') => {
    setModalType(type);
    setModalOpen(true);
  };

  // ==========================================================================
  // Static content
  // ==========================================================================
  const steps = [
    { art: StepAdd, title: t.step1Title || 'Drop files or whole folders', text: t.step1Text || 'Folders keep their structure. Nothing is packed yet — the queue just waits.' },
    { art: StepTune, title: t.step2Title || 'Choose how hard to squeeze', text: t.step2Text || 'Five presets, or set the method file by file in manual mode.' },
    { art: StepPack, title: t.step3Title || 'Press the button', text: t.step3Text || 'A worker thread does the packing, so the page keeps responding and you can cancel.' },
    { art: StepShare, title: t.step4Title || 'Download or keep working', text: t.step4Text || 'Save the archive, or send a file straight to another oLoveTools tool.' },
  ];

  const featureIcons = [IconWorker, IconSmart, IconFolderTree, IconInspect, IconLocalOnly, IconHandoff];

  const presetCopy: Record<Preset, { name: string; hint: string }> = {
    smart: { name: t.presetSmart || 'Smart', hint: t.presetSmartHint || 'Deflate 9 for compressible files, stored raw for photos, video and other packed formats.' },
    max: { name: t.presetMax || 'Maximum', hint: t.presetMaxHint || 'Deflate level 9 on everything. Smallest archive, slowest run.' },
    balanced: { name: t.presetBalanced || 'Balanced', hint: t.presetBalancedHint || 'Deflate level 6, the classic ZIP default.' },
    fast: { name: t.presetFast || 'Fast', hint: t.presetFastHint || 'Deflate level 1. Quickest real compression.' },
    store: { name: t.presetStore || 'Store', hint: t.presetStoreHint || 'No compression at all — just bundles the files together.' },
  };

  const methodLabel: Record<Method, string> = {
    auto: t.methodAuto || 'Auto',
    deflate: t.methodDeflate || 'Deflate',
    store: t.methodStore || 'Store',
  };

  const savedPercent = result && result.original > 0
    ? Math.max(0, (1 - result.blob.size / result.original) * 100)
    : 0;

  const bestBench = bench ? bench.reduce((a, b) => (b.size < a.size ? b : a)) : null;

  return (
    <div className="min-h-screen bg-[#0c0802] text-amber-100/90 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/zip-flow`;
        }}
        onReset={handleReset}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. A full-width <main> leaves
          a zero gap and the rails never render at any screen size. */}
      {/* pt-36 (144px), not pt-32: the header stacks into two rows below md and
          measures 133px there, so 128px of padding slides the hero under it. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-36 pb-24 relative z-10 flex flex-col">
        <AdBanner id="adsense-zip-flow-top" />

        {/* ================================================================== */}
        {/* Hero                                                               */}
        {/* ================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-14">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-amber-950/40 border border-amber-800/40 text-amber-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.badge || 'Local ZIP workshop'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-outfit tracking-tight text-white leading-[1.08]">
              {t.heroTitle || 'Pack and unpack ZIP files without uploading anything'}
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              {t.heroText ||
                'Drop files or entire folders, pick how hard to compress, and get a standard ZIP. Or open an archive, browse it like a file manager and pull out only what you need.'}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {(t.heroChips || ['Folders kept intact', 'Worker thread', 'Per-file compression', 'Nothing uploaded']).map(
                (chip: string) => (
                  <span
                    key={chip}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-slate-300"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
          </div>
          <ZipHeroArt
            className="w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            animated={!prefersReduced}
          />
        </section>

        {/* ================================================================== */}
        {/* Tabs                                                               */}
        {/* ================================================================== */}
        <div className="flex justify-center mb-8 w-full max-w-md mx-auto">
          <div className="w-full grid grid-cols-2 gap-2 p-1.5 bg-black/40 border border-white/10 rounded-2xl">
            {(['compress', 'extract'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className={`py-3 px-3 text-xs sm:text-sm font-black uppercase rounded-xl transition-all cursor-pointer border-none outline-none flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'compress' ? <Package className="w-4 h-4 shrink-0" /> : <FolderOpen className="w-4 h-4 shrink-0" />}
                <span className="truncate">
                  {tab === 'compress' ? t.tab_compress || 'Compress' : t.tab_extract || 'Extract'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ================================================================== */}
        {/* Workspace                                                          */}
        {/* ================================================================== */}
        <div className="w-full glass-card rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl relative glow-amber">
          {activeTab === 'compress' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* ---------------------------------------------------------- */}
              {/* Queue                                                       */}
              {/* ---------------------------------------------------------- */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5 min-w-0">
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setDragCompress(true);
                  }}
                  onDragLeave={() => setDragCompress(false)}
                  onDrop={handleCompressDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4 transition-all min-h-[170px] ${
                    dragCompress ? 'border-amber-500 bg-amber-500/5' : 'border-white/10'
                  }`}
                >
                  <input
                    type="file"
                    ref={filesInputRef}
                    onChange={e => {
                      onPickFiles(e.target.files);
                      e.target.value = '';
                    }}
                    multiple
                    className="hidden"
                  />
                  {/* webkitdirectory has no React prop; the attribute is set as-is. */}
                  <input
                    type="file"
                    ref={folderInputRef}
                    onChange={e => {
                      onPickFiles(e.target.files);
                      e.target.value = '';
                    }}
                    multiple
                    className="hidden"
                    {...({ webkitdirectory: '', directory: '' } as any)}
                  />

                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-amber-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-base font-bold text-white">
                      {dragCompress
                        ? t.compress_drop_active || 'Drop them to add'
                        : t.compress_drop_inactive || 'Drag files or folders here'}
                    </p>
                    <p className="text-xs text-slate-500 font-medium max-w-sm">
                      {t.compress_drop_hint ||
                        'Dropped folders keep their structure inside the archive. Nothing is compressed until you press the button.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => filesInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-xs font-bold text-slate-200 transition-all cursor-pointer outline-none"
                    >
                      <FilePlus2 className="w-4 h-4 text-amber-500" />
                      {t.addFiles || 'Add files'}
                    </button>
                    <button
                      onClick={() => folderInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-xs font-bold text-slate-200 transition-all cursor-pointer outline-none"
                    >
                      <FolderPlus className="w-4 h-4 text-amber-500" />
                      {t.addFolder || 'Add a folder'}
                    </button>
                  </div>
                </div>

                {queue.length > 0 && (
                  <div className="flex flex-col gap-3 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/5">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        {(t.queueCount || '{n} files · {size}')
                          .replace('{n}', String(queue.length))
                          .replace('{size}', formatBytes(totalSize))}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={undo}
                          disabled={!past.length}
                          title={`${t.undoBtn || 'Undo'} (Ctrl+Z)`}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={redo}
                          disabled={!future.length}
                          title={`${t.redoBtn || 'Redo'} (Ctrl+Y)`}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Redo2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setManualMode(v => !v)}
                          aria-pressed={manualMode}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer outline-none ${
                            manualMode
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          {t.manualMode || 'Per-file'}
                        </button>
                        <button
                          onClick={clearQueue}
                          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/5 border border-white/10 text-red-400 hover:text-red-300 hover:border-red-400/30 text-[11px] font-bold transition-all cursor-pointer outline-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t.compress_clear_all || 'Clear'}
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                      {queue.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-white/10 transition-colors min-w-0"
                        >
                          <div className="p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                            <FolderArchive className="w-4 h-4 text-amber-500/70" />
                          </div>

                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            {renaming === item.id ? (
                              <input
                                autoFocus
                                defaultValue={item.path}
                                onBlur={e => {
                                  dispatch({ type: 'rename', id: item.id, path: e.target.value });
                                  setRenaming(null);
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  if (e.key === 'Escape') setRenaming(null);
                                }}
                                className="w-full bg-black/60 border border-amber-500/50 rounded-lg px-2 py-1 text-sm text-white outline-none font-mono"
                              />
                            ) : (
                              <button
                                onClick={() => setRenaming(item.id)}
                                title={t.renameHint || 'Click to rename it inside the archive'}
                                className="group flex items-center gap-1.5 min-w-0 bg-transparent border-none p-0 text-left cursor-text outline-none"
                              >
                                <span className="text-sm font-bold text-white truncate">{item.path}</span>
                                <Pencil className="w-3 h-3 text-slate-600 group-hover:text-amber-500 shrink-0 transition-colors" />
                              </button>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono font-bold">
                              {formatBytes(item.file.size)}
                            </span>
                          </div>

                          {manualMode && (
                            <button
                              onClick={() => dispatch({ type: 'cycleMethod', id: item.id })}
                              title={t.methodHint || 'Compression for this file'}
                              className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer outline-none ${
                                item.method === 'auto'
                                  ? 'bg-white/5 border-white/10 text-slate-400'
                                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              }`}
                            >
                              {methodLabel[item.method]}
                            </button>
                          )}

                          <button
                            onClick={() => dispatch({ type: 'remove', id: item.id })}
                            aria-label={`${t.removeFile || 'Remove'}: ${item.path}`}
                            className="shrink-0 p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 border-none bg-transparent transition-colors cursor-pointer outline-none"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------------- */}
              {/* Settings                                                    */}
              {/* ---------------------------------------------------------- */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5 bg-black/25 p-5 rounded-3xl border border-white/5 min-w-0">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 border-b border-white/5 pb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  {t.settingsTitle || 'Archive settings'}
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="zf-name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t.compress_output_filename || 'File name'}
                  </label>
                  <input
                    id="zf-name"
                    type="text"
                    placeholder="archive.zip"
                    value={zipName}
                    onChange={e => setZipName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t.compress_level || 'Compression'}
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {PRESETS.map(name => (
                      <button
                        key={name}
                        onClick={() => {
                          setPreset(name);
                          setResult(null);
                        }}
                        aria-pressed={preset === name}
                        className={`w-full px-3.5 py-2.5 border rounded-xl transition-all cursor-pointer outline-none text-left ${
                          preset === name
                            ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                            : 'border-white/10 hover:border-white/25 text-slate-300'
                        }`}
                      >
                        <span className="block text-xs font-black uppercase tracking-wide">
                          {presetCopy[name].name}
                        </span>
                        {preset === name && (
                          <span className="block text-[11px] font-medium text-slate-400 mt-1 leading-snug">
                            {presetCopy[name].hint}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {preset === 'smart' && queue.length > 0 && (
                    <p className="text-[11px] text-slate-500 font-medium leading-snug">
                      {(t.smartSummary || '{n} of {total} files are already compressed formats and will be stored raw.')
                        .replace('{n}', String(storedCount))
                        .replace('{total}', String(queue.length))}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="zf-comment" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t.commentLabel || 'Archive comment'}
                  </label>
                  <input
                    id="zf-comment"
                    type="text"
                    placeholder={t.commentPlaceholder || 'Optional note stored inside the ZIP'}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-colors"
                  />
                </div>

                {buildError && (
                  <p className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                    <span>{buildError}</span>
                  </p>
                )}

                {(building || benching) && (
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-[width] duration-150"
                        style={{ width: `${Math.min(100, Math.max(2, progress.percent))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                      <span className="truncate">{progress.current || '…'}</span>
                      <span className="shrink-0 tabular-nums">{Math.round(progress.percent)}%</span>
                    </div>
                    <button
                      onClick={cancelBuild}
                      className="w-full py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:text-white hover:border-white/25 transition-all cursor-pointer outline-none"
                    >
                      {t.cancelBtn || 'Cancel'}
                    </button>
                  </div>
                )}

                {result && !building && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t.compress_stats_original || 'Original'}
                        </p>
                        <p className="font-mono font-bold text-white">{formatBytes(result.original)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t.compress_stats_compressed || 'Archive'}
                        </p>
                        <p className="font-mono font-bold text-amber-400">{formatBytes(result.blob.size)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t.compress_stats_savings || 'Saved'}
                        </p>
                        <p className="font-mono font-bold text-emerald-400">{savedPercent.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          {t.statTime || 'Time'}
                        </p>
                        <p className="font-mono font-bold text-white">{formatMs(result.ms)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => saveBlob(result.blob, outputName)}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer outline-none"
                    >
                      <Download className="w-4 h-4" />
                      {(t.downloadZip || 'Download {name}').replace('{name}', outputName)}
                    </button>
                    <button
                      onClick={() => stageZip(new File([result.blob], outputName, { type: 'application/zip' }))}
                      className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-slate-300 hover:text-white hover:border-amber-500/30 transition-all cursor-pointer outline-none flex items-center justify-center gap-2"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      {t.verifyInExtractor || 'Open it in the extractor to check'}
                    </button>
                  </div>
                )}

                {bench && (
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {t.benchTitle || 'Measured on your files'}
                    </p>
                    {bench.map(row => (
                      <div key={row.preset} className="flex items-center justify-between gap-3 text-[11px] font-mono">
                        <span className={`font-bold ${row === bestBench ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {presetCopy[row.preset].name}
                        </span>
                        <span className="text-slate-300 tabular-nums">
                          {formatBytes(row.size)} · {formatMs(row.ms)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/5 pt-4 space-y-2">
                  <button
                    onClick={build}
                    disabled={!queue.length || building}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-3 active:scale-95 duration-200 outline-none shadow-lg ${
                      !queue.length || building
                        ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/10 cursor-pointer'
                    }`}
                  >
                    {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                    <span>{building ? t.compress_working || 'Packing…' : t.compress_btn || 'Create ZIP'}</span>
                  </button>
                  <button
                    onClick={runBench}
                    disabled={!queue.length || benching || building || totalSize > BENCH_LIMIT}
                    title={totalSize > BENCH_LIMIT ? t.benchTooBig || 'Only for queues under 64 MB' : undefined}
                    className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-slate-300 hover:text-white hover:border-amber-500/30 transition-all cursor-pointer outline-none flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {benching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gauge className="w-3.5 h-3.5" />}
                    {t.benchBtn || 'Compare all five presets'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // ================================================================
            // Extract
            // ================================================================
            <div className="flex flex-col gap-6">
              {!entries ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div
                    onDragOver={e => {
                      e.preventDefault();
                      setDragExtract(true);
                    }}
                    onDragLeave={() => setDragExtract(false)}
                    onDrop={handleExtractDrop}
                    className={`border-2 border-dashed rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center gap-4 transition-all min-h-[260px] ${
                      dragExtract ? 'border-amber-500 bg-amber-500/5' : 'border-white/10'
                    }`}
                  >
                    <input
                      type="file"
                      ref={zipInputRef}
                      onChange={e => {
                        stageZip(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                      accept=".zip,.jar,.epub,.docx,.xlsx,.pptx,.apk,application/zip"
                      className="hidden"
                    />

                    {staged ? (
                      <>
                        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-4 text-left space-y-1">
                          <p className="text-sm font-bold text-white truncate">{staged.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{formatBytes(staged.size)}</p>
                        </div>

                        <label className="flex items-center gap-2 text-[11px] font-medium text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checkCrc}
                            onChange={e => setCheckCrc(e.target.checked)}
                            className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                          />
                          {t.verifyCrc || 'Verify every CRC while opening (slower)'}
                        </label>

                        {archiveError && (
                          <p className="flex items-start gap-2 max-w-sm text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 font-medium text-left">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                            <span>{archiveError}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={openArchive}
                            disabled={opening}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs uppercase transition-all active:scale-95 cursor-pointer outline-none disabled:opacity-60"
                          >
                            {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                            {opening ? t.extract_loading || 'Reading the directory…' : t.openArchive || 'Open archive'}
                          </button>
                          <button
                            onClick={closeArchive}
                            className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
                          >
                            {t.chooseAnother || 'Choose another'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-amber-500">
                          <HardDriveDownload className="w-6 h-6" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-base font-bold text-white">
                            {dragExtract
                              ? t.extract_drop_active || 'Drop it to stage the archive'
                              : t.extract_drop_inactive || 'Drag a ZIP here, or pick one'}
                          </p>
                          <p className="text-xs text-slate-500 font-medium max-w-sm">
                            {t.extract_drop_hint ||
                              'Also opens .jar, .epub, .docx, .xlsx and .apk — they are all ZIP containers. Nothing is extracted until you ask.'}
                          </p>
                        </div>
                        <button
                          onClick={() => zipInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-xs font-bold text-slate-200 transition-all cursor-pointer outline-none"
                        >
                          <FilePlus2 className="w-4 h-4 text-amber-500" />
                          {t.selectZip || 'Select a ZIP file'}
                        </button>
                      </>
                    )}
                  </div>

                  <UnzipArt
                    className="hidden lg:block w-full max-w-sm mx-auto text-amber-400"
                    animated={!prefersReduced}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* ------------------------------------------------------ */}
                  {/* Explorer                                                */}
                  {/* ------------------------------------------------------ */}
                  <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative group flex-1 min-w-[180px]">
                        <input
                          ref={searchRef}
                          type="text"
                          placeholder={t.extract_search_placeholder || 'Search by name or path  ( / )'}
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          className="w-full pl-10 pr-9 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-focus-within:text-amber-500 transition-colors" />
                        {query && (
                          <button
                            onClick={() => setQuery('')}
                            aria-label={t.clearSearch || 'Clear search'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-transparent border-none cursor-pointer outline-none"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={expandAll}
                          title={t.expandAll || 'Expand all'}
                          aria-label={t.expandAll || 'Expand all'}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition-all cursor-pointer outline-none"
                        >
                          <ChevronsUpDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={collapseAll}
                          title={t.collapseAll || 'Collapse all'}
                          aria-label={t.collapseAll || 'Collapse all'}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition-all cursor-pointer outline-none"
                        >
                          <ChevronsDownUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={selectAll}
                          title={t.selectAll || 'Select all'}
                          aria-label={t.selectAll || 'Select all'}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition-all cursor-pointer outline-none"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={selectNone}
                          title={t.selectNone || 'Select none'}
                          aria-label={t.selectNone || 'Select none'}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition-all cursor-pointer outline-none"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/25 border border-white/5 rounded-3xl p-3 sm:p-4 min-h-[320px] max-h-[460px] overflow-auto">
                      {searchResults ? (
                        searchResults.length ? (
                          <div className="space-y-1">
                            <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                              {(t.searchCount || '{n} matches').replace('{n}', String(searchResults.length))}
                            </p>
                            {searchResults.slice(0, 500).map(entry => (
                              <div
                                key={entry.path}
                                className="group flex items-center gap-2 py-1.5 px-2 rounded-xl hover:bg-white/[0.04] transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected.has(entry.path)}
                                  onChange={() =>
                                    setSelected(prev => {
                                      const next = new Set(prev);
                                      if (next.has(entry.path)) next.delete(entry.path);
                                      else next.add(entry.path);
                                      return next;
                                    })
                                  }
                                  className="w-3.5 h-3.5 shrink-0 accent-amber-500 cursor-pointer"
                                  aria-label={entry.path}
                                />
                                <button
                                  onClick={() => openEntry(entry)}
                                  className="flex flex-col min-w-0 flex-1 text-left bg-transparent border-none p-0 cursor-pointer outline-none"
                                >
                                  <span className="text-sm font-medium text-slate-200 truncate">
                                    {entry.path.split('/').pop()}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500 truncate">{entry.path}</span>
                                </button>
                                <span className="text-[11px] font-mono text-slate-500 shrink-0 tabular-nums">
                                  {formatBytes(entry.size)}
                                </span>
                                <button
                                  onClick={() => downloadEntry(entry.path)}
                                  aria-label={`${t.extract_single_download || 'Download'}: ${entry.path}`}
                                  className="shrink-0 p-1.5 rounded-lg text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 hover:text-white transition-all cursor-pointer outline-none"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="py-12 text-center text-sm text-slate-500">
                            {(t.searchEmpty || 'Nothing in this archive matches “{q}”.').replace('{q}', query.trim())}
                          </p>
                        )
                      ) : tree && tree.children.length ? (
                        <FileTree
                          node={tree}
                          expanded={expanded}
                          selected={selected}
                          activePath={active?.path ?? null}
                          onToggleExpand={toggleExpand}
                          onToggleSelect={toggleSelect}
                          onOpen={node => node.entry && openEntry(node.entry)}
                          onDownload={node => downloadEntry(node.path)}
                          filesUnder={filesUnder}
                          labels={{
                            download: t.extract_single_download || 'Download',
                            ratio: t.ratioLabel || 'Space saved by compression',
                          }}
                        />
                      ) : (
                        <p className="py-12 text-center text-sm text-slate-500">
                          {t.extract_empty || 'This archive is empty.'}
                        </p>
                      )}
                    </div>

                    {active && (
                      <EntryPreview
                        entry={active}
                        blob={activeBlob}
                        loading={previewLoading}
                        error={previewError}
                        lang={lang}
                        t={t}
                        onClose={() => {
                          setActive(null);
                          setActiveBlob(null);
                        }}
                        onDownload={() => downloadEntry(active.path)}
                      />
                    )}
                  </div>

                  {/* ------------------------------------------------------ */}
                  {/* Archive info + actions                                  */}
                  {/* ------------------------------------------------------ */}
                  <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5 bg-black/25 p-5 rounded-3xl border border-white/5 min-w-0">
                    <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-2 min-w-0">
                        <Info className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t.extract_info_title || 'Archive'}</span>
                      </h3>
                      <button
                        onClick={closeArchive}
                        aria-label={t.closeArchive || 'Close archive'}
                        className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border-none outline-none"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-sm text-left min-w-0">
                      <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                          {t.archiveName || 'Name'}
                        </p>
                        <p className="text-white font-bold truncate">{staged?.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                        {[
                          { label: t.extract_info_files || 'Files', value: String(totals.files) },
                          { label: t.extract_info_folders || 'Folders', value: String(totals.folders) },
                          { label: t.archiveOnDisk || 'On disk', value: formatBytes(staged?.size || 0) },
                          { label: t.archiveUnpacked || 'Unpacked', value: formatBytes(totals.size) },
                        ].map(cell => (
                          <div key={cell.label}>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                              {cell.label}
                            </p>
                            <p className="text-amber-500 font-black font-mono text-base">{cell.value}</p>
                          </div>
                        ))}
                      </div>
                      {totals.size > 0 && (
                        <p className="text-[11px] text-slate-500 font-medium border-t border-white/5 pt-3">
                          {(t.archiveRatio || 'Compression saved {pct}% of the original bytes.').replace(
                            '{pct}',
                            Math.max(0, (1 - totals.packed / totals.size) * 100).toFixed(1)
                          )}
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-black/40 border border-white/5 p-3.5 space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {t.selectionLabel || 'Selection'}
                      </p>
                      <p className="text-sm font-bold text-white">
                        {(t.selectionValue || '{n} files · {size}')
                          .replace('{n}', String(selected.size))
                          .replace('{size}', formatBytes(selectedSize))}
                      </p>
                    </div>

                    {archiveError && (
                      <p className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                        <span>{archiveError}</span>
                      </p>
                    )}

                    {exporting && (
                      <div className="space-y-1.5">
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-[width] duration-150"
                            style={{ width: `${Math.round((exporting.done / Math.max(1, exporting.total)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                          {exporting.done} / {exporting.total}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-4 space-y-2">
                      {supportsDirectoryPicker() && (
                        <button
                          onClick={extractToFolder}
                          disabled={!selected.size || !!exporting}
                          className={`w-full py-4 rounded-2xl font-black text-sm uppercase transition-all flex items-center justify-center gap-2.5 active:scale-95 duration-200 outline-none shadow-lg ${
                            !selected.size || exporting
                              ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                              : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/10 cursor-pointer'
                          }`}
                        >
                          <FolderOpen className="w-4 h-4" />
                          {t.extractToFolder || 'Extract into a folder'}
                        </button>
                      )}
                      <button
                        onClick={downloadSelectedZip}
                        disabled={!selected.size || !!exporting}
                        className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2.5 active:scale-95 outline-none ${
                          !selected.size || exporting
                            ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
                            : supportsDirectoryPicker()
                              ? 'border border-white/10 bg-white/5 text-slate-200 hover:border-amber-500/30 hover:text-white cursor-pointer'
                              : 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/10 cursor-pointer'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        {t.downloadSelection || 'Download the selection as a ZIP'}
                      </button>
                      {!supportsDirectoryPicker() && (
                        <p className="text-[11px] text-slate-500 font-medium leading-snug">
                          {t.noPickerHint ||
                            'Saving straight into a folder needs Chrome or Edge. Here, the selection comes back as one ZIP instead.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* How it works                                                       */}
        {/* ================================================================== */}
        <section className="mt-24 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              {t.howItWorksTitle || 'How it works'}
            </h2>
            <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Art = step.art;
              return (
                <div
                  key={i}
                  className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-amber-500/20 transition-all group"
                >
                  <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-amber-500/10 transition-colors">
                    {i + 1}
                  </span>
                  <Art className="w-24 h-auto text-amber-400" />
                  <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================== */}
        {/* Features                                                           */}
        {/* ================================================================== */}
        <motion.section
          initial={prefersReduced ? false : 'hidden'}
          whileInView={prefersReduced ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeInUp}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {(t.features || []).map((feature: any, idx: number) => {
            const Icon = featureIcons[idx] || IconLocalOnly;
            return (
              <div
                key={idx}
                className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 group border border-white/5"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 group-hover:border-amber-500/40 transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-amber-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
              </div>
            );
          })}
        </motion.section>

        {/* ================================================================== */}
        {/* SEO content                                                        */}
        {/* ================================================================== */}
        <section className="mt-24 space-y-20 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-[11px] font-black uppercase tracking-[0.2em] border border-amber-500/20">
                {t.seoKeywords?.[0]}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-[1.1] tracking-tight">
                {t.seoHeroTitle}
              </h2>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(t.seoHeroList || []).map((point: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all min-w-0"
                  >
                    <span className="w-7 h-7 shrink-0 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span className="text-slate-300 font-bold text-sm min-w-0">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative glass-card rounded-[2.5rem] p-8 py-14 min-h-[360px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl" />
              <IconWorker className="w-20 h-20 text-amber-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  {t.seoBrowserSpeedTitle}
                </h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#150d02] border border-white/5 space-y-10">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-white leading-tight">
                {t.seoSecondaryTitle || 'A file manager for archives, not a black box'}
              </h2>
              <div className="h-1.5 w-20 bg-amber-500 rounded-full" />
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
          <div className="max-w-4xl mx-auto w-full space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
              <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
            </div>
            <div className="grid gap-3">
              {(t.faq || []).map((faq: any, idx: number) => (
                <details
                  key={idx}
                  className="glass-card rounded-2xl px-5 sm:px-6 py-5 text-left border border-white/5 hover:border-amber-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 text-[11px] font-black">
                      Q
                    </span>
                    <span className="flex-1 min-w-0">{faq.question}</span>
                    <span className="shrink-0 text-amber-400 transition-transform group-open:rotate-45 text-xl leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              {t.seoKeywordsTitle || 'Keywords'}
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {(t.seoKeywords || []).map((keyword: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400 transition-all cursor-default"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>

        <AdBanner id="adsense-zip-flow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={openLegal} />

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy'
            ? legalTranslations[lang]?.privacy.title || 'Privacy Policy'
            : modalType === 'terms'
              ? legalTranslations[lang]?.terms.title || 'Terms of Service'
              : legalTranslations[lang]?.cookies.title || 'Cookie Policy'
        }
        content={
          modalType === 'privacy'
            ? legalTranslations[lang]?.privacy.content || ''
            : modalType === 'terms'
              ? legalTranslations[lang]?.terms.content || ''
              : legalTranslations[lang]?.cookies.content || ''
        }
        t={t}
      />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-10 right-10 z-[200] w-12 h-12 bg-white text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 hover:-translate-y-1 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>
      )}
    </div>
  );
};

export default ZipFlow;
