import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera, Check, Download, Gauge, Loader2, Mic, Monitor, Play, RefreshCw,
  Ruler, Square, Trash2, Volume2,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import AudioMeter from './components/AudioMeter';
import ScreenTest from './components/ScreenTest';
import NextStepBar from './components/NextStepBar';
import { KeyboardTest, PointerTest } from './components/InputTests';
import {
  HeroArt, IconKeyboard, IconLocal, IconMeter, IconProbe, IconScreen, IconSpeakers, STEP_ART,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { grabFrame } from './lib/devices';
import { playTone } from './lib/audio';
import { useDeviceTest } from './lib/useDeviceTest';
import type { TestId } from './lib/types';

interface DeviceTestProps {
  lang: string;
  dictionary: any;
}

const FEATURE_ICONS = [IconProbe, IconMeter, IconSpeakers, IconScreen, IconKeyboard, IconLocal];

export default function DeviceTest({ lang, dictionary }: DeviceTestProps) {
  const t = dictionary || {};
  const ui = t.ui || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [tab, setTab] = useState<TestId>('camera');
  const [screenTest, setScreenTest] = useState(false);
  const [tonePlaying, setTonePlaying] = useState<string | null>(null);
  const [speakerId, setSpeakerId] = useState('');
  const [shot, setShot] = useState<{ url: string; blob: Blob; width: number; height: number } | null>(null);
  const shotUrl = useRef<string | null>(null);

  const labels = useMemo(
    () => ({ unknown: ui.unknown || '—', yes: ui.yes || 'Yes', no: ui.no || 'No' }),
    [ui.unknown, ui.yes, ui.no]
  );
  const device = useDeviceTest(labels);

  // --- Captura de la webcam -------------------------------------------------

  const capture = useCallback(async () => {
    const video = device.videoRef.current;
    if (!video) return;
    const blob = await grabFrame(video);
    if (!blob) return;
    if (shotUrl.current) URL.revokeObjectURL(shotUrl.current);
    const url = URL.createObjectURL(blob);
    shotUrl.current = url;
    setShot({ url, blob, width: video.videoWidth, height: video.videoHeight });
  }, [device.videoRef]);

  useEffect(() => () => { if (shotUrl.current) URL.revokeObjectURL(shotUrl.current); }, []);

  const downloadShot = () => {
    if (!shot) return;
    const link = document.createElement('a');
    link.href = shot.url;
    link.download = `webcam-${shot.width}x${shot.height}.png`;
    link.click();
  };

  const handoffShot = useCallback(async () => {
    if (!shot) return null;
    return { blob: shot.blob, name: `webcam-${shot.width}x${shot.height}.png` };
  }, [shot]);

  const downloadRecording = () => {
    if (!device.recordUrl) return;
    const link = document.createElement('a');
    link.href = device.recordUrl;
    link.download = 'microphone-test.webm';
    link.click();
  };

  const tone = async (channel: 'left' | 'right' | 'both') => {
    if (tonePlaying) return;
    setTonePlaying(channel);
    await playTone(440, channel, 1.2, speakerId || undefined);
    setTimeout(() => setTonePlaying(null), 1300);
  };

  // --- Datos del diccionario ------------------------------------------------

  const faqs: any[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const steps: any[] = Array.isArray(t.how?.steps) ? t.how.steps : [];
  const features: any[] = Array.isArray(t.features?.items) ? t.features.items : [];

  const TABS: { id: TestId; icon: React.ReactNode; label: string }[] = [
    { id: 'camera', icon: <Camera className="w-4 h-4" />, label: ui.tabCamera || 'Camera' },
    { id: 'microphone', icon: <Mic className="w-4 h-4" />, label: ui.tabMic || 'Microphone' },
    { id: 'speakers', icon: <Volume2 className="w-4 h-4" />, label: ui.tabSpeakers || 'Speakers' },
    { id: 'screen', icon: <Monitor className="w-4 h-4" />, label: ui.tabScreen || 'Screen' },
    { id: 'keyboard', icon: <Square className="w-4 h-4" />, label: ui.tabKeyboard || 'Keyboard' },
    { id: 'pointer', icon: <Gauge className="w-4 h-4" />, label: ui.tabPointer || 'Pointer' },
  ];

  const sysRows: [string, string][] = device.system
    ? [
        [ui.sysScreen, device.system.screen],
        [ui.sysViewport, device.system.viewport],
        [ui.sysPixelRatio, device.system.pixelRatio],
        [ui.sysColorDepth, device.system.colorDepth],
        [ui.sysColorGamut, device.system.colorGamut],
        [ui.sysBrowser, device.system.browser],
        [ui.sysEngine, device.system.engine],
        [ui.sysOS, device.system.os],
        [ui.sysGpu, device.system.gpu],
        [ui.sysCpuCores, device.system.cpuCores],
        [ui.sysMemory, device.system.memory],
        [ui.sysTouchPoints, device.system.touchPoints],
        [ui.sysPointer, device.system.pointer],
        [ui.sysLanguages, device.system.languages],
        [ui.sysTimezone, device.system.timezone],
        [ui.sysConnection, device.system.connection],
        [ui.sysOnline, device.system.online],
        [ui.sysReducedMotion, device.system.reducedMotion],
      ]
    : [];

  const card = 'glass-card rounded-3xl p-6 space-y-5';

  return (
    <div className="min-h-screen flex flex-col bg-[#04080a] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/device-test`)}
        onReset={() => { device.stopCamera(); void device.stopMic(); device.clearRecording(); setTab('camera'); }}
        t={t}
      />

      {/* El max-w vive en el <main>: AdRail mide ESTE elemento. Con el
          `max-w-6xl` de antes (1152 px) el hueco a 1440 era de 141 px, por
          debajo de los 168 que pide el raíl, así que no salía ninguno. */}
      <main className="flex-grow w-full max-w-5xl mx-auto min-[1400px]:max-w-[min(64rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-8">
        <AdBanner id="adsense-device-test-top" />

        <section className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-[0.2em]">
              {t.hero?.badge}
            </span>
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.1] break-words">
              {t.hero?.title} <span className="text-cyan-400">{t.hero?.titleHighlight}</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">{t.hero?.subtitle}</p>
            <ul className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2">
              {[t.hero?.trust1, t.hero?.trust2, t.hero?.trust3].filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {line}
                </li>
              ))}
            </ul>
          </div>
          <HeroArt className="w-full max-w-md mx-auto h-auto" />
        </section>

        {/* --- Pestañas de pruebas ------------------------------------------ */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(entry => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                tab === entry.id
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {entry.icon} {entry.label}
            </button>
          ))}
        </div>

        {!device.devices.labelled && (
          <p className="text-[11px] text-amber-300/90 leading-relaxed">{ui.labelsHint}</p>
        )}

        {/* --- Cámara ------------------------------------------------------- */}
        {tab === 'camera' && (
          <div className={card}>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={device.cameraId}
                onChange={e => { device.setCameraId(e.target.value); if (device.cameraStatus === 'active') device.startCamera(e.target.value); }}
                aria-label={ui.tabCamera}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-slate-200 max-w-full"
              >
                <option value="">{ui.defaultDevice}</option>
                {device.devices.cameras.map((cam, i) => (
                  <option key={cam.deviceId || i} value={cam.deviceId}>{cam.label || `${ui.tabCamera} ${i + 1}`}</option>
                ))}
              </select>
              {device.cameraStatus === 'active' ? (
                <button type="button" onClick={device.stopCamera}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer">
                  {ui.stop}
                </button>
              ) : (
                <button type="button" onClick={() => device.startCamera(device.cameraId || undefined)} disabled={device.cameraStatus === 'busy'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-colors cursor-pointer disabled:opacity-50">
                  {device.cameraStatus === 'busy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} {ui.start}
                </button>
              )}
              <button type="button" onClick={device.refresh} aria-label={ui.refresh}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button type="button" onClick={device.runProbe} disabled={!!device.probeStep}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                {device.probeStep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ruler className="w-4 h-4" />}
                {device.probeStep ? `${device.probeStep.done}/${device.probeStep.total}` : ui.probeResolutions}
              </button>
            </div>

            {device.cameraError && <p className="text-xs font-bold text-red-400">{ui.errors?.[device.cameraError] || device.cameraError}</p>}

            <div className="rounded-2xl overflow-hidden bg-black/50 border border-white/10 aspect-video flex items-center justify-center">
              <video ref={device.videoRef} playsInline muted className="w-full h-full object-contain" />
            </div>

            {device.cameraSettings && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Stat label={ui.actualResolution} value={`${device.cameraSettings.width}×${device.cameraSettings.height}`} />
                <Stat label={ui.frameRate} value={`${device.cameraSettings.frameRate} fps`} />
                <Stat label={ui.facing} value={device.cameraSettings.facingMode || '—'} />
                <Stat label={ui.maxSupported}
                  value={device.cameraCaps && device.cameraCaps.maxWidth ? `${device.cameraCaps.maxWidth}×${device.cameraCaps.maxHeight}` : '—'} />
              </div>
            )}

            {device.probes && (
              <div className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{ui.probeResults}</span>
                <div className="grid sm:grid-cols-2 gap-2">
                  {device.probes.map(probe => (
                    <div key={probe.label} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-black/30 border border-white/10">
                      <span className="text-xs font-bold text-slate-300">{probe.label}</span>
                      <span className={`font-mono text-xs ${probe.exact ? 'text-emerald-400' : probe.got ? 'text-amber-400' : 'text-slate-600'}`}>
                        {probe.got ? `${probe.got.width}×${probe.got.height}` : ui.notAvailable}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{ui.probeHint}</p>
              </div>
            )}

            {device.cameraStatus === 'active' && (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={capture}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-cyan-500 hover:text-white text-xs font-black transition-colors cursor-pointer">
                  <Camera className="w-4 h-4" /> {ui.capture}
                </button>
                {shot && (
                  <>
                    <img src={shot.url} alt="" className="h-12 rounded-lg border border-white/10" />
                    <span className="font-mono text-[11px] text-slate-500">{shot.width}×{shot.height}</span>
                    <button type="button" onClick={downloadShot}
                      className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer">
                      <Download className="w-4 h-4" /> {ui.download}
                    </button>
                  </>
                )}
              </div>
            )}

            {shot && <NextStepBar lang={lang} t={t.next || {}} getResult={handoffShot} />}
          </div>
        )}

        {/* --- Micrófono ---------------------------------------------------- */}
        {tab === 'microphone' && (
          <div className={card}>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={device.micId}
                onChange={e => { device.setMicId(e.target.value); if (device.micStatus === 'active') device.startMic(e.target.value); }}
                aria-label={ui.tabMic}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-slate-200 max-w-full"
              >
                <option value="">{ui.defaultDevice}</option>
                {device.devices.microphones.map((mic, i) => (
                  <option key={mic.deviceId || i} value={mic.deviceId}>{mic.label || `${ui.tabMic} ${i + 1}`}</option>
                ))}
              </select>
              {device.micStatus === 'active' ? (
                <button type="button" onClick={() => void device.stopMic()}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer">
                  {ui.stop}
                </button>
              ) : (
                <button type="button" onClick={() => device.startMic(device.micId || undefined)} disabled={device.micStatus === 'busy'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-colors cursor-pointer disabled:opacity-50">
                  {device.micStatus === 'busy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} {ui.start}
                </button>
              )}
              {device.micInfo && (
                <span className="font-mono text-[11px] text-slate-500">
                  {(device.micInfo.sampleRate / 1000).toFixed(1)} kHz
                  {device.micInfo.latency !== null ? ` · ${device.micInfo.latency} ms` : ''}
                </span>
              )}
            </div>

            {device.micError && <p className="text-xs font-bold text-red-400">{ui.errors?.[device.micError] || device.micError}</p>}

            <AudioMeter levels={device.levels} t={ui} />

            {device.micStatus === 'active' && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => device.startRecording(5)} disabled={device.recording}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50">
                  {device.recording ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                  {device.recording ? `${Math.round(device.recordProgress * 5)}s` : ui.record}
                </button>
                {device.recordUrl && (
                  <>
                    <audio src={device.recordUrl} controls className="h-9 max-w-full" />
                    <button type="button" onClick={downloadRecording}
                      className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer">
                      <Download className="w-4 h-4" /> {ui.download}
                    </button>
                    <button type="button" onClick={device.clearRecording} aria-label={ui.clear}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- Altavoces ---------------------------------------------------- */}
        {tab === 'speakers' && (
          <div className={card}>
            <p className="text-sm text-slate-400 leading-relaxed">{ui.speakersIntro}</p>
            {device.devices.speakers.length > 0 && (
              <select value={speakerId} onChange={e => setSpeakerId(e.target.value)} aria-label={ui.tabSpeakers}
                className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-slate-200 max-w-full">
                <option value="">{ui.defaultDevice}</option>
                {device.devices.speakers.map((out, i) => (
                  <option key={out.deviceId || i} value={out.deviceId}>{out.label || `${ui.tabSpeakers} ${i + 1}`}</option>
                ))}
              </select>
            )}
            <div className="flex flex-wrap gap-3">
              {([['left', ui.channelLeft], ['both', ui.channelBoth], ['right', ui.channelRight]] as const).map(([channel, label]) => (
                <button key={channel} type="button" onClick={() => void tone(channel)} disabled={!!tonePlaying}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-colors cursor-pointer disabled:opacity-50 ${
                    tonePlaying === channel ? 'bg-cyan-500/25 border border-cyan-500/50 text-cyan-200' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  }`}>
                  <Volume2 className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{ui.speakersHint}</p>
          </div>
        )}

        {/* --- Pantalla ----------------------------------------------------- */}
        {tab === 'screen' && (
          <div className={card}>
            <p className="text-sm text-slate-400 leading-relaxed">{ui.screenIntro}</p>
            <button type="button" onClick={() => setScreenTest(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black transition-colors cursor-pointer">
              <Monitor className="w-4 h-4" /> {ui.screenStart}
            </button>
            <p className="text-[11px] text-slate-500 leading-relaxed">{ui.screenHint}</p>
          </div>
        )}

        {/* --- Teclado y puntero -------------------------------------------- */}
        {tab === 'keyboard' && <div className={card}><KeyboardTest t={ui} /></div>}
        {tab === 'pointer' && <div className={card}><PointerTest t={ui} /></div>}

        {/* --- Sistema ------------------------------------------------------ */}
        <section className={card}>
          <h2 className="text-lg font-black text-white">{ui.sysTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {sysRows.filter(([, value]) => value).map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-2 min-w-0">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">{label}</span>
                <span className="font-mono text-xs text-slate-200 text-right truncate" title={value}>{value}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{ui.sysNote}</p>
        </section>

        <AdBanner id="adsense-device-test-mid" />

        {steps.length > 0 && (
          <section className="space-y-7">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{t.how?.title}</h2>
              <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">{t.how?.subtitle}</p>
            </div>
            <ol className="grid sm:grid-cols-3 gap-5">
              {steps.slice(0, 3).map((step, i) => {
                const Art = STEP_ART[i];
                return (
                  <li key={i} className="glass-card rounded-3xl p-6 space-y-4">
                    <Art />
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">{i + 1}</span>
                      <h3 className="text-base font-bold text-white">{step.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {features.length > 0 && (
          <section className="space-y-7">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center">{t.features?.title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.slice(0, 6).map((feature, i) => {
                const Icon = FEATURE_ICONS[i];
                const tint = ['text-cyan-400', 'text-sky-400', 'text-teal-400', 'text-indigo-400', 'text-emerald-400', 'text-amber-400'][i];
                return (
                  <article key={i} className="glass-card rounded-3xl p-6 space-y-3">
                    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 ${tint}`}>
                      <Icon />
                    </span>
                    <h3 className="text-base font-bold text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight text-center">{t.faqTitle}</h2>
            <div className="grid gap-3 max-w-3xl mx-auto w-full">
              {faqs.map((faq, i) => (
                <details key={i} className="glass-card rounded-2xl px-5 py-4 group [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-start gap-3 cursor-pointer list-none text-sm sm:text-base font-bold text-white">
                    <span className="flex-1">{faq.question}</span>
                    <span className="shrink-0 text-cyan-400 text-xl leading-none transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="text-sm text-slate-400 leading-relaxed pt-3">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {keywords.length > 0 && (
          <section className="space-y-4 opacity-60 text-center">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {keywords.map((keyword, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">{keyword}</span>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-device-test-bottom" />
      </main>

      {screenTest && <ScreenTest onClose={() => setScreenTest(false)} t={ui} />}

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="space-y-1 min-w-0">
    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</span>
    <span className="block font-mono text-sm font-black text-white truncate">{value}</span>
  </div>
);
