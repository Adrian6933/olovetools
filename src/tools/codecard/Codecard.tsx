import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  Palette, 
  Settings, 
  Download, 
  Sparkles, 
  Lock, 
  RefreshCw, 
  ArrowUp,
  FileCode,
  Sliders,
  Maximize2
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import type { Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { CodeTheme, WindowStyle, FontFamily, ShadowStyle, GradientTheme } from './types';

// Embedded premium theme CSS for Prism highlights
const PRISM_THEME_CSS: Record<CodeTheme, string> = {
  'one-dark': `
    .code-editor-pre { background: #282c34; color: #abb2bf; }
    .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #5c6370; font-style: italic; }
    .token.punctuation { color: #abb2bf; }
    .token.property, .token.tag, .token.boolean, .token.number, .token.constant, .token.symbol { color: #d19a66; }
    .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #98c379; }
    .token.operator, .token.entity, .token.url, .token.variable { color: #56b6c2; }
    .token.atrule, .token.attr-value, .token.keyword { color: #c678dd; }
    .token.function, .token.class-name { color: #61afef; }
    .token.regex, .token.important { color: #c678dd; }
  `,
  'dracula': `
    .code-editor-pre { background: #282a36; color: #f8f8f2; }
    .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6272a4; font-style: italic; }
    .token.punctuation { color: #f8f8f2; }
    .token.property, .token.tag, .token.constant, .token.symbol { color: #ff79c6; }
    .token.boolean, .token.number { color: #bd93f9; }
    .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #f1fa8c; }
    .token.operator, .token.entity, .token.url, .token.variable { color: #ff79c6; }
    .token.atrule, .token.attr-value, .token.keyword { color: #ff79c6; }
    .token.function, .token.class-name { color: #50fa7b; }
    .token.regex, .token.important { color: #f1fa8c; }
  `,
  'vs-code': `
    .code-editor-pre { background: #1e1e1e; color: #d4d4d4; }
    .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6a9955; font-style: italic; }
    .token.punctuation { color: #d4d4d4; }
    .token.property, .token.tag, .token.constant, .token.symbol { color: #9cdcfe; }
    .token.boolean, .token.number { color: #b5cea8; }
    .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #ce9178; }
    .token.operator, .token.entity, .token.url, .token.variable { color: #d4d4d4; }
    .token.atrule, .token.attr-value, .token.keyword { color: #569cd6; }
    .token.function { color: #dcdcaa; }
    .token.class-name { color: #4ec9b0; }
    .token.regex, .token.important { color: #d16969; }
  `,
  'night-owl': `
    .code-editor-pre { background: #011627; color: #abb2bf; }
    .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #637777; font-style: italic; }
    .token.punctuation { color: #c792ea; }
    .token.property, .token.tag, .token.constant, .token.symbol { color: #7fdbca; }
    .token.boolean, .token.number { color: #f78c6c; }
    .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #ecc48d; }
    .token.operator, .token.entity, .token.url, .token.variable { color: #7fdbca; }
    .token.atrule, .token.attr-value, .token.keyword { color: #c792ea; }
    .token.function { color: #82aaff; }
    .token.class-name { color: #addb67; }
    .token.regex, .token.important { color: #ecc48d; }
  `,
  'synthwave': `
    .code-editor-pre { background: #2b213a; color: #e5e5e5; }
    .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #848bb3; font-style: italic; }
    .token.punctuation { color: #fede5d; }
    .token.property, .token.tag, .token.constant, .token.symbol { color: #2befef; }
    .token.boolean, .token.number { color: #f97e72; }
    .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #72f1b8; }
    .token.operator, .token.entity, .token.url, .token.variable { color: #36f9f6; }
    .token.atrule, .token.attr-value, .token.keyword { color: #fede5d; }
    .token.function { color: #f92aad; }
    .token.class-name { color: #2befef; }
    .token.regex, .token.important { color: #fede5d; }
  `,
  'github-light': `
    .code-editor-pre { background: #ffffff; color: #24292e; border: 1px solid #e1e4e8; }
    .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #6e7781; font-style: italic; }
    .token.punctuation { color: #24292e; }
    .token.property, .token.tag, .token.constant, .token.symbol { color: #0550ae; }
    .token.boolean, .token.number { color: #0550ae; }
    .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #0a3069; }
    .token.operator, .token.entity, .token.url, .token.variable { color: #cf222e; }
    .token.atrule, .token.attr-value, .token.keyword { color: #cf222e; }
    .token.function { color: #8250df; }
    .token.class-name { color: #953800; }
    .token.regex, .token.important { color: #0a3069; }
  `
};

const GRADIENTS: Record<GradientTheme, string> = {
  sunset: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
  cosmic: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
  aurora: 'linear-gradient(135deg, #0575e6 0%, #00f260 100%)',
  midnight: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  glass: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)'
};

const FONTS: Record<FontFamily, string> = {
  'fira-code': '"Fira Code", Menlo, Monaco, Consolas, monospace',
  'jetbrains-mono': '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
  'source-code-pro': '"Source Code Pro", Menlo, Monaco, Consolas, monospace',
  'geist-mono': '"Geist Mono", Menlo, Monaco, Consolas, monospace'
};

const SHADOWS: Record<ShadowStyle, string> = {
  soft: '0 20px 40px rgba(0, 0, 0, 0.25)',
  heavy: '0 30px 60px rgba(0, 0, 0, 0.5)',
  neon: '0 0 40px rgba(99, 102, 241, 0.35)',
  none: 'none'
};

const LANGUAGES_SUPPORTED = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'markup', label: 'HTML / XML' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'json', label: 'JSON' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'markdown', label: 'Markdown' }
];

interface CodecardProps {
  lang: Language;
  dictionary?: any;
}

export const Codecard: React.FC<CodecardProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};

  // Dashboard state tabs
  const [activeTab, setActiveTab] = useState<'code' | 'style' | 'window' | 'export'>('code');

  // Input States
  const [code, setCode] = useState<string>(
`// Paste your source code snippet here
function calculateLoveScore(person1, person2) {
  const baseScore = Math.floor(Math.random() * 50) + 50;
  console.log("Analyzing compatibility...");
  return \`\${person1} â¤ï¸ \${person2}: \${baseScore}%\`;
}`
  );
  const [language, setLanguage] = useState<string>('javascript');
  const [theme, setTheme] = useState<CodeTheme>('one-dark');
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>('index.js');

  // Style customization
  const [gradientTheme, setGradientTheme] = useState<GradientTheme>('cosmic');
  const [padding, setPadding] = useState<number>(48);
  const [borderRadius, setBorderRadius] = useState<number>(16);
  const [shadow, setShadow] = useState<ShadowStyle>('heavy');
  const [fontSize, setFontSize] = useState<number>(14);
  const [fontFamily, setFontFamily] = useState<FontFamily>('jetbrains-mono');

  // Window customizer
  const [windowStyle, setWindowStyle] = useState<WindowStyle>('mac');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);

  // Export properties
  const [exportScale, setExportScale] = useState<number>(2);

  // Status & Modal control
  const [status, setStatus] = useState<'idle' | 'ready' | 'exporting' | 'error'>('idle');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [activeFaqIdx, setActiveFaqIdx] = useState<number | null>(null);
  const [prismLoaded, setPrismLoaded] = useState<boolean>(false);

  // Canvas ref
  const cardRef = useRef<HTMLDivElement>(null);

  // 1. Safe Client Load for PrismJS
  useEffect(() => {
    const loadPrismComponents = async () => {
      try {
        const PrismObj = (await import('prismjs')).default;
        await import('prismjs/components/prism-typescript');
        await import('prismjs/components/prism-python');
        await import('prismjs/components/prism-markup');
        await import('prismjs/components/prism-css');
        await import('prismjs/components/prism-sql');
        await import('prismjs/components/prism-json');
        await import('prismjs/components/prism-rust');
        await import('prismjs/components/prism-go');
        await import('prismjs/components/prism-java');
        await import('prismjs/components/prism-cpp');
        await import('prismjs/components/prism-markdown');
        
        (window as any).Prism = PrismObj;
        setPrismLoaded(true);
        setStatus('ready');
      } catch (err) {
        console.error('Failed to initialize Prism syntax engine:', err);
        setStatus('error');
      }
    };

    loadPrismComponents();
  }, []);

  // 2. Syntax Highlight Render logic
  const getHighlightedCodeHtml = () => {
    if (typeof window === 'undefined') {
      return code;
    }
    const prism = (window as any).Prism;
    if (!prismLoaded || !prism) {
      return code; // raw plain text placeholder
    }

    const grammar = prism.languages[language];
    if (!grammar) {
      return prism.highlight(code, prism.languages.clike, 'clike');
    }

    return prism.highlight(code, grammar, language);
  };

  // 3. Image Download Handler
  const handleDownload = async (format: 'png' | 'jpeg' | 'svg') => {
    if (!cardRef.current) return;
    setStatus('exporting');
    
    try {
      const htmlToImage = await import('html-to-image');
      
      const options = {
        pixelRatio: exportScale,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: cardRef.current.offsetWidth + 'px',
          height: cardRef.current.offsetHeight + 'px'
        }
      };

      let dataUrl = '';
      if (format === 'png') {
        dataUrl = await htmlToImage.toPng(cardRef.current, options);
      } else if (format === 'jpeg') {
        dataUrl = await htmlToImage.toJpeg(cardRef.current, { ...options, quality: 0.95 });
      } else if (format === 'svg') {
        dataUrl = await htmlToImage.toSvg(cardRef.current, options);
      }

      const cleanName = fileName.replace(/[^\w.-]/g, '_') || 'code-snippet';
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `CodeCard-${cleanName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatus('ready');
    } catch (e) {
      console.error('Html-to-image pipeline error:', e);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setCode(
`// Paste your source code snippet here
function calculateLoveScore(person1, person2) {
  const baseScore = Math.floor(Math.random() * 50) + 50;
  console.log("Analyzing compatibility...");
  return \`\${person1} â¤ï¸ \${person2}: \${baseScore}%\`;
}`
    );
    setLanguage('javascript');
    setTheme('one-dark');
    setShowLineNumbers(true);
    setFileName('index.js');
    setGradientTheme('cosmic');
    setPadding(48);
    setBorderRadius(16);
    setShadow('heavy');
    setFontSize(14);
    setFontFamily('jetbrains-mono');
    setWindowStyle('mac');
    setShowWatermark(true);
    setExportScale(2);
    setActiveTab('code');
  };

  // Scroll position watcher
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const featuresList = Array.isArray(t.features) ? t.features : [];

  // Parse lines for line numbers
  const linesArray = code.split('\n');

  return (
    <div className="min-h-screen flex flex-col bg-[#06050a] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      {/* Inject selected highlighter theme css dynamically */}
      <style dangerouslySetInnerHTML={{ __html: PRISM_THEME_CSS[theme] }} />

      {/* Glow Orbs background */}
      

      <Header currentLang={lang} onLanguageChange={(newLang) => window.location.href = `/${newLang.toLowerCase()}/codecard`} onReset={handleReset} t={t} />

      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-codecard-top" />
        <div className="w-full text-center space-y-16 md:space-y-24">
          
          {/* Hero Header */}
          <div className="flex flex-col items-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-indigo-950/40 border border-indigo-800/30 text-indigo-400 text-xs font-black tracking-widest uppercase shadow-[0_0_25px_rgba(99,102,241,0.15)]">
              <Sparkles className="w-4 h-4 animate-float" />
              <span>{t.title}</span>
            </div>
            
            <h1 className="text-4xl md:text-[5.5rem] font-black tracking-tight leading-[0.9] text-white bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
              {t.title}
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              {t.description}
            </p>
          </div>

          {/* Interactive Core Box */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left box: Controller Panel */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Tabs Switcher */}
              <div className="flex p-1 rounded-2xl bg-[#0e0c15]/80 border border-white/5 shadow-2xl gap-1 w-full">
                {[
                  { id: 'code', label: t.tabCode, icon: Code },
                  { id: 'style', label: t.tabStyle, icon: Palette },
                  { id: 'window', label: t.tabWindow, icon: Settings },
                  { id: 'export', label: t.tabExport, icon: Download }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none outline-none
                        ${isActive 
                          ? 'bg-indigo-600 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)]' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab options Box */}
              <div className="glass-card rounded-3xl p-6 text-left space-y-5 min-h-[420px] relative overflow-hidden">
                

                {/* TAB 1: CODE EDITOR */}
                {activeTab === 'code' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelCodeInput}</label>
                      <textarea
                        rows={8}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full bg-[#060408] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-slate-200 outline-none focus:border-indigo-500 resize-none leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelLanguage}</label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-3 text-xs text-slate-300 outline-none focus:border-indigo-500"
                        >
                          {LANGUAGES_SUPPORTED.map(l => (
                            <option key={l.id} value={l.id}>{l.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelTheme}</label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as CodeTheme)}
                          className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-3 text-xs text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="one-dark">One Dark</option>
                          <option value="dracula">Dracula</option>
                          <option value="vs-code">VS Code Dark</option>
                          <option value="night-owl">Night Owl</option>
                          <option value="synthwave">Synthwave</option>
                          <option value="github-light">GitHub Light</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelFileName}</label>
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-4 text-xs text-slate-200 outline-none focus:border-indigo-500 font-medium"
                          placeholder="e.g. index.js"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-6">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelShowLineNumbers}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showLineNumbers} 
                            onChange={(e) => setShowLineNumbers(e.target.checked)}
                            className="sr-only peer outline-none" 
                          />
                          <div className="w-9 h-5 bg-[#080d0a] rounded-full border border-white/10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-indigo-400 peer-checked:border-indigo-500/50" />
                        </label>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: STYLING PANEL */}
                {activeTab === 'style' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    
                    {/* Background Gradients */}
                    <div className="space-y-2.5">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelBgGradient}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(GRADIENTS) as GradientTheme[]).map((g) => {
                          const isSel = gradientTheme === g;
                          return (
                            <button
                              key={g}
                              onClick={() => setGradientTheme(g)}
                              style={{ background: GRADIENTS[g] }}
                              className={`h-11 rounded-xl cursor-pointer transition-all border outline-none flex items-center justify-center
                                ${isSel ? 'border-white scale-[1.05] shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                            >
                              <span className="bg-black/80 px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider">
                                {t[`gradient${g.charAt(0).toUpperCase() + g.slice(1)}` as any] || g}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Font Family selection */}
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelFontSize} & Font</label>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          value={fontFamily}
                          onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                          className="w-full h-11 bg-[#060408] border border-white/10 rounded-xl px-3 text-xs text-slate-300 outline-none focus:border-indigo-500"
                        >
                          <option value="jetbrains-mono">{t.fontJetBrains}</option>
                          <option value="fira-code">{t.fontFiraCode}</option>
                          <option value="source-code-pro">{t.fontSourceCode}</option>
                          <option value="geist-mono">{t.fontGeist}</option>
                        </select>

                        <div className="flex items-center space-x-2 bg-[#060408] border border-white/10 rounded-xl px-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Size</span>
                          <input
                            type="number"
                            min="10"
                            max="24"
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-full text-center bg-transparent border-0 outline-none text-xs font-bold text-slate-200"
                          />
                          <span className="text-[10px] font-bold text-slate-500">px</span>
                        </div>
                      </div>
                    </div>

                    {/* Sliders for Padding & Radius */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                          <span>{t.labelPadding}</span>
                          <span className="text-indigo-400 font-bold">{padding}px</span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="96"
                          step="8"
                          value={padding}
                          onChange={(e) => setPadding(Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded outline-none accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                          <span>{t.labelBorderRadius}</span>
                          <span className="text-indigo-400 font-bold">{borderRadius}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="32"
                          step="4"
                          value={borderRadius}
                          onChange={(e) => setBorderRadius(Number(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded outline-none accent-indigo-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Card Shadow picker */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelShadow}</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'soft', label: t.shadowSoft },
                          { id: 'heavy', label: t.shadowHeavy },
                          { id: 'neon', label: t.shadowNeon },
                          { id: 'none', label: t.shadowNone }
                        ].map(sh => (
                          <button
                            key={sh.id}
                            onClick={() => setShadow(sh.id as ShadowStyle)}
                            className={`py-2 px-1 text-[10px] font-bold rounded-xl border text-center transition-all cursor-pointer outline-none
                              ${shadow === sh.id
                                ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-400 shadow-inner'
                                : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
                          >
                            {sh.label}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 3: WINDOW FRAME */}
                {activeTab === 'window' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelWindowStyle}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'mac', label: t.windowMac, desc: "macOS style dots" },
                          { id: 'windows', label: t.windowWindows, desc: "Standard Windows controls" },
                          { id: 'simple', label: t.windowSimple, desc: "Simple border separator" },
                          { id: 'none', label: t.windowNone, desc: "Hide all frame indicators" }
                        ].map(win => {
                          const isSel = windowStyle === win.id;
                          return (
                            <button
                              key={win.id}
                              onClick={() => setWindowStyle(win.id as WindowStyle)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer outline-none flex flex-col h-16 justify-between
                                ${isSel 
                                  ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-400 shadow-inner' 
                                  : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                              <span className="text-[10px] font-bold text-white block leading-none">{win.label}</span>
                              <span className="text-[8px] text-slate-500 font-medium leading-none block">{win.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest block">{t.labelShowWatermark}</span>
                        <span className="text-[9px] text-slate-500 font-medium block">Show a very subtle watermark at the bottom right</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showWatermark} 
                          onChange={(e) => setShowWatermark(e.target.checked)}
                          className="sr-only peer outline-none" 
                        />
                        <div className="w-9 h-5 bg-[#080d0a] rounded-full border border-white/10 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:bg-indigo-400 peer-checked:border-indigo-500/50" />
                      </label>
                    </div>

                  </div>
                )}

                {/* TAB 4: EXPORT PIPELINE */}
                {activeTab === 'export' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelExportScale}</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 1, label: "1x (Normal)" },
                          { val: 2, label: "2x (Retina HD)" },
                          { val: 4, label: "4x (Ultra Print)" }
                        ].map(sc => {
                          const isSel = exportScale === sc.val;
                          return (
                            <button
                              key={sc.val}
                              onClick={() => setExportScale(sc.val)}
                              className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer outline-none flex flex-col items-center justify-center gap-1.5 h-16
                                ${isSel 
                                  ? 'bg-indigo-950/20 border-indigo-500/40 text-indigo-400 shadow-inner' 
                                  : 'bg-[#060408] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                              <span className="text-xs font-black text-white">{sc.val}x</span>
                              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{sc.label.split(' ')[1]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Generate formats</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleDownload('png')}
                          className="py-3.5 bg-indigo-600 hover:bg-indigo-500 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        >
                          <Download className="w-4 h-4 stroke-[2.5]" />
                          <span>{t.downloadBtnPng}</span>
                        </button>

                        <button
                          onClick={() => handleDownload('jpeg')}
                          className="py-3.5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/5 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 cursor-pointer"
                        >
                          <Download className="w-4 h-4 stroke-[2]" />
                          <span>{t.downloadBtnJpg}</span>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleDownload('svg')}
                        className="w-full py-3.5 border border-dashed border-white/5 hover:border-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer outline-none rounded-xl text-xs font-bold"
                      >
                        {t.downloadBtnSvg}
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>

            {/* Right box: Real-Time Preview Card Canvas */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6 flex flex-col items-center relative z-10">
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Live Canvas Card</h3>
                  <button 
                    onClick={handleReset}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title={t.resetBtn}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* Visual Capture Box Element */}
                <div className="relative w-full overflow-hidden flex items-center justify-center rounded-2xl bg-[#08060c] border border-white/5 p-4 min-h-[360px]">
                  
                  {/* Glowing background behind canvas */}
                  <div className="absolute inset-0 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full scale-75" />

                  {/* High Quality Styled Code card */}
                  <div 
                    ref={cardRef} 
                    id="codecard-render-node"
                    style={{ 
                      background: GRADIENTS[gradientTheme], 
                      padding: `${padding}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                    className="max-w-full w-auto min-w-[280px] sm:min-w-[420px] transition-all select-none"
                  >
                    <div 
                      style={{ 
                        borderRadius: `${borderRadius}px`,
                        boxShadow: SHADOWS[shadow]
                      }}
                      className="bg-[#1e1e1e] border border-white/10 overflow-hidden flex flex-col w-full relative z-10"
                    >
                      {/* Window title header */}
                      {windowStyle !== 'none' && (
                        <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/5">
                          {/* Dot controls */}
                          <div className="flex items-center space-x-2 shrink-0">
                            {windowStyle === 'mac' && (
                              <>
                                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                              </>
                            )}
                            {windowStyle === 'windows' && (
                              <>
                                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                              </>
                            )}
                            {windowStyle === 'simple' && (
                              <div className="flex items-center space-x-1.5 text-slate-500">
                                <FileCode className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          
                          {/* File Name Header */}
                          <div className="text-[10px] font-black text-slate-500 tracking-wider uppercase font-mono max-w-[150px] truncate text-center">
                            {fileName || "index.js"}
                          </div>

                          <div className="w-12 shrink-0" />
                        </div>
                      )}

                      {/* Highlighted pre/code area */}
                      <div className="flex relative w-full text-left">
                        
                        {/* Line Numbers column */}
                        {showLineNumbers && (
                          <div 
                            style={{ 
                              fontFamily: FONTS[fontFamily], 
                              fontSize: `${fontSize}px` 
                            }} 
                            className="py-4 pl-4 pr-3 text-right text-slate-600 font-mono select-none border-r border-white/5 leading-normal"
                          >
                            {linesArray.map((_, i) => (
                              <div key={i}>{i + 1}</div>
                            ))}
                          </div>
                        )}

                        {/* Formatting viewport */}
                        <pre 
                          style={{ 
                            fontFamily: FONTS[fontFamily], 
                            fontSize: `${fontSize}px` 
                          }} 
                          className="code-editor-pre flex-1 p-4 overflow-x-auto overflow-y-hidden font-mono leading-normal whitespace-pre pr-8"
                        >
                          <code 
                            dangerouslySetInnerHTML={{ __html: getHighlightedCodeHtml() }}
                            className="block font-mono leading-normal"
                          />
                        </pre>
                      </div>

                    </div>

                    {/* Subtle oLoveTools Watermark inside card container */}
                    {showWatermark && (
                      <div className="absolute bottom-2.5 right-4 flex items-center space-x-1 font-bold text-[9px] text-white/40 drop-shadow-sm font-sans tracking-wide">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{t.watermarkLabel}</span>
                      </div>
                    )}

                  </div>

                </div>

                {/* Secure privacy notice */}
                <div className="w-full border-t border-white/5 pt-4 flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-bold select-none">
                  <Lock className="w-3.5 h-3.5 text-indigo-500/70" />
                  <span>Highlighted entirely locally. No credentials or codes leave your machine.</span>
                </div>

              </div>

            </div>

          </div>

          {/* Premium Features Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
            {featuresList.map((feature: any, idx: number) => (
              <div 
                key={idx}
                className="glass-card p-8 rounded-3xl text-left hover:-translate-y-1 transition-all duration-300 glow-indigo border border-white/5 relative overflow-hidden"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                  {idx === 0 && <Maximize2 className="w-6 h-6" />}
                  {idx === 1 && <Lock className="w-6 h-6" />}
                  {idx === 2 && <FileCode className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{feature.text}</p>
              </div>
            ))}
          </div>

          {/* Collapsible FAQ accordion section */}
          {faqs.length > 0 && (
            <div className="space-y-12 max-w-4xl mx-auto pt-16 text-left">
              <h2 className="text-3xl font-black text-white tracking-tight border-b border-white/5 pb-4 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-float" />
                <span>{t.faqTitle}</span>
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faqItem: any, idx: number) => {
                  const isAct = activeFaqIdx === idx;
                  return (
                    <div 
                      key={idx} 
                      className="glass-card rounded-2xl p-6 md:p-8 space-y-3 cursor-pointer select-none"
                      onClick={() => setActiveFaqIdx(isAct ? null : idx)}
                    >
                      <h4 className="text-lg font-bold text-white tracking-tight flex items-center justify-between gap-3">
                        <span className="flex items-start gap-3">
                          <span className="text-indigo-400 font-black">Q:</span>
                          <span>{faqItem.question}</span>
                        </span>
                        <span className="text-indigo-400 font-bold text-sm shrink-0">
                          {isAct ? 'âˆ’' : '+'}
                        </span>
                      </h4>
                      <AnimatePresence>
                        {isAct && (
                          <motion.p 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="text-slate-400 text-sm leading-relaxed font-medium pl-6 pt-2 overflow-hidden"
                          >
                            {faqItem.answer}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deep SEO textual content sitemaps */}
          <div className="border-t border-white/5 pt-16 text-left max-w-4xl mx-auto space-y-12 select-none">
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-wider">{t.seoHeroTitle}</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">{t.seoHeroText}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {Array.isArray(t.seoHeroList) && t.seoHeroList.map((liText: string, i: number) => (
                  <li key={i} className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>{liText}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoUseCaseTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoPrivacyTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoPrivacyText}</p>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">{t.seoSecondaryTitle}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.description}</p>
              </div>
            </div>

            {keywords.length > 0 && (
              <div className="border-t border-white/5 pt-8 space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.seoKeywordsTitle}</h4>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw: string, i: number) => (
                    <span 
                      key={i} 
                      className="text-[10px] font-bold bg-[#0a0812] text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-900/30 uppercase tracking-wider"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-codecard-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      <LegalModal 
        isOpen={activeModal !== null} 
        onClose={() => setActiveModal(null)} 
        title={
          activeModal === 'privacy' ? t.privacyPolicy :
          activeModal === 'terms' ? t.termsOfService :
          t.cookiePolicy
        }
        content={
          activeModal === 'privacy' ? t.privacyContent :
          activeModal === 'terms' ? t.termsContent :
          t.cookiesContent
        }
        t={t}
      />

      {/* Floating Scroll Top element */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-indigo-500 hover:bg-indigo-400 text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-95 cursor-pointer outline-none"
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Codecard;
