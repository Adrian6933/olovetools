import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  Binary, Copy, Check, RotateCcw, ArrowRight, ArrowLeft,
  Upload, Download, Image as ImageIcon, FileText, AlertCircle,
  Zap, Trash2, Eye
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface Base64BoltProps {
  lang: string;
  dictionary: any;
}

type Tab = 'text' | 'image';

export default function Base64Bolt({ lang, dictionary }: Base64BoltProps) {
  const t = dictionary || {};

  const [tab, setTab] = useState<Tab>('text');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // Text mode state
  const [textMode, setTextMode] = useState<'encode' | 'decode'>('encode');
  const [textInput, setTextInput] = useState('');
  const [textOutput, setTextOutput] = useState('');
  const [textError, setTextError] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  // Image mode state
  const [imageMode, setImageMode] = useState<'encode' | 'decode'>('encode');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageSize, setImageSize] = useState<number>(0);
  const [base64Input, setBase64Input] = useState('');
  const [decodedImagePreview, setDecodedImagePreview] = useState('');
  const [decodedImageError, setDecodedImageError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text encode/decode
  const handleTextProcess = useCallback((input: string, mode: 'encode' | 'decode') => {
    if (!input) {
      setTextOutput('');
      setTextError('');
      return;
    }
    try {
      if (mode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setTextOutput(encoded);
        setTextError('');
      } else {
        const decoded = decodeURIComponent(escape(atob(input.trim())));
        setTextOutput(decoded);
        setTextError('');
      }
    } catch (err) {
      setTextOutput('');
      setTextError(mode === 'decode' ? (t.error_invalid_base64 || 'Invalid Base64 string') : (t.error_encode || 'Failed to encode'));
    }
  }, [t]);

  const handleTextInputChange = useCallback((value: string) => {
    setTextInput(value);
    handleTextProcess(value, textMode);
  }, [textMode, handleTextProcess]);

  const handleTextModeSwap = useCallback(() => {
    const newMode = textMode === 'encode' ? 'decode' : 'encode';
    setTextMode(newMode);
    setTextInput(textOutput);
    handleTextProcess(textOutput, newMode);
  }, [textMode, textOutput, handleTextProcess]);

  const handleCopyText = useCallback(() => {
    if (!textOutput) return;
    navigator.clipboard.writeText(textOutput);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }, [textOutput]);

  // Image -> Base64
  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setTextError(t.error_not_image || 'Please select an image file');
      return;
    }
    setImageFile(file);
    setImageSize(file.size);
    setTextError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageDataUrl(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  }, [handleImageFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  }, [handleImageFile]);

  const handleCopyDataUrl = useCallback(() => {
    if (!imageDataUrl) return;
    navigator.clipboard.writeText(imageDataUrl);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  }, [imageDataUrl]);

  // Base64 -> Image
  const handleBase64Decode = useCallback((input: string) => {
    setBase64Input(input);
    if (!input.trim()) {
      setDecodedImagePreview('');
      setDecodedImageError('');
      return;
    }
    try {
      let dataUrl = input.trim();
      if (!dataUrl.startsWith('data:')) {
        const ext = input.substring(0, 50);
        let mimeType = 'image/png';
        if (ext.includes('/9j/')) mimeType = 'image/jpeg';
        else if (ext.includes('iVBOR')) mimeType = 'image/png';
        else if (ext.includes('R0lGOD')) mimeType = 'image/gif';
        else if (ext.includes('UklGR')) mimeType = 'image/webp';
        dataUrl = `data:${mimeType};base64,${dataUrl}`;
      }
      setDecodedImagePreview(dataUrl);
      setDecodedImageError('');
    } catch {
      setDecodedImagePreview('');
      setDecodedImageError(t.error_invalid_base64 || 'Invalid Base64 string');
    }
  }, [t]);

  const handleDownloadDecoded = useCallback(() => {
    if (!decodedImagePreview) return;
    const link = document.createElement('a');
    link.href = decodedImagePreview;
    link.download = `decoded-image-${Date.now()}.png`;
    link.click();
  }, [decodedImagePreview]);

  const resetWorkspace = useCallback(() => {
    setTextInput('');
    setTextOutput('');
    setTextError('');
    setImageFile(null);
    setImageDataUrl('');
    setImagePreview('');
    setBase64Input('');
    setDecodedImagePreview('');
    setDecodedImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const textCharCount = textInput.length;
  const textOutputCharCount = textOutput.length;
  const base64InputCharCount = base64Input.length;
  const dataUrlSize = imageDataUrl ? new Blob([imageDataUrl]).size : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#020610] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/base64-bolt`}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">

        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Binary className="w-8 h-8 text-blue-400" />
            <span>{t.seoHeroTitle || 'Base64 Encoder & Decoder'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0a1a3a] p-1.5 rounded-2xl border border-white/5 self-start">
          <button
            onClick={() => setTab('text')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
              tab === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t.tab_text || 'Text'}</span>
          </button>
          <button
            onClick={() => setTab('image')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
              tab === 'image' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{t.tab_image || 'Image'}</span>
          </button>
        </div>

        {/* TEXT TAB */}
        {tab === 'text' && (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setTextMode('encode'); handleTextProcess(textInput, 'encode'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border ${
                  textMode === 'encode' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-slate-500 hover:text-white border-transparent'
                }`}
              >
                {t.mode_encode || 'Encode'}
              </button>
              <button
                onClick={() => { setTextMode('decode'); handleTextProcess(textInput, 'decode'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border ${
                  textMode === 'decode' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-slate-500 hover:text-white border-transparent'
                }`}
              >
                {t.mode_decode || 'Decode'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                    {textMode === 'encode' ? (t.label_input || 'Plain Text') : (t.label_base64_input || 'Base64 String')}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">{textCharCount} chars</span>
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => handleTextInputChange(e.target.value)}
                  placeholder={textMode === 'encode'
                    ? (t.placeholder_text_encode || 'Type or paste text to encode to Base64...')
                    : (t.placeholder_text_decode || 'Paste a Base64 string to decode...')}
                  className="w-full h-64 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none resize-none scrollbar-thin"
                  spellCheck={false}
                />
              </div>

              <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />
                    {textMode === 'encode' ? (t.label_base64_output || 'Base64 Output') : (t.label_decoded_output || 'Decoded Text')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-600 font-mono">{textOutputCharCount} chars</span>
                    {textOutput && (
                      <button
                        onClick={handleCopyText}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border ${
                          copiedText ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-400 hover:text-white'
                        }`}
                        title={t.tooltip_copy || 'Copy'}
                      >
                        {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full h-64 p-5 overflow-auto font-mono text-sm break-all text-slate-200 scrollbar-thin">
                  {textError ? (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{textError}</span>
                    </div>
                  ) : textOutput || <span className="text-slate-600">{t.placeholder_output || 'Result will appear here...'}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleTextModeSwap}
                disabled={!textOutput}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/10 border border-blue-600/30 text-blue-400 text-xs font-black hover:bg-blue-600/20 transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4" />
                {t.button_swap || 'Swap & Reverse'}
              </button>
              <button
                onClick={resetWorkspace}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer outline-none"
              >
                <Trash2 className="w-4 h-4" />
                {t.button_clear || 'Clear All'}
              </button>
            </div>
          </>
        )}

        {/* IMAGE TAB */}
        {tab === 'image' && (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setImageMode('encode')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border ${
                  imageMode === 'encode' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-slate-500 hover:text-white border-transparent'
                }`}
              >
                {t.mode_image_to_b64 || 'Image → Base64'}
              </button>
              <button
                onClick={() => setImageMode('decode')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border ${
                  imageMode === 'decode' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'text-slate-500 hover:text-white border-transparent'
                }`}
              >
                {t.mode_b64_to_image || 'Base64 → Image'}
              </button>
            </div>

            {imageMode === 'encode' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-blue-400" />
                      {t.label_upload_image || 'Upload Image'}
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group ${
                        dragOver ? 'border-blue-500/60 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/40 hover:bg-slate-950/40'
                      }`}
                    >
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                      <div className="w-14 h-14 bg-white/5 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all">
                        <ImageIcon className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {t.image_drag || 'Drag & drop an image here, or click to browse'}
                        </p>
                        <p className="text-xs text-slate-500">{t.image_formats || 'PNG, JPG, GIF, WebP, SVG'}</p>
                      </div>
                    </div>

                    {imageFile && (
                      <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 overflow-hidden">
                            {imagePreview && <img src={imagePreview} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white truncate max-w-xs">{imageFile.name}</p>
                            <p className="text-[10px] text-slate-500">{formatBytes(imageSize)} → {formatBytes(dataUrlSize)} (base64)</p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setImageFile(null); setImageDataUrl(''); setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      {t.label_data_url || 'Data URL Output'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-600 font-mono">{dataUrlSize > 0 ? formatBytes(dataUrlSize) : ''}</span>
                      {imageDataUrl && (
                        <button
                          onClick={handleCopyDataUrl}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border ${
                            copiedText ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-400 hover:text-white'
                          }`}
                          title={t.tooltip_copy || 'Copy'}
                        >
                          {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-64 p-5 overflow-auto font-mono text-xs break-all text-slate-200 scrollbar-thin">
                    {imageDataUrl || <span className="text-slate-600">{t.placeholder_data_url || 'Upload an image to generate its Base64 Data URL...'}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                      {t.label_base64_input_image || 'Base64 Input'}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">{base64InputCharCount} chars</span>
                  </div>
                  <textarea
                    value={base64Input}
                    onChange={(e) => handleBase64Decode(e.target.value)}
                    placeholder={t.placeholder_base64_image || 'Paste a Base64 string or Data URL to preview and download the image...'}
                    className="w-full h-64 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none resize-none scrollbar-thin"
                    spellCheck={false}
                  />
                </div>

                <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      {t.label_image_preview || 'Image Preview'}
                    </span>
                    {decodedImagePreview && (
                      <button
                        onClick={handleDownloadDecoded}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[11px] font-bold hover:bg-blue-600/30 transition-all cursor-pointer outline-none"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {t.button_download || 'Download'}
                      </button>
                    )}
                  </div>
                  <div className="w-full h-64 p-5 overflow-auto flex items-center justify-center scrollbar-thin">
                    {decodedImageError ? (
                      <div className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{decodedImageError}</span>
                      </div>
                    ) : decodedImagePreview ? (
                      <img src={decodedImagePreview} alt="Decoded" className="max-w-full max-h-full object-contain rounded-lg" />
                    ) : (
                      <span className="text-slate-600 text-sm">{t.placeholder_image_preview || 'Paste Base64 to see the image...'}</span>
                    )}
                  </div>
                </div>
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
