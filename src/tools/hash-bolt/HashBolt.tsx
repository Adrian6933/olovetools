import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { 
  Lock, 
  File, 
  Clipboard, 
  Check, 
  X, 
  AlertCircle, 
  Copy, 
  RotateCcw, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  FileText,
  Binary
} from 'lucide-react';
import { computeHash, bufferToHex, bufferToBase64 } from './utils/hashAlgorithms';
import { legalTranslations } from '../../locales/legal';

interface HashBoltProps {
  lang: string;
  dictionary: any;
}

export default function HashBolt({ lang, dictionary }: HashBoltProps) {
  const t = dictionary || {};
  
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<string>('SHA-256');
  const [outputFormat, setOutputFormat] = useState<'hex' | 'base64'>('hex');
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  
  const [computedHash, setComputedHash] = useState<string>('');
  const [expectedHash, setExpectedHash] = useState<string>('');
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState<number | null>(null);
  const [fileSpeed, setFileSpeed] = useState<number | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hashComputeTimeout = useRef<any>(null);

  // Trigger hash calculation for text
  useEffect(() => {
    if (activeTab === 'text') {
      if (hashComputeTimeout.current) clearTimeout(hashComputeTimeout.current);
      
      // Debounce slightly for better typing performance on larger text
      hashComputeTimeout.current = setTimeout(() => {
        const encoder = new TextEncoder();
        const buffer = encoder.encode(inputText).buffer;
        const t0 = performance.now();
        computeHash(algorithm, buffer).then(digest => {
          const t1 = performance.now();
          const rawHash = outputFormat === 'hex' ? bufferToHex(digest) : bufferToBase64(digest);
          setComputedHash(isUppercase ? rawHash.toUpperCase() : rawHash.toLowerCase());
          setTimeTaken(Math.round(t1 - t0));
        }).catch(err => {
          console.error(err);
          setComputedHash('');
          setTimeTaken(null);
        });
      }, 50);
    }
  }, [inputText, algorithm, outputFormat, isUppercase, activeTab]);

  // Trigger hash calculation for file
  const handleFileHashing = (selectedFile: File) => {
    setFile(selectedFile);
    setFileError(null);
    setComputedHash('');
    setTimeTaken(null);
    setFileProgress(0);
    setFileSpeed(0);
    
    const startTime = performance.now();
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setFileProgress(pct);
        const elapsed = (performance.now() - startTime) / 1000;
        if (elapsed > 0) {
          const mb = e.loaded / (1024 * 1024);
          setFileSpeed(Math.round((mb / elapsed) * 10) / 10);
        }
      }
    };

    reader.onerror = () => {
      setFileError('Error reading file. Please try again.');
      setFileProgress(null);
      setFile(null);
    };

    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      try {
        const digest = await computeHash(algorithm, buffer);
        const t1 = performance.now();
        const rawHash = outputFormat === 'hex' ? bufferToHex(digest) : bufferToBase64(digest);
        setComputedHash(isUppercase ? rawHash.toUpperCase() : rawHash.toLowerCase());
        setTimeTaken(Math.round(t1 - startTime));
      } catch (err) {
        console.error(err);
        setFileError('Failed to compute hash. The file may be too large.');
      } finally {
        setFileProgress(null);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // Re-run hash if parameters change for a loaded file
  useEffect(() => {
    if (activeTab === 'file' && file) {
      handleFileHashing(file);
    }
  }, [algorithm, outputFormat, isUppercase, activeTab]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileHashing(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileHashing(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    setComputedHash('');
    setTimeTaken(null);
    setFileProgress(null);
    setFileSpeed(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = () => {
    if (!computedHash) return;
    navigator.clipboard.writeText(computedHash);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const resetWorkspace = () => {
    setInputText('');
    setExpectedHash('');
    clearFile();
  };

  // Formatter for readable file sizes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Comparison logic for matching status
  const normalizedExpected = expectedHash.trim().toLowerCase();
  const normalizedComputed = computedHash.trim().toLowerCase();
  const isMatchDefined = expectedHash.trim() !== '' && computedHash !== '';
  const isMatch = isMatchDefined && normalizedExpected === normalizedComputed;

  return (
    <div className="min-h-screen flex flex-col bg-[#020813] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      {/* Glow decorations */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-sky-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <Header 
        currentLang={lang} 
        onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/hash-bolt`}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        
        {/* Banner Title */}
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Lock className="w-8 h-8 text-sky-400 animate-pulse" />
            <span>{t.seoHeroTitle || 'Cryptographic Checksum & Hash Generator'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        {/* Dashboard Panels */}
        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
          
          {/* Controls row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
            
            {/* Input tabs selection */}
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 self-start">
              <button
                onClick={() => { setActiveTab('text'); clearFile(); }}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
                  activeTab === 'text' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t.input_text_tab || 'Text Hashing'}</span>
              </button>
              <button
                onClick={() => { setActiveTab('file'); setInputText(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
                  activeTab === 'file' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Binary className="w-4 h-4" />
                <span>{t.input_file_tab || 'File Hashing'}</span>
              </button>
            </div>

            {/* Selection parameters group */}
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Hash Function Selection */}
              <div className="flex items-center space-x-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-white/5">
                <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-semibold text-slate-400">{t.label_algorithm || 'Function'}:</span>
                <select 
                  value={algorithm} 
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="bg-transparent border-none text-xs text-white font-bold cursor-pointer outline-none focus:ring-0"
                >
                  <option value="SHA-256" className="bg-slate-900 text-white">SHA-256 (Secure)</option>
                  <option value="MD5" className="bg-slate-900 text-white">MD5 (Checksum)</option>
                  <option value="SHA-1" className="bg-slate-900 text-white">SHA-1</option>
                  <option value="SHA-384" className="bg-slate-900 text-white">SHA-384</option>
                  <option value="SHA-512" className="bg-slate-900 text-white">SHA-512 (Strong)</option>
                </select>
              </div>

              {/* Case formats */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setIsUppercase(!isUppercase)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer outline-none ${
                    isUppercase 
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' 
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.format_uppercase || 'Uppercase'}
                </button>

                <button
                  onClick={() => setOutputFormat(outputFormat === 'hex' ? 'base64' : 'hex')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer outline-none ${
                    outputFormat === 'base64' 
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' 
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.format_base64 || 'Base64 Format'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Tab Workspace */}
          <div className="flex-grow">
            {activeTab === 'text' ? (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.placeholder_text || 'Type or paste text here...'}
                className="w-full h-48 p-5 rounded-2xl bg-slate-950/50 border border-white/5 text-slate-300 placeholder-slate-600 font-mono text-sm focus:border-sky-500/50 focus:ring-0 transition-colors resize-none scrollbar-thin outline-none"
              />
            ) : (
              <div className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 hover:border-sky-500/40 bg-slate-950/20 hover:bg-slate-950/40 p-10 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-14 h-14 bg-white/5 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-sky-500/10 group-hover:border-sky-500/30 transition-all">
                    <File className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                      {t.file_drag_inactive || 'Drag & drop a file here, or click to browse'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.file_size_warning || 'All file hashing is strictly executed locally inside your browser.'}
                    </p>
                  </div>
                </div>

                {/* Processing File Bar */}
                {fileProgress !== null && (
                  <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                        <span>{t.file_processing || 'Computing checksum...'}</span>
                      </span>
                      <span className="text-white font-bold">{fileProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 transition-all duration-200" style={{ width: `${fileProgress}%` }} />
                    </div>
                    {fileSpeed && (
                      <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                        <span>{t.file_processing_speed || 'Speed'}: <strong>{fileSpeed} MB/s</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error messages */}
                {fileError && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center space-x-3 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                )}

                {/* File Detail Card */}
                {file && !fileProgress && (
                  <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                        <File className="w-5 h-5 text-sky-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white truncate max-w-md">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{formatBytes(file.size)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={clearFile}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer outline-none"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hashing Result Pane */}
          {computedHash && (
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="uppercase tracking-wider font-mono text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded">
                  {algorithm}
                </span>
                {timeTaken !== null && (
                  <span>
                    {t.file_processing_time || 'Time taken'}: <strong className="text-white font-mono">{timeTaken}ms</strong>
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-grow p-4 bg-slate-950/90 border border-white/5 rounded-xl font-mono text-sm break-all text-white select-all text-left">
                  {computedHash}
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all shrink-0 cursor-pointer outline-none ${
                    copySuccess 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-white/5 border-white/5 hover:bg-sky-500/20 hover:border-sky-500/30 text-slate-400 hover:text-white'
                  }`}
                  title={t.tooltip_copy || 'Copy'}
                >
                  {copySuccess ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Verification deck */}
          <div className="border-t border-white/5 pt-6 space-y-4">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider text-left">
              {t.label_expected_hash || 'Compare with Checksum'}
            </label>
            <input
              type="text"
              value={expectedHash}
              onChange={(e) => setExpectedHash(e.target.value)}
              placeholder={t.match_placeholder || 'Paste expected hash to verify...'}
              className="w-full p-4 rounded-xl bg-slate-950/50 border border-white/5 text-slate-300 placeholder-slate-600 font-mono text-sm focus:border-sky-500/50 focus:ring-0 transition-colors outline-none"
            />

            {/* Matching notification cards */}
            {isMatchDefined && (
              isMatch ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 rounded-2xl flex items-center space-x-3 text-emerald-400 text-sm font-semibold animate-in slide-in-from-top-2 duration-200">
                  <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                  <span>{t.match_success || 'Verified: Hashes match successfully!'}</span>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 px-5 py-4 rounded-2xl flex items-center space-x-3 text-red-400 text-sm font-semibold animate-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                  <span>{t.match_fail || 'Error: Hashes do not match!'}</span>
                </div>
              )
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <Footer 
        lang={lang} 
        t={t} 
        onOpenModal={(modal) => setLegalModal(modal)} 
      />

      {/* Legal Overlays */}
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
