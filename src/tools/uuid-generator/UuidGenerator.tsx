import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import {
  Fingerprint, Copy, Check, Download, RotateCcw, RefreshCw, Hash
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface UuidGeneratorProps {
  lang: string;
  dictionary: any;
}

const DNS_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const parseUuidToBytes = (uuid: string): Uint8Array => {
  const hex = uuid.replace(/-/g, '').replace(/[^a-fA-F0-9]/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16 && i * 2 + 1 < hex.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16) || 0;
  }
  return bytes;
};

const formatUuidFromBytes = (bytes: Uint8Array): string => {
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
};

const generateV5Uuid = async (namespace: string, name: string): Promise<string> => {
  const nsBytes = parseUuidToBytes(namespace);
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array(nsBytes.length + nameBytes.length);
  data.set(nsBytes, 0);
  data.set(nameBytes, nsBytes.length);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashBytes = new Uint8Array(hashBuffer);
  hashBytes[6] = (hashBytes[6] & 0x0f) | 0x50;
  hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80;
  return formatUuidFromBytes(hashBytes.slice(0, 16));
};

const isV5NamespaceValid = (ns: string): boolean =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ns.trim());

export default function UuidGenerator({ lang, dictionary }: UuidGeneratorProps) {
  const t = dictionary || {};

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [uuids, setUuids] = useState<string[]>([]);
  const [version, setVersion] = useState<'v4' | 'v5'>('v4');
  const [count, setCount] = useState<number>(10);
  const [namespace, setNamespace] = useState<string>(DNS_NAMESPACE);
  const [name, setName] = useState<string>('example.com');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const generateBatch = useCallback(async () => {
    const safeCount = Math.max(1, Math.min(500, count));
    if (version === 'v4') {
      const batch: string[] = [];
      for (let i = 0; i < safeCount; i++) {
        batch.push(crypto.randomUUID());
      }
      setUuids(batch);
    } else {
      const ns = namespace.trim() || DNS_NAMESPACE;
      const baseName = name || 'unnamed';
      const batch = await Promise.all(
        Array.from({ length: safeCount }, (_, i) => generateV5Uuid(ns, `${baseName}-${i}`))
      );
      setUuids(batch);
    }
  }, [version, count, namespace, name]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (version === 'v5' && !isV5NamespaceValid(namespace)) {
        setUuids([]);
        return;
      }
      const safeCount = Math.max(1, Math.min(500, count));
      if (version === 'v4') {
        const batch: string[] = [];
        for (let i = 0; i < safeCount; i++) {
          batch.push(crypto.randomUUID());
        }
        if (!cancelled) setUuids(batch);
      } else {
        const ns = namespace.trim() || DNS_NAMESPACE;
        const baseName = name || 'unnamed';
        const batch = await Promise.all(
          Array.from({ length: safeCount }, (_, i) => generateV5Uuid(ns, `${baseName}-${i}`))
        );
        if (!cancelled) setUuids(batch);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [version, count, namespace, name]);

  const handleCopyOne = useCallback((index: number) => {
    const uuid = uuids[index];
    if (!uuid) return;
    navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  }, [uuids]);

  const handleCopyAll = useCallback(() => {
    if (uuids.length === 0) return;
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [uuids]);

  const handleDownload = useCallback(() => {
    if (uuids.length === 0) return;
    const content = uuids.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uuids-${version}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [uuids, version]);

  const resetWorkspace = useCallback(() => {
    setVersion('v4');
    setCount(10);
    setNamespace(DNS_NAMESPACE);
    setName('example.com');
    setCopiedIndex(null);
    setCopiedAll(false);
  }, []);

  const namespaceValid = isV5NamespaceValid(namespace);
  const showGrid = version === 'v4' || (version === 'v5' && namespaceValid);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/uuid-generator`}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-uuid-generator-top" />

        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-violet-400" />
            <span>{t.seoHeroTitle || 'UUID Generator'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl p-5 md:p-6 shadow-2xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {t.label_version || 'Version'}
              </span>
              <div className="flex bg-[#160a14] p-1.5 rounded-2xl border border-white/5">
                <button
                  onClick={() => setVersion('v4')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center gap-2 ${
                    version === 'v4' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.option_v4 || 'v4 Random'}</span>
                </button>
                <button
                  onClick={() => setVersion('v5')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center gap-2 ${
                    version === 'v5' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>{t.option_v5 || 'v5 Named'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {t.label_count || 'Count'}
                </span>
                <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-md border border-violet-500/20">
                  {count}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full h-2 bg-[#160a14] rounded-full appearance-none cursor-pointer accent-violet-500 outline-none"
                style={{
                  background: `linear-gradient(to right, #7c3aed ${((count - 1) / 499) * 100}%, #160a14 ${((count - 1) / 499) * 100}%)`
                }}
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>1</span>
                <span>250</span>
                <span>500</span>
              </div>
            </div>
          </div>

          {version === 'v5' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-violet-400" />
                  {t.label_namespace || 'Namespace UUID'}
                </span>
                <input
                  type="text"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  placeholder={DNS_NAMESPACE}
                  className={`w-full px-4 py-2.5 rounded-xl bg-[#160a14] font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none border transition-all ${
                    namespaceValid
                      ? 'border-white/10 focus:border-violet-500/50'
                      : 'border-red-500/40 focus:border-red-500/60'
                  }`}
                  spellCheck={false}
                />
                {!namespaceValid && (
                  <span className="text-[10px] text-red-400 font-medium">
                    {t.error_invalid_namespace || 'Enter a valid UUID (e.g. 6ba7b810-9dad-11d1-80b4-00c04fd430c8)'}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  {t.label_name || 'Name'}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#160a14] font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none border border-white/10 focus:border-violet-500/50 transition-all"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Fingerprint className="w-3.5 h-3.5 text-violet-400" />
              <span>
                {uuids.length > 0
                  ? `${uuids.length} ${t.label_uuids_generated || 'UUIDs generated'}`
                  : (t.label_no_uuids || 'No UUIDs yet')}
              </span>
            </div>
            <button
              onClick={generateBatch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/15 border border-violet-600/30 text-violet-300 text-xs font-black hover:bg-violet-600/25 transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_regenerate || 'Regenerate'}
            </button>
          </div>
        </div>

        {showGrid ? (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
            }}
          >
            {uuids.map((uuid, index) => (
              <div
                key={`${version}-${index}-${uuid}`}
                className="group relative bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-2xl p-4 shadow-xl hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                    #{(index + 1).toString().padStart(3, '0')}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-violet-400/70 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20 uppercase">
                    {version}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-[11px] md:text-xs font-mono text-slate-200 break-all leading-relaxed flex-1">
                    {uuid}
                  </code>
                  <button
                    onClick={() => handleCopyOne(index)}
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border ${
                      copiedIndex === index
                        ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                        : 'bg-white/5 border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-400 hover:text-white'
                    }`}
                    title={t.tooltip_copy || 'Copy'}
                  >
                    {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-red-500/20 backdrop-blur-2xl rounded-3xl p-8 text-center">
            <p className="text-sm text-red-400/80">
              {t.error_fix_namespace || 'Fix the namespace UUID to generate v5 UUIDs'}
            </p>
          </div>
        )}

        {uuids.length > 0 && showGrid && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleCopyAll}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none border ${
                copiedAll
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                  : 'bg-violet-600/15 border-violet-600/30 text-violet-300 hover:bg-violet-600/25'
              }`}
            >
              {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedAll ? (t.button_copied_all || 'Copied All!') : (t.button_copy_all || 'Copy All')}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer outline-none"
            >
              <Download className="w-4 h-4" />
              {t.button_download || 'Download .txt'}
            </button>
            <button
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_reset || 'Reset'}
            </button>
          </div>
        )}
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-uuid-generator-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(modal) => setActiveModal(modal)}
      />

      <LegalModal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={activeModal === 'cookies'}
        onClose={() => setActiveModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}
