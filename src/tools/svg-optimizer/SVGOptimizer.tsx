import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { PRESET_SVGS, type PresetSvg } from './utils/presetSvgs';
import { optimizeSvg, type SvgOptimizerOptions } from './utils/svgOptimizerCore';
import {
  Upload, Download, Copy, Check, Code, Eye, Settings,
  FileCode2, Sparkles, RotateCcw, Layers, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface SVGOptimizerProps {
  lang: string;
  dictionary: any;
}

const DEFAULT_OPTIONS: SvgOptimizerOptions = {
  xmlDecl: true,
  metadata: true,
  namespaces: true,
  unusedIds: true,
  emptyGroups: true,
  precision: 2,
  minifyPath: true,
  responsive: false,
  styleToAttrs: false,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function svgToReactComponent(svgCode: string): string {
  let jsx = svgCode
    .replace(/xmlns:xlink/g, 'xmlnsXlink')
    .replace(/xml:space/g, 'xmlSpace')
    .replace(/clip-path/g, 'clipPath')
    .replace(/clip-rule/g, 'clipRule')
    .replace(/fill-rule/g, 'fillRule')
    .replace(/fill-opacity/g, 'fillOpacity')
    .replace(/stroke-width/g, 'strokeWidth')
    .replace(/stroke-opacity/g, 'strokeOpacity')
    .replace(/stroke-linecap/g, 'strokeLinecap')
    .replace(/stroke-linejoin/g, 'strokeLinejoin')
    .replace(/stroke-dasharray/g, 'strokeDasharray')
    .replace(/stroke-dashoffset/g, 'strokeDashoffset')
    .replace(/stroke-miterlimit/g, 'strokeMiterlimit')
    .replace(/font-family/g, 'fontFamily')
    .replace(/font-size/g, 'fontSize')
    .replace(/font-weight/g, 'fontWeight')
    .replace(/font-style/g, 'fontStyle')
    .replace(/stop-color/g, 'stopColor')
    .replace(/stop-opacity/g, 'stopOpacity')
    .replace(/ class="/g, ' className="');

  return `const SvgIcon = (props) => (\n  ${jsx}\n);\n\nexport default SvgIcon;`;
}

function svgToDataUri(svgCode: string): string {
  const encoded = encodeURIComponent(svgCode)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `url("data:image/svg+xml,${encoded}")`;
}

const SVGOptimizer: React.FC<SVGOptimizerProps> = ({ lang, dictionary }) => {
  const t = dictionary;

  // Modal state
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // SVG content states
  const [originalSvg, setOriginalSvg] = useState<string>(PRESET_SVGS.icon.code);
  const [optimizedSvg, setOptimizedSvg] = useState<string>('');
  const [fileName, setFileName] = useState<string>('app-logo-icon.svg');

  // Options state
  const [options, setOptions] = useState<SvgOptimizerOptions>({ ...DEFAULT_OPTIONS });
  const [showOptions, setShowOptions] = useState<boolean>(true);

  // UI states
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedState, setCopiedState] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');
  const [bgTheme, setBgTheme] = useState<'checkered' | 'dark' | 'white' | 'cyan'>('checkered');
  const [showCodeInput, setShowCodeInput] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Run optimization when SVG or options change
  useEffect(() => {
    if (!originalSvg.trim()) {
      setOptimizedSvg('');
      setErrorMsg('');
      return;
    }

    try {
      const result = optimizeSvg(originalSvg, options);
      setOptimizedSvg(result);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || t.error_invalid_svg || 'Invalid SVG');
      setOptimizedSvg('');
    }
  }, [originalSvg, options]);

  // Size stats
  const originalSize = useMemo(() => new Blob([originalSvg]).size, [originalSvg]);
  const optimizedSize = useMemo(() => new Blob([optimizedSvg]).size, [optimizedSvg]);
  const reduction = useMemo(() => {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  }, [originalSize, optimizedSize]);

  // File handling
  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setErrorMsg(t.error_invalid_svg || 'Please upload an SVG file');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setOriginalSvg(content);
      setErrorMsg('');
    };
    reader.readAsText(file);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Load a preset
  const loadPreset = useCallback((preset: PresetSvg) => {
    setOriginalSvg(preset.code);
    setFileName(preset.fileName);
    setErrorMsg('');
  }, []);

  // Copy helpers
  const copyToClipboard = useCallback(async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedState(label);
      setTimeout(() => setCopiedState(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = content;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedState(label);
      setTimeout(() => setCopiedState(null), 2000);
    }
  }, []);

  // Download optimized SVG
  const downloadSvg = useCallback(() => {
    if (!optimizedSvg) return;
    const blob = new Blob([optimizedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = fileName.replace(/\.svg$/i, '');
    a.href = url;
    a.download = `${baseName}-optimized.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [optimizedSvg, fileName]);

  // Reset to default preset
  const handleReset = useCallback(() => {
    setOriginalSvg(PRESET_SVGS.icon.code);
    setFileName('app-logo-icon.svg');
    setOptions({ ...DEFAULT_OPTIONS });
    setErrorMsg('');
    setShowCodeInput(false);
  }, []);

  // Language change
  const handleLanguageChange = useCallback((newLang: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/[a-z]{2}\//, `/${newLang.toLowerCase()}/`);
    window.location.href = newPath;
  }, []);

  // Options update helper
  const updateOption = useCallback(<K extends keyof SvgOptimizerOptions>(
    key: K,
    value: SvgOptimizerOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Background style for preview
  const bgStyle = useMemo((): React.CSSProperties => {
    switch (bgTheme) {
      case 'checkered':
        return {
          backgroundImage: `
            linear-gradient(45deg, #1a1a2e 25%, transparent 25%),
            linear-gradient(-45deg, #1a1a2e 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #1a1a2e 75%),
            linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundColor: '#0f0f23',
        };
      case 'white':
        return { backgroundColor: '#ffffff' };
      case 'dark':
        return { backgroundColor: '#0a0a0a' };
      case 'cyan':
        return { backgroundColor: '#042f2e' };
      default:
        return { backgroundColor: '#0f0f23' };
    }
  }, [bgTheme]);

  // Legal modal content
  const legalContent = useMemo(() => {
    const legal = legalTranslations[lang];
    if (!legal) return { privacy: '', terms: '', cookies: '', titles: { privacy: '', terms: '', cookies: '' } };
    return {
      privacy: legal.privacy,
      terms: legal.terms,
      cookies: legal.cookies,
      titles: legal.nav,
    };
  }, [lang]);

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      <Header
        currentLang={lang}
        onLanguageChange={handleLanguageChange}
        onReset={handleReset}
        t={t}
      />

      {/* Main Content */}
      <main className="flex-1 pt-28 md:pt-32 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero Description */}
          <div className="text-center space-y-3 mb-8">
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {t.seoHeroText}
            </p>
          </div>

          {/* Upload / Drag-Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              glass-card rounded-2xl p-8 md:p-10 cursor-pointer
              text-center transition-all duration-300 group
              border-2 border-dashed
              ${isDragging
                ? 'border-cyan-400/60 bg-cyan-500/5 shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]'
                : 'border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.02]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="flex flex-col items-center space-y-4">
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
                ${isDragging
                  ? 'bg-cyan-500/20 rotate-6 scale-110'
                  : 'bg-white/5 group-hover:bg-cyan-500/10 group-hover:rotate-3'
                }
              `}>
                <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-cyan-300' : 'text-cyan-500'}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {isDragging ? t.drop_active : t.label_svg_file}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t.drop_inactive}
                </p>
              </div>
            </div>
          </div>

          {/* Paste Code Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowCodeInput(!showCodeInput)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-cyan-400 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all cursor-pointer"
            >
              <Code className="w-4 h-4" />
              {showCodeInput ? 'Hide Code Input' : 'Paste SVG Code'}
              {showCodeInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Code Textarea for pasting */}
          {showCodeInput && (
            <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">SVG Source Code</span>
                <button
                  onClick={() => {
                    setOriginalSvg('');
                    if (textareaRef.current) textareaRef.current.value = '';
                  }}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={originalSvg}
                onChange={(e) => setOriginalSvg(e.target.value)}
                spellCheck={false}
                className="w-full h-48 bg-transparent text-green-300/80 text-xs font-mono p-4 resize-none outline-none border-none placeholder-gray-600"
                placeholder="<svg xmlns=&quot;...&quot; ..."
              />
            </div>
          )}

          {/* Presets Row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-gray-500 tracking-wider uppercase mr-1">
              {t.label_presets}:
            </span>
            {Object.entries(PRESET_SVGS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => loadPreset(preset)}
                className={`
                  px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer
                  border
                  ${originalSvg === preset.code
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }
                `}
              >
                <Sparkles className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                {t[preset.nameKey] || preset.nameKey}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm font-medium flex items-start gap-3">
              <span className="text-red-400 mt-0.5">⚠</span>
              {errorMsg}
            </div>
          )}

          {/* Main Two-Column Layout */}
          {!errorMsg && optimizedSvg && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left: Visual Preview */}
              <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
                {/* Preview Header */}
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">
                      Preview
                    </span>
                  </div>

                  {/* View toggle */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                    <button
                      onClick={() => setActiveView('preview')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        activeView === 'preview'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                      Visual
                    </button>
                    <button
                      onClick={() => setActiveView('code')}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        activeView === 'code'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                      Code
                    </button>
                  </div>
                </div>

                {/* Backdrop theme selector */}
                {activeView === 'preview' && (
                  <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-1">{t.label_bg_color}:</span>
                    {(['checkered', 'dark', 'white', 'cyan'] as const).map(theme => (
                      <button
                        key={theme}
                        onClick={() => setBgTheme(theme)}
                        className={`
                          w-6 h-6 rounded-lg border-2 transition-all cursor-pointer
                          ${bgTheme === theme ? 'border-cyan-400 scale-110 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'border-white/10 hover:border-white/30'}
                        `}
                        style={{
                          backgroundColor: theme === 'checkered' ? '#1a1a2e'
                            : theme === 'dark' ? '#0a0a0a'
                            : theme === 'white' ? '#ffffff'
                            : '#042f2e',
                          ...(theme === 'checkered' ? {
                            backgroundImage: 'linear-gradient(45deg, #0f0f23 25%, transparent 25%), linear-gradient(-45deg, #0f0f23 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f0f23 75%), linear-gradient(-45deg, transparent 75%, #0f0f23 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                          } : {}),
                        }}
                        title={theme}
                      />
                    ))}
                  </div>
                )}

                {/* Preview Content */}
                <div className="flex-1 min-h-[320px] md:min-h-[400px]">
                  {activeView === 'preview' ? (
                    <div
                      className="w-full h-full flex items-center justify-center p-8 overflow-hidden"
                      style={bgStyle}
                    >
                      <div
                        className="max-w-full max-h-[360px] svg-preview-container"
                        dangerouslySetInnerHTML={{ __html: optimizedSvg }}
                        style={{ lineHeight: 0 }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full overflow-auto p-4 bg-[#04080a]">
                      <pre className="text-[11px] leading-5 text-green-300/70 font-mono whitespace-pre-wrap break-all select-all">
                        {optimizedSvg}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Stats & Actions */}
              <div className="space-y-5">

                {/* Size Comparison Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="glass-card rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-gray-500" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {t.label_original}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">
                      {formatBytes(originalSize)}
                    </p>
                  </div>

                  {/* Optimized */}
                  <div className="glass-card rounded-2xl p-5 space-y-2 border-cyan-500/20">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-bold text-cyan-400/70 uppercase tracking-widest">
                        {t.label_optimized}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-cyan-300 tracking-tight">
                      {formatBytes(optimizedSize)}
                    </p>
                  </div>
                </div>

                {/* Reduction Bar */}
                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{t.label_reduction}</span>
                    <span className={`text-xl font-black tracking-tight ${
                      reduction > 0 ? 'text-emerald-400' : reduction === 0 ? 'text-gray-400' : 'text-red-400'
                    }`}>
                      {reduction > 0 ? '-' : ''}{reduction}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(0, Math.min(100, reduction))}%`,
                        background: reduction > 50
                          ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                          : reduction > 20
                          ? 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                          : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Download */}
                  <button
                    onClick={downloadSvg}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.4)] active:scale-95 col-span-2"
                  >
                    <Download className="w-4.5 h-4.5" />
                    {t.btn_download}
                  </button>

                  {/* Copy SVG */}
                  <button
                    onClick={() => copyToClipboard(optimizedSvg, 'svg')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    {copiedState === 'svg' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedState === 'svg' ? t.copied : t.btn_copy_svg}
                  </button>

                  {/* Copy React */}
                  <button
                    onClick={() => copyToClipboard(svgToReactComponent(optimizedSvg), 'react')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                  >
                    {copiedState === 'react' ? <Check className="w-4 h-4 text-emerald-400" /> : <Code className="w-4 h-4" />}
                    {copiedState === 'react' ? t.copied : t.btn_copy_react}
                  </button>

                  {/* Copy Data URI */}
                  <button
                    onClick={() => copyToClipboard(svgToDataUri(optimizedSvg), 'uri')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 col-span-2"
                  >
                    {copiedState === 'uri' ? <Check className="w-4 h-4 text-emerald-400" /> : <Layers className="w-4 h-4" />}
                    {copiedState === 'uri' ? t.copied : t.btn_copy_data_uri}
                  </button>
                </div>

                {/* File Name */}
                <div className="text-center text-[11px] text-gray-600 font-mono truncate">
                  {fileName}
                </div>
              </div>
            </div>
          )}

          {/* Optimization Options Panel */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="w-full px-6 py-4 flex items-center justify-between cursor-pointer bg-transparent border-none text-left"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-white tracking-tight">
                  {t.label_options}
                </span>
              </div>
              {showOptions ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showOptions && (
              <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-4">
                {/* Toggle Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {([
                    { key: 'xmlDecl', label: t.opt_xml_decl },
                    { key: 'metadata', label: t.opt_metadata },
                    { key: 'namespaces', label: t.opt_namespaces },
                    { key: 'unusedIds', label: t.opt_unused_ids },
                    { key: 'emptyGroups', label: t.opt_empty_groups },
                    { key: 'minifyPath', label: t.opt_minify_path },
                    { key: 'responsive', label: t.opt_responsive },
                    { key: 'styleToAttrs', label: t.opt_style_to_attrs },
                  ] as { key: keyof SvgOptimizerOptions; label: string }[]).map(({ key, label }) => (
                    <label
                      key={key}
                      className={`
                        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                        border
                        ${options[key]
                          ? 'bg-cyan-500/8 border-cyan-500/20 hover:border-cyan-500/30'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                        }
                      `}
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={!!options[key]}
                          onChange={(e) => updateOption(key, e.target.checked as any)}
                          className="sr-only peer"
                        />
                        <div className={`
                          w-9 h-5 rounded-full transition-all duration-200
                          ${options[key]
                            ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                            : 'bg-white/10'
                          }
                        `} />
                        <div className={`
                          absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200
                          ${options[key]
                            ? 'left-[18px] bg-white'
                            : 'left-0.5 bg-gray-400'
                          }
                        `} />
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${
                        options[key] ? 'text-gray-200' : 'text-gray-500'
                      }`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Precision Slider */}
                <div className="glass-card rounded-xl p-4 space-y-3 bg-white/[0.02] border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">{t.opt_precision}</span>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                      {options.precision === null ? t.opt_precision_keep : `${options.precision} dp`}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{t.opt_precision_desc}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateOption('precision', null)}
                      className={`
                        px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border
                        ${options.precision === null
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                        }
                      `}
                    >
                      {t.opt_precision_keep}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={1}
                      value={options.precision ?? 2}
                      onChange={(e) => updateOption('precision', parseInt(e.target.value))}
                      className="flex-1 h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer accent-cyan-500"
                      style={{
                        background: options.precision !== null
                          ? `linear-gradient(90deg, #06b6d4 0%, #06b6d4 ${((options.precision ?? 2) / 6) * 100}%, rgba(255,255,255,0.1) ${((options.precision ?? 2) / 6) * 100}%)`
                          : 'rgba(255,255,255,0.1)',
                      }}
                    />
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map(n => (
                        <button
                          key={n}
                          onClick={() => updateOption('precision', n)}
                          className={`
                            w-7 h-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer border
                            ${options.precision === n
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                              : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                            }
                          `}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEO Hero Banner */}
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center space-y-4 border border-white/5">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {t.seoHeroTitle}
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {t.seoHeroText}
            </p>
          </div>
        </div>
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(modal) => setActiveModal(modal)}
      />

      {/* Legal Modal */}
      {activeModal && (
        <LegalModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={legalContent.titles[activeModal] || activeModal}
          content={legalContent[activeModal] || ''}
          t={t}
        />
      )}

      {/* Global Inline Styles for SVG Preview Container */}
      <style>{`
        .svg-preview-container svg {
          max-width: 100%;
          max-height: 360px;
          height: auto;
          width: auto;
        }
      `}</style>
    </div>
  );
};

export default SVGOptimizer;
