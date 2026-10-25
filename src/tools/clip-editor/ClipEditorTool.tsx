// ============================================================================
// Clip Editor — el editor de TwitchBolt y KickBolt, suelto y con lo tuyo.
// ----------------------------------------------------------------------------
// Es el mismo ClipEditor de clipstudio sin clips de ninguna plataforma: se le
// dan vídeos e imágenes propios y se recortan, cortan, reordenan y exportan
// como un vídeo o como un ZIP. La página solo pone la entrada (soltar
// archivos, o recibirlos de TwitchBolt/KickBolt por el traspaso) y guarda las
// piezas, para que cerrar el editor y volver a abrirlo no pierda nada.
// ============================================================================
import React, { useCallback, useState } from 'react';
import { Scissors, Upload, Loader2, Film, ImageIcon, RotateCcw, ArrowRight, Zap, Lock, Gauge, ListVideo } from 'lucide-react';

import ClipEditor from '../../components/clipstudio/editor/ClipEditor';
import type { Capa } from '../../components/clipstudio/editor/animaciones';
import { BrandContext, type ClipBrand } from '../../components/clipstudio/brand';
import { prepararVideo } from '../../components/clipstudio/editor/ownMedia';
import { durFinal, mmss, nuevoId, registrarFuente, type Pieza } from '../../components/clipstudio/editor/model';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { createTranslator, type Language } from '../../locales/meta';

const sinRed = () => Promise.reject(new Error('clip-editor: no platform downloads'));

// Sin plataforma: nada que descargar ni que firmar. El morado entra por las
// mismas variables con las que KickBolt pone su verde.
const brand: ClipBrand = {
  id: 'twitch',
  name: 'Clip Editor',
  domain: '',
  storagePrefix: 'clipeditor',
  accent: '#8b5cf6',
  fetchMovieBlob: sinRed,
  downloadBlob: sinRed,
  cssVars: {
    ['--color-twitch' as any]: '#8b5cf6',
    ['--color-twitch-base' as any]: '#8b5cf6',
    ['--color-twitch-dark' as any]: '#7c3aed',
    ['--color-accent-ink' as any]: '#ffffff',
    ['--color-accent-rgb' as any]: '139, 92, 246',
  },
};

const VIDEO_EXT = ['.mp4', '.m4v', '.webm', '.mov', '.mkv', '.ogv', '.ogg'];
const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.bmp'];
const ACCEPT = `video/*,image/*,${[...VIDEO_EXT, ...IMAGE_EXT].join(',')}`;

const extension = (name: string) => name.slice(name.lastIndexOf('.')).toLowerCase();
const esImagen = (f: File) => f.type.startsWith('image/') || IMAGE_EXT.includes(extension(f.name));
const esVideo = (f: File) => f.type.startsWith('video/') || VIDEO_EXT.includes(extension(f.name));

const SIN_SELECCION: never[] = [];

const ClipEditorTool: React.FC<{ lang: Language; dictionary?: any }> = ({ lang = 'en', dictionary }) => {
  const t = createTranslator(dictionary);
  const tx = (k: string, fb: string) => (typeof dictionary?.[k] === 'string' && dictionary[k]) || fb;

  const [piezas, setPiezas] = useState<Pieza[]>([]);
  const [capas, setCapas] = useState<Capa[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [leyendo, setLeyendo] = useState(0);
  const [errores, setErrores] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [legal, setLegal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  /** Convierte archivos en piezas de la línea de tiempo, en el orden dado. */
  const anadir = useCallback(async (files: File[]) => {
    const validos = files.filter(f => esVideo(f) || esImagen(f));
    const malos = files.filter(f => !validos.includes(f)).map(f => f.name);
    setErrores(malos.map(n => tx('ui_notMedia', '{f} is not a video or an image.').replace('{f}', n)));
    if (!validos.length) return;
    setLeyendo(validos.length);
    const nuevas: Pieza[] = [];
    for (const file of validos) {
      const id = nuevoId();
      if (esImagen(file)) {
        const f = registrarFuente(`propio:${id}`, file);
        nuevas.push({ id, tipo: 'imagen', nombre: file.name, canal: '', thumb: f.url, total: 4, inicio: 0, fin: 4, volumen: 1, silencio: false, velocidad: 1 });
      } else {
        try {
          const { dur, thumb } = await prepararVideo(file);
          registrarFuente(`propio:${id}`, file);
          nuevas.push({ id, tipo: 'video', nombre: file.name, canal: '', thumb, total: dur, inicio: 0, fin: dur, volumen: 1, silencio: false, velocidad: 1 });
        } catch {
          setErrores(prev => [...prev, tx('mergeOwnBad', "This browser can't read {f}. Try an MP4 or WebM.").replace('{f}', file.name)]);
        }
      }
      setLeyendo(n => n - 1);
    }
    setLeyendo(0);
    if (nuevas.length) {
      setPiezas(prev => [...prev, ...nuevas]);
      setAbierto(true);
    }
  }, [dictionary]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lo que manda TwitchBolt o KickBolt ("Abrir en Clip Editor") llega aquí.
  useHandoffIntake((file, _from, resto) => { void anadir([file, ...resto]); });

  const empezarDeNuevo = () => {
    setPiezas([]);
    setErrores([]);
    setAbierto(false);
  };

  const total = piezas.reduce((s, p) => s + durFinal(p), 0);
  const faqs: Array<{ question: string; answer: string }> = Array.isArray(dictionary?.faq) ? dictionary.faq : [];
  const funciones: Array<{ title: string; text: string }> = Array.isArray(dictionary?.features) ? dictionary.features : [];
  const iconos = [Scissors, ListVideo, Gauge, Film, Lock, Zap];

  return (
    <BrandContext.Provider value={brand}>
      <div className="min-h-screen flex flex-col bg-[#08050f] text-slate-200 font-sans relative overflow-x-hidden pt-24" style={brand.cssVars}>
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none z-0" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none z-0" />

        <Header
          currentLang={lang}
          onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/clip-editor`)}
          onReset={empezarDeNuevo}
          t={t}
        />

        <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-8 py-8 relative z-10 flex flex-col gap-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 text-[11px] font-black uppercase tracking-[0.2em] border border-violet-500/20">
              <Zap className="w-3.5 h-3.5" />
              {tx('heroBadge', 'No install, no account, no upload')}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Scissors className="w-8 h-8 text-violet-400 shrink-0" />
              <span>{tx('title', 'Clip Editor')}</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">{tx('tagline', '')}</p>
          </div>

          <AdBanner id="adsense-clip-editor-top" />

          {piezas.length === 0 ? (
            <label
              onDragOver={e => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={e => {
                e.preventDefault();
                setArrastrando(false);
                void anadir(Array.from(e.dataTransfer.files));
              }}
              className={`glass-card rounded-[2rem] border-2 border-dashed px-8 py-20 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all ${
                arrastrando ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 hover:border-violet-500/40'
              }`}
            >
              <input
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={e => {
                  const elegidos = Array.from(e.target.files || []);
                  e.target.value = '';
                  void anadir(elegidos);
                }}
              />
              {leyendo > 0 ? <Loader2 className="w-12 h-12 text-violet-400 animate-spin" /> : <Upload className="w-12 h-12 text-violet-400" />}
              <span className="text-lg font-black text-white">
                {leyendo > 0 ? tx('ui_reading', 'Reading your files…') : tx('ui_drop', 'Drop your videos and images here, or click to pick them')}
              </span>
              <span className="text-sm text-slate-400 max-w-md">{tx('ui_formats', 'MP4, WebM, MOV and images. Pick several at once: they go onto the timeline in that order. Nothing leaves your device.')}</span>
            </label>
          ) : (
            <div className="glass-card rounded-[2rem] border border-violet-500/25 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex -space-x-3 shrink-0">
                {piezas.slice(0, 4).map(p => (
                  <img key={p.id} src={p.thumb} alt="" className="w-20 h-12 object-cover rounded-xl border-2 border-[#08050f] bg-black" />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-white">
                  {tx('ui_project', '{n} pieces · {d}').replace('{n}', String(piezas.length)).replace('{d}', mmss(total))}
                </p>
                <p className="text-sm text-slate-400">{tx('ui_projectHint', 'Your edit stays here while this tab is open. Close the editor and come back to it whenever you want.')}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setAbierto(true)}
                  className="h-12 px-6 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-violet-600/25"
                >
                  <Scissors className="w-4 h-4" />{tx('ui_open', 'Open the editor')}<ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={empezarDeNuevo}
                  className="h-12 px-4 rounded-2xl border border-white/10 text-slate-300 hover:text-white text-xs font-black flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />{tx('ui_reset', 'Start over')}
                </button>
              </div>
            </div>
          )}

          {errores.length > 0 && (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 px-5 py-3 text-sm font-bold text-rose-300 space-y-1">
              {errores.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {funciones.length > 0 && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {funciones.map((f, i) => {
                const Icono = iconos[i % iconos.length];
                return (
                  <div key={i} className="glass-card rounded-2xl p-5 border border-white/5">
                    <Icono className="w-5 h-5 text-violet-400 mb-3" />
                    <h2 className="text-sm font-black text-white mb-1">{f.title}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.text}</p>
                  </div>
                );
              })}
            </section>
          )}

          <section className="space-y-10 pt-6">
            <div className="max-w-4xl mx-auto w-full space-y-4 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{tx('seoHeroTitle', '')}</h2>
              <p className="text-slate-400 text-base leading-relaxed">{tx('seoHeroText', '')}</p>
            </div>
            <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <h3 className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-60">{tx('seoUseCaseTitle', '')}</h3>
                <p className="text-slate-400 text-base leading-relaxed">{tx('seoUseCaseText', '')}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-60">{tx('seoPrivacyTitle', '')}</h3>
                <p className="text-slate-400 text-base leading-relaxed">{tx('seoPrivacyText', '')}</p>
              </div>
            </div>
            <div className="max-w-4xl mx-auto w-full flex flex-wrap justify-center gap-3">
              <a href={`/${lang.toLowerCase()}/twitchbolt/`} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/40 text-white font-black text-xs uppercase tracking-wider">
                <Film className="w-4 h-4 text-violet-400" />{tx('ctaTwitch', 'Bring clips from Twitch')}
              </a>
              <a href={`/${lang.toLowerCase()}/kickbolt/`} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/40 text-white font-black text-xs uppercase tracking-wider">
                <ImageIcon className="w-4 h-4 text-violet-400" />{tx('ctaKick', 'Bring clips from Kick')}
              </a>
            </div>

            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-8">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight text-center">{tx('faqTitle', 'FAQ')}</h2>
                <div className="grid gap-3">
                  {faqs.map((faq, i) => (
                    <details key={i} className="glass-card rounded-2xl px-6 py-5 border border-white/5 hover:border-violet-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-violet-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                      </summary>
                      <p className="text-slate-400 leading-relaxed pt-3 text-sm">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>

        <Footer lang={lang} t={t} onOpenModal={setLegal} />
        {(['privacy', 'terms', 'cookies'] as const).map(k => (
          <LegalModal
            key={k}
            isOpen={legal === k}
            onClose={() => setLegal(null)}
            title={legalTranslations[lang]?.[k].title || k}
            content={legalTranslations[lang]?.[k].content}
            t={t}
          />
        ))}

        {abierto && (
          <ClipEditor
            clips={SIN_SELECCION}
            piezas={piezas}
            setPiezas={setPiezas}
            capas={capas}
            setCapas={setCapas}
            quality="1080"
            watermarkOn={false}
            watermarkConfig={null}
            sinMarca
            t={dictionary}
            onClose={() => setAbierto(false)}
          />
        )}
      </div>
    </BrandContext.Provider>
  );
};

export default ClipEditorTool;
