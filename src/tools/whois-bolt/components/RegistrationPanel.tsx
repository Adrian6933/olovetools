import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { looksLikeDomain } from '../lib/doh';

interface Registration {
  domain: string; source: string; checkedAt: string; registrar: string | null;
  created: string | null; expires: string | null; updated: string | null;
  statuses: string[]; nameservers: string[]; dnssec: boolean | null;
}

export function RegistrationPanel({ domain, lang, t }: { domain: string; lang: string; t: any }) {
  const [data, setData] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Registries such as Red.es (.es) only answer whitelisted IPs; IANA lists
  // their own web lookup, which is the one place the user can still go.
  const [registryUrl, setRegistryUrl] = useState('');
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    abort.current?.abort(); setData(null); setLoading(false); setError(''); setRegistryUrl('');
    return () => abort.current?.abort();
  }, [domain]);
  const lookup = async () => {
    if (!looksLikeDomain(domain)) { setError(t.registrationInvalid); return; }
    abort.current?.abort();
    const controller = new AbortController(); abort.current = controller;
    setLoading(true); setData(null); setError(''); setRegistryUrl('');
    try {
      const res = await fetch(`/api/whois?mode=rdap&domain=${encodeURIComponent(domain)}`, { signal: controller.signal });
      const body = await res.json();
      if (controller.signal.aborted) return;
      if (!res.ok) {
        if (body.error === 'registry_restricted') {
          setError(t.registrationRestricted);
          if (/^https?:\/\//.test(body.registryUrl || '')) setRegistryUrl(body.registryUrl);
        } else setError(body.error === 'registration_not_found' ? t.registrationMissing : t.registrationFailed);
        return;
      }
      setData(body);
    } catch { if (!controller.signal.aborted) setError(t.registrationFailed); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  };
  const date = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value)) : '—';
  const download = () => {
    if (!data) return;
    const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = href; a.download = `${domain}-rdap.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
  };
  return <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 sm:p-5 space-y-4">
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <h2 className="text-sm font-bold text-white">{t.registrationTitle}</h2>
      <button disabled={loading || !domain} onClick={() => void lookup()} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}{t.registrationLookup}</button>
    </div>
    <p className="text-xs text-slate-400 leading-relaxed">{t.registrationHint}</p>
    {error && <p role="alert" className="text-xs text-amber-300">{error}{registryUrl && <> <a href={registryUrl} target="_blank" rel="noopener noreferrer" className="underline text-amber-200">{t.registrationRegistryLink}</a></>}</p>}
    {data && <div className="space-y-4">
      <p className="font-mono text-sm text-indigo-200 break-all">{data.domain}</p>
      <dl className="grid sm:grid-cols-2 gap-3">{[[t.registrarLabel, data.registrar || '—'], [t.createdLabel, date(data.created)], [t.expiresLabel, date(data.expires)], [t.updatedLabel, date(data.updated)]].map(([label, value]) => <div key={label} className="rounded-xl bg-black/20 p-3 min-w-0"><dt className="text-[11px] text-slate-500">{label}</dt><dd className="text-sm text-slate-200 mt-1 break-words">{value}</dd></div>)}</dl>
      <p className="text-xs text-slate-400 break-all">DNSSEC · {data.dnssec === null ? '—' : data.dnssec ? t.registrationSigned : t.registrationUnsigned}</p>
      <div className="flex flex-wrap gap-2">{data.statuses.map(s => <span key={s} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-300">{s}</span>)}</div>
      <p className="font-mono text-xs text-slate-400 break-all">{data.nameservers.join(' · ')}</p>
      <div className="flex flex-wrap gap-4 items-center"><button onClick={download} className="flex items-center gap-2 text-xs text-indigo-300"><Download className="w-4 h-4" />{t.registrationSave}</button>{/^https:\/\//.test(data.source)
        ? <a href={data.source} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 underline">{t.registrationSource}</a>
        : <span className="text-xs text-slate-400 break-all">{t.registrationSource} · WHOIS {data.source.replace(/^whois:\/\//, '')}</span>}</div>
    </div>}
  </section>;
}
