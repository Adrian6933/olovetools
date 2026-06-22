import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  Link, Copy, Check, RotateCcw, ArrowRight, ArrowLeft,
  Globe, Code, Unlink, AlertCircle, Zap, Eye, Search,
  Key, Server, Route, Hash, FileCode, Layers
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface UrlBoltProps {
  lang: string;
  dictionary: any;
}

type Mode = 'encode' | 'decode' | 'parse';

interface UrlPart {
  label: string;
  value: string;
  decoded?: string;
  icon: React.ReactNode;
  color: string;
}

export default function UrlBolt({ lang, dictionary }: UrlBoltProps) {
  const t = dictionary || {};

  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState<string>('');
  const [encodeType, setEncodeType] = useState<'component' | 'uri'>('component');
  const [copied, setCopied] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const output = useMemo(() => {
    if (!input) return '';
    try {
      if (mode === 'encode') {
        return encodeType === 'component'
          ? encodeURIComponent(input)
          : encodeURI(input);
      } else if (mode === 'decode') {
        return encodeType === 'component'
          ? decodeURIComponent(input)
          : decodeURI(input);
      }
      return '';
    } catch (err) {
      return '';
    }
  }, [input, mode, encodeType]);

  const urlParts = useMemo<UrlPart[]>(() => {
    if (mode !== 'parse' || !input) return [];

    let urlToParse = input.trim();
    if (!urlToParse) return [];

    if (!urlToParse.match(/^https?:\/\//i) && !urlToParse.match(/^ftp:\/\//i)) {
      urlToParse = 'https://' + urlToParse;
    }

    try {
      const url = new URL(urlToParse);
      const parts: UrlPart[] = [];

      parts.push({
        label: t.label_protocol || 'Protocol',
        value: url.protocol.replace(':', ''),
        icon: <Zap className="w-4 h-4" />,
        color: 'text-amber-400 border-amber-500/30 bg-amber-500/5'
      });

      parts.push({
        label: t.label_host || 'Host',
        value: url.hostname,
        icon: <Server className="w-4 h-4" />,
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
      });

      if (url.port) {
        parts.push({
          label: t.label_port || 'Port',
          value: url.port,
          icon: <Layers className="w-4 h-4" />,
          color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5'
        });
      }

      if (url.pathname && url.pathname !== '/') {
        parts.push({
          label: t.label_path || 'Path',
          value: url.pathname,
          decoded: decodeURIComponent(url.pathname),
          icon: <Route className="w-4 h-4" />,
          color: 'text-violet-400 border-violet-500/30 bg-violet-500/5'
        });
      }

      if (url.search) {
        parts.push({
          label: t.label_query || 'Query String',
          value: url.search,
          decoded: decodeURIComponent(url.search),
          icon: <Search className="w-4 h-4" />,
          color: 'text-sky-400 border-sky-500/30 bg-sky-500/5'
        });
      }

      if (url.hash) {
        parts.push({
          label: t.label_hash || 'Fragment',
          value: url.hash,
          decoded: decodeURIComponent(url.hash),
          icon: <Hash className="w-4 h-4" />,
          color: 'text-pink-400 border-pink-500/30 bg-pink-500/5'
        });
      }

      return parts;
    } catch (err) {
      return [];
    }
  }, [input, mode, t]);

  useEffect(() => {
    if (mode !== 'parse' || !input) {
      setParseError('');
      return;
    }
    let urlToParse = input.trim();
    if (!urlToParse) {
      setParseError('');
      return;
    }
    if (!urlToParse.match(/^https?:\/\//i) && !urlToParse.match(/^ftp:\/\//i)) {
      urlToParse = 'https://' + urlToParse;
    }
    try {
      new URL(urlToParse);
      setParseError('');
    } catch {
      setParseError(t.parse_error || 'Invalid URL format');
    }
  }, [input, mode, t]);

  const queryParams = useMemo<{ key: string; value: string; decoded: string }[]>(() => {
    if (mode !== 'parse' || !input) return [];
    let urlToParse = input.trim();
    if (!urlToParse.match(/^https?:\/\//i)) {
      urlToParse = 'https://' + urlToParse;
    }
    try {
      const url = new URL(urlToParse);
      const params: { key: string; value: string; decoded: string }[] = [];
      url.searchParams.forEach((value, key) => {
        params.push({ key, value, decoded: decodeURIComponent(value) });
      });
      return params;
    } catch {
      return [];
    }
  }, [input, mode]);

  const pathSegments = useMemo<string[]>(() => {
    if (mode !== 'parse' || !input) return [];
    let urlToParse = input.trim();
    if (!urlToParse.match(/^https?:\/\//i)) {
      urlToParse = 'https://' + urlToParse;
    }
    try {
      const url = new URL(urlToParse);
      return url.pathname.split('/').filter(s => s.length > 0).map(s => decodeURIComponent(s));
    } catch {
      return [];
    }
  }, [input, mode]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleSwap = useCallback(() => {
    if (mode === 'encode') {
      setMode('decode');
      setInput(output);
    } else if (mode === 'decode') {
      setMode('encode');
      setInput(output);
    }
  }, [mode, output]);

  const resetWorkspace = useCallback(() => {
    setInput('');
    setMode('encode');
    setEncodeType('component');
    setCopied(false);
    setParseError('');
  }, []);

  const charCount = input.length;
  const outputCharCount = output.length;
  const isOutputDifferent = input !== output;

  return (
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/url-bolt`}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">

        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Link className="w-8 h-8 text-emerald-400" />
            <span>{t.seoHeroTitle || 'URL Encoder, Decoder & Parser'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          <div className="flex bg-[#04130e] p-1.5 rounded-2xl border border-white/5 self-start">
            <button
              onClick={() => { setMode('encode'); setInput(''); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
                mode === 'encode' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>{t.tab_encode || 'Encode'}</span>
            </button>
            <button
              onClick={() => { setMode('decode'); setInput(''); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
                mode === 'decode' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Unlink className="w-4 h-4" />
              <span>{t.tab_decode || 'Decode'}</span>
            </button>
            <button
              onClick={() => { setMode('parse'); setInput(''); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
                mode === 'parse' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>{t.tab_parse || 'Parse URL'}</span>
            </button>
          </div>

          {mode !== 'parse' && (
            <div className="flex items-center gap-2 bg-[#04130e] px-4 py-2 rounded-2xl border border-white/5 self-start lg:self-center">
              <span className="text-xs font-bold text-slate-500">{t.label_encoding_mode || 'Mode'}:</span>
              <button
                onClick={() => setEncodeType('component')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer outline-none ${
                  encodeType === 'component' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-white border border-transparent'
                }`}
              >
                encodeURIComponent
              </button>
              <button
                onClick={() => setEncodeType('uri')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer outline-none ${
                  encodeType === 'uri' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:text-white border border-transparent'
                }`}
              >
                encodeURI
              </button>
            </div>
          )}
        </div>

        {mode !== 'parse' ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#04130e]/50">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    {mode === 'encode' ? (t.label_input || 'Input') : (t.label_encoded_input || 'Encoded Input')}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">{charCount} chars</span>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'encode'
                    ? (t.placeholder_encode || 'Type or paste text to encode...')
                    : (t.placeholder_decode || 'Paste an encoded URL or text to decode...')}
                  className="w-full h-64 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none resize-none scrollbar-thin"
                  spellCheck={false}
                />
              </div>

              <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#04130e]/50">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                    {mode === 'encode' ? (t.label_output || 'Encoded Output') : (t.label_decoded_output || 'Decoded Output')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-mono">{outputCharCount} chars</span>
                    {output && (
                      <button
                        onClick={handleCopy}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border ${
                          copied
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : 'bg-white/5 border-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-slate-400 hover:text-white'
                        }`}
                        title={t.tooltip_copy || 'Copy'}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full h-64 p-5 overflow-auto font-mono text-sm break-all text-slate-200 scrollbar-thin">
                  {output || <span className="text-slate-600">{t.placeholder_output || 'Result will appear here...'}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleSwap}
                disabled={!output}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 text-xs font-black hover:bg-emerald-600/20 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                {t.button_swap || 'Swap & Reverse'}
              </button>
              <button
                onClick={resetWorkspace}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer outline-none"
              >
                <RotateCcw className="w-4 h-4" />
                {t.button_clear || 'Clear All'}
              </button>
              {isOutputDifferent && output && (
                <span className="text-[10px] text-emerald-500/60 font-mono bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-lg">
                  {mode === 'encode' ? '+' : '-'}{Math.abs(outputCharCount - charCount)} chars
                </span>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#04130e]/50">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  {t.label_url_input || 'URL to Parse'}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">{charCount} chars</span>
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder_parse || 'Paste any URL here, e.g. https://olovetools.com/es/tools?sort=asc&page=2#section'}
                className="w-full p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none"
                spellCheck={false}
              />
            </div>

            {parseError && (
              <div className="bg-red-500/10 border border-red-500/20 px-5 py-4 rounded-2xl flex items-center space-x-3 text-red-400 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {urlParts.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-emerald-400" />
                    {t.label_anatomy || 'URL Anatomy'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {urlParts.map((part, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border ${part.color} space-y-2`}
                      >
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider opacity-80">
                          {part.icon}
                          <span>{part.label}</span>
                        </div>
                        <div className="font-mono text-sm text-white break-all">
                          {part.value}
                        </div>
                        {part.decoded && part.decoded !== part.value && (
                          <div className="text-[11px] text-slate-400 font-mono break-all border-t border-white/5 pt-2">
                            <span className="text-slate-500">{t.label_decoded || 'Decoded'}: </span>
                            {part.decoded}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {pathSegments.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl p-6 space-y-4">
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Route className="w-4 h-4 text-violet-400" />
                      {t.label_path_segments || 'Path Segments'}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-600 font-mono">/</span>
                      {pathSegments.map((seg, i) => (
                        <React.Fragment key={i}>
                          <span className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-xs font-bold">
                            {seg}
                          </span>
                          {i < pathSegments.length - 1 && (
                            <span className="text-xs text-slate-600 font-mono">/</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {queryParams.length > 0 && (
                  <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <Key className="w-4 h-4 text-sky-400" />
                        {t.label_query_params || 'Query Parameters'}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-mono">{queryParams.length} {t.label_params || 'params'}</span>
                    </div>
                    <div className="space-y-2">
                      {queryParams.map((param, i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 p-3 rounded-xl bg-sky-500/5 border border-sky-500/10">
                          <div className="flex items-center gap-2 md:w-1/3">
                            <span className="text-[10px] font-black text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded font-mono">
                              {t.label_key || 'KEY'}
                            </span>
                            <span className="font-mono text-sm text-sky-300 break-all">{param.key}</span>
                          </div>
                          <div className="flex items-center gap-2 md:w-2/3">
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                              {t.label_value || 'VALUE'}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-mono text-sm text-emerald-300 break-all">{param.value}</span>
                              {param.decoded !== param.value && (
                                <span className="text-[10px] text-slate-500 font-mono break-all">
                                  {t.label_decoded || 'Decoded'}: {param.decoded}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!input && !parseError && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-emerald-500/50" />
                </div>
                <p className="text-slate-500 text-sm max-w-md">
                  {t.placeholder_parse_empty || 'Paste a URL above to see its full anatomy breakdown — protocol, host, path segments, and query parameters with decoded values.'}
                </p>
              </div>
            )}
          </>
        )}

      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(modal) => setLegalModal(modal)}
      />

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
