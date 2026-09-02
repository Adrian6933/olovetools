import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { UrlInputCard } from './components/UrlInputCard';
import { PlayerSection } from './components/PlayerSection';
import { TimelineEditor } from './components/TimelineEditor';
import { CutList } from './components/CutList';
import { ExportBar } from './components/ExportBar';
import {
  parseInput, resolveChannelVideoId, fetchVodInfoAndToken, fetchMasterPlaylist,
  fetchSegmentIndex, computeSegmentWindow, downloadSegments, estimateCutBytes, VodError,
} from './services/twitchVodService';
import { loadFFmpeg, remuxCutToMp4, concatMp4s, cancelExport, deleteFfmpegFile, saveBlob } from './services/exportService';
import { VodInfo, VodQuality, Cut, CutExportState, FfmpegLoadState, Phase, CUT_COLORS } from './types';
import { getAllowThirdParty, getLastRoute, setAllowThirdParty } from './services/route';
import {
  HeroArt, IconCopy, IconJoin, IconLocalCut, IconMultiCut, IconNoLimit, IconRelay,
  StepExport, StepMark, StepPaste, StepRelay,
} from './components/Illustrations';
import { motion } from 'framer-motion';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';

interface ClipFlowProps {
  lang: string;
  dictionary: any;
}

const MEMORY_WARNING_BYTES = 700 * 1024 * 1024;

const slugify = (s: string) => (s || 'clip').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'clip';

const fillTemplate = (template: string | undefined, pct: number): string => {
  if (!template) return `${pct}%`;
  return template.replace('{pct}', String(pct));
};

let cutIdCounter = 0;
const nextCutId = () => `cut_${Date.now()}_${cutIdCounter++}`;

export default function ClipFlow({ lang, dictionary }: ClipFlowProps) {
  const t = dictionary || {};
  const prefersReduced = useReducedMotion();
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  // The relay is a fact of how this works; the UI now states it instead of the
  // copy claiming the video arrives "directly from Twitch".
  const [allowProxies, setAllowProxies] = useState(true);
  const [routeUsed, setRouteUsed] = useState<{ kind: string; host: string } | null>(null);

  const [phase, setPhase] = useState<Phase>('input');
  const [inputError, setInputError] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState<string | undefined>(undefined);

  const [vod, setVod] = useState<VodInfo | null>(null);
  const [qualities, setQualities] = useState<VodQuality[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<VodQuality | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [pendingSeekTime, setPendingSeekTime] = useState<number | undefined>(undefined);

  const [cuts, setCuts] = useState<Cut[]>([]);
  const [activeCutId, setActiveCutId] = useState<string | null>(null);
  const [cutStates, setCutStates] = useState<Record<string, CutExportState>>({});
  const [joinState, setJoinState] = useState<CutExportState>({ status: 'idle', progress: 0 });

  const [ffmpegState, setFfmpegState] = useState<FfmpegLoadState>('unloaded');
  const [ffmpegLoadPct, setFfmpegLoadPct] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerAreaRef = useRef<HTMLDivElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cutAbortRefs = useRef<Record<string, AbortController>>({});
  const joinAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onFsChange = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => {
      const next = !prev;
      if (next) playerAreaRef.current?.requestFullscreen?.().catch(() => {});
      else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      Object.values(cutAbortRefs.current).forEach(c => c.abort());
      joinAbortRef.current?.abort();
      cancelExport();
    };
  }, []);

  const resetWorkspace = useCallback(() => {
    Object.values(cutAbortRefs.current).forEach(c => c.abort());
    cutAbortRefs.current = {};
    joinAbortRef.current?.abort();
    joinAbortRef.current = null;
    cancelExport();
    setFfmpegState('unloaded');
    setFfmpegLoadPct(0);
    setPhase('input');
    setInputError(null);
    setVod(null);
    setQualities([]);
    setSelectedQuality(null);
    setDuration(0);
    setCurrentTime(0);
    setCuts([]);
    setActiveCutId(null);
    setCutStates({});
    setJoinState({ status: 'idle', progress: 0 });
    setPendingSeekTime(undefined);
    setIsFullscreen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  const handleSubmit = useCallback(async (raw: string) => {
    setInputError(null);
    const parsed = parseInput(raw);
    if (!parsed) { setInputError(t.errorInvalidUrl || 'That link doesn\'t look like a valid Twitch VOD or channel.'); return; }

    setPhase('loading');
    try {
      let videoId: string;
      let isLive = false;

      if (parsed.kind === 'channel') {
        setLoadingLabel(t.loadingVod || 'Fetching VOD info…');
        const resolved = await resolveChannelVideoId(parsed.login);
        videoId = resolved.videoId;
        isLive = resolved.isLive;
      } else {
        videoId = parsed.videoId;
      }

      setLoadingLabel(t.loadingVod || 'Fetching VOD info…');
      const { info, token } = await fetchVodInfoAndToken(videoId);
      info.isLive = isLive;

      setLoadingLabel(t.loadingPlaylist || 'Loading video streams…');
      const qualityList = await fetchMasterPlaylist(videoId, token);

      setVod(info);
      setQualities(qualityList);
      setSelectedQuality(qualityList[0]);
      setDuration(info.lengthSeconds);
      if (typeof parsed.startTime === 'number') {
        const clamped = Math.max(0, Math.min(parsed.startTime, Math.max(0, info.lengthSeconds - 1)));
        setPendingSeekTime(clamped);
        setCurrentTime(clamped);
      }
      setPhase('editor');
    } catch (e: any) {
      const code = e instanceof VodError ? e.code : null;
      const message = code && t[code] ? t[code] : (e.message || t.errorPlaylist || 'Something went wrong loading this video.');
      setInputError(message);
      setPhase('input');
    }
  }, [t]);

  // ---- Cut editing ----
  const clampCut = useCallback((cut: Cut): Cut => {
    const start = Math.max(0, Math.min(cut.start, duration - 1));
    const end = Math.max(start + 1, Math.min(cut.end, duration));
    return { ...cut, start, end };
  }, [duration]);

  const handleAddCutAtPlayhead = useCallback(() => {
    if (duration <= 0) return;
    const start = Math.min(currentTime, Math.max(0, duration - 1));
    const end = Math.min(duration, start + 60);
    const cut: Cut = {
      id: nextCutId(),
      start,
      end: Math.max(start + 1, end),
      label: `${t.cutLabel || 'Cut'} ${cuts.length + 1}`,
      color: CUT_COLORS[cuts.length % CUT_COLORS.length],
    };
    setCuts(prev => [...prev, cut]);
    setActiveCutId(cut.id);
  }, [currentTime, duration, cuts.length, t]);

  const handleChangeCut = useCallback((updated: Cut) => {
    setCuts(prev => prev.map(c => c.id === updated.id ? clampCut(updated) : c));
  }, [clampCut]);

  const handleRemoveCut = useCallback((id: string) => {
    cutAbortRefs.current[id]?.abort();
    setCuts(prev => prev.filter(c => c.id !== id));
    setCutStates(prev => { const next = { ...prev }; delete next[id]; return next; });
    setActiveCutId(prev => prev === id ? null : prev);
  }, []);

  const handleMoveCut = useCallback((id: string, direction: -1 | 1) => {
    setCuts(prev => {
      const index = prev.findIndex(c => c.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const handleSetStartAtPlayhead = useCallback((id: string) => {
    setCuts(prev => prev.map(c => c.id === id ? clampCut({ ...c, start: currentTime }) : c));
  }, [currentTime, clampCut]);

  const handleSetEndAtPlayhead = useCallback((id: string) => {
    setCuts(prev => prev.map(c => c.id === id ? clampCut({ ...c, end: currentTime }) : c));
  }, [currentTime, clampCut]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // ---- Keyboard shortcuts: space=play/pause, arrows=seek (shift=frame step), f=fullscreen, m=mute, c=add cut ----
  useEffect(() => {
    if (phase !== 'editor') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;
      const video = videoRef.current;
      if (!video) return;
      const fps = selectedQuality?.fps || 30;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (video.paused) video.play().catch(() => {}); else video.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - (e.shiftKey ? 1 / fps : 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || duration, video.currentTime + (e.shiftKey ? 1 / fps : 5));
          break;
        case 'f': case 'F':
          toggleFullscreen();
          break;
        case 'm': case 'M':
          video.muted = !video.muted;
          break;
        case 'c': case 'C':
          handleAddCutAtPlayhead();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, selectedQuality, duration, toggleFullscreen, handleAddCutAtPlayhead]);

  // ---- Export: single cut ----
  const ensureFfmpegReady = useCallback(async () => {
    if (ffmpegState === 'ready') return;
    setFfmpegState('loading');
    try {
      await loadFFmpeg(pct => setFfmpegLoadPct(pct));
      setFfmpegState('ready');
    } catch (e) {
      setFfmpegState('failed');
      throw e;
    }
  }, [ffmpegState]);

  const buildFilename = useCallback((cut: Cut, ext: string = 'mp4') => {
    const broadcaster = vod ? slugify(vod.broadcaster) : 'clip';
    return `clipflow_${broadcaster}_${slugify(cut.label)}.${ext}`;
  }, [vod]);

  const exportCut = useCallback(async (cutId: string) => {
    const cut = cuts.find(c => c.id === cutId);
    if (!cut || !selectedQuality) return;

    const controller = new AbortController();
    cutAbortRefs.current[cutId] = controller;
    setCutStates(s => ({ ...s, [cutId]: { status: 'downloading', progress: 0, phaseLabel: fillTemplate(t.downloadingSegments, 0) } }));

    try {
      await ensureFfmpegReady();

      const index = await fetchSegmentIndex(selectedQuality.url);
      const { segments, windowStart } = computeSegmentWindow(index, cut.start, cut.end);
      const tsBlob = await downloadSegments(segments, (loaded, total) => {
        const pct = total > 0 ? Math.min(70, Math.round((loaded / total) * 70)) : 0;
        setCutStates(s => ({ ...s, [cutId]: { status: 'downloading', progress: pct, phaseLabel: fillTemplate(t.downloadingSegments, Math.round(pct / 0.7)) } }));
      }, controller.signal);

      setCutStates(s => ({ ...s, [cutId]: { status: 'processing', progress: 70, phaseLabel: t.processingCut || 'Converting to MP4…' } }));

      const outName = `cut_${cutId}.mp4`;
      const mp4Blob = await remuxCutToMp4({
        tsBlob,
        trimOffset: Math.max(0, cut.start - windowStart),
        duration: cut.end - cut.start,
        onProgress: (pct) => {
          setCutStates(s => ({ ...s, [cutId]: { status: 'processing', progress: 70 + Math.round(pct * 0.3), phaseLabel: t.processingCut || 'Converting to MP4…' } }));
        },
      }, outName);
      await deleteFfmpegFile(outName);

      saveBlob(mp4Blob, buildFilename(cut));
      setCutStates(s => ({ ...s, [cutId]: { status: 'done', progress: 100 } }));
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message === 'AbortError') {
        setCutStates(s => ({ ...s, [cutId]: { status: 'idle', progress: 0 } }));
      } else {
        setCutStates(s => ({ ...s, [cutId]: { status: 'error', progress: 0, error: e?.message || t.exportError || 'Export failed.' } }));
      }
    } finally {
      delete cutAbortRefs.current[cutId];
    }
  }, [cuts, selectedQuality, ensureFfmpegReady, buildFilename, t]);

  const cancelCutExport = useCallback((cutId: string) => {
    const state = cutStates[cutId];
    if (state?.status === 'processing') {
      cancelExport();
      setFfmpegState('unloaded');
    }
    cutAbortRefs.current[cutId]?.abort();
    setCutStates(s => ({ ...s, [cutId]: { status: 'idle', progress: 0 } }));
  }, [cutStates]);

  const downloadRawTs = useCallback(async (cutId: string) => {
    const cut = cuts.find(c => c.id === cutId);
    if (!cut || !selectedQuality) return;

    const controller = new AbortController();
    cutAbortRefs.current[cutId] = controller;
    setCutStates(s => ({ ...s, [cutId]: { status: 'downloading', progress: 0, phaseLabel: fillTemplate(t.downloadingSegments, 0) } }));

    try {
      const index = await fetchSegmentIndex(selectedQuality.url);
      const { segments } = computeSegmentWindow(index, cut.start, cut.end);
      const tsBlob = await downloadSegments(segments, (loaded, total) => {
        const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
        setCutStates(s => ({ ...s, [cutId]: { status: 'downloading', progress: pct, phaseLabel: fillTemplate(t.downloadingSegments, pct) } }));
      }, controller.signal);
      saveBlob(tsBlob, buildFilename(cut, 'ts'));
      setCutStates(s => ({ ...s, [cutId]: { status: 'done', progress: 100 } }));
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message === 'AbortError') {
        setCutStates(s => ({ ...s, [cutId]: { status: 'idle', progress: 0 } }));
      } else {
        setCutStates(s => ({ ...s, [cutId]: { status: 'error', progress: 0, error: e?.message || t.exportError || 'Export failed.' } }));
      }
    } finally {
      delete cutAbortRefs.current[cutId];
    }
  }, [cuts, selectedQuality, buildFilename, t]);

  // ---- Export: joined ----
  const exportJoined = useCallback(async () => {
    if (cuts.length === 0 || !selectedQuality) return;

    const controller = new AbortController();
    joinAbortRef.current = controller;
    setJoinState({ status: 'downloading', progress: 0, phaseLabel: '' });

    try {
      await ensureFfmpegReady();

      const fileNames: string[] = [];
      for (let i = 0; i < cuts.length; i++) {
        const cut = cuts[i];
        const index = await fetchSegmentIndex(selectedQuality.url);
        const { segments, windowStart } = computeSegmentWindow(index, cut.start, cut.end);

        const tsBlob = await downloadSegments(segments, (loaded, total) => {
          const segFraction = total > 0 ? loaded / total : 0;
          const overall = Math.round(((i + segFraction * 0.6) / cuts.length) * 100);
          setJoinState({ status: 'downloading', progress: overall, phaseLabel: `${t.downloadingSegments ? fillTemplate(t.downloadingSegments, Math.round(segFraction * 100)) : 'Downloading'} (${cut.label})` });
        }, controller.signal);

        setJoinState({ status: 'processing', progress: Math.round(((i + 0.6) / cuts.length) * 100), phaseLabel: `${t.processingCut || 'Converting'} (${cut.label})` });

        const outName = `cut${i}.mp4`;
        await remuxCutToMp4({
          tsBlob,
          trimOffset: Math.max(0, cut.start - windowStart),
          duration: cut.end - cut.start,
          onProgress: (pct) => {
            const overall = Math.round(((i + 0.6 + (pct / 100) * 0.4) / cuts.length) * 100);
            setJoinState({ status: 'processing', progress: overall, phaseLabel: `${t.processingCut || 'Converting'} (${cut.label})` });
          },
        }, outName);
        fileNames.push(outName);
      }

      setJoinState({ status: 'processing', progress: 96, phaseLabel: t.joiningCuts || 'Joining cuts…' });
      const joined = await concatMp4s(fileNames, (pct) => {
        setJoinState({ status: 'processing', progress: 96 + Math.round(pct * 0.04), phaseLabel: t.joiningCuts || 'Joining cuts…' });
      });

      const broadcaster = vod ? slugify(vod.broadcaster) : 'clip';
      saveBlob(joined, `clipflow_${broadcaster}_joined.mp4`);
      setJoinState({ status: 'done', progress: 100 });
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message === 'AbortError') {
        setJoinState({ status: 'idle', progress: 0 });
      } else {
        setJoinState({ status: 'error', progress: 0, error: e?.message || t.exportError || 'Export failed.' });
      }
    } finally {
      joinAbortRef.current = null;
    }
  }, [cuts, selectedQuality, ensureFfmpegReady, vod, t]);

  const cancelJoinedExport = useCallback(() => {
    if (joinState.status === 'processing') {
      cancelExport();
      setFfmpegState('unloaded');
    }
    joinAbortRef.current?.abort();
    setJoinState({ status: 'idle', progress: 0 });
  }, [joinState.status]);

  const totalSeconds = cuts.reduce((sum, c) => sum + Math.max(0, c.end - c.start), 0);
  const estimatedBytes = cuts.reduce((sum, c) => sum + estimateCutBytes(selectedQuality, c.end - c.start), 0);
  const memoryWarning = estimatedBytes > MEMORY_WARNING_BYTES;

  useEffect(() => {
    setAllowThirdParty(allowProxies);
  }, [allowProxies]);

  // Which hop actually served the bytes is only known once something has loaded.
  useEffect(() => {
    if (phase !== 'editor') return;
    const id = setInterval(() => setRouteUsed(getLastRoute()), 800);
    return () => clearInterval(id);
  }, [phase]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none z-0" />
      <Header
        onReset={resetWorkspace} currentLang={lang} onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/clip-flow`} t={t} />
      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col space-y-6">
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <span>{t.seoHeroTitle || 'ClipFlow'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed mx-auto md:mx-0">{t.seoHeroText}</p>
        </div>

        {(phase === 'input' || phase === 'loading') && (
          <UrlInputCard t={t} onSubmit={handleSubmit} loading={phase === 'loading'} loadingLabel={loadingLabel} error={inputError} />
        )}

        {phase === 'editor' && vod && selectedQuality && (
          <div className="space-y-6">
            <div ref={playerAreaRef} className={isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0408] p-4 flex flex-col gap-4 overflow-y-auto' : 'space-y-6'}>
              <PlayerSection
                videoRef={videoRef}
                vod={vod}
                qualities={qualities}
                selectedQuality={selectedQuality}
                onQualityChange={setSelectedQuality}
                onTimeUpdate={setCurrentTime}
                onDuration={(d) => { if (d > 0 && Math.abs(d - duration) > 2) setDuration(d); }}
                initialSeekTime={pendingSeekTime}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                t={t}
              />

              <TimelineEditor
                duration={duration}
                currentTime={currentTime}
                cuts={cuts}
                activeCutId={activeCutId}
                onSeek={handleSeek}
                onChangeCut={handleChangeCut}
                onSelectCut={setActiveCutId}
                onAddCutAtPlayhead={handleAddCutAtPlayhead}
                t={t}
              />
            </div>

            <AdBanner id="adsense-clip-flow-mid" />

            <motion.div
              initial={prefersReduced ? false : 'hidden'}
              whileInView={prefersReduced ? undefined : 'visible'}
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeInUp}
            >
              <CutList
                cuts={cuts}
                activeCutId={activeCutId}
                duration={duration}
                cutStates={cutStates}
                onSelect={setActiveCutId}
                onChange={handleChangeCut}
                onRemove={handleRemoveCut}
                onMove={handleMoveCut}
                onSetStartAtPlayhead={handleSetStartAtPlayhead}
                onSetEndAtPlayhead={handleSetEndAtPlayhead}
                onDownload={exportCut}
                onCancelDownload={cancelCutExport}
                onDownloadTsFallback={downloadRawTs}
                t={t}
              />
            </motion.div>

            <ExportBar
              cuts={cuts}
              joinState={joinState}
              ffmpegState={ffmpegState}
              ffmpegLoadPct={ffmpegLoadPct}
              totalSeconds={totalSeconds}
              estimatedBytes={estimatedBytes}
              memoryWarning={memoryWarning}
              onExportAll={exportJoined}
              onCancel={cancelJoinedExport}
              t={t}
            />
          </div>
        )}

        {/* The relay, stated plainly ------------------------------------- */}
        <section className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-400/80">
              <span className="w-4 h-4"><IconRelay /></span>
              {t.relayTitle || 'How the video reaches you'}
            </span>
            {routeUsed && (
              <span className="text-[11px] font-mono text-slate-500">
                {(t.relayUsed || 'last segment via {host}').replace('{host}', routeUsed.host || '\u2014')}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t.relayExplain ||
              'The Twitch video CDN sends no CORS headers, so the browser cannot fetch the segments directly. They are relayed \u2014 first through this site\u2019s own endpoint, then through public proxies if that fails. The cutting and joining still happen entirely on your device, and nothing you export is uploaded anywhere.'}
          </p>
          <label className="flex items-start gap-2 text-[11px] font-semibold text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={allowProxies}
              onChange={(e) => setAllowProxies(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-violet-500 cursor-pointer shrink-0"
            />
            <span>
              {t.relayAllowThird ||
                'Allow public third-party proxies as a fallback. Turn this off to use only this site\u2019s own relay \u2014 more private, but some VODs will fail to load.'}
            </span>
          </label>
        </section>

        {phase !== 'editor' && <AdBanner id="adsense-clip-flow-top" />}

        {/* How it works ---------------------------------------------------- */}
        <section id="how-it-works" className="space-y-8 pt-8 scroll-mt-28">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.howTitle || 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { art: StepPaste, title: t.step1Title || 'Paste a VOD link', text: t.step1Text || 'A video URL or a channel name. Pick the quality you want to cut from.' },
              { art: StepMark, title: t.step2Title || 'Mark every cut', text: t.step2Text || 'Scrub the full timeline and mark as many pieces as you like.' },
              { art: StepRelay, title: t.step3Title || 'The segments are relayed', text: t.step3Text || 'Only the download hop leaves your machine, and the tool shows which relay served it.' },
              { art: StepExport, title: t.step4Title || 'Export separately or joined', text: t.step4Text || 'Cut with a stream copy, so it is fast and the quality is untouched.' },
            ].map((step, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
                <step.art />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-violet-500/15 text-violet-300 text-[11px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* Features -------------------------------------------------------- */}
        <section className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.featuresTitle || 'What it actually does'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: IconMultiCut, title: t.feat1Title || 'Many cuts, one pass', text: t.feat1Text || 'Mark minute 1 to 2 and minute 40 to 43 in the same session and export both.' },
              { icon: IconNoLimit, title: t.feat2Title || 'No 60-second ceiling', text: t.feat2Text || 'Twitch caps its own clips at a minute. Cutting from the VOD does not.' },
              { icon: IconJoin, title: t.feat3Title || 'Join into one file', text: t.feat3Text || 'Every marked piece concatenated into a single MP4, in the order you set.' },
              { icon: IconCopy, title: t.feat4Title || 'Stream copy, not re-encode', text: t.feat4Text || 'ffmpeg runs with -c copy, so the export is quick and the picture matches the source.' },
              { icon: IconRelay, title: t.feat5Title || 'Honest about the relay', text: t.feat5Text || 'The download hop is named in the interface, and the third-party fallback can be switched off.' },
              { icon: IconLocalCut, title: t.feat6Title || 'Cutting stays on your device', text: t.feat6Text || 'The video engine runs in the tab. What you export is never uploaded anywhere.' },
            ].map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10"><f.icon /></div>
                <h3 className="text-sm font-black text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------- */}
        {Array.isArray(t.faq) && t.faq.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
              {t.faqTitle || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto w-full">
              {t.faq.map((item: any, i: number) => (
                <details key={i} className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-violet-300 transition-colors">
                    <span>{item.question}</span>
                    <span className="text-violet-400 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-clip-flow-bottom" />
      </main>
      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}
