import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { Search, Globe, Server, Mail, FileText, RotateCcw, AlertCircle, Loader, Check } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface WhoisBoltProps {
  lang: string;
  dictionary: any;
}

type RecordType = 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'CNAME' | 'SOA';

interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
  preference?: number;
  exchange?: string;
  rname?: string;
  mname?: string;
  serial?: number;
  refresh?: number;
  retry?: number;
  expire?: number;
  minimum?: number;
}

interface DohResponse {
  Status: number;
  Answer?: DohAnswer[];
  Authority?: DohAnswer[];
  Comment?: string;
}

interface RecordSet {
  type: RecordType;
  records: DohAnswer[];
  icon: React.ReactNode;
}

const TYPE_CODES: Record<RecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  MX: 15,
  TXT: 16,
  AAAA: 28,
};

const TYPE_ORDER: RecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA'];

const TYPE_ICONS: Record<RecordType, React.ReactNode> = {
  A: <Server className="w-3 h-3" />,
  AAAA: <Server className="w-3 h-3" />,
  CNAME: <Globe className="w-3 h-3" />,
  MX: <Mail className="w-3 h-3" />,
  NS: <Globe className="w-3 h-3" />,
  TXT: <FileText className="w-3 h-3" />,
  SOA: <FileText className="w-3 h-3" />,
};

const TYPE_CODE_TO_NAME = (code: number): RecordType | null => {
  for (const key of Object.keys(TYPE_CODES) as RecordType[]) {
    if (TYPE_CODES[key] === code) return key;
  }
  return null;
};

const sanitizeDomain = (input: string): string => {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
};

const formatTtl = (ttl: number, t: any): string => {
  if (ttl < 60) return `${ttl} ${t.unit_seconds || 's'}`;
  if (ttl < 3600) return `${Math.floor(ttl / 60)} ${t.unit_minutes || 'min'}`;
  if (ttl < 86400) return `${Math.floor(ttl / 3600)} ${t.unit_hours || 'h'}`;
  return `${Math.floor(ttl / 86400)} ${t.unit_days || 'd'}`;
};

const formatRecordData = (record: DohAnswer, type: RecordType): string => {
  if (type === 'MX' && record.preference !== undefined) {
    return `${record.preference} ${record.exchange || record.data}`;
  }
  if (type === 'SOA') {
    const parts = [
      record.mname || record.data,
      record.rname,
      record.serial,
      record.refresh,
      record.retry,
      record.expire,
      record.minimum,
    ].filter((p) => p !== undefined && p !== null && p !== '');
    if (parts.length > 1) return parts.join(' ');
  }
  if (type === 'TXT') {
    return record.data.replace(/^"|"$/g, '');
  }
  return record.data;
};

const RecordCard: React.FC<{
  record: DohAnswer;
  type: RecordType;
  t: any;
  copied: boolean;
  onCopy: () => void;
}> = ({ record, type, t, copied, onCopy }) => {
  const data = formatRecordData(record, type);
  return (
    <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-2 hover:border-indigo-500/20 transition-colors group">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-sm text-white break-all min-h-[1.25rem] select-all flex-1">
          {data || <span className="text-slate-600">â€”</span>}
        </div>
        <button
          onClick={onCopy}
          title={copied ? (t.emailCopied || 'Copied!') : (t.tooltip_copy || 'Copy')}
          className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
            copied
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-white/5 border-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/30 text-slate-400 hover:text-white'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400/60">
        <span className="uppercase tracking-widest">{record.name}</span>
        <span>TTL {formatTtl(record.TTL, t)}</span>
      </div>
    </div>
  );
};

const RecordSection: React.FC<{
  recordSet: RecordSet;
  t: any;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}> = ({ recordSet, t, copiedKey, onCopy }) => {
  if (recordSet.records.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {recordSet.icon}
          </span>
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
            {recordSet.type}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-indigo-400/70 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded uppercase tracking-widest">
          {recordSet.records.length} {t.label_records || 'records'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recordSet.records.map((record, idx) => (
          <RecordCard
            key={`${recordSet.type}-${idx}-${record.name}`}
            record={record}
            type={recordSet.type}
            t={t}
            copied={copiedKey === `${recordSet.type}-${idx}`}
            onCopy={() => onCopy(`${recordSet.type}-${idx}`, formatRecordData(record, recordSet.type))}
          />
        ))}
      </div>
    </div>
  );
};

export default function WhoisBolt({ lang, dictionary }: WhoisBoltProps) {
  const t = dictionary || {};
  const [domainInput, setDomainInput] = useState<string>('');
  const [queriedDomain, setQueriedDomain] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<RecordType, DohAnswer[]> | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const fetchRecords = useCallback(async (domain: string): Promise<Record<RecordType, DohAnswer[]>> => {
    const empty: Record<RecordType, DohAnswer[]> = { A: [], AAAA: [], MX: [], TXT: [], NS: [], CNAME: [], SOA: [] };
    const settled = await Promise.all(
      TYPE_ORDER.map(async (type) => {
        try {
          const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`, {
            headers: { 'Accept': 'application/dns+json' },
          });
          if (!res.ok) return { type, records: [] as DohAnswer[] };
          const json: DohResponse = await res.json();
          if (json.Status !== 0 && json.Status !== 3) return { type, records: [] as DohAnswer[] };
          const answers = (json.Answer || []).filter((a) => {
            const name = TYPE_CODE_TO_NAME(a.type);
            return name === type || (type === 'SOA' && a.type === TYPE_CODES.SOA);
          });
          return { type, records: answers };
        } catch {
          return { type, records: [] as DohAnswer[] };
        }
      })
    );
    for (const { type, records } of settled) {
      empty[type] = records;
    }
    return empty;
  }, []);

  const handleLookup = useCallback(async () => {
    const domain = sanitizeDomain(domainInput);
    if (!domain || !domain.includes('.')) {
      setError(t.error_invalid_domain || 'Please enter a valid domain');
      setResults(null);
      setQueriedDomain('');
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);
    setQueriedDomain(domain);
    setCopiedKey(null);
    try {
      const records = await fetchRecords(domain);
      setResults(records);
      const total = Object.values(records).reduce((sum, r) => sum + r.length, 0);
      if (total === 0) {
        setError(t.error_no_records || 'No DNS records found for this domain');
      }
    } catch {
      setError(t.error_lookup_failed || 'DNS lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [domainInput, fetchRecords, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleLookup();
  };

  const copyToClipboard = (key: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const recordSets: RecordSet[] = useMemo(() => {
    if (!results) return [];
    return TYPE_ORDER.map((type) => ({
      type,
      records: results[type] || [],
      icon: TYPE_ICONS[type],
    })).filter((rs) => rs.records.length > 0);
  }, [results]);

  const summary = useMemo(() => {
    if (!results) return null;
    const ips = [
      ...(results.A || []).map((r) => r.data),
      ...(results.AAAA || []).map((r) => r.data),
    ];
    const nameservers = (results.NS || []).map((r) => r.data);
    const mailServers = (results.MX || []).map((r) => ({
      preference: r.preference ?? 0,
      exchange: r.exchange || r.data,
    })).sort((a, b) => a.preference - b.preference);
    const cname = (results.CNAME || [])[0]?.data || null;
    const soa = (results.SOA || [])[0];
    const txtRecords = (results.TXT || []).map((r) => r.data.replace(/^"|"$/g, ''));
    return { ips, nameservers, mailServers, cname, soa, txtRecords };
  }, [results]);

  const totalRecords = useMemo(() => recordSets.reduce((sum, rs) => sum + rs.records.length, 0), [recordSets]);

  const resetWorkspace = useCallback(() => {
    setDomainInput('');
    setQueriedDomain('');
    setResults(null);
    setError(null);
    setCopiedKey(null);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#05050a] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/whois-bolt`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-whois-bolt-top" />

        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Search className="w-8 h-8 text-indigo-400" />
            <span>{t.seoHeroTitle || 'Whois-Bolt'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <label className="text-xs font-black text-indigo-400 uppercase tracking-widest text-left">
              {t.label_domain_input || 'Domain Name'}
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex items-center flex-1">
              <Search className="absolute left-4 w-5 h-5 text-indigo-400 pointer-events-none" />
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="example.com"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border border-white/5 focus:border-indigo-500/50 font-mono text-sm text-white placeholder-slate-600 focus:ring-0 transition-colors outline-none"
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={loading || !domainInput.trim()}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 hover:bg-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 hover:text-white text-sm font-bold transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? (t.button_searching || 'Searching...') : (t.button_lookup || 'Lookup')}
            </button>
          </div>
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {t.note_doh_privacy || 'Queries are sent directly to Google DNS over HTTPS. No data is stored on our servers.'}
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-sm font-mono">
              {t.status_resolving || 'Resolving'} {queriedDomain}...
            </span>
          </div>
        )}

        {!loading && results && totalRecords > 0 && (
          <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-sm text-white">
                  {queriedDomain}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-400/80 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded uppercase tracking-widest">
                {totalRecords} {t.label_records || 'records'}
              </span>
            </div>
            <div className="space-y-6">
              {recordSets.map((rs) => (
                <RecordSection
                  key={rs.type}
                  recordSet={rs}
                  t={t}
                  copiedKey={copiedKey}
                  onCopy={copyToClipboard}
                />
              ))}
            </div>
          </div>
        )}

        {!loading && summary && (summary.ips.length > 0 || summary.nameservers.length > 0 || summary.mailServers.length > 0) && (
          <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
              <Globe className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                {t.label_domain_summary || 'Domain Summary'}
              </h3>
            </div>

            {summary.ips.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-400/80" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                    {t.label_resolved_ips || 'Resolved IP Addresses'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summary.ips.map((ip, idx) => (
                    <div
                      key={`ip-${idx}`}
                      className="bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 font-mono text-sm text-white break-all"
                    >
                      {ip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.nameservers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400/80" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                    {t.label_nameservers || 'Nameservers'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summary.nameservers.map((ns, idx) => (
                    <div
                      key={`ns-${idx}`}
                      className="bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 font-mono text-sm text-white break-all"
                    >
                      {ns}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.mailServers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400/80" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                    {t.label_mail_servers || 'Mail Servers'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {summary.mailServers.map((mx, idx) => (
                    <div
                      key={`mx-${idx}`}
                      className="bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 font-mono text-sm text-white break-all flex items-center gap-3"
                    >
                      <span className="text-[10px] font-bold text-indigo-400/70 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded shrink-0">
                        {mx.preference}
                      </span>
                      <span className="break-all">{mx.exchange}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.cname && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400/80" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                    {t.label_cname || 'Canonical Name'}
                  </span>
                </div>
                <div className="bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 font-mono text-sm text-white break-all">
                  {summary.cname}
                </div>
              </div>
            )}

            {summary.txtRecords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400/80" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                    {t.label_txt_records || 'TXT Records'}
                  </span>
                </div>
                <div className="space-y-2">
                  {summary.txtRecords.map((txt, idx) => (
                    <div
                      key={`txt-${idx}`}
                      className="bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 font-mono text-xs text-white break-all"
                    >
                      {txt}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.soa && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400/80" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/80">
                    {t.label_soa || 'Start of Authority'}
                  </span>
                </div>
                <div className="bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 space-y-1 font-mono text-xs text-white break-all">
                  <div><span className="text-indigo-400/60">mname:</span> {summary.soa.mname || summary.soa.data}</div>
                  {summary.soa.rname && <div><span className="text-indigo-400/60">rname:</span> {summary.soa.rname}</div>}
                  {summary.soa.serial !== undefined && <div><span className="text-indigo-400/60">serial:</span> {summary.soa.serial}</div>}
                  {summary.soa.refresh !== undefined && <div><span className="text-indigo-400/60">refresh:</span> {summary.soa.refresh}</div>}
                  {summary.soa.retry !== undefined && <div><span className="text-indigo-400/60">retry:</span> {summary.soa.retry}</div>}
                  {summary.soa.expire !== undefined && <div><span className="text-indigo-400/60">expire:</span> {summary.soa.expire}</div>}
                  {summary.soa.minimum !== undefined && <div><span className="text-indigo-400/60">minimum:</span> {summary.soa.minimum}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !results && !error && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-500 text-center">
            <Globe className="w-12 h-12 text-indigo-400/30" />
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-400">
                {t.placeholder_enter_domain || 'Enter a domain to begin DNS inspection'}
              </div>
              <div className="text-xs text-slate-600">
                {t.placeholder_supported_types || 'A, AAAA, MX, TXT, NS, CNAME, SOA records supported'}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={resetWorkspace}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 text-xs font-bold transition-all cursor-pointer outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            {t.button_reset || 'Reset'}
          </button>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-whois-bolt-bottom" />
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
