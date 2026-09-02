import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowUp, Check, Copy, Download, Globe, Loader2, Search, ShieldCheck } from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  HeroArt,
  IconDnssec,
  IconPrivacy,
  IconPropagation,
  IconResolvers,
  IconStatus,
  IconTypes,
  StepAsk,
  StepCompare,
  StepRead,
  StepTrust,
} from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import {
  compareResolvers,
  lookup,
  looksLikeDomain,
  resolverById,
  resolversAgree,
  reverseName,
  sanitizeDomain,
} from './lib/doh';
import { RESOLVERS, TYPE_ORDER, type LookupResults, type RecordType, type ResolverView, type Status } from './types';

interface WhoisBoltProps {
  lang: string;
  dictionary: any;
}

const formatTtl = (ttl: number, t: any): string => {
  if (ttl < 60) return `${ttl} ${t.unit_seconds || 's'}`;
  if (ttl < 3600) return `${Math.floor(ttl / 60)} ${t.unit_minutes || 'min'}`;
  if (ttl < 86400) return `${Math.floor(ttl / 3600)} ${t.unit_hours || 'h'}`;
  return `${Math.floor(ttl / 86400)} ${t.unit_days || 'd'}`;
};

const STATUS_TONE: Record<Status, string> = {
  ok: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  empty: 'text-slate-400 border-white/10 bg-white/5',
  nxdomain: 'text-red-300 border-red-500/30 bg-red-500/10',
  servfail: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  refused: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  error: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
};

export default function WhoisBolt({ lang, dictionary }: WhoisBoltProps) {
  const t = dictionary || {};

  const [domainInput, setDomainInput] = useState('');
  const [queried, setQueried] = useState('');
  const [resolverId, setResolverId] = useState('google');
  const [results, setResults] = useState<LookupResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareType, setCompareType] = useState<RecordType>('A');
  const [views, setViews] = useState<ResolverView[] | null>(null);
  const [comparing, setComparing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The old copy handler left a dangling timer behind on unmount.
  useEffect(() => {
    if (!copiedKey) return;
    const id = setTimeout(() => setCopiedKey(null), 1800);
    return () => clearTimeout(id);
  }, [copiedKey]);

  // A pending lookup is abandoned when a new one starts, so a slow resolver
  // cannot overwrite fresher results.
  useEffect(() => () => abortRef.current?.abort(), []);

  const copy = useCallback((key: string, value: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(key);
  }, []);

  const runLookup = useCallback(async () => {
    const raw = domainInput.trim();
    // An IPv4 address is turned into its reverse-lookup name, so pasting an IP
    // does the obvious thing instead of failing validation.
    const reverse = reverseName(raw);
    const domain = reverse || sanitizeDomain(raw);
    if (!domain || (!reverse && !looksLikeDomain(domain))) {
      setError(t.error_invalid_domain || 'Please enter a valid domain or IPv4 address');
      setResults(null);
      setViews(null);
      setQueried('');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResults(null);
    setViews(null);
    setQueried(domain);
    try {
      const types: RecordType[] = reverse ? ['PTR'] : TYPE_ORDER;
      const found = await lookup(domain, types, resolverById(resolverId), controller.signal);
      if (controller.signal.aborted) return;
      setResults(found);
      // NXDOMAIN on the SOA lookup is the honest signal that the name itself
      // does not exist, as opposed to simply having no records of one type.
      const anyNx = Object.values(found).some(r => r && r.status === 'nxdomain');
      const total = Object.values(found).reduce((n, r) => n + (r ? r.answers.length : 0), 0);
      if (anyNx && total === 0) setError(t.error_nxdomain || 'That name does not exist in DNS.');
      else if (total === 0) setError(t.error_no_records || 'No records found for this name.');
    } catch {
      if (!controller.signal.aborted) setError(t.error_lookup_failed || 'The lookup failed. Try another resolver.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [domainInput, resolverId, t]);

  const runCompare = useCallback(async () => {
    if (!queried) return;
    setComparing(true);
    setViews(null);
    try {
      const v = await compareResolvers(queried, compareType);
      setViews(v);
    } finally {
      setComparing(false);
    }
  }, [queried, compareType]);

  const agree = views ? resolversAgree(views) : true;

  const exportText = useMemo(() => {
    if (!results || !queried) return '';
    const lines: string[] = [`; DNS records for ${queried}`, `; resolver: ${resolverById(resolverId).label}`, ''];
    (Object.keys(results) as RecordType[]).forEach(type => {
      const r = results[type];
      if (!r || r.answers.length === 0) return;
      r.answers.forEach(a => {
        lines.push(`${a.name}\t${a.TTL}\tIN\t${type}\t${a.data}`);
      });
    });
    return lines.join('\n') + '\n';
  }, [results, queried, resolverId]);

  const downloadZone = useCallback(() => {
    if (!exportText) return;
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${queried}-dns.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }, [exportText, queried]);

  const statusLabel = (s: Status): string =>
    s === 'ok'
      ? t.status_ok || 'answered'
      : s === 'empty'
      ? t.status_empty || 'no records'
      : s === 'nxdomain'
      ? t.status_nxdomain || 'name does not exist'
      : s === 'servfail'
      ? t.status_servfail || 'server failure'
      : s === 'refused'
      ? t.status_refused || 'refused'
      : t.status_error || 'unreachable';

  const activeResolver = resolverById(resolverId);

  const steps = [
    { art: StepAsk, title: t.step1Title || 'Type a domain or an IP', text: t.step1Text || 'A URL is trimmed down to its host, and an IPv4 address is turned into a reverse lookup.' },
    { art: StepRead, title: t.step2Title || 'Read every record type', text: t.step2Text || 'A, AAAA, CNAME, MX, NS, TXT, SOA, CAA, SRV and HTTPS, each with its TTL.' },
    { art: StepCompare, title: t.step3Title || 'Check it has propagated', text: t.step3Text || 'Ask three resolvers the same question and see whether they still disagree.' },
    { art: StepTrust, title: t.step4Title || 'See if it is signed', text: t.step4Text || 'The resolver says whether the answer was validated with DNSSEC, and that badge is shown.' },
  ];

  const features = [
    { icon: IconTypes, title: t.feat1Title || 'Ten record types', text: t.feat1Text || 'Including CAA, which says who may issue certificates for the domain, and HTTPS/SVCB records.' },
    { icon: IconStatus, title: t.feat2Title || 'Tells a typo from a gap', text: t.feat2Text || 'A name that does not exist is reported as NXDOMAIN, not quietly shown as "no records".' },
    { icon: IconPropagation, title: t.feat3Title || 'Propagation check', text: t.feat3Text || 'Three independent resolvers, side by side, so you can see a change spreading.' },
    { icon: IconDnssec, title: t.feat4Title || 'DNSSEC badge', text: t.feat4Text || 'Shows the resolver’s authenticated-data flag instead of throwing it away.' },
    { icon: IconResolvers, title: t.feat5Title || 'You pick the resolver', text: t.feat5Text || 'Google, Cloudflare or DNS.SB, each named with its operator so the choice is informed.' },
    { icon: IconPrivacy, title: t.feat6Title || 'Honest about the network', text: t.feat6Text || 'DNS cannot be answered offline. The query goes straight from your browser to the resolver you chose, with no server of ours in between.' },
  ];

  const faq: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];

  /** Types actually present in the answer, in the usual order.
   *  Derived from the result rather than from TYPE_ORDER: a reverse lookup
   *  returns PTR, which is not in that list, and iterating the list meant the
   *  PTR record was fetched and then silently never rendered. */
  const presentTypes = useMemo(() => {
    if (!results) return [] as RecordType[];
    const keys = Object.keys(results) as RecordType[];
    const ordered = TYPE_ORDER.filter(ty => keys.includes(ty));
    const extras = keys.filter(ty => !TYPE_ORDER.includes(ty));
    return [...ordered, ...extras];
  }, [results]);
  const shownTypes = presentTypes.filter(ty => results && results[ty] && results[ty]!.answers.length > 0);

  /**
   * Reinicio desde el nombre de la herramienta en la cabecera.
   * Vacia el dominio y descarta la consulta anterior. El resolutor elegido se mantiene, como haria una recarga.
   * El scroll arriba lo pone withScrollToTop en el propio Header.
   */
  const handleSoftReset = () => {
    setDomainInput('');
    setQueried('');
    setResults(null);
    setLoading(false);
    setError(null);
    setViews(null);
    setComparing(false);
    setCopiedKey(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05060f] text-slate-200 font-sans relative overflow-x-hidden pt-36 md:pt-24">
      <Header
        onReset={handleSoftReset} currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/whois-bolt`)} t={t} />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit, so reserving 440px from 1400px up is
          what keeps them visible instead of silently suppressed. */}
      <main className="flex-grow w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 py-8 relative z-10 flex flex-col gap-12 md:gap-20">
        <AdBanner id="adsense-whois-bolt-top" />

        {/* Hero ------------------------------------------------------------ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300">
              <Globe className="w-3.5 h-3.5" />
              {t.heroBadge || 'DNS over HTTPS'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t.seoHeroTitle || 'WhoisBolt'}
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">{t.seoHeroText}</p>
            <a
              href="#how-it-works"
              className="inline-block px-5 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-indigo-500/30 font-bold text-sm transition-all"
            >
              {t.heroSecondary || 'See how it works'}
            </a>
          </div>
          <HeroArt className="w-full h-auto max-w-lg mx-auto" />
        </section>

        {/* Lookup ----------------------------------------------------------- */}
        <section className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 md:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
              <input
                type="text"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') runLookup();
                }}
                placeholder={t.placeholder_domain || 'example.com or 93.184.216.34'}
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                aria-label={t.placeholder_domain || 'Domain or IP'}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-indigo-500/50 font-mono text-sm text-white outline-none transition-colors placeholder-slate-600"
              />
            </div>
            <button
              onClick={runLookup}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-500 text-white text-sm font-black hover:bg-indigo-400 active:scale-95 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t.button_lookup || 'Look up'}
            </button>
          </div>

          {/* resolver choice, with the operator named */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
              {t.label_resolver || 'Resolver'}
            </span>
            <div className="inline-flex flex-wrap rounded-xl bg-slate-950/60 border border-white/5 p-1">
              {RESOLVERS.map(r => (
                <button
                  key={r.id}
                  onClick={() => setResolverId(r.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    resolverId === r.id ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">
              {(t.resolverNote || 'Your query goes straight to {op}. Nothing passes through our servers.').replace(
                '{op}',
                activeResolver.operator
              )}
            </span>
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-bold text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </p>
          )}

          {/* results */}
          {results && queried && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm text-white">{queried}</span>
                <div className="flex items-center gap-2">
                  {Object.values(results).some(r => r && r.authenticated) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t.dnssecOn || 'DNSSEC validated'}
                    </span>
                  )}
                  <button
                    onClick={downloadZone}
                    disabled={!exportText}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-indigo-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t.downloadZone || 'Download'}
                  </button>
                </div>
              </div>

              {/* one block per type that answered */}
              {shownTypes.map(type => {
                const r = results[type]!;
                return (
                  <div key={type} className="rounded-2xl border border-white/5 bg-slate-950/40 overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-white/5">
                      <span className="inline-flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 text-[11px] font-black">
                          {type}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {(t.recordCount || '{n} records').replace('{n}', String(r.answers.length))}
                        </span>
                      </span>
                      {r.authenticated && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="divide-y divide-white/5">
                      {r.answers.map((a, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <span className="font-mono text-sm text-white break-all flex-1 select-all">{a.data}</span>
                          <span className="font-mono text-[10px] text-slate-500 shrink-0">
                            TTL {formatTtl(a.TTL, t)}
                          </span>
                          <button
                            onClick={() => copy(`${type}-${i}`, a.data)}
                            aria-label={`${t.tooltip_copy || 'Copy'} ${type}`}
                            className={`w-7 h-7 shrink-0 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                              copiedKey === `${type}-${i}`
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'bg-white/5 border-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-white'
                            }`}
                          >
                            {copiedKey === `${type}-${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* what every type answered, including the ones with nothing */}
              <div className="flex flex-wrap gap-1.5">
                {presentTypes.map(ty => {
                  const r = results[ty]!;
                  return (
                    <span
                      key={ty}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold ${STATUS_TONE[r.status]}`}
                      title={statusLabel(r.status)}
                    >
                      {ty} · {r.status === 'ok' ? r.answers.length : statusLabel(r.status)}
                    </span>
                  );
                })}
              </div>

              {/* propagation */}
              <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                    {t.compareTitle || 'Compare resolvers'}
                  </span>
                  <select
                    value={compareType}
                    onChange={e => setCompareType(e.target.value as RecordType)}
                    aria-label={t.compareType || 'Record type to compare'}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-white/10 text-xs font-mono text-white outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                  >
                    {TYPE_ORDER.map(ty => (
                      <option key={ty} value={ty}>
                        {ty}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={runCompare}
                    disabled={comparing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    {comparing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    {t.compareRun || 'Ask all three'}
                  </button>
                </div>

                {views && (
                  <>
                    <div className="space-y-1.5">
                      {views.map(v => {
                        const r = resolverById(v.resolverId);
                        return (
                          <div key={v.resolverId} className="flex items-start gap-3 text-xs">
                            <span className="w-24 shrink-0 font-bold text-slate-300">{r.label}</span>
                            <span className="font-mono text-slate-400 break-all flex-1">
                              {v.values.length ? v.values.join(', ') : statusLabel(v.status)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className={`text-[11px] font-bold ${agree ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {agree ? t.compareAgree || 'All resolvers agree.' : t.compareDisagree || 'Resolvers disagree — the change has not fully propagated.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-whois-bolt-mid" />

        {/* How it works ---------------------------------------------------- */}
        <section id="how-it-works" className="space-y-8 scroll-mt-28">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
            {t.howTitle || 'How it works'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 space-y-3">
                <s.art />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/15 text-indigo-300 text-[11px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.text}</p>
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
            {features.map((f, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
                <div className="w-10 h-10">
                  <f.icon />
                </div>
                <h3 className="text-sm font-black text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ------------------------------------------------------------- */}
        {faq.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white text-center">
              {t.faqTitle || 'Frequently Asked Questions'}
            </h2>
            <div className="space-y-3 max-w-3xl mx-auto w-full">
              {faq.map((item, i) => (
                <details key={i} className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-bold text-white hover:text-indigo-300 transition-colors">
                    <span>{item.question}</span>
                    <span className="text-indigo-400 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <AdBanner id="adsense-whois-bolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={m => setLegalModal(m)} />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTop || 'Back to top'}
          className="fixed bottom-6 right-6 z-[190] w-11 h-11 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition-all cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

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
