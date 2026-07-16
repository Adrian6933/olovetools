import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  KeyRound, RotateCcw, ClipboardCopy, Check, Sparkles, ShieldAlert,
  Clock, CalendarClock, CalendarX2, CalendarPlus, Hash, UserCircle, Globe2, Fingerprint, Building2,
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';
import { useReducedMotion, fadeInUp, staggerContainer, EASE_OUT } from '../../components/shared/motion';

interface JwtBoltProps {
  lang: string;
  dictionary: any;
}

interface Decoded {
  headerObj: Record<string, any> | null;
  payloadObj: Record<string, any> | null;
  headerRaw: string;
  payloadRaw: string;
  signature: string;
  headerJson: string;
  payloadJson: string;
  error?: string;
}

const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lZSIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

function b64UrlToUtf8(seg: string): string {
  let s = seg.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function prettyJson(obj: unknown): string {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj ?? ''); }
}

function decodeJwt(raw: string, t: any): Decoded {
  const trimmed = raw.trim();
  if (!trimmed) return { headerObj: null, payloadObj: null, headerRaw: '', payloadRaw: '', signature: '', headerJson: '', payloadJson: '', error: t.errorEmpty };
  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return { headerObj: null, payloadObj: null, headerRaw: '', payloadRaw: '', signature: '', headerJson: '', payloadJson: '', error: t.errorMalformed };
  }
  const [headerSeg, payloadSeg, signature] = parts as [string, string, string];
  const out: Decoded = { headerObj: null, payloadObj: null, headerRaw: headerSeg, payloadRaw: payloadSeg, signature, headerJson: '', payloadJson: '' };
  try {
    const headerText = b64UrlToUtf8(headerSeg);
    out.headerJson = headerText;
    out.headerObj = JSON.parse(headerText);
  } catch {
    out.error = (t.errorJson || 'Invalid JSON').replace('{segment}', t.segHeader || 'header');
    return out;
  }
  try {
    const payloadText = b64UrlToUtf8(payloadSeg);
    out.payloadJson = payloadText;
    out.payloadObj = JSON.parse(payloadText);
  } catch {
    out.error = (t.errorJson || 'Invalid JSON').replace('{segment}', t.segPayload || 'payload');
  }
  return out;
}

interface ClaimDef { key: string; labelKey: string; icon: React.ReactNode; }
const STD_CLAIMS: ClaimDef[] = [
  { key: 'iss', labelKey: 'claimIss', icon: <Building2 className="w-4 h-4" /> },
  { key: 'sub', labelKey: 'claimSub', icon: <UserCircle className="w-4 h-4" /> },
  { key: 'aud', labelKey: 'claimAud', icon: <Globe2 className="w-4 h-4" /> },
  { key: 'exp', labelKey: 'claimExp', icon: <CalendarX2 className="w-4 h-4" /> },
  { key: 'iat', labelKey: 'claimIat', icon: <CalendarPlus className="w-4 h-4" /> },
  { key: 'nbf', labelKey: 'claimNbf', icon: <CalendarClock className="w-4 h-4" /> },
  { key: 'jti', labelKey: 'claimJti', icon: <Fingerprint className="w-4 h-4" /> },
];

export default function JwtBolt({ lang, dictionary }: JwtBoltProps) {
  const t = dictionary || {};
  const [raw, setRaw] = useState('');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const decoded = useMemo(() => decodeJwt(raw, t), [raw, t]);
  const hasToken = !!raw.trim();
  const ok = hasToken && !decoded.error && !!decoded.payloadObj;

  const payload = decoded.payloadObj || {};
  const header = decoded.headerObj || {};

  const stdPresent = STD_CLAIMS.filter((c) => c.key in payload);
  const others = Object.keys(payload).filter((k) => !STD_CLAIMS.some((c) => c.key === k));

  const expStatus = useMemo(() => {
    if (!ok) return null;
    const exp = payload.exp;
    const nbf = payload.nbf;
    if (typeof nbf === 'number' && now / 1000 < nbf) {
      return { kind: 'notYet' as const, secs: nbf * 1000 - now };
    }
    if (typeof exp === 'number') {
      const diff = exp * 1000 - now;
      if (diff <= 0) return { kind: 'expired' as const, secs: -diff };
      return { kind: 'valid' as const, secs: diff };
    }
    return { kind: 'noExp' as const };
  }, [ok, payload, now]);

  const resetWorkspace = useCallback(() => { setRaw(''); setCopiedToken(false); setCopiedJson(false); }, []);

  const copyText = useCallback((text: string, which: 'token' | 'json') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'token') { setCopiedToken(true); window.setTimeout(() => setCopiedToken(false), 1800); }
      else { setCopiedJson(true); window.setTimeout(() => setCopiedJson(false), 1800); }
    }).catch(() => {});
  }, []);

  const fmtDuration = (secs: number) => {
    const abs = Math.floor(secs / 1000);
    const d = Math.floor(abs / 86400);
    const h = Math.floor((abs % 86400) / 3600);
    const m = Math.floor((abs % 3600) / 60);
    const s = abs % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const fmtTimestamp = (v: unknown) => {
    if (typeof v !== 'number') return String(v ?? '');
    const d = new Date(v * 1000);
    if (Number.isNaN(d.getTime())) return String(v);
    return `${d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z')}`;
  };

  const motionProps = prefersReduced
    ? {}
    : { initial: 'hidden' as const, whileInView: 'visible' as const, viewport: { once: true, amount: 0.2 }, variants: staggerContainer };

  const SEG_COLORS: Record<number, { ring: string; text: string; chip: string; bar: string }> = {
    0: { ring: 'border-rose-500/40', text: 'text-rose-300', chip: 'bg-rose-500/15', bar: 'bg-rose-500/70' },
    1: { ring: 'border-violet-500/40', text: 'text-violet-300', chip: 'bg-violet-500/15', bar: 'bg-violet-500/70' },
    2: { ring: 'border-slate-500/40', text: 'text-slate-300', chip: 'bg-slate-500/15', bar: 'bg-slate-500/70' },
  };
  const SEG_LABELS = [t.segHeader, t.segPayload, t.segSignature];

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none z-0" />
      <Header currentLang={lang} onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/jwt-bolt`} onReset={resetWorkspace} t={t} />
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-violet-400" />
            <span>{t.seoHeroTitle}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">{t.seoHeroText}</p>
        </div>

        <section className="glass-card rounded-2xl p-4 md:p-5 border border-white/5 bg-white/[0.02] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="jwt-input" className="text-xs font-bold uppercase tracking-widest text-violet-300/80">{t.labelInput}</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setRaw(SAMPLE)} className="text-xs px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 transition-colors flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5" /> {t.actionSample}
              </button>
              <button onClick={() => copyText(raw.trim(), 'token')} disabled={!hasToken} className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardCopy className="w-3.5 h-3.5" />} {copiedToken ? (t.copied || 'Copied!') : t.actionCopyToken}
              </button>
              <button onClick={resetWorkspace} className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5" /> {t.actionClear}
              </button>
            </div>
          </div>
          <textarea
            id="jwt-input"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={t.placeholderInput}
            spellCheck={false}
            aria-label={t.labelInput}
            className="w-full min-h-[120px] resize-y rounded-xl bg-black/40 border border-white/10 px-4 py-3 font-mono text-xs md:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition"
          />
          {hasToken && (
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.labelSegments}</span>
              <div className="flex flex-col gap-2">
                {(['headerRaw', 'payloadRaw', 'signature'] as const).map((field, i) => {
                  const val = (decoded as any)[field] as string;
                  const c = SEG_COLORS[i];
                  return (
                    <button key={i} onClick={() => copyText(val, 'token')} className={`group flex items-center gap-3 w-full text-left rounded-lg border ${c.ring} ${c.chip} px-3 py-2 hover:brightness-125 transition cursor-pointer`} title={t.actionCopyToken}>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${c.text} w-16 shrink-0`}>{SEG_LABELS[i]}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${c.bar} shrink-0`} />
                      <span className="font-mono text-[11px] text-slate-300 truncate flex-1" aria-label={SEG_LABELS[i]}>{val || '—'}</span>
                      <ClipboardCopy className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {hasToken && decoded.error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-200">{decoded.error}</p>
          </div>
        )}

        {ok && expStatus && (
          <motion.div {...motionProps}>
            <ExpiryBanner status={expStatus} t={t} fmtDuration={fmtDuration} />
          </motion.div>
        )}

        {ok && (
          <motion.div {...motionProps} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stdPresent.length > 0 && (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stdPresent.map((c) => (
                  <motion.article key={c.key} variants={fadeInUp} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex flex-col gap-2">
                    <header className="flex items-center gap-2 text-violet-300/90">
                      {c.icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{t[c.labelKey]}</span>
                      <code className="ml-auto text-[10px] text-slate-500 font-mono">{c.key}</code>
                    </header>
                    <p className="font-mono text-xs text-slate-200 break-words leading-relaxed">{fmtTimestamp(payload[c.key])}</p>
                    {(c.key === 'exp' || c.key === 'iat' || c.key === 'nbf') && typeof payload[c.key] === 'number' && (
                      <p className="text-[10px] text-slate-500">{new Date(payload[c.key] * 1000).toLocaleString(lang)}</p>
                    )}
                  </motion.article>
                ))}
              </div>
            )}
            {others.length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> {t.otherClaims}</h3>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-white/5">
                      {others.map((k) => (
                        <tr key={k} className="align-top">
                          <th scope="row" className="px-4 py-2.5 font-mono text-violet-300/80 w-1/3 break-all">{k}</th>
                          <td className="px-4 py-2.5 font-mono text-slate-200 break-all">{typeof payload[k] === 'string' ? payload[k] : prettyJson(payload[k])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {ok && (
          <motion.section {...motionProps} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-rose-200 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-500/70" /> {t.segHeader}</h3>
                <button onClick={() => copyText(decoded.headerJson, 'json')} className="text-[10px] px-2 py-1 rounded-md border border-white/10 hover:bg-white/10 flex items-center gap-1 cursor-pointer">
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <ClipboardCopy className="w-3 h-3" />} {t.actionCopyJson}
                </button>
              </div>
              <pre className="font-mono text-[11px] text-slate-200 bg-black/40 rounded-lg p-3 overflow-x-auto max-h-64"><code>{prettyJson(header)}</code></pre>
              <dl className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex flex-col"><dt className="text-slate-500 uppercase tracking-wider text-[9px]">{t.fieldAlg}</dt><dd className="font-mono text-rose-200">{String(header.alg ?? '—')}</dd></div>
                <div className="flex flex-col"><dt className="text-slate-500 uppercase tracking-wider text-[9px]">{t.fieldTyp}</dt><dd className="font-mono text-rose-200">{String(header.typ ?? '—')}</dd></div>
                {header.kid !== undefined && <div className="flex flex-col col-span-2"><dt className="text-slate-500 uppercase tracking-wider text-[9px]">{t.fieldKid}</dt><dd className="font-mono text-rose-200 break-all">{String(header.kid)}</dd></div>}
              </dl>
            </div>
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-violet-200 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500/70" /> {t.segPayload}</h3>
                <button onClick={() => copyText(decoded.payloadJson, 'json')} className="text-[10px] px-2 py-1 rounded-md border border-white/10 hover:bg-white/10 flex items-center gap-1 cursor-pointer">
                  <ClipboardCopy className="w-3 h-3" /> {t.actionCopyJson}
                </button>
              </div>
              <pre className="font-mono text-[11px] text-slate-200 bg-black/40 rounded-lg p-3 overflow-x-auto max-h-64"><code>{prettyJson(payload)}</code></pre>
            </div>
          </motion.section>
        )}

        {ok && (
          <p className="text-[11px] text-slate-500 leading-relaxed border border-white/5 rounded-xl p-3 bg-white/[0.01]">
            <ShieldAlert className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-amber-400/80" />
            {t.noteSecurity}
          </p>
        )}
      </main>
      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}

function ExpiryBanner({ status, t, fmtDuration }: { status: { kind: 'valid' | 'expired' | 'notYet' | 'noExp'; secs?: number }, t: any, fmtDuration: (s: number) => string }) {
  const cfg = {
    valid: { cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200', dot: 'bg-emerald-400', text: t.statusValid, suffix: `${t.labelExpiresIn} ${fmtDuration(status.secs ?? 0)}` },
    expired: { cls: 'border-rose-500/40 bg-rose-500/10 text-rose-200', dot: 'bg-rose-400', text: t.statusExpired, suffix: `${t.labelExpiredAgo} ${fmtDuration(status.secs ?? 0)}` },
    notYet: { cls: 'border-amber-500/40 bg-amber-500/10 text-amber-200', dot: 'bg-amber-400', text: t.statusNotYetValid, suffix: `${t.labelNotBeforeIn} ${fmtDuration(status.secs ?? 0)}` },
    noExp: { cls: 'border-slate-500/40 bg-slate-500/10 text-slate-300', dot: 'bg-slate-400', text: t.statusNoExp, suffix: '' },
  }[status.kind];
  return (
    <div className={`rounded-2xl border ${cfg.cls} p-4 flex items-center gap-3`}>
      <span className={`relative flex h-2.5 w-2.5`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-60`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dot}`} />
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-bold">{cfg.text}</span>
        {cfg.suffix && <span className="text-xs opacity-80 font-mono">{cfg.suffix}</span>}
      </div>
      <Clock className="ml-auto w-5 h-5 opacity-50" />
    </div>
  );
}
