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
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none z-0" />
      <Header currentLang={lang} onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/clip-flow`} onReset={resetWorkspace} t={t} />
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">
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

        {phase !== 'editor' && <AdBanner id="adsense-clip-flow-top" />}
      </main>
      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}
