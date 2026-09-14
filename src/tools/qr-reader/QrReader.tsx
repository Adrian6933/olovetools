import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  ExternalLink,
  FileText,
  History,
  Image as ImageIcon,
  Loader2,
  QrCode,
  RotateCcw,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  IconCamera,
  IconInspect,
  IconLocalRead,
  IconPaste,
  IconSafety,
  IconStructured,
  ReaderHeroArt,
  StepAct,
  StepDecode,
  StepReview,
  StepSource,
  ViewfinderArt,
} from './components/Illustrations';
import { legalTranslations } from '../../locales/legal';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import { createTicker, type Ticker } from '../../lib/ticker';
import {
  decodeFile,
  decodeImageData,
  parsePayload,
  type ParsedPayload,
  type PayloadKind,
  type WarningKind,
} from './lib/parse';

interface QrReaderProps {
  lang: string;
  dictionary: any;
}

type SourceMode = 'camera' | 'image' | 'text';

interface HistoryEntry {
  id: number;
  payload: ParsedPayload;
  at: number;
}

/** Warnings that should stop someone before they tap a link. */
const SEVERE: WarningKind[] = ['punycode', 'mixedScript', 'credentials', 'executable', 'ipHost'];

const VCARD_PROPERTIES: Record<string, string> = {
  fieldName: 'FN',
  fieldOrganization: 'ORG',
  fieldJobTitle: 'TITLE',
  fieldPhone: 'TEL',
  fieldEmail: 'EMAIL',
  fieldWebsite: 'URL',
  fieldAddress: 'ADR',
  fieldNote: 'NOTE',
  fieldBirthday: 'BDAY',
};

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function contactAsVCard(payload: ParsedPayload): string {
  if (payload.kind === 'vcard') return payload.raw;

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  for (const field of payload.fields) {
    const property = VCARD_PROPERTIES[field.key];
    if (property && field.value) lines.push(`${property}:${escapeVCardValue(field.value)}`);
  }
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export default function QrReader({ lang, dictionary }: QrReaderProps) {
  const t = dictionary || {};
  const prefersReduced = useReducedMotion();

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [source, setSource] = useState<SourceMode>('image');
  const [result, setResult] = useState<ParsedPayload | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [revealSecret, setRevealSecret] = useState(false);
  const [manualText, setManualText] = useState('');

  // Camera
  const [cameraOn, setCameraOn] = useState(false);
  const [cameras, setCameras] = useState<{ deviceId: string; label: string }[]>([]);
  const [cameraId, setCameraId] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tickerRef = useRef<Ticker | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nextId = useRef(1);

  // ==========================================================================
  // Result handling
  // ==========================================================================
  const acceptDecoded = useCallback((raw: string) => {
    const payload = parsePayload(raw);
    setResult(payload);
    setRevealSecret(false);
    setError(null);
    setHistory(prev => {
      // Re-scanning the same sticker should not fill the list with duplicates.
      const withoutDupe = prev.filter(entry => entry.payload.raw !== payload.raw);
      return [{ id: nextId.current++, payload, at: Date.now() }, ...withoutDupe].slice(0, 12);
    });
  }, []);

  // ==========================================================================
  // Camera
  // ==========================================================================
  const stopCamera = useCallback(() => {
    tickerRef.current?.stop();
    tickerRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setTorchOn(false);
    setTorchAvailable(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }
    // Downscale wide frames: a QR needs resolution, not megapixels, and this
    // keeps each pass cheap enough to run several times a second.
    const scale = Math.min(1, 900 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const found = await decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (found) {
      // Stop on the first hit: continuing would keep re-reading the same code
      // and make the result flicker while the user is trying to read it.
      stopCamera();
      acceptDecoded(found.data);
    }
  }, [acceptDecoded, stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraId
          ? { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraOn(true);

      const track = stream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities?.() || {};
      setTorchAvailable(!!capabilities.torch);

      // Labels only exist once permission has been granted at least once.
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(
        devices
          .filter(d => d.kind === 'videoinput')
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }))
      );

      tickerRef.current?.stop();
      tickerRef.current = createTicker(200, () => void scanFrame());
    } catch (err: any) {
      const denied = err?.name === 'NotAllowedError';
      setError(
        denied
          ? t.errorCameraDenied || 'Camera permission was denied. You can still scan an image or paste one.'
          : t.errorCameraMissing || 'No camera is available on this device.'
      );
      stopCamera();
    }
  }, [cameraId, scanFrame, stopCamera, t]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && streamRef.current && cameraOn) {
      video.srcObject = streamRef.current;
      video.play().catch(() => undefined);
    }
  }, [cameraOn]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] } as any);
      setTorchOn(v => !v);
    } catch {
      setTorchAvailable(false);
    }
  }, [torchOn]);

  // ==========================================================================
  // Image intake
  // ==========================================================================
  const readImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setBusy(true);
      setError(null);
      setSource('image');
      try {
        const found = await decodeFile(file);
        if (found) acceptDecoded(found.data);
        else setError(t.errorNoCode || 'No QR code was found in that image. Try a closer, sharper shot.');
      } catch {
        setError(t.errorBadImage || 'That file could not be read as an image.');
      } finally {
        setBusy(false);
      }
    },
    [acceptDecoded, t]
  );

  // Lets another tool hand an image straight over for reading.
  useHandoffIntake(readImage);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) void readImage(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readImage(file);
  };

  // Pasting a screenshot is how most people arrive here from a chat app.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        void readImage(file);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [readImage]);

  const pasteFromClipboard = useCallback(async () => {
    setError(null);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(ty => ty.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          await readImage(new File([blob], 'clipboard.png', { type }));
          return;
        }
      }
      setError(t.errorNoClipboardImage || 'There is no image in your clipboard.');
    } catch {
      setError(t.errorClipboardBlocked || 'Your browser blocked clipboard access. Press Ctrl+V over the page instead.');
    }
  }, [readImage, t]);

  // ==========================================================================
  // Output
  // ==========================================================================
  const copy = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(current => (current === key ? null : current)), 1600);
    } catch {
      /* clipboard blocked; the text is on screen anyway */
    }
  }, []);

  const downloadVCard = useCallback(() => {
    if (!result) return;
    const blob = new Blob([contactAsVCard(result)], { type: 'text/vcard;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'contact.vcf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }, [result]);

  const reset = useCallback(() => {
    stopCamera();
    setResult(null);
    setError(null);
    setManualText('');
  }, [stopCamera]);

  const analyseManual = useCallback(() => {
    const value = manualText.trim();
    if (value) acceptDecoded(value);
  }, [manualText, acceptDecoded]);

  // ==========================================================================
  // Copy
  // ==========================================================================
  const kindLabels: Record<PayloadKind, string> = {
    url: t.kindUrl || 'Link',
    wifi: t.kindWifi || 'WiFi network',
    vcard: t.kindContact || 'Contact card',
    mecard: t.kindContact || 'Contact card',
    email: t.kindEmail || 'Email',
    sms: t.kindSms || 'SMS',
    tel: t.kindTel || 'Phone number',
    geo: t.kindGeo || 'Map location',
    event: t.kindEvent || 'Calendar event',
    text: t.kindText || 'Plain text',
  };

  const fieldLabels: Record<string, string> = {
    fieldHost: t.fieldHost || 'Domain',
    fieldSsid: t.fieldSsid || 'Network name',
    fieldSecurity: t.fieldSecurity || 'Security',
    fieldPassword: t.fieldPassword || 'Password',
    fieldHidden: t.fieldHidden || 'Hidden network',
    fieldName: t.fieldName || 'Name',
    fieldOrganization: t.fieldOrganization || 'Organisation',
    fieldJobTitle: t.fieldJobTitle || 'Job title',
    fieldPhone: t.fieldPhone || 'Phone',
    fieldEmail: t.fieldEmail || 'Email',
    fieldWebsite: t.fieldWebsite || 'Website',
    fieldAddress: t.fieldAddress || 'Address',
    fieldNote: t.fieldNote || 'Note',
    fieldBirthday: t.fieldBirthday || 'Birthday',
    fieldSubject: t.fieldSubject || 'Subject',
    fieldBody: t.fieldBody || 'Message',
    fieldMessage: t.fieldMessage || 'Message',
    fieldLatitude: t.fieldLatitude || 'Latitude',
    fieldLongitude: t.fieldLongitude || 'Longitude',
    fieldSummary: t.fieldSummary || 'Title',
    fieldStart: t.fieldStart || 'Starts',
    fieldEnd: t.fieldEnd || 'Ends',
    fieldLocation: t.fieldLocation || 'Location',
  };

  const warningText: Record<WarningKind, string> = {
    insecure: t.warnInsecure || 'This link is plain http, so anything you send over it travels unencrypted.',
    punycode: t.warnPunycode || 'The domain uses punycode. It may be legitimate, or a lookalike of a name you trust.',
    mixedScript: t.warnMixedScript || 'The domain mixes alphabets — a classic trick for impersonating a real site.',
    shortener: t.warnShortener || 'This is a link shortener: the real destination is hidden behind a redirect.',
    ipHost: t.warnIpHost || 'The link points at a raw IP address rather than a domain name.',
    credentials: t.warnCredentials || 'The link carries a username and password inside it.',
    longUrl: t.warnLongUrl || 'The link is unusually long, which is often used to bury the real destination.',
    openWifi: t.warnOpenWifi || 'This network has no password, so traffic on it is not encrypted.',
    executable: t.warnExecutable || 'The link points straight at an installable file.',
  };

  const severity = useMemo(() => {
    if (!result || result.warnings.length === 0) return 'clean' as const;
    return result.warnings.some(w => SEVERE.includes(w)) ? ('severe' as const) : ('caution' as const);
  }, [result]);

  const steps = [
    { art: StepSource, title: t.step1Title || 'Bring the code in', text: t.step1Text || 'Point your camera at it, drop a screenshot, or just paste from the clipboard.' },
    { art: StepDecode, title: t.step2Title || 'It gets decoded here', text: t.step2Text || 'The decoder runs in your browser. The image never leaves the machine.' },
    { art: StepReview, title: t.step3Title || 'Read before you act', text: t.step3Text || 'You see the full destination, the fields inside it, and any red flags.' },
    { art: StepAct, title: t.step4Title || 'Then decide', text: t.step4Text || 'Copy a field, save the contact, or open the link — only if you choose to.' },
  ];

  const featureIcons = [IconInspect, IconSafety, IconLocalRead, IconCamera, IconStructured, IconPaste];
  const features = Array.isArray(t.features) && t.features.length ? t.features : [
    { title: 'Shows, never redirects', text: 'A QR sticker can point anywhere. This reader prints the destination and waits for you.' },
    { title: 'Flags the classic tricks', text: 'Lookalike domains, mixed alphabets, link shorteners, raw IPs and embedded credentials.' },
    { title: '100% local', text: 'The decoder runs in your browser. No image, no scan and no link ever reaches a server.' },
    { title: 'Camera, file or clipboard', text: 'Scan live with the rear camera, drop a screenshot, or hit Ctrl+V anywhere on the page.' },
    { title: 'Reads the structure', text: 'WiFi, vCard, MeCard, email, SMS, phone, geo and calendar payloads are broken into fields.' },
    { title: 'Nothing is stored', text: 'The scan list lives in the tab and disappears the moment you close it.' },
  ];

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#04080a] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/qr-reader`)}
        onReset={reset}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-qr-reader-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                <ScanLine className="w-3.5 h-3.5 shrink-0" />
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
                    <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>

              <a
                href={`/${lang.toLowerCase()}/qr-bolt/`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition-all"
              >
                <QrCode className="w-4 h-4" />
                {t.makerCta || 'Want to create a QR instead? Open QRBolt'}
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full" />
              <ReaderHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Scanner */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex p-1 rounded-2xl bg-[#071319]/80 border border-white/5 gap-1 w-full">
                {[
                  { id: 'image' as SourceMode, label: t.sourceImage || 'Image', icon: ImageIcon },
                  { id: 'camera' as SourceMode, label: t.sourceCamera || 'Camera', icon: Camera },
                  { id: 'text' as SourceMode, label: t.sourceText || 'Raw text', icon: FileText },
                ].map(tab => {
                  const Icon = tab.icon;
                  const active = source === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id !== 'camera') stopCamera();
                        setSource(tab.id);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-cyan-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.35)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5 min-h-[380px]">
                {/* ---------------------------------------------------- image */}
                {source === 'image' && (
                  <div className="space-y-4">
                    <div
                      onDragOver={e => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`rounded-2xl border-2 border-dashed p-10 text-center flex flex-col items-center gap-4 cursor-pointer transition-all ${
                        dragging
                          ? 'border-cyan-500/60 bg-cyan-500/5'
                          : 'border-white/10 hover:border-cyan-500/40 bg-black/20 hover:bg-black/40'
                      }`}
                    >
                      {busy ? (
                        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                      ) : (
                        <ViewfinderArt className="w-24 h-24 text-cyan-400" animated={!prefersReduced} />
                      )}
                      <div className="space-y-1">
                        <p className="text-sm font-black text-white uppercase tracking-wider">
                          {t.dropTitle || 'Drop a QR image'}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {t.dropHint || 'PNG, JPG, WebP, screenshots — or press Ctrl+V anywhere on this page'}
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        {t.browseBtn || 'Choose a file'}
                      </button>
                      <button
                        onClick={pasteFromClipboard}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <ClipboardPaste className="w-4 h-4" />
                        {t.pasteBtn || 'Paste from clipboard'}
                      </button>
                    </div>
                  </div>
                )}

                {/* --------------------------------------------------- camera */}
                {source === 'camera' && (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`}
                      />
                      {!cameraOn && (
                        <div className="flex flex-col items-center gap-4 text-center px-8 text-cyan-400/70">
                          <ViewfinderArt className="w-28 h-28" animated={!prefersReduced} />
                          <p className="text-xs text-slate-500 font-medium max-w-xs leading-relaxed">
                            {t.cameraIdle ||
                              'The camera stays off until you start it, and the frames are only read in memory.'}
                          </p>
                        </div>
                      )}
                      {cameraOn && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-2/3 aspect-square max-w-[260px] border-2 border-cyan-400/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {!cameraOn ? (
                        <button
                          onClick={startCamera}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          {t.startCameraBtn || 'Start camera'}
                        </button>
                      ) : (
                        <button
                          onClick={stopCamera}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          {t.stopCameraBtn || 'Stop camera'}
                        </button>
                      )}

                      {cameraOn && torchAvailable && (
                        <button
                          onClick={toggleTorch}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            torchOn
                              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                              : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                          {t.torchBtn || 'Torch'}
                        </button>
                      )}

                      {cameras.length > 1 && (
                        <select
                          value={cameraId}
                          onChange={e => {
                            setCameraId(e.target.value);
                            if (cameraOn) stopCamera();
                          }}
                          className="bg-[#071319] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-cyan-500 cursor-pointer max-w-[200px]"
                        >
                          <option value="">{t.cameraDefault || 'Default camera'}</option>
                          {cameras.map(cam => (
                            <option key={cam.deviceId} value={cam.deviceId}>
                              {cam.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {/* ----------------------------------------------------- text */}
                {source === 'text' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {t.manualLabel || 'Paste the raw content of a QR code'}
                      </span>
                      <textarea
                        value={manualText}
                        onChange={e => setManualText(e.target.value)}
                        rows={8}
                        placeholder={'WIFI:T:WPA;S:MyNetwork;P:secret;;'}
                        className="w-full bg-[#050f14] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500 font-mono resize-none"
                      />
                      <p className="text-[11px] text-slate-600 font-medium leading-snug">
                        {t.manualHint ||
                          'Skips the decoder entirely: useful when you already have the text and just want it taken apart and checked.'}
                      </p>
                    </div>
                    <button
                      onClick={analyseManual}
                      disabled={!manualText.trim()}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <ScanLine className="w-4 h-4" />
                      {t.analyseBtn || 'Analyse it'}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] font-bold text-amber-300 leading-snug">{error}</p>
                  </div>
                )}
              </div>

              {/* History */}
              {history.length > 0 && (
                <div className="glass-card rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <History className="w-3.5 h-3.5 text-cyan-400" />
                      {t.historyTitle || 'This session'}
                    </span>
                    <button
                      onClick={() => setHistory([])}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t.clearBtn || 'Clear'}
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {history.map(entry => (
                      <li key={entry.id}>
                        <button
                          onClick={() => {
                            setResult(entry.payload);
                            setRevealSecret(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-black/20 hover:bg-black/40 hover:border-cyan-500/20 text-left transition-all cursor-pointer"
                        >
                          <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 shrink-0 w-16 truncate">
                            {kindLabels[entry.payload.kind]}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium truncate flex-1 min-w-0">
                            {entry.payload.raw}
                          </span>
                          {entry.payload.warnings.length > 0 && (
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Result */}
            <div className="lg:col-span-5 space-y-5">
              <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5">
                {!result ? (
                  <div className="flex flex-col items-center justify-center text-center gap-4 py-14">
                    <QrCode className="w-10 h-10 text-slate-700" />
                    <p className="text-xs text-slate-600 font-bold max-w-[220px] leading-relaxed">
                      {t.emptyResult || 'Whatever the code contains will be shown here, in full, before anything happens.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                        <ScanLine className="w-3.5 h-3.5" />
                        {kindLabels[result.kind]}
                      </span>
                      <button
                        onClick={reset}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {t.scanAgainBtn || 'Scan again'}
                      </button>
                    </div>

                    {/* Safety verdict */}
                    <div
                      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${
                        severity === 'severe'
                          ? 'border-red-500/30 bg-red-500/10'
                          : severity === 'caution'
                            ? 'border-amber-500/25 bg-amber-500/10'
                            : 'border-emerald-500/25 bg-emerald-500/10'
                      }`}
                    >
                      {severity === 'clean' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <ShieldAlert
                          className={`w-4 h-4 shrink-0 mt-0.5 ${severity === 'severe' ? 'text-red-400' : 'text-amber-400'}`}
                        />
                      )}
                      <div className="min-w-0 space-y-1.5">
                        <p
                          className={`text-[11px] font-black uppercase tracking-wider ${
                            severity === 'severe'
                              ? 'text-red-300'
                              : severity === 'caution'
                                ? 'text-amber-300'
                                : 'text-emerald-300'
                          }`}
                        >
                          {severity === 'severe'
                            ? t.verdictSevere || 'Treat this one with suspicion'
                            : severity === 'caution'
                              ? t.verdictCaution || 'Worth a second look'
                              : t.verdictClean || 'Nothing suspicious found'}
                        </p>
                        {result.warnings.length > 0 ? (
                          <ul className="space-y-1">
                            {result.warnings.map(warning => (
                              <li key={warning} className="text-[11px] text-slate-400 font-medium leading-snug">
                                {warningText[warning]}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-slate-400 font-medium leading-snug">
                            {t.verdictCleanHint || 'We still never open anything on your behalf — that stays your call.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Destination */}
                    {result.kind === 'url' && result.href && (
                      <div className="space-y-2.5">
                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {t.destinationLabel || 'Full destination'}
                        </span>
                        <p className="text-sm text-white font-mono break-all bg-black/30 border border-white/5 rounded-xl px-3.5 py-3 leading-relaxed">
                          {result.href}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={result.href}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                              severity === 'severe'
                                ? 'border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-black'
                            }`}
                          >
                            <ExternalLink className="w-4 h-4" />
                            {severity === 'severe' ? t.openAnywayBtn || 'Open anyway' : t.openBtn || 'Open the link'}
                          </a>
                          <button
                            onClick={() => copy(result.href!, 'href')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            {copied === 'href' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {t.copyBtn || 'Copy'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fields */}
                    {result.fields.length > 0 && (
                      <div className="space-y-2">
                        {result.fields.map((field, i) => {
                          const hidden = field.secret && !revealSecret;
                          return (
                            <div
                              key={`${field.key}-${i}`}
                              className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-3.5 py-2.5"
                            >
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 w-20 shrink-0 pt-1">
                                {fieldLabels[field.key] || field.key}
                              </span>
                              <span
                                className={`flex-1 min-w-0 text-[13px] text-slate-200 break-words whitespace-pre-wrap ${
                                  field.mono ? 'font-mono' : 'font-medium'
                                }`}
                              >
                                {hidden ? '••••••••' : field.value}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {field.secret && (
                                  <button
                                    onClick={() => setRevealSecret(v => !v)}
                                    className="text-[9px] font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer px-1"
                                  >
                                    {revealSecret ? t.hideBtn || 'Hide' : t.showBtn || 'Show'}
                                  </button>
                                )}
                                <button
                                  onClick={() => copy(field.value, `${field.key}-${i}`)}
                                  aria-label={t.copyBtn || 'Copy'}
                                  className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1"
                                >
                                  {copied === `${field.key}-${i}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Raw */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {t.rawLabel || 'Raw content'}
                        </span>
                        <button
                          onClick={() => copy(result.raw, 'raw')}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors cursor-pointer"
                        >
                          {copied === 'raw' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {t.copyBtn || 'Copy'}
                        </button>
                      </div>
                      <pre className="text-[11px] text-slate-400 font-mono bg-black/30 border border-white/5 rounded-xl px-3.5 py-3 max-h-48 overflow-auto whitespace-pre-wrap break-all">
                        {result.raw}
                      </pre>
                    </div>

                    {(result.kind === 'vcard' || result.kind === 'mecard') && (
                      <button
                        onClick={downloadVCard}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        {t.saveContactBtn || 'Save as .vcf'}
                      </button>
                    )}
                  </>
                )}
              </div>

              <a
                href={`/${lang.toLowerCase()}/qr-bolt/`}
                className="glass-card rounded-3xl p-5 flex items-center gap-4 hover:border-cyan-500/20 transition-all group"
              >
                <span className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white">{t.makerCardTitle || 'Need to create one?'}</span>
                  <span className="block text-[11px] text-slate-500 font-medium leading-snug">
                    {t.makerCardText || 'QRBolt builds styled QR codes and proves they scan before you print them.'}
                  </span>
                </span>
              </a>
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
              <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-cyan-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-cyan-400" />
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
            {features.map((feature: any, idx: number) => {
              const Icon = featureIcons[idx] || IconInspect;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 group-hover:border-cyan-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-cyan-400 transition-colors">
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
                <div className="inline-block px-4 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-[11px] font-black uppercase tracking-[0.2em] border border-cyan-500/20">
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
                      <span className="w-7 h-7 shrink-0 bg-cyan-500/20 text-cyan-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl" />
                <IconSafety className="w-20 h-20 text-cyan-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#061218] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-cyan-500 rounded-full" />
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

              <a
                href={`/${lang.toLowerCase()}/qr-bolt/`}
                className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs uppercase tracking-wider transition-all"
              >
                <QrCode className="w-4 h-4" />
                {t.makerCtaLong || 'Create a QR code instead'}
              </a>
            </div>

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-cyan-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-cyan-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-qr-reader-bottom" />
      </main>

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
