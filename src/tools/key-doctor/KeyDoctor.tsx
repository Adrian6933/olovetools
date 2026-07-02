import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { Keyboard, Copy, Check, RotateCcw, Delete, CornerDownLeft } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface KeyDoctorProps {
  lang: string;
  dictionary: any;
}

interface KeyRecord {
  key: string;
  code: string;
  keyCode: number;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  timestamp: number;
}

export default function KeyDoctor({ lang, dictionary }: KeyDoctorProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [current, setCurrent] = useState<KeyRecord | null>(null);
  const [history, setHistory] = useState<KeyRecord[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [modifiers, setModifiers] = useState({ ctrl: false, alt: false, shift: false, meta: false });
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const record: KeyRecord = {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
        timestamp: Date.now(),
      };
      setCurrent(record);
      setModifiers({ ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey });
      setHistory((prev) => [record, ...prev].slice(0, 10));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const resetWorkspace = useCallback(() => {
    setCurrent(null);
    setHistory([]);
    setModifiers({ ctrl: false, alt: false, shift: false, meta: false });
    setCopiedField(null);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const copyValue = useCallback((value: string, field: string) => {
    navigator.clipboard.writeText(String(value));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const modifierBadges: { key: 'ctrl' | 'alt' | 'shift' | 'meta'; label: string }[] = [
    { key: 'ctrl', label: 'Ctrl' },
    { key: 'alt', label: 'Alt' },
    { key: 'shift', label: 'Shift' },
    { key: 'meta', label: 'Meta' },
  ];

  const displayCards: { label: string; value: string | number; field: string }[] = [
    { label: 'event.key', value: current?.key ?? 'â€”', field: 'key' },
    { label: 'event.code', value: current?.code ?? 'â€”', field: 'code' },
    { label: 'event.keyCode', value: current?.keyCode ?? 'â€”', field: 'keyCode' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0802] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/key-doctor`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-key-doctor-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Keyboard className="w-8 h-8 text-amber-400" />
            <span>{t.seoHeroTitle || 'Key Inspector'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">{t.seoHeroText}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {modifierBadges.map((m) => (
            <span
              key={m.key}
              className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-all ${
                modifiers[m.key]
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'bg-white/[0.02] border-white/10 text-slate-500'
              }`}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div
          ref={areaRef}
          tabIndex={0}
          className="relative rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-[#0c0802] to-[#0c0802] p-6 md:p-12 min-h-[280px] flex flex-col items-center justify-center text-center focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
        >
          <div className="absolute top-4 left-4 text-[10px] tracking-[0.4em] uppercase text-amber-400/40 font-bold">
            {t.captureHint || 'Press any key'}
          </div>
          {current ? (
            <div className="flex flex-col items-center gap-6">
              <div className="text-7xl md:text-8xl font-black text-amber-400 tracking-tighter break-all max-w-full">
                {current.key === ' ' ? 'Space' : current.key}
              </div>
              <div className="text-amber-400/50 text-xs tracking-[0.3em] uppercase font-bold flex items-center gap-2">
                <CornerDownLeft className="w-3 h-3" />
                {current.code}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <Keyboard className="w-16 h-16 text-amber-400/30" />
              <p className="text-sm tracking-widest uppercase font-bold">
                {t.captureHint || 'Press any key to inspect'}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayCards.map((card) => (
            <div
              key={card.field}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-amber-500/40 transition-all"
            >
              <div className="text-[10px] tracking-[0.3em] uppercase text-amber-400/60 font-bold mb-2">
                {card.label}
              </div>
              <div className="text-2xl md:text-3xl font-black text-white break-all min-h-[2.5rem] flex items-center">
                {String(card.value)}
              </div>
              <button
                onClick={() => copyValue(String(card.value), card.field)}
                disabled={!current}
                className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {copiedField === card.field ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> {t.copied || 'Copied'}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> {t.copy || 'Copy'}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-sm font-black tracking-tight text-white uppercase">
              {t.historyTitle || 'History Log'}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearHistory}
                disabled={history.length === 0}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer"
              >
                <Delete className="w-3.5 h-3.5" /> {t.clear || 'Clear'}
              </button>
              <button
                onClick={resetWorkspace}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {t.reset || 'Reset'}
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-600 text-sm tracking-widest uppercase font-bold">
              {t.historyEmpty || 'No keys pressed yet'}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {history.map((rec, i) => (
                <div
                  key={rec.timestamp + '_' + i}
                  className="px-5 py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 hover:bg-amber-500/5 transition-colors"
                >
                  <div className="flex items-center gap-3 md:w-48 shrink-0">
                    <span className="text-amber-400/40 text-xs font-mono">{String(history.length - i).padStart(2, '0')}</span>
                    <span className="text-lg font-black text-amber-400 break-all">
                      {rec.key === ' ' ? 'Space' : rec.key}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                    <span>
                      <span className="text-slate-600">code:</span> {rec.code}
                    </span>
                    <span>
                      <span className="text-slate-600">keyCode:</span> {rec.keyCode}
                    </span>
                    <span className="flex gap-1">
                      {(['ctrl', 'alt', 'shift', 'meta'] as const).map((mk) =>
                        rec[mk] ? (
                          <span key={mk} className="text-amber-300 bg-amber-500/10 px-1.5 rounded uppercase tracking-wider">
                            {mk}
                          </span>
                        ) : null
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-key-doctor-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />

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
