import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import {
  ShieldCheck, Copy, Check, Download, RotateCcw, Eye, Code,
  AlertCircle, Trash2, FileCode
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface HtmlSanitizerProps {
  lang: string;
  dictionary: any;
}

interface SanitizeOptions {
  removeScript: boolean;
  removeStyle: boolean;
  removeEventHandlers: boolean;
  removeComments: boolean;
  removeIframe: boolean;
  removeObjectEmbed: boolean;
  removeClass: boolean;
  removeStyleAttr: boolean;
  whitelistMode: boolean;
}

const SAFE_TAGS = new Set<string>([
  'p', 'div', 'span', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'br', 'strong', 'em', 'img',
  'table', 'tr', 'td', 'th', 'tbody', 'thead',
  'blockquote', 'pre', 'code',
]);

const DEFAULT_OPTIONS: SanitizeOptions = {
  removeScript: true,
  removeStyle: true,
  removeEventHandlers: true,
  removeComments: true,
  removeIframe: true,
  removeObjectEmbed: true,
  removeClass: false,
  removeStyleAttr: false,
  whitelistMode: false,
};

const OPTION_LIST: { key: keyof SanitizeOptions; labelKey: string; defaultLabel: string }[] = [
  { key: 'removeScript', labelKey: 'opt_remove_script', defaultLabel: 'Remove <script> tags' },
  { key: 'removeStyle', labelKey: 'opt_remove_style', defaultLabel: 'Remove <style> tags' },
  { key: 'removeEventHandlers', labelKey: 'opt_remove_events', defaultLabel: 'Remove inline event handlers (onclick, onload, etc.)' },
  { key: 'removeComments', labelKey: 'opt_remove_comments', defaultLabel: 'Remove HTML comments' },
  { key: 'removeIframe', labelKey: 'opt_remove_iframe', defaultLabel: 'Remove <iframe> tags' },
  { key: 'removeObjectEmbed', labelKey: 'opt_remove_object', defaultLabel: 'Remove <object>/<embed> tags' },
  { key: 'removeClass', labelKey: 'opt_remove_class', defaultLabel: 'Remove class attributes' },
  { key: 'removeStyleAttr', labelKey: 'opt_remove_style_attr', defaultLabel: 'Remove style attributes' },
  { key: 'whitelistMode', labelKey: 'opt_whitelist', defaultLabel: 'Allow only safe tags (whitelist mode)' },
];

const sanitizeHtml = (html: string, opts: SanitizeOptions): string => {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (opts.removeComments) {
      const walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_COMMENT, null);
      const comments: Comment[] = [];
      while (walker.nextNode()) comments.push(walker.currentNode as Comment);
      comments.forEach((c) => c.parentNode?.removeChild(c));
    }

    if (opts.removeScript) doc.querySelectorAll('script').forEach((el) => el.remove());
    if (opts.removeStyle) doc.querySelectorAll('style').forEach((el) => el.remove());
    if (opts.removeIframe) doc.querySelectorAll('iframe').forEach((el) => el.remove());
    if (opts.removeObjectEmbed) doc.querySelectorAll('object,embed').forEach((el) => el.remove());

    if (opts.removeEventHandlers || opts.removeClass || opts.removeStyleAttr) {
      doc.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (opts.removeEventHandlers && name.startsWith('on')) {
            el.removeAttribute(attr.name);
          } else if (opts.removeClass && name === 'class') {
            el.removeAttribute(attr.name);
          } else if (opts.removeStyleAttr && name === 'style') {
            el.removeAttribute(attr.name);
          }
        });
      });
    }

    if (opts.whitelistMode) {
      const toRemove: Element[] = [];
      doc.body.querySelectorAll('*').forEach((el) => {
        if (!SAFE_TAGS.has(el.tagName.toLowerCase())) toRemove.push(el);
      });
      toRemove.forEach((el) => {
        const parent = el.parentNode;
        if (!parent) return;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      });
    }

    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

export default function HtmlSanitizer({ lang, dictionary }: HtmlSanitizerProps) {
  const t = dictionary || {};
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [options, setOptions] = useState<SanitizeOptions>(DEFAULT_OPTIONS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOutput(sanitizeHtml(input, options));
  }, [input, options]);

  const toggleOption = useCallback((key: keyof SanitizeOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanitized-${Date.now()}.html`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [output]);

  const resetWorkspace = useCallback(() => {
    setInput('');
    setOutput('');
    setOptions(DEFAULT_OPTIONS);
    setCopied(false);
  }, []);

  const clearInput = useCallback(() => {
    setInput('');
  }, []);

  const inputBytes = useMemo(() => (input ? new Blob([input]).size : 0), [input]);
  const outputBytes = useMemo(() => (output ? new Blob([output]).size : 0), [output]);
  const reduction = inputBytes > 0 ? Math.max(0, Math.round(((inputBytes - outputBytes) / inputBytes) * 100)) : 0;
  const removedTags = input && output ? Math.max(0, (input.match(/<[a-zA-Z]/g)?.length || 0) - (output.match(/<[a-zA-Z]/g)?.length || 0)) : 0;

  const previewDoc = useMemo(() => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,system-ui,sans-serif;color:#0f172a;background:#fff;padding:16px;margin:0;line-height:1.6;font-size:14px} img{max-width:100%;height:auto} a{color:#0891b2;text-decoration:underline} table{border-collapse:collapse} td,th{border:1px solid #e2e8f0;padding:6px 10px} pre{background:#f1f5f9;padding:12px;border-radius:8px;overflow:auto} code{background:#f1f5f9;padding:2px 5px;border-radius:4px;font-family:monospace} pre code{background:transparent;padding:0} blockquote{border-left:3px solid #0891b2;margin:0;padding-left:12px;color:#475569} h1,h2,h3,h4,h5,h6{margin:0.6em 0 0.3em;line-height:1.25}</style></head><body>${output}</body></html>`;
  }, [output]);

  return (
    <div className="min-h-screen flex flex-col bg-[#04080a] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/html-sanitizer`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-html-sanitizer-top" />

        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
            <span>{t.seoHeroTitle || 'HTML-Sanitizer'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText || 'Clean and sanitize HTML code by removing unwanted tags, scripts and styles 100% locally in your browser.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          <section className="lg:col-span-3 flex flex-col gap-4">
            <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-cyan-950/30">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  {t.label_input || 'Raw HTML Input'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-600 font-mono">{inputBytes} bytes</span>
                  {input && (
                    <button
                      onClick={clearInput}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border bg-white/5 border-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-red-400"
                      title={t.button_clear || 'Clear'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder_input || 'Paste your raw HTML here... <script>, <iframe>, onclick and more will be cleaned automatically based on your options below.'}
                className="w-full h-72 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none resize-none scrollbar-thin"
                spellCheck={false}
              />
            </div>

            <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  {t.label_options || 'Sanitization Options'}
                </span>
                <button
                  onClick={() => setOptions(DEFAULT_OPTIONS)}
                  className="text-[10px] text-slate-500 hover:text-cyan-400 font-bold uppercase tracking-wider transition-colors cursor-pointer outline-none flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t.button_reset_options || 'Defaults'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {OPTION_LIST.map((opt) => {
                  const active = options[opt.key];
                  return (
                    <button
                      key={opt.key}
                      onClick={() => toggleOption(opt.key)}
                      className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer outline-none ${
                        active
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition-all ${
                          active ? 'bg-cyan-500 border-cyan-400' : 'border-white/20'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="leading-snug">{t[opt.labelKey] || opt.defaultLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-cyan-950/30">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  {t.label_preview || 'Live Preview'}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {output ? `${outputBytes} bytes` : ''}
                </span>
              </div>
              <div className="bg-white h-72 w-full">
                {output ? (
                  <iframe
                    title="sanitized-preview"
                    srcDoc={previewDoc}
                    sandbox=""
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950">
                    <span className="text-slate-600 text-xs">{t.placeholder_preview || 'Sanitized preview will render here...'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-cyan-950/30">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  {t.label_source || 'Cleaned HTML Source'}
                </span>
                <span className="text-[10px] text-slate-600 font-mono">
                  {output ? `${output.length} chars` : ''}
                </span>
              </div>
              <pre className="w-full h-56 p-4 overflow-auto font-mono text-xs text-cyan-200/90 bg-black/40 scrollbar-thin whitespace-pre-wrap break-all">
                {output || <span className="text-slate-600">{t.placeholder_source || 'Cleaned HTML source will appear here...'}</span>}
              </pre>
            </div>
          </section>
        </div>

        <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-slate-300">
                {inputBytes} <span className="text-slate-500">bytes</span> <span className="text-cyan-400">â†’</span> {outputBytes} <span className="text-slate-500">bytes</span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-slate-300">
                {reduction}% <span className="text-slate-500">{t.label_reduction || 'reduction'}</span>
              </span>
            </div>
            {removedTags > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                <Trash2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-slate-300">
                  {removedTags} <span className="text-slate-500">{t.label_tags_removed || 'tags removed'}</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none border disabled:opacity-30 disabled:cursor-not-allowed ${
                copied
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-cyan-600/10 border-cyan-600/30 text-cyan-400 hover:bg-cyan-600/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? (t.button_copied || 'Copied!') : (t.button_copy || 'Copy HTML')}
            </button>
            <button
              onClick={handleDownload}
              disabled={!output}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600/10 border border-cyan-600/30 text-cyan-400 text-xs font-black hover:bg-cyan-600/20 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {t.button_download || 'Download'}
            </button>
            <button
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_reset || 'Reset'}
            </button>
          </div>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-html-sanitizer-bottom" />
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
