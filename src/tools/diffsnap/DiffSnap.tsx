import React, { useState, useRef } from 'react';
import { GitCompare, FileText, Upload, RefreshCw, Sparkles, BookOpen, Layers, ArrowRightLeft, FileCode, CheckCircle, Info } from 'lucide-react';
import { createTranslator, type Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { legalTranslations } from '../../locales/legal';

interface DiffSnapProps {
  lang: string;
  dictionary: any;
}

interface DiffLine {
  type: 'removed' | 'added' | 'unchanged';
  value: string;
  line1?: number;
  line2?: number;
}

interface AlignedRow {
  left: { type: 'removed' | 'unchanged'; value: string; num: number } | null;
  right: { type: 'added' | 'unchanged'; value: string; num: number } | null;
}

export const DiffSnap: React.FC<DiffSnapProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);

  // Input text states
  const [textA, setTextA] = useState<string>('');
  const [textB, setTextB] = useState<string>('');

  // Compared results states
  const [isCompared, setIsCompared] = useState<boolean>(false);
  const [diffResult, setDiffResult] = useState<DiffLine[]>([]);
  const [alignedRows, setAlignedRows] = useState<AlignedRow[]>([]);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  // Stats
  const [additionsCount, setAdditionsCount] = useState<number>(0);
  const [deletionsCount, setDeletionsCount] = useState<number>(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  // File upload input refs
  const fileInputRefA = useRef<HTMLInputElement>(null);
  const fileInputRefB = useRef<HTMLInputElement>(null);

  // Sample loads
  const codeSampleA = `function greet(user) {
  console.log("Hello, " + user + "!");
  return true;
}`;

  const codeSampleB = `// Enhanced greeting helper
function greet(user = "Guest") {
  console.log(\`Hello, \${user}!\`);
  console.log("Welcome to DiffSnap");
  return { success: true };
}`;

  const textSampleA = `The quick brown fox jumps over the lazy dog.
This is a simple paragraph to test comparison.
Many sentences remain unchanged.
We want to see red and green highlights.`;

  const textSampleB = `The quick brown fox jumps over the sleepy dog.
This is a simple paragraph to test the diff comparison.
Many sentences remain unchanged.
We want to see bright red and green highlights clearly.`;

  const handleLoadSample = (type: 'code' | 'text') => {
    if (type === 'code') {
      setTextA(codeSampleA);
      setTextB(codeSampleB);
    } else {
      setTextA(textSampleA);
      setTextB(textSampleB);
    }
    setIsCompared(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (target === 'A') {
        setTextA(content);
      } else {
        setTextB(content);
      }
      setIsCompared(false);
    };
    reader.readAsText(file);
  };

  // Myers LCS diff calculation
  const runComparison = () => {
    const linesA = textA.split(/\r?\n/);
    const linesB = textB.split(/\r?\n/);
    
    const n = linesA.length;
    const m = linesB.length;
    
    // DP matrix for Longest Common Subsequence
    const dp: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
    
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (linesA[i - 1] === linesB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    let i = n;
    let j = m;
    const result: DiffLine[] = [];
    let additions = 0;
    let deletions = 0;
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
        result.unshift({ type: 'unchanged', value: linesA[i - 1], line1: i, line2: j });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'added', value: linesB[j - 1], line2: j });
        additions++;
        j--;
      } else {
        result.unshift({ type: 'removed', value: linesA[i - 1], line1: i });
        deletions++;
        i--;
      }
    }
    
    // Align rows for Side-by-Side (Split) View
    const aligned: AlignedRow[] = [];
    let idx = 0;
    while (idx < result.length) {
      const current = result[idx];
      
      if (current.type === 'unchanged') {
        aligned.push({
          left: { type: 'unchanged', value: current.value, num: current.line1! },
          right: { type: 'unchanged', value: current.value, num: current.line2! }
        });
        idx++;
      } else if (current.type === 'removed') {
        // modified line detection
        if (idx + 1 < result.length && result[idx + 1].type === 'added') {
          aligned.push({
            left: { type: 'removed', value: current.value, num: current.line1! },
            right: { type: 'added', value: result[idx + 1].value, num: result[idx + 1].line2! }
          });
          idx += 2;
        } else {
          aligned.push({
            left: { type: 'removed', value: current.value, num: current.line1! },
            right: null
          });
          idx++;
        }
      } else { // type === 'added'
        aligned.push({
          left: null,
          right: { type: 'added', value: current.value, num: current.line2! }
        });
        idx++;
      }
    }

    setDiffResult(result);
    setAlignedRows(aligned);
    setAdditionsCount(additions);
    setDeletionsCount(deletions);
    setIsCompared(true);
  };

  const handleReset = () => {
    setIsCompared(false);
    setDiffResult([]);
    setAlignedRows([]);
  };

  const resetInputs = () => {
    setTextA('');
    setTextB('');
    handleReset();
  };

  return (
    <div className="min-h-screen bg-[#050809] text-slate-200 font-sans flex flex-col">
      <Header
        currentLang={lang}
        onLanguageChange={(newLang) => {
          window.location.href = `/${newLang.toLowerCase()}/diffsnap`;
        }}
        onReset={resetInputs}
        t={t}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 pt-36 pb-24 relative z-10 flex flex-col justify-start items-center">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-diffsnap-top" />
        {/* Hero title */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-white mb-3 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
            {t.seoHeroTitle || 'Compare Code and Texts Locally'}
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto font-medium">
            {t.seoHeroText || 'Compute line-level updates client-side. Absolute privacy for your custom files and codebases.'}
          </p>
        </div>

        {/* 
          PHASE 1: Text Editors Input Area
        */}
        {!isCompared ? (
          <div className="w-full flex flex-col gap-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Quick load presets panel */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleLoadSample('code')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-cyan-300 rounded-xl border border-white/5 transition-all text-xs font-bold cursor-pointer"
              >
                <FileCode className="w-4 h-4" />
                <span>{t.label_sample_code || 'Load Code Sample'}</span>
              </button>
              <button
                onClick={() => handleLoadSample('text')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-cyan-300 rounded-xl border border-white/5 transition-all text-xs font-bold cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{t.label_sample_text || 'Load Text Sample'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-full">
              {/* Original Editor Box */}
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {t.label_original || 'Original Text (A)'}
                  </span>
                  
                  <button
                    onClick={() => fileInputRefA.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.label_import || 'Import'}</span>
                  </button>
                  <input
                    ref={fileInputRefA}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'A')}
                  />
                </div>

                <textarea
                  value={textA}
                  onChange={(e) => setTextA(e.target.value)}
                  className="flex-1 w-full min-h-[300px] md:min-h-[400px] bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-200 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-y"
                  placeholder="Paste original text or drop your code file here..."
                />
              </div>

              {/* Modified Editor Box */}
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4 relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {t.label_modified || 'Modified Text (B)'}
                  </span>
                  
                  <button
                    onClick={() => fileInputRefB.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.label_import || 'Import'}</span>
                  </button>
                  <input
                    ref={fileInputRefB}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'B')}
                  />
                </div>

                <textarea
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  className="flex-1 w-full min-h-[300px] md:min-h-[400px] bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-200 font-mono text-sm leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-y"
                  placeholder="Paste modified text or drop updated script file here..."
                />
              </div>
            </div>

            {/* Compare trigger button */}
            <div className="flex justify-center mt-4">
              <button
                onClick={runComparison}
                disabled={!textA.trim() && !textB.trim()}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-20 text-white font-black text-sm uppercase rounded-2xl transition-all cursor-pointer active:scale-95 duration-200 border-none outline-none shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
              >
                <GitCompare className="w-5 h-5 animate-pulse" />
                <span>{t.btn_compare || 'Compare Texts'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* 
            PHASE 2: Comparison Result Viewer Workspace
          */
          <div className="w-full max-w-6xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Top diagnostic statistics board */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{t.stat_additions || 'Additions'}:</span>
                  <span className="text-emerald-400 font-mono">+{additionsCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{t.stat_deletions || 'Deletions'}:</span>
                  <span className="text-rose-400 font-mono">-{deletionsCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Lines:</span>
                  <span className="text-slate-200 font-mono">{textA.split(/\r?\n/).length} → {textB.split(/\r?\n/).length}</span>
                </div>
              </div>

              {/* Action layout controls */}
              <div className="flex items-center gap-2">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-1 flex gap-1">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{t.btn_split || 'Split View'}</span>
                  </button>
                  <button
                    onClick={() => setViewMode('unified')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                      viewMode === 'unified'
                        ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{t.btn_unified || 'Unified View'}</span>
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.btn_reset || 'New Compare'}</span>
                </button>
              </div>
            </div>

            {/* Content pane diff display */}
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
              {diffResult.length === 0 || (additionsCount === 0 && deletionsCount === 0) ? (
                <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
                  <CheckCircle className="w-16 h-16 text-cyan-400 animate-bounce" />
                  <h3 className="text-xl font-bold text-white">
                    {t.no_diff || 'No differences detected!'}
                  </h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Both input texts are identical line for line.
                  </p>
                </div>
              ) : viewMode === 'split' ? (
                /* SPLIT VIEW (Side by Side Side aligned layout) */
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 font-mono text-xs overflow-x-auto select-text">
                  
                  {/* Left Column (Original Text A - removals) */}
                  <div className="flex flex-col min-w-[300px]">
                    <div className="px-4 py-2 bg-black/40 border-b border-white/10 text-slate-400 font-bold tracking-wider text-[10px] uppercase flex justify-between">
                      <span>{t.label_original || 'Original Text (A)'}</span>
                      <span className="text-rose-400 font-bold">-{deletionsCount}</span>
                    </div>

                    <div className="flex flex-col py-2">
                      {alignedRows.map((row, index) => {
                        const cell = row.left;
                        if (!cell) {
                          // Render aligned blank space where B has addition
                          return (
                            <div key={index} className="flex h-6 bg-slate-900/30 opacity-20">
                              <div className="w-12 border-r border-white/5 shrink-0 bg-black/20 text-slate-800 text-right pr-2 select-none" />
                              <div className="px-4 text-slate-800 select-none" />
                            </div>
                          );
                        }

                        const isRemoved = cell.type === 'removed';
                        return (
                          <div
                            key={index}
                            className={`flex h-6 items-center ${
                              isRemoved 
                                ? 'bg-rose-950/35 text-rose-200 border-l-4 border-rose-500/80' 
                                : 'text-slate-300 hover:bg-white/[0.02]'
                            }`}
                          >
                            <div className="w-12 border-r border-white/5 shrink-0 bg-black/30 text-slate-500 text-right pr-2 select-none font-bold">
                              {cell.num}
                            </div>
                            <div className="px-4 whitespace-pre overflow-x-auto scrollbar-hide flex-1">
                              {isRemoved ? `- ${cell.value}` : `  ${cell.value}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column (Modified Text B - additions) */}
                  <div className="flex flex-col min-w-[300px]">
                    <div className="px-4 py-2 bg-black/40 border-b border-white/10 text-slate-400 font-bold tracking-wider text-[10px] uppercase flex justify-between">
                      <span>{t.label_modified || 'Modified Text (B)'}</span>
                      <span className="text-emerald-400 font-bold">+{additionsCount}</span>
                    </div>

                    <div className="flex flex-col py-2">
                      {alignedRows.map((row, index) => {
                        const cell = row.right;
                        if (!cell) {
                          // Render aligned blank space where A has deletion
                          return (
                            <div key={index} className="flex h-6 bg-slate-900/30 opacity-20">
                              <div className="w-12 border-r border-white/5 shrink-0 bg-black/20 text-slate-800 text-right pr-2 select-none" />
                              <div className="px-4 text-slate-800 select-none" />
                            </div>
                          );
                        }

                        const isAdded = cell.type === 'added';
                        return (
                          <div
                            key={index}
                            className={`flex h-6 items-center ${
                              isAdded 
                                ? 'bg-emerald-950/35 text-emerald-200 border-l-4 border-emerald-500/80' 
                                : 'text-slate-300 hover:bg-white/[0.02]'
                            }`}
                          >
                            <div className="w-12 border-r border-white/5 shrink-0 bg-black/30 text-slate-500 text-right pr-2 select-none font-bold">
                              {cell.num}
                            </div>
                            <div className="px-4 whitespace-pre overflow-x-auto scrollbar-hide flex-1">
                              {isAdded ? `+ ${cell.value}` : `  ${cell.value}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                /* UNIFIED VIEW (Merged combined rows list view) */
                <div className="flex flex-col py-3 font-mono text-xs overflow-x-auto select-text">
                  {diffResult.map((line, index) => {
                    const isAdded = line.type === 'added';
                    const isRemoved = line.type === 'removed';

                    return (
                      <div
                        key={index}
                        className={`flex h-6 items-center ${
                          isAdded
                            ? 'bg-emerald-950/35 text-emerald-200 border-l-4 border-emerald-500/80'
                            : isRemoved
                            ? 'bg-rose-950/35 text-rose-200 border-l-4 border-rose-500/80'
                            : 'text-slate-300 hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Line number indicators */}
                        <div className="w-12 border-r border-white/5 shrink-0 bg-black/30 text-slate-600 text-right pr-2 select-none font-bold">
                          {line.line1 || ' '}
                        </div>
                        <div className="w-12 border-r border-white/5 shrink-0 bg-black/20 text-slate-600 text-right pr-2 select-none font-bold">
                          {line.line2 || ' '}
                        </div>

                        {/* Sign indicator */}
                        <div className={`px-2 select-none font-bold ${
                          isAdded ? 'text-emerald-400' : isRemoved ? 'text-rose-400' : 'text-slate-600'
                        }`}>
                          {isAdded ? '+' : isRemoved ? '-' : ' '}
                        </div>

                        <div className="px-2 whitespace-pre overflow-x-auto scrollbar-hide flex-1">
                          {line.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reset help button under results */}
            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-white/5"
              >
                Change Text Inputs
              </button>
            </div>
          </div>
        )}

        {/* SEO diagnostic article grids */}
        <div className="max-w-5xl mx-auto w-full mt-24 border-t border-white/5 pt-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/15 transition-colors">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoBrowserSpeedTitle || 'Myers LCS Diffing'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoBrowserSpeedText || 'Computes dynamic text modifications locally. Zero server latency, rendering edits in milliseconds.'}
              </p>
            </div>
            
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/15 transition-colors">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoUseCaseTitle || 'Developer Diagnoses'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoUseCaseText || 'Inspect code changes, script rewrites, or translated texts side-by-side. Copy diff summaries or download exports.'}
              </p>
            </div>

            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:border-cyan-500/15 transition-colors">
              <h3 className="text-white font-bold text-lg mb-3">
                {t.seoPrivacyTitle || '100% Client-Side Privacy'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t.seoPrivacyText || 'We do not capture or look at your scripts or texts. Comparisons happen in local RAM sandboxes.'}
              </p>
            </div>
          </div>
        </div>

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-diffsnap-bottom" />
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(type) => {
          setModalType(type);
          setModalOpen(true);
        }}
      />

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'privacy' 
            ? (legalTranslations[lang]?.privacy.title || 'Privacy Policy')
            : modalType === 'terms'
            ? (legalTranslations[lang]?.terms.title || 'Terms of Service')
            : (legalTranslations[lang]?.cookies.title || 'Cookie Policy')
        }
        content={
          modalType === 'privacy'
            ? (legalTranslations[lang]?.privacy.content || '')
            : modalType === 'terms'
            ? (legalTranslations[lang]?.terms.content || '')
            : (legalTranslations[lang]?.cookies.content || '')
        }
        t={t}
      />
    </div>
  );
};

export default DiffSnap;
