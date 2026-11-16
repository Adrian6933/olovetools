import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  ClipboardPaste,
  Download,
  FileText,
  History,
  Image as ImageIcon,
  Loader2,
  MonitorUp,
  QrCode,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { CameraScanner } from './components/CameraScanner';
import { ResultView, kindLabel } from './components/ResultView';
import { SeoSections } from './components/SeoSections';
import { legalTranslations } from '../../locales/legal';
import { AdBanner } from '../../components/shared/AdBanner';
import { useHandoffIntake } from '../../lib/useHandoff';
import {
  cameraAlreadyAllowed,
  canCaptureScreen,
  canUseCamera,
  decodeBitmap,
  decodeFrame,
  decodeImageFile,
  decodePdfFile,
  isTouchDevice,
  warmUpDecoder,
  type Detection,
} from './lib/decode';
import { parseScan, prettyFormat, type ParsedPayload } from './lib/parse';
import {
  DEFAULT_PREFS,
  addToHistory,
  historyToCsv,
  readHistory,
  readPrefs,
  writeHistory,
  writePrefs,
  type HistoryItem,
  type Prefs,
} from './lib/history';
import { downloadText } from './lib/actions';

interface QrReaderProps {
  lang: string;
  dictionary: any;
}

type Source = 'camera' | 'image' | 'pdf' | 'screen' | 'text' | 'history';

interface Scan {
  id: string;
  payload: ParsedPayload;
  corners?: { x: number; y: number }[];
  page?: number;
}

interface Preview {
  url: string;
  width: number;
  height: number;
}

const AUTO_CAMERA_KEY = 'olovetools_qr_autocam';

export default function QrReader({ lang, dictionary }: QrReaderProps) {
  const t = dictionary || {};

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [selected, setSelected] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showText, setShowText] = useState(false);
  const [manualText, setManualText] = useState('');
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  // Capabilities are only known in the browser; until then render the
  // universal layout so the server HTML and the first client render match.
  const [env, setEnv] = useState({ ready: false, touch: false, screen: false, camera: true });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const screenStopRef = useRef<(() => void) | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  // ==========================================================================
  // Mount: preferences, history, device, warm the decoder
  // ==========================================================================
  useEffect(() => {
    const p = readPrefs();
    setPrefs(p);
    if (p.keepHistory) setHistory(readHistory());
    const touch = isTouchDevice();
    setEnv({ ready: true, touch, screen: canCaptureScreen(), camera: canUseCamera() });
    warmUpDecoder();

    // A phone that already allowed the camera opens straight into the scanner,
    // like the camera app. Once per tab: closing it must not reopen it.
    if (touch) {
      let already = false;
      try {
        already = sessionStorage.getItem(AUTO_CAMERA_KEY) === '1';
        sessionStorage.setItem(AUTO_CAMERA_KEY, '1');
      } catch {
        /* private mode */
      }
      if (!already) void cameraAlreadyAllowed().then(ok => ok && setCameraOpen(true));
    }
  }, []);

  const updatePrefs = useCallback((next: Prefs) => {
    setPrefs(next);
    writePrefs(next);
    if (!next.keepHistory) {
      setHistory([]);
      writeHistory([]);
    }
  }, []);

  // ==========================================================================
  // Accepting results
  // ==========================================================================
  const accept = useCallback(
    (found: { text: string; format: string; corners?: { x: number; y: number }[]; page?: number }[], source: Source, pic?: Preview | null) => {
      const list: Scan[] = found.map((d, i) => ({
        id: `${Date.now()}-${i}`,
        payload: parseScan(d.text, d.format),
        corners: d.corners,
        page: d.page,
      }));
      setScans(list);
      setSelected(0);
      setPreview(pic || null);
      setError(null);
      if (prefsRef.current.keepHistory && source !== 'history') {
        setHistory(prev => {
          let next = prev;
          for (const d of [...found].reverse()) next = addToHistory(next, { text: d.text, format: d.format, source });
          writeHistory(next);
          return next;
        });
      }
      // On a phone the result sits under the scanner: bring it into view.
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    },
    []
  );

  const reset = useCallback(() => {
    screenStopRef.current?.();
    setScans([]);
    setPreview(null);
    setError(null);
    setNotice(null);
    setBusy(null);
    setManualText('');
    setShowText(false);
  }, []);

  // ==========================================================================
  // Files: images and PDFs
  // ==========================================================================
  const readFile = useCallback(
    async (file: File) => {
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!isPdf && !file.type.startsWith('image/') && !/\.(heic|heif|avif|webp|png|jpe?g|gif|bmp)$/i.test(file.name)) {
        setError(t.errorBadImage || 'That file could not be read as an image.');
        return;
      }
      setError(null);
      setNotice(null);
      setBusy(t.busyReading || 'Looking for codes…');
      try {
        if (isPdf) {
          const res = await decodePdfFile(file, (n, total) =>
            setBusy((t.busyPdf || 'Reading page {n} of {total}…').replace('{n}', String(n)).replace('{total}', String(total)))
          );
          const found = res.pages.flatMap(p => p.detections.map(d => ({ ...d, page: p.page })));
          if (res.truncated) setNotice((t.pdfTruncated || 'Only the first {n} pages were searched.').replace('{n}', '20'));
          if (found.length) {
            const first = res.pages[0];
            accept(found, 'pdf', res.pages.length === 1 ? { url: first.previewUrl, width: first.width, height: first.height } : null);
          } else setError(t.errorNoCodePdf || 'No QR code or barcode was found in that PDF.');
        } else {
          const res = await decodeImageFile(file);
          if (res.detections.length) accept(res.detections, 'image', { url: res.previewUrl, width: res.width, height: res.height });
          else setError(t.errorNoCode || 'No code was found in that image. Try a closer, sharper photo, or crop around the code.');
        }
      } catch {
        setError(isPdf ? t.errorPdf || 'That PDF could not be opened.' : t.errorBadImage || 'That file could not be read as an image.');
      } finally {
        setBusy(null);
      }
    },
    [accept, t]
  );

  // Another oLoveTools tool can hand an image straight over.
  useHandoffIntake(file => void readFile(file));

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void readFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  // Ctrl+V anywhere: the usual way a screenshot arrives on a computer.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const file = Array.from(e.clipboardData?.files || [])[0]
        || Array.from(e.clipboardData?.items || []).find(i => i.kind === 'file')?.getAsFile();
      if (file) {
        e.preventDefault();
        void readFile(file);
        return;
      }
      const text = e.clipboardData?.getData('text')?.trim();
      if (text && /^(WIFI:|BEGIN:|MECARD:|https?:\/\/)/i.test(text)) {
        e.preventDefault();
        accept([{ text, format: '' }], 'text');
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [readFile, accept]);

  const pasteFromClipboard = useCallback(async () => {
    setError(null);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(ty => ty.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          await readFile(new File([blob], 'clipboard.png', { type }));
          return;
        }
      }
      setError(t.errorNoClipboardImage || 'There is no image in your clipboard. Copy a screenshot of the code first.');
    } catch {
      setError(t.errorClipboardBlocked || 'Your browser blocked clipboard access. Press Ctrl+V on this page instead.');
    }
  }, [readFile, t]);

  // ==========================================================================
  // Screen: a QR shown in another window, a video call or a web page
  // ==========================================================================
  const scanScreen = useCallback(async () => {
    setError(null);
    setNotice(null);
    let stream: MediaStream;
    try {
      setBusy(t.busyScreen || 'Choose the window, tab or screen where the code is…');
      stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: { frameRate: 5 }, audio: false });
    } catch {
      setBusy(null);
      return; // cancelled from the browser's picker: nothing to report
    }

    setBusy(t.screenSearching || 'Searching your screen for a code…');
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play().catch(() => undefined);

    let stopped = false;
    const stop = () => {
      stopped = true;
      stream.getTracks().forEach(tr => tr.stop());
      screenStopRef.current = null;
    };
    screenStopRef.current = stop;
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (!stopped) {
        stop();
        setBusy(null);
      }
    });

    const canvas = document.createElement('canvas');
    const deadline = Date.now() + 20_000;
    while (!stopped && Date.now() < deadline) {
      if (video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const quick = await decodeFrame(ctx.getImageData(0, 0, canvas.width, canvas.height));
          if (quick.length && !stopped) {
            // Found one: search the same frame properly for every code it shows.
            const full = await decodeBitmap(canvas);
            stop();
            setBusy(null);
            accept(full.detections.length ? full.detections : quick, 'screen', { url: full.previewUrl, width: full.width, height: full.height });
            return;
          }
        }
      }
      await new Promise(r => setTimeout(r, 400));
    }
    if (!stopped) {
      stop();
      setBusy(null);
      setError(t.errorScreenNoCode || 'No code appeared on the shared screen. Make the code bigger or share the window where it is.');
    }
  }, [accept, t]);

  // ==========================================================================
  // Camera
  // ==========================================================================
  const openCamera = () => {
    setError(null);
    setNotice(null);
    setCameraOpen(true);
  };

  const onCameraClose = useCallback(
    (reason?: 'denied' | 'missing' | 'insecure') => {
      setCameraOpen(false);
      if (reason === 'denied')
        setError(t.errorCameraDenied || 'Camera access was blocked. Allow it from the padlock icon next to the address, or use a photo instead.');
      else if (reason === 'missing') setError(t.errorCameraMissing || 'No camera was found on this device. Use a photo or screenshot instead.');
      else if (reason === 'insecure') setError(t.errorInsecure || 'The camera only works over a secure (https) connection.');
    },
    [t]
  );

  const onCameraResult = useCallback(
    (found: Detection[]) => {
      setCameraOpen(false);
      accept(found, 'camera');
    },
    [accept]
  );

  // ==========================================================================
  // History
  // ==========================================================================
  const openHistory = (item: HistoryItem) => accept([{ text: item.text, format: item.format }], 'history');

  const clearHistory = () => {
    setHistory([]);
    writeHistory([]);
  };

  const exportHistory = () => downloadText(historyToCsv(history), 'qr-scans.csv', 'text/csv;charset=utf-8');

  const timeFmt = (at: number) => {
    try {
      return new Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'short' }).format(at);
    } catch {
      return new Date(at).toLocaleString();
    }
  };

  // ==========================================================================
  // UI
  // ==========================================================================
  const current = scans[selected];
  const desktopFirst = env.ready && !env.touch;

  const bigBtn =
    'w-full flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.99]';

  const cameraButton = (
    <button
      onClick={openCamera}
      disabled={!env.camera}
      className={`${bigBtn} border-cyan-400/40 bg-gradient-to-br from-cyan-500 to-cyan-600 text-black hover:from-cyan-400 hover:to-cyan-500 disabled:opacity-40 shadow-[0_10px_40px_-10px_rgba(6,182,212,0.7)]`}
    >
      <span className="w-12 h-12 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
        <Camera className="w-6 h-6" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-black">{desktopFirst ? t.srcWebcam || 'Use the webcam' : t.srcCamera || 'Scan with the camera'}</span>
        <span className="block text-xs font-bold opacity-75">{t.srcCameraHint || 'Point it at the code. It reads on its own.'}</span>
      </span>
    </button>
  );

  const dropZone = (
    <div
      onDragOver={e => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
      className={`rounded-2xl border-2 border-dashed px-5 py-8 md:py-12 text-center flex flex-col items-center gap-3 cursor-pointer transition-all ${
        dragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/15 hover:border-cyan-500/50 bg-black/25 hover:bg-black/40'
      }`}
    >
      <span className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-300">
        <Upload className="w-6 h-6" />
      </span>
      <span className="block text-base md:text-lg font-black text-white">{t.dropTitle || 'Drop an image or PDF here'}</span>
      <span className="block text-sm text-slate-400">
        {t.dropHint || 'or press Ctrl+V to paste a screenshot'}
      </span>
      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">PNG · JPG · WEBP · HEIC · PDF</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#04080a] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/qr-reader/`)}
        onReset={reset}
        t={t}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.heic,.heif"
        onChange={onFileInput}
        className="hidden"
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 md:pt-28 pb-24 relative z-10">
        {/* ================================================================ */}
        {/* Tool: visible without scrolling on a phone                       */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-2 pt-1">
              <h1 className="text-[1.7rem] leading-tight md:text-5xl font-black tracking-tight text-white">
                {t.h1 || 'QR code reader online'}
              </h1>
              <p className="text-sm md:text-lg text-slate-400 leading-relaxed">
                {t.subtitle || 'Scan QR codes and barcodes with your camera, from a photo, a screenshot, a PDF or your screen. Free, no app, nothing uploaded.'}
              </p>
            </div>

            <div className="glass-card rounded-3xl p-3.5 md:p-5 space-y-3">
              {/* Phones: camera first. Computers: drop/paste first. */}
              {desktopFirst ? dropZone : cameraButton}

              <div className="grid grid-cols-2 gap-2.5">
                {desktopFirst ? (
                  <>
                    {env.screen && (
                      <button
                        onClick={scanScreen}
                        className="col-span-2 flex items-center gap-3 p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-left cursor-pointer transition-colors"
                      >
                        <MonitorUp className="w-5 h-5 text-cyan-300 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-white">{t.srcScreen || 'Read a QR from my screen'}</span>
                          <span className="block text-xs text-slate-400">{t.srcScreenHint || 'For a code in another window, a video call or a web page'}</span>
                        </span>
                      </button>
                    )}
                    <button onClick={openCamera} disabled={!env.camera} className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold text-white cursor-pointer disabled:opacity-40">
                      <Camera className="w-4 h-4" />
                      {t.srcWebcam || 'Use the webcam'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold text-white cursor-pointer">
                    <ImageIcon className="w-4 h-4" />
                    {t.srcUpload || 'Photo or PDF'}
                  </button>
                )}
                <button onClick={pasteFromClipboard} className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-bold text-white cursor-pointer">
                  <ClipboardPaste className="w-4 h-4" />
                  {t.srcPaste || 'Paste image'}
                </button>
              </div>

              <button
                onClick={() => setShowText(v => !v)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 px-1 cursor-pointer"
                aria-expanded={showText}
              >
                <FileText className="w-3.5 h-3.5" />
                {t.srcText || 'I already have the text of the code'}
              </button>
              {showText && (
                <div className="space-y-2">
                  <label className="sr-only" htmlFor="qr-manual">{t.manualLabel || 'Paste the raw content of a QR code'}</label>
                  <textarea
                    id="qr-manual"
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    rows={4}
                    placeholder="WIFI:T:WPA;S:MyNetwork;P:secret;;"
                    className="w-full bg-[#050f14] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500 font-mono resize-y"
                  />
                  <button
                    onClick={() => manualText.trim() && accept([{ text: manualText.trim(), format: '' }], 'text')}
                    disabled={!manualText.trim()}
                    className="flex items-center gap-2 px-5 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black text-sm font-black cursor-pointer"
                  >
                    <ScanLine className="w-4 h-4" />
                    {t.analyseBtn || 'Analyse it'}
                  </button>
                </div>
              )}

              {busy && (
                <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3" role="status">
                  <Loader2 className="w-5 h-5 text-cyan-300 animate-spin shrink-0" />
                  <p className="text-sm font-bold text-cyan-100 flex-1">{busy}</p>
                  {screenStopRef.current && (
                    <button onClick={() => { screenStopRef.current?.(); setBusy(null); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer" aria-label={t.closeBtn || 'Close'}>
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3" role="alert">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-amber-200 leading-snug">{error}</p>
                </div>
              )}
              {notice && !error && <p className="text-xs text-slate-400 px-1">{notice}</p>}
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-1">
              {(Array.isArray(t.heroPoints) ? t.heroPoints : ['No app, no sign-up', 'Nothing is uploaded', 'Never opens links by itself']).map((p: string) => (
                <li key={p} className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* ---------------------------------------------------- result */}
          <div ref={resultRef} className="lg:col-span-5 lg:sticky lg:top-28 space-y-4 scroll-mt-20">
            <div className="glass-card rounded-3xl p-4 md:p-6">
              {!current ? (
                <div className="flex flex-col items-center justify-center text-center gap-3 py-10 md:py-16">
                  <QrCode className="w-12 h-12 text-slate-700" />
                  <p className="text-sm text-slate-500 font-bold max-w-[260px] leading-relaxed">
                    {t.emptyResult || 'What the code contains will appear here, in full, before anything is opened.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-black text-white">
                      {scans.length > 1
                        ? (t.foundCount || '{n} codes found').replace('{n}', String(scans.length))
                        : t.resultTitle || 'Result'}
                    </h2>
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.scanAgainBtn || 'Scan another'}
                    </button>
                  </div>

                  {preview && (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                      <img src={preview.url} alt="" className="w-full max-h-64 object-contain" />
                      <svg viewBox={`0 0 ${preview.width} ${preview.height}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                        {scans.map((s, i) =>
                          s.corners && s.corners.length === 4 ? (
                            <g key={s.id} onClick={() => setSelected(i)} className="cursor-pointer">
                              <polygon
                                points={s.corners.map(p => `${p.x},${p.y}`).join(' ')}
                                fill={i === selected ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.12)'}
                                stroke={i === selected ? '#22d3ee' : '#ffffff'}
                                strokeWidth={Math.max(3, preview.width / 160)}
                              />
                              {scans.length > 1 && (
                                <text x={s.corners[0].x} y={s.corners[0].y - preview.width / 80} fill="#22d3ee" fontSize={Math.max(18, preview.width / 28)} fontWeight="900">
                                  {i + 1}
                                </text>
                              )}
                            </g>
                          ) : null
                        )}
                      </svg>
                    </div>
                  )}

                  {scans.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                      {scans.map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => setSelected(i)}
                          className={`shrink-0 max-w-[12rem] text-left px-3 py-2 rounded-xl border text-xs cursor-pointer ${
                            i === selected ? 'border-cyan-400 bg-cyan-500/15 text-white' : 'border-white/10 bg-white/5 text-slate-400'
                          }`}
                        >
                          <span className="block font-black">
                            {i + 1}. {kindLabel(t, s.payload.kind)}
                            {s.page ? ` · ${(t.pageLabel || 'p. {n}').replace('{n}', String(s.page))}` : ''}
                          </span>
                          <span className="block truncate">{s.payload.raw}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <ResultView t={t} payload={current.payload} />
                </div>
              )}
            </div>

            <a
              href={`/${lang.toLowerCase()}/qr-bolt/`}
              className="glass-card rounded-3xl p-4 flex items-center gap-4 hover:border-cyan-500/30 transition-all group"
            >
              <span className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <QrCode className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">{t.makerCardTitle || 'Need to create a QR code?'}</span>
                <span className="block text-xs text-slate-500 leading-snug">
                  {t.makerCardText || 'QRBolt builds styled QR codes and checks they scan before you print them.'}
                </span>
              </span>
            </a>
          </div>
        </section>

        {/* ================================================================ */}
        {/* History                                                          */}
        {/* ================================================================ */}
        {env.ready && (
          <section className="mt-8 glass-card rounded-3xl p-4 md:p-6 space-y-4" aria-labelledby="qr-history-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="qr-history-title" className="flex items-center gap-2 text-base font-black text-white">
                <History className="w-4 h-4 text-cyan-400" />
                {t.historyTitle || 'Your scans'}
                {history.length > 0 && <span className="text-slate-500 font-bold">({history.length})</span>}
              </h2>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <>
                    <button onClick={exportHistory} className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                      {t.exportCsvBtn || 'Export CSV'}
                    </button>
                    <button onClick={clearHistory} className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/5 hover:bg-red-500/15 hover:text-red-300 text-xs font-bold text-slate-300 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                      {t.clearBtn || 'Clear'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {history.length > 0 ? (
              <ul className="divide-y divide-white/5 max-h-80 overflow-auto -mx-1">
                {history.map(item => {
                  const p = parseScan(item.text, item.format);
                  return (
                    <li key={item.id}>
                      <button onClick={() => openHistory(item)} className="w-full flex items-center gap-3 px-1 py-2.5 text-left hover:bg-white/[0.03] rounded-lg cursor-pointer">
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 w-20 shrink-0 truncate">{kindLabel(t, p.kind)}</span>
                        <span className="flex-1 min-w-0 text-sm text-slate-300 truncate">{p.kind === 'wifi' ? p.fields[0]?.value : item.text}</span>
                        {p.warnings.length > 0 && <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />}
                        <span className="text-[11px] text-slate-600 shrink-0 hidden sm:block">{item.format ? prettyFormat(item.format) + ' · ' : ''}{timeFmt(item.at)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">{prefs.keepHistory ? t.historyEmpty || 'Codes you scan will be listed here.' : t.historyOff || 'History is off.'}</p>
            )}

            <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.keepHistory}
                onChange={e => updatePrefs({ ...prefs, keepHistory: e.target.checked })}
                className="mt-0.5 accent-cyan-500 w-4 h-4"
              />
              <span>
                <span className="font-bold text-slate-300">{t.keepHistoryLabel || 'Keep a history on this device'}</span>
                {' · '}
                {t.historyPrivacy || 'It stays in this browser only and is never sent anywhere.'}
              </span>
            </label>
          </section>
        )}

        <AdBanner id="adsense-qr-reader-top" className="mt-10" />

        <SeoSections t={t} lang={lang} />
      </main>

      {cameraOpen && (
        <CameraScanner
          t={t}
          prefs={prefs}
          onPrefs={updatePrefs}
          onResult={onCameraResult}
          onBatch={found => {
            setCameraOpen(false);
            accept(found, 'camera');
          }}
          onClose={onCameraClose}
        />
      )}

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />
      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
