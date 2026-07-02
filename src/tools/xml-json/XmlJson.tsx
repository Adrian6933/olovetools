import React, { useState, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { FileCode, Copy, Check, RotateCcw, ArrowRight, ArrowLeft, AlertCircle, Braces } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface XmlJsonProps {
  lang: string;
  dictionary: any;
}

type TabKey = 'xml-to-json' | 'json-to-xml';

interface ConversionStats {
  elements: number;
  depth: number;
  size: number;
}

interface ConversionResult {
  output: string;
  error: string | null;
  stats: ConversionStats;
}

const EMPTY_STATS: ConversionStats = { elements: 0, depth: 0, size: 0 };

const DEFAULT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="fiction">
    <title lang="en">The Great Gatsby</title>
    <author>F. Scott Fitzgerald</author>
    <year>1925</year>
    <price currency="USD">12.99</price>
  </book>
  <book category="poetry">
    <title lang="en">Leaves of Grass</title>
    <author>Walt Whitman</author>
    <year>1855</year>
    <price currency="USD">9.50</price>
  </book>
</bookstore>`;

const DEFAULT_JSON = `{
  "bookstore": {
    "book": [
      {
        "@category": "fiction",
        "title": {
          "@lang": "en",
          "#text": "The Great Gatsby"
        },
        "author": "F. Scott Fitzgerald",
        "year": "1925",
        "price": {
          "@currency": "USD",
          "#text": "12.99"
        }
      },
      {
        "@category": "poetry",
        "title": {
          "@lang": "en",
          "#text": "Leaves of Grass"
        },
        "author": "Walt Whitman",
        "year": "1855",
        "price": {
          "@currency": "USD",
          "#text": "9.50"
        }
      }
    ]
  }
}`;

const escapeXml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const countBytes = (value: string): number => new Blob([value]).size;

const convertXmlToJson = (xml: string): ConversionResult => {
  if (!xml.trim()) {
    return { output: '', error: null, stats: EMPTY_STATS };
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      const message = errorNode.textContent?.trim().split('\n')[0] || 'Invalid XML';
      return { output: '', error: message, stats: EMPTY_STATS };
    }
    if (!doc.documentElement) {
      return { output: '', error: 'No root element found', stats: EMPTY_STATS };
    }

    let elementCount = 0;
    let maxDepth = 0;

    const build = (node: Element, depth: number): any => {
      elementCount += 1;
      if (depth > maxDepth) maxDepth = depth;

      const obj: any = {};

      if (node.attributes && node.attributes.length > 0) {
        for (let i = 0; i < node.attributes.length; i += 1) {
          const attr = node.attributes[i];
          obj[`@${attr.name}`] = attr.value;
        }
      }

      const childElements = Array.from(node.children);
      let directText = '';

      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.trim() || '';
          if (text) directText += text;
        }
      });

      if (childElements.length > 0) {
        childElements.forEach((child) => {
          const childObj = build(child as Element, depth + 1);
          if (Object.prototype.hasOwnProperty.call(obj, child.nodeName)) {
            if (!Array.isArray(obj[child.nodeName])) {
              obj[child.nodeName] = [obj[child.nodeName]];
            }
            obj[child.nodeName].push(childObj);
          } else {
            obj[child.nodeName] = childObj;
          }
        });
      }

      if (directText) {
        obj['#text'] = directText;
      }

      return obj;
    };

    const rootName = doc.documentElement.nodeName;
    const json = { [rootName]: build(doc.documentElement, 0) };
    const output = JSON.stringify(json, null, 2);

    return {
      output,
      error: null,
      stats: { elements: elementCount, depth: maxDepth, size: countBytes(output) },
    };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : String(e), stats: EMPTY_STATS };
  }
};

const convertJsonToXml = (json: string): ConversionResult => {
  if (!json.trim()) {
    return { output: '', error: null, stats: EMPTY_STATS };
  }
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return {
      output: '',
      error: e instanceof Error ? e.message : 'Invalid JSON',
      stats: EMPTY_STATS,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { output: '', error: 'JSON must be an object with a single root key', stats: EMPTY_STATS };
  }

  const rootKeys = Object.keys(parsed);
  if (rootKeys.length === 0) {
    return { output: '', error: 'JSON object is empty', stats: EMPTY_STATS };
  }

  let elementCount = 0;
  let maxDepth = 0;

  const build = (key: string, value: any, depth: number): string => {
    elementCount += 1;
    if (depth > maxDepth) maxDepth = depth;
    const indent = '  '.repeat(depth);

    if (value === null || value === undefined) {
      return `${indent}<${key}/>`;
    }

    if (Array.isArray(value)) {
      return value.map((item) => build(key, item, depth)).join('\n');
    }

    if (typeof value === 'object') {
      const attrs: string[] = [];
      const children: string[] = [];
      let textContent = '';

      Object.keys(value).forEach((k) => {
        if (k.startsWith('@')) {
          attrs.push(` ${k.slice(1)}="${escapeXml(String(value[k]))}"`);
        } else if (k === '#text') {
          textContent = escapeXml(String(value[k]));
        } else {
          children.push(build(k, value[k], depth + 1));
        }
      });

      const attrStr = attrs.join('');

      if (children.length === 0 && !textContent) {
        return `${indent}<${key}${attrStr}/>`;
      }
      if (children.length === 0 && textContent) {
        return `${indent}<${key}${attrStr}>${textContent}</${key}>`;
      }
      const inner = children.join('\n');
      return `${indent}<${key}${attrStr}>\n${inner}\n${indent}</${key}>`;
    }

    return `${indent}<${key}>${escapeXml(String(value))}</${key}>`;
  };

  try {
    const rootKey = rootKeys[0];
    const body = build(rootKey, parsed[rootKey], 0);
    const output = `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;

    return {
      output,
      error: null,
      stats: { elements: elementCount, depth: maxDepth, size: countBytes(output) },
    };
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : String(e), stats: EMPTY_STATS };
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function XmlJson({ lang, dictionary }: XmlJsonProps) {
  const t = dictionary || {};
  const [activeTab, setActiveTab] = useState<TabKey>('xml-to-json');
  const [xmlInput, setXmlInput] = useState<string>(DEFAULT_XML);
  const [jsonInput, setJsonInput] = useState<string>(DEFAULT_JSON);
  const [copied, setCopied] = useState<boolean>(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const xmlResult = useMemo(() => convertXmlToJson(xmlInput), [xmlInput]);
  const jsonResult = useMemo(() => convertJsonToXml(jsonInput), [jsonInput]);

  const current = activeTab === 'xml-to-json' ? xmlResult : jsonResult;
  const currentInput = activeTab === 'xml-to-json' ? xmlInput : jsonInput;
  const setCurrentInput = activeTab === 'xml-to-json' ? setXmlInput : setJsonInput;
  const inputLabel = activeTab === 'xml-to-json' ? 'XML' : 'JSON';
  const outputLabel = activeTab === 'xml-to-json' ? 'JSON' : 'XML';

  const handleCopy = useCallback(() => {
    if (!current.output) return;
    navigator.clipboard.writeText(current.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [current.output]);

  const resetWorkspace = useCallback(() => {
    if (activeTab === 'xml-to-json') {
      setXmlInput(DEFAULT_XML);
    } else {
      setJsonInput(DEFAULT_JSON);
    }
    setCopied(false);
  }, [activeTab]);

  const clearInput = useCallback(() => {
    setCurrentInput('');
    setCopied(false);
  }, [setCurrentInput]);

  const swapTab = useCallback(() => {
    if (activeTab === 'xml-to-json') {
      if (xmlResult.output) setJsonInput(xmlResult.output);
      setActiveTab('json-to-xml');
    } else {
      if (jsonResult.output) setXmlInput(jsonResult.output);
      setActiveTab('xml-to-json');
    }
    setCopied(false);
  }, [activeTab, xmlResult.output, jsonResult.output]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'xml-to-json', label: t.label_xml_to_json || 'XML \u2192 JSON' },
    { key: 'json-to-xml', label: t.label_json_to_xml || 'JSON \u2192 XML' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/xml-json`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-xml-json-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <FileCode className="w-8 h-8 text-teal-400" />
            <span>{t.seoHeroTitle || 'XML \u2194 JSON Converter'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText ||
              'Convert between XML and JSON formats instantly, right in your browser. 100% local, no uploads.'}
          </p>
        </div>

        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-3 md:px-5 pt-3 gap-2">
            <div className="flex gap-1 md:gap-2">
              {tabs.map((tab) => {
                const active = activeTab === tab.key;
                const Icon = tab.key === 'xml-to-json' ? FileCode : Braces;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setCopied(false);
                    }}
                    className={`flex items-center gap-2 px-3 md:px-5 py-3 rounded-t-xl text-xs md:text-sm font-bold transition-all cursor-pointer outline-none border-b-2 -mb-px ${
                      active
                        ? 'text-teal-400 border-teal-400 bg-teal-500/5'
                        : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={swapTab}
              title={t.tooltip_swap || 'Swap direction'}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-all cursor-pointer outline-none"
            >
              {activeTab === 'xml-to-json' ? (
                <ArrowRight className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              {t.button_swap || 'Swap'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
            <div className="flex flex-col bg-[#020a08] p-4 md:p-5 space-y-3 min-h-[420px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                  {activeTab === 'xml-to-json' ? <FileCode className="w-3.5 h-3.5" /> : <Braces className="w-3.5 h-3.5" />}
                  {t.label_input || 'Input'} ({inputLabel})
                </span>
                <button
                  onClick={clearInput}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-teal-400 transition-colors cursor-pointer outline-none"
                >
                  {t.button_clear || 'Clear'}
                </button>
              </div>
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                spellCheck={false}
                placeholder={
                  activeTab === 'xml-to-json'
                    ? '<?xml version="1.0"?>\n<root>\n  <item>value</item>\n</root>'
                    : '{\n  "root": {\n    "item": "value"\n  }\n}'
                }
                className="flex-grow w-full resize-none bg-slate-950/60 border border-white/5 rounded-2xl p-4 font-mono text-sm text-white placeholder-slate-600 focus:border-teal-500/40 focus:ring-0 transition-colors outline-none min-h-[340px]"
              />
            </div>

            <div className="flex flex-col bg-[#020a08] p-4 md:p-5 space-y-3 min-h-[420px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-1.5">
                  {activeTab === 'xml-to-json' ? <Braces className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                  {t.label_output || 'Output'} ({outputLabel})
                </span>
                <button
                  onClick={handleCopy}
                  disabled={!current.output}
                  title={copied ? (t.emailCopied || 'Copied!') : (t.tooltip_copy || 'Copy')}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
                    copied
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/5 border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {current.error ? (
                <div className="flex-grow flex items-start gap-3 bg-red-950/30 border border-red-500/30 rounded-2xl p-4 text-red-300 text-sm font-mono overflow-auto min-h-[340px]">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-sans font-bold text-red-400 text-xs uppercase tracking-widest">
                      {t.error_conversion || 'Conversion Error'}
                    </div>
                    <div className="break-words whitespace-pre-wrap">{current.error}</div>
                  </div>
                </div>
              ) : (
                <pre className="flex-grow w-full overflow-auto bg-slate-950/60 border border-white/5 rounded-2xl p-4 font-mono text-sm text-white whitespace-pre min-h-[340px]">
                  {current.output || <span className="text-slate-600">{'\u2014'}</span>}
                </pre>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 px-4 md:px-6 py-4 bg-slate-950/40">
            <div className="grid grid-cols-3 gap-3 md:gap-6">
              <div className="flex flex-col items-center md:items-start gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {t.stat_elements || 'Elements'}
                </span>
                <span className="text-lg md:text-2xl font-extrabold text-teal-400 font-mono tabular-nums">
                  {current.stats.elements}
                </span>
              </div>
              <div className="flex flex-col items-center md:items-start gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {t.stat_depth || 'Depth'}
                </span>
                <span className="text-lg md:text-2xl font-extrabold text-teal-400 font-mono tabular-nums">
                  {current.stats.depth}
                </span>
              </div>
              <div className="flex flex-col items-center md:items-start gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {t.stat_size || 'Size'}
                </span>
                <span className="text-lg md:text-2xl font-extrabold text-teal-400 font-mono tabular-nums">
                  {formatBytes(current.stats.size)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 px-4 md:px-6 py-4 flex justify-end">
            <button
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-300 hover:text-teal-400 text-xs font-bold transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_reset || 'Reset'}
            </button>
          </div>
        </div>

        <div className="md:hidden flex justify-center">
          <button
            onClick={swapTab}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-300 hover:text-teal-400 text-xs font-bold transition-all cursor-pointer outline-none"
          >
            {activeTab === 'xml-to-json' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t.button_swap || 'Swap'}
          </button>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-xml-json-bottom" />
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
