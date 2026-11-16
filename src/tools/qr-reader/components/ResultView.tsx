import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Wifi,
} from 'lucide-react';

import type { ParsedPayload, PayloadKind, WarningKind } from '../lib/parse';
import { prettyFormat } from '../lib/parse';
import {
  bookLinks,
  canShare,
  contactAsVCard,
  downloadText,
  eventAsIcs,
  field,
  mailHref,
  mapsUrl,
  productLinks,
  shareText,
  smsHref,
  telHref,
  webSearchUrl,
} from '../lib/actions';

/** Warnings that should stop someone before they tap a link. */
const SEVERE: WarningKind[] = ['punycode', 'mixedScript', 'credentials', 'executable', 'ipHost'];

export function kindLabel(t: any, kind: PayloadKind): string {
  const labels: Record<PayloadKind, string> = {
    url: t.kindUrl || 'Link',
    wifi: t.kindWifi || 'WiFi network',
    vcard: t.kindContact || 'Contact card',
    mecard: t.kindContact || 'Contact card',
    email: t.kindEmail || 'Email',
    sms: t.kindSms || 'SMS',
    tel: t.kindTel || 'Phone number',
    geo: t.kindGeo || 'Map location',
    event: t.kindEvent || 'Calendar event',
    product: t.kindProduct || 'Product barcode',
    isbn: t.kindIsbn || 'Book (ISBN)',
    text: t.kindText || 'Plain text',
  };
  return labels[kind];
}

function fieldLabel(t: any, key: string): string {
  const fallback: Record<string, string> = {
    fieldHost: 'Domain', fieldSsid: 'Network name', fieldSecurity: 'Security', fieldPassword: 'Password',
    fieldHidden: 'Hidden network', fieldName: 'Name', fieldOrganization: 'Organisation', fieldJobTitle: 'Job title',
    fieldPhone: 'Phone', fieldEmail: 'Email', fieldWebsite: 'Website', fieldAddress: 'Address', fieldNote: 'Note',
    fieldBirthday: 'Birthday', fieldSubject: 'Subject', fieldBody: 'Message', fieldMessage: 'Message',
    fieldLatitude: 'Latitude', fieldLongitude: 'Longitude', fieldSummary: 'Title', fieldStart: 'Starts',
    fieldEnd: 'Ends', fieldLocation: 'Location', fieldGtin: 'Barcode number', fieldIsbn: 'ISBN',
    fieldFormat: 'Type', fieldCheck: 'Check digit',
  };
  return t[key] || fallback[key] || key;
}

function warningLabel(t: any, w: WarningKind): string {
  const fallback: Record<WarningKind, string> = {
    insecure: 'This link is plain http, so anything you send over it travels unencrypted.',
    punycode: 'The domain uses punycode. It may be legitimate, or a lookalike of a name you trust.',
    mixedScript: 'The domain mixes alphabets — a classic trick for impersonating a real site.',
    shortener: 'This is a link shortener: the real destination is hidden behind a redirect.',
    ipHost: 'The link points at a raw IP address rather than a domain name.',
    credentials: 'The link carries a username and password inside it.',
    longUrl: 'The link is unusually long, which is often used to bury the real destination.',
    openWifi: 'This network has no password, so traffic on it is not encrypted.',
    executable: 'The link points straight at an installable file.',
  };
  const key = `warn${w.charAt(0).toUpperCase()}${w.slice(1)}`;
  return t[key] || fallback[w];
}

/** Renders the WiFi string as a QR again, so a friend can join by pointing their phone at the screen. */
function WifiQr({ data, label }: { data: string; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let cancelled = false;
    import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = '';
      new QRCodeStyling({
        width: 220,
        height: 220,
        type: 'svg',
        data,
        margin: 8,
        qrOptions: { errorCorrectionLevel: 'M' },
        dotsOptions: { color: '#000000', type: 'square' },
        backgroundOptions: { color: '#ffffff' },
      }).append(ref.current);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);
  return <div ref={ref} role="img" aria-label={label} className="w-[220px] h-[220px] mx-auto rounded-2xl overflow-hidden bg-white" />;
}

interface Props {
  t: any;
  payload: ParsedPayload;
}

export function ResultView({ t, payload }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [showWifiQr, setShowWifiQr] = useState(false);

  useEffect(() => {
    setReveal(false);
    setShowWifiQr(false);
  }, [payload]);

  const severity = useMemo(() => {
    if (payload.warnings.length === 0) return 'clean' as const;
    return payload.warnings.some(w => SEVERE.includes(w)) ? ('severe' as const) : ('caution' as const);
  }, [payload]);

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(c => (c === key ? null : c)), 1600);
    } catch {
      /* the value is on screen anyway */
    }
  };

  const primary =
    'flex-1 min-w-[9rem] flex items-center justify-center gap-2 h-12 px-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-sm font-black transition-colors cursor-pointer';
  const secondary =
    'flex-1 min-w-[9rem] flex items-center justify-center gap-2 h-12 px-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors cursor-pointer';

  const CopyIcon = ({ k }: { k: string }) =>
    copied === k ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />;

  const k = payload.kind;
  const isContact = k === 'vcard' || k === 'mecard';
  const ssid = field(payload, 'fieldSsid');
  const password = field(payload, 'fieldPassword');
  const code = field(payload, 'fieldGtin') || field(payload, 'fieldIsbn');
  const badCheck = field(payload, 'fieldCheck') === 'invalid';

  // Fields already shown in a dedicated block are not repeated in the list.
  const listed = payload.fields.filter(f => {
    if (k === 'url') return false;
    if (k === 'wifi') return f.key !== 'fieldSsid' && f.key !== 'fieldPassword';
    if (k === 'product' || k === 'isbn') return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Type + format */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-black uppercase tracking-wider">
          {kindLabel(t, k)}
        </span>
        {payload.format && (
          <span className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[11px] font-bold">
            {prettyFormat(payload.format)}
          </span>
        )}
      </div>

      {/* Safety (links and open networks) */}
      {(k === 'url' || payload.warnings.length > 0) && (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 ${
            severity === 'severe'
              ? 'border-red-500/35 bg-red-500/10'
              : severity === 'caution'
                ? 'border-amber-500/30 bg-amber-500/10'
                : 'border-emerald-500/30 bg-emerald-500/10'
          }`}
        >
          {severity === 'clean' ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${severity === 'severe' ? 'text-red-400' : 'text-amber-400'}`} />
          )}
          <div className="min-w-0 space-y-1">
            <p className={`text-sm font-black ${severity === 'severe' ? 'text-red-300' : severity === 'caution' ? 'text-amber-300' : 'text-emerald-300'}`}>
              {severity === 'severe'
                ? t.verdictSevere || 'Treat this one with suspicion'
                : severity === 'caution'
                  ? t.verdictCaution || 'Worth a second look'
                  : t.verdictClean || 'Nothing suspicious found'}
            </p>
            {payload.warnings.length > 0 ? (
              <ul className="space-y-1 list-disc pl-4">
                {payload.warnings.map(w => (
                  <li key={w} className="text-[13px] text-slate-300 leading-snug">
                    {warningLabel(t, w)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-slate-400 leading-snug">
                {t.verdictCleanHint || 'We still never open anything on your behalf — that stays your call.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- link */}
      {k === 'url' && payload.href && (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{fieldLabel(t, 'fieldHost')}</p>
            <p className="text-xl font-black text-white break-all">{payload.host}</p>
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{t.destinationLabel || 'Full destination'}</p>
            <p className="text-sm text-slate-200 font-mono break-all bg-black/30 border border-white/5 rounded-xl px-3.5 py-3 leading-relaxed">{payload.href}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <a
              href={payload.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={
                severity === 'severe'
                  ? 'flex-1 min-w-[9rem] flex items-center justify-center gap-2 h-12 px-4 rounded-2xl border border-red-500/45 bg-red-500/10 text-red-300 hover:bg-red-500/20 text-sm font-black transition-colors'
                  : primary
              }
            >
              <ExternalLink className="w-4 h-4" />
              {severity === 'severe' ? t.openAnywayBtn || 'Open anyway' : t.openBtn || 'Open the link'}
            </a>
            <button onClick={() => copy(payload.href!, 'href')} className={secondary}>
              <CopyIcon k="href" />
              {t.copyBtn || 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- wifi */}
      {k === 'wifi' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500/15 to-transparent border border-cyan-500/20 p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0">
                <Wifi className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{fieldLabel(t, 'fieldSsid')}</p>
                <p className="text-lg font-black text-white break-all">{ssid || '—'}</p>
              </div>
              <button onClick={() => copy(ssid, 'ssid')} className="ml-auto p-2.5 rounded-xl hover:bg-white/10 text-slate-300 cursor-pointer" aria-label={t.copyBtn || 'Copy'}>
                <CopyIcon k="ssid" />
              </button>
            </div>
            {password && (
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{fieldLabel(t, 'fieldPassword')}</p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 min-w-0 text-lg font-mono text-white break-all bg-black/30 rounded-xl px-3.5 py-2.5">
                    {reveal ? password : '•'.repeat(Math.min(12, password.length))}
                  </p>
                  <button
                    onClick={() => setReveal(v => !v)}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 cursor-pointer"
                    aria-label={reveal ? t.hideBtn || 'Hide' : t.showBtn || 'Show'}
                  >
                    {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {password && (
              <button onClick={() => copy(password, 'pass')} className={primary}>
                <CopyIcon k="pass" />
                {t.copyPasswordBtn || 'Copy password'}
              </button>
            )}
            <button onClick={() => setShowWifiQr(v => !v)} className={secondary}>
              <QrCode className="w-4 h-4" />
              {t.shareWifiBtn || 'Show QR to share'}
            </button>
          </div>
          {showWifiQr && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-2 text-center">
              <WifiQr data={payload.raw} label={`${t.kindWifi || 'WiFi'}: ${ssid}`} />
              <p className="text-xs text-slate-400 leading-snug">{t.shareWifiHint || 'Another phone can join the network by scanning this code with its camera.'}</p>
            </div>
          )}
          <p className="text-xs text-slate-500 leading-snug">{t.wifiJoinHint || 'Browsers cannot join a WiFi network for you: copy the password and paste it in your WiFi settings.'}</p>
        </div>
      )}

      {/* ------------------------------------------------ product / book */}
      {(k === 'product' || k === 'isbn') && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-300 shrink-0">
              {k === 'isbn' ? <BookOpen className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
            </span>
            <p className="text-2xl font-black font-mono text-white tracking-wider break-all">{code}</p>
            <button onClick={() => copy(code, 'code')} className="ml-auto p-2.5 rounded-xl hover:bg-white/10 text-slate-300 cursor-pointer" aria-label={t.copyBtn || 'Copy'}>
              <CopyIcon k="code" />
            </button>
          </div>
          {badCheck && (
            <p className="text-xs text-amber-300 font-bold">{t.badCheckDigit || 'The check digit does not match: the number may have been misread. Scan it again.'}</p>
          )}
          <div className="flex flex-wrap gap-2.5">
            {(k === 'isbn' ? bookLinks(code) : productLinks(code)).map((link, i) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer nofollow" className={i === 0 ? primary : secondary}>
                <Search className="w-4 h-4" />
                {(t.searchOnBtn || 'Search on {site}').replace('{site}', link.label)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------- plain text */}
      {k === 'text' && (
        <div className="space-y-3">
          <p className="text-base text-white whitespace-pre-wrap break-words bg-black/30 border border-white/5 rounded-2xl px-4 py-3.5 max-h-72 overflow-auto leading-relaxed">
            {payload.raw}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={() => copy(payload.raw, 'text')} className={primary}>
              <CopyIcon k="text" />
              {t.copyTextBtn || 'Copy text'}
            </button>
            <a href={webSearchUrl(payload.raw.slice(0, 300))} target="_blank" rel="noopener noreferrer nofollow" className={secondary}>
              <Search className="w-4 h-4" />
              {t.searchWebBtn || 'Search the web'}
            </a>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ field list */}
      {listed.length > 0 && (
        <div className="space-y-2">
          {listed.map((f, i) => {
            if (f.key === 'fieldCheck') return null;
            const hidden = f.secret && !reveal;
            const key = `${f.key}-${i}`;
            return (
              <div key={key} className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-3.5 py-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 w-24 shrink-0 pt-0.5">{fieldLabel(t, f.key)}</span>
                <span className={`flex-1 min-w-0 text-sm text-slate-100 break-words whitespace-pre-wrap ${f.mono ? 'font-mono' : 'font-medium'}`}>
                  {hidden ? '••••••••' : f.value === 'yes' ? t.yes || 'Yes' : f.value}
                </span>
                <button onClick={() => copy(f.value, key)} aria-label={t.copyBtn || 'Copy'} className="text-slate-500 hover:text-white p-1 cursor-pointer shrink-0">
                  <CopyIcon k={key} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------- per-kind actions */}
      {(isContact || k === 'event' || k === 'geo' || k === 'tel' || k === 'sms' || k === 'email') && (
        <div className="flex flex-wrap gap-2.5">
          {isContact && (
            <button onClick={() => downloadText(contactAsVCard(payload), 'contact.vcf', 'text/vcard;charset=utf-8')} className={primary}>
              <Download className="w-4 h-4" />
              {t.saveContactBtn || 'Save contact'}
            </button>
          )}
          {k === 'event' && (
            <button onClick={() => downloadText(eventAsIcs(payload), 'event.ics', 'text/calendar;charset=utf-8')} className={primary}>
              <Calendar className="w-4 h-4" />
              {t.addCalendarBtn || 'Add to calendar'}
            </button>
          )}
          {k === 'geo' && mapsUrl(payload) && (
            <a href={mapsUrl(payload)!} target="_blank" rel="noopener noreferrer nofollow" className={primary}>
              <MapPin className="w-4 h-4" />
              {t.openMapBtn || 'Open in maps'}
            </a>
          )}
          {(k === 'tel' || isContact) && telHref(payload) && (
            <a href={telHref(payload)!} className={k === 'tel' ? primary : secondary}>
              <Phone className="w-4 h-4" />
              {t.callBtn || 'Call'}
            </a>
          )}
          {k === 'sms' && smsHref(payload) && (
            <a href={smsHref(payload)!} className={primary}>
              <MessageSquare className="w-4 h-4" />
              {t.sendSmsBtn || 'Write the SMS'}
            </a>
          )}
          {(k === 'email' || isContact) && mailHref(payload) && (
            <a href={mailHref(payload)!} className={k === 'email' ? primary : secondary}>
              <Mail className="w-4 h-4" />
              {t.writeEmailBtn || 'Write the email'}
            </a>
          )}
        </div>
      )}

      {/* ------------------------------------------------------- raw */}
      <details className="group rounded-2xl border border-white/5 bg-black/20">
        <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none text-xs font-black uppercase tracking-widest text-slate-500 [&::-webkit-details-marker]:hidden">
          {t.rawLabel || 'Raw content'}
          <span className="text-cyan-400 text-lg leading-none transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="px-4 pb-4 space-y-2">
          <pre className="text-xs text-slate-300 font-mono bg-black/30 rounded-xl px-3.5 py-3 max-h-56 overflow-auto whitespace-pre-wrap break-all">{payload.raw}</pre>
          <div className="flex gap-2">
            <button onClick={() => copy(payload.raw, 'raw')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer">
              <CopyIcon k="raw" />
              {t.copyBtn || 'Copy'}
            </button>
            {canShare() && (
              <button onClick={() => shareText(payload.href || payload.raw)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 cursor-pointer">
                <Share2 className="w-4 h-4" />
                {t.shareBtn || 'Share'}
              </button>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
