import React, { useState, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Captions, Copy, Check, Download, RotateCcw, ArrowRight, FileText, AlertCircle } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface SubtitlesBoltProps {
  lang: string;
  dictionary: any;
}

type SubFormat = 'srt' | 'vtt' | 'sbv';
type InputFormat = SubFormat | 'auto';

interface Subtitle {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

function timeStrToMs(str: string): number {
  const cleaned = str.trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const sParts = parts[2].split('.');
    const s = parseInt(sParts[0], 10) || 0;
    const ms = sParts[1] ? parseInt(sParts[1].padEnd(3, '0').substring(0, 3), 10) : 0;
    return h * 3600000 + m * 60000 + s * 1000 + ms;
  }
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10) || 0;
    const sParts = parts[1].split('.');
    const s = parseInt(sParts[0], 10) || 0;
    const ms = sParts[1] ? parseInt(sParts[1].padEnd(3, '0').substring(0, 3), 10) : 0;
    return m * 60000 + s * 1000 + ms;
  }
  return 0;
}

function msToSrtTime(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mss = Math.floor(ms % 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(mss).padStart(3, '0')}`;
}

function msToVttTime(ms: number): string {
  return msToSrtTime(ms).replace(',', '.');
}

function msToSbvTime(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mss = Math.floor(ms % 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(mss).padStart(3, '0')}`;
}

function detectFormat(input: string): SubFormat {
  const trimmed = input.trim();
  if (/^WEBVTT/i.test(trimmed)) return 'vtt';
  if (/^\d+\s*\r?\n\d{2}:\d{2}:\d{2},\d{3}\s*-->/.test(trimmed)) return 'srt';
  if (/^\d+:\d{2}:\d{2}\.\d{3},\d+:\d{2}:\d{2}\.\d{3}/m.test(trimmed)) return 'sbv';
  if (/\d{2}:\d{2}:\d{2}\.\d{3}\s*-->/.test(trimmed)) return 'vtt';
  if (/\d{2}:\d{2}:\d{2},\d{3}\s*-->/.test(trimmed)) return 'srt';
  if (/^\d+:\d{2}:\d{2}\.\d{3},/m.test(trimmed)) return 'sbv';
  return 'srt';
}

function parseSrt(input: string): Subtitle[] {
  const blocks = input.trim().split(/\r?\n\r?\n/);
  const subs: Subtitle[] = [];
  let idx = 1;
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    if (lines.length < 2) continue;
    let lineIdx = 0;
    if (/^\d+$/.test(lines[0].trim())) {
      lineIdx = 1;
    }
    const timeLine = lines[lineIdx];
    if (!timeLine) continue;
    const match = timeLine.match(/([\d:.,]+)\s*-->\s*([\d:.,]+)/);
    if (!match) continue;
    const startTime = timeStrToMs(match[1]);
    const endTime = timeStrToMs(match[2]);
    const text = lines.slice(lineIdx + 1).join('\n').trim();
    subs.push({ index: idx++, startTime, endTime, text });
  }
  return subs;
}

function parseVtt(input: string): Subtitle[] {
  let text = input.trim();
  text = text.replace(/^WEBVTT[^\n]*\n?/i, '');
  const blocks = text.trim().split(/\r?\n\r?\n/);
  const subs: Subtitle[] = [];
  let idx = 1;
  for (const block of blocks) {
    if (/^NOTE/i.test(block) || /^STYLE/i.test(block) || /^REGION/i.test(block)) continue;
    const lines = block.split(/\r?\n/);
    if (lines.length < 1) continue;
    let lineIdx = 0;
    if (!lines[0].includes('-->')) {
      lineIdx = 1;
      if (lines.length < 2) continue;
    }
    const timeLine = lines[lineIdx];
    if (!timeLine) continue;
    const match = timeLine.match(/([\d:.,]+)\s*-->\s*([\d:.,]+)/);
    if (!match) continue;
    const startTime = timeStrToMs(match[1]);
    const endTime = timeStrToMs(match[2]);
    const cueText = lines.slice(lineIdx + 1).join('\n').trim();
    subs.push({ index: idx++, startTime, endTime, text: cueText });
  }
  return subs;
}

function parseSbv(input: string): Subtitle[] {
  const blocks = input.trim().split(/\r?\n\r?\n/);
  const subs: Subtitle[] = [];
  let idx = 1;
  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    if (lines.length < 2) continue;
    const match = lines[0].match(/([\d:.,]+),([\d:.,]+)/);
    if (!match) continue;
    const startTime = timeStrToMs(match[1]);
    const endTime = timeStrToMs(match[2]);
    const text = lines.slice(1).join('\n').trim();
    subs.push({ index: idx++, startTime, endTime, text });
  }
  return subs;
}

function parseSubtitles(input: string, format: SubFormat): Subtitle[] {
  if (format === 'srt') return parseSrt(input);
  if (format === 'vtt') return parseVtt(input);
  return parseSbv(input);
}

function formatSrt(subs: Subtitle[]): string {
  return subs.map(s => `${s.index}\n${msToSrtTime(s.startTime)} --> ${msToSrtTime(s.endTime)}\n${s.text}`).join('\n\n') + '\n';
}

function formatVtt(subs: Subtitle[]): string {
  return 'WEBVTT\n\n' + subs.map(s => `${msToVttTime(s.startTime)} --> ${msToVttTime(s.endTime)}\n${s.text}`).join('\n\n') + '\n';
}

function formatSbv(subs: Subtitle[]): string {
  return subs.map(s => `${msToSbvTime(s.startTime)},${msToSbvTime(s.endTime)}\n${s.text}`).join('\n\n') + '\n';
}

function formatSubtitles(subs: Subtitle[], format: SubFormat): string {
  if (format === 'srt') return formatSrt(subs);
  if (format === 'vtt') return formatVtt(subs);
  return formatSbv(subs);
}

function msToReadable(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mss = Math.floor(ms % 1000);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}.${String(mss).padStart(3, '0')}s`;
}

export default function SubtitlesBolt({ lang, dictionary }: SubtitlesBoltProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [input, setInput] = useState('');
  const [inputFormat, setInputFormat] = useState<InputFormat>('auto');
  const [targetFormat, setTargetFormat] = useState<SubFormat>('srt');
  const [copied, setCopied] = useState(false);

  const detectedFormat = useMemo(() => detectFormat(input), [input]);
  const activeInputFormat = useMemo<SubFormat>(
    () => (inputFormat === 'auto' ? detectedFormat : inputFormat),
    [inputFormat, detectedFormat]
  );

  const { subtitles, error } = useMemo(() => {
    if (!input.trim()) return { subtitles: [] as Subtitle[], error: '' };
    try {
      const subs = parseSubtitles(input, activeInputFormat);
      if (subs.length === 0) {
        return { subtitles: [] as Subtitle[], error: t.error_no_subtitles || 'No valid subtitles found. Check the format and try again.' };
      }
      return { subtitles: subs, error: '' };
    } catch {
      return { subtitles: [] as Subtitle[], error: t.error_parse || 'Failed to parse subtitles.' };
    }
  }, [input, activeInputFormat, t]);

  const output = useMemo(() => {
    if (error || subtitles.length === 0) return '';
    return formatSubtitles(subtitles, targetFormat);
  }, [subtitles, error, targetFormat]);

  const stats = useMemo(() => {
    if (subtitles.length === 0) return null;
    const firstStart = subtitles[0].startTime;
    const lastEnd = subtitles[subtitles.length - 1].endTime;
    return {
      count: subtitles.length,
      firstStart,
      lastEnd,
      duration: lastEnd - firstStart,
    };
  }, [subtitles]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const ext = targetFormat === 'srt' ? 'srt' : targetFormat === 'vtt' ? 'vtt' : 'sbv';
    const mime = targetFormat === 'srt' ? 'application/x-subrip' : targetFormat === 'vtt' ? 'text/vtt' : 'text/plain';
    const blob = new Blob([output], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subtitles-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [output, targetFormat]);

  const resetWorkspace = useCallback(() => {
    setInput('');
    setInputFormat('auto');
    setTargetFormat('srt');
    setCopied(false);
  }, []);

  const formatLabel = (f: SubFormat | 'auto'): string => {
    if (f === 'auto') return t.format_auto || 'Auto';
    if (f === 'srt') return 'SRT';
    if (f === 'vtt') return 'VTT';
    return 'SBV';
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020610] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/subtitles-bolt`}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">

        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Captions className="w-8 h-8 text-blue-400" />
            <span>{t.seoHeroTitle || 'Subtitle Converter'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                {t.label_input || 'Input Subtitles'}
              </span>
              <div className="flex items-center gap-2">
                {inputFormat === 'auto' && input.trim() && (
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {formatLabel(detectedFormat)}
                  </span>
                )}
                <select
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value as InputFormat)}
                  className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2.5 py-1.5 rounded-lg outline-none font-bold cursor-pointer hover:border-blue-500/30 transition-colors"
                >
                  <option value="auto" className="bg-[#020610]">{formatLabel('auto')}</option>
                  <option value="srt" className="bg-[#020610]">SRT</option>
                  <option value="vtt" className="bg-[#020610]">VTT</option>
                  <option value="sbv" className="bg-[#020610]">SBV</option>
                </select>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder_input || 'Paste your subtitles here (SRT, VTT, or SBV)...'}
              className="w-full h-72 p-5 bg-transparent text-slate-200 placeholder-slate-600 font-mono text-sm focus:outline-none resize-none scrollbar-thin"
              spellCheck={false}
            />
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-[#0a1a3a]/30">
              <span className="text-[10px] text-slate-600 font-mono">{input.length} chars</span>
              {stats && (
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                  <span className="text-blue-400 font-bold">{stats.count} {t.unit_cues || 'cues'}</span>
                  <span>{msToReadable(stats.firstStart)} → {msToReadable(stats.lastEnd)}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1a3a]/50">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                {t.label_output || 'Converted Output'}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value as SubFormat)}
                  className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2.5 py-1.5 rounded-lg outline-none font-bold cursor-pointer hover:border-blue-500/30 transition-colors"
                >
                  <option value="srt" className="bg-[#020610]">SRT</option>
                  <option value="vtt" className="bg-[#020610]">VTT</option>
                  <option value="sbv" className="bg-[#020610]">SBV</option>
                </select>
                {output && (
                  <button
                    onClick={handleCopy}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border ${
                      copied ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 hover:bg-blue-500/20 hover:border-blue-500/30 text-slate-400 hover:text-white'
                    }`}
                    title={t.tooltip_copy || 'Copy'}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                {output && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 text-[11px] font-bold hover:bg-blue-600/30 transition-all cursor-pointer outline-none"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t.button_download || 'Download'}
                  </button>
                )}
              </div>
            </div>
            <div className="w-full h-72 p-5 overflow-auto font-mono text-sm text-slate-200 scrollbar-thin whitespace-pre-wrap break-words">
              {error ? (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : output || <span className="text-slate-600">{t.placeholder_output || 'Converted subtitles will appear here...'}</span>}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-[#0a1a3a]/30">
              <span className="text-[10px] text-slate-600 font-mono">{output.length} chars</span>
              {stats && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {t.label_duration || 'Duration'}: {msToReadable(stats.duration)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={resetWorkspace}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-black hover:bg-white/10 hover:text-white transition-all cursor-pointer outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            {t.button_reset || 'Reset'}
          </button>
        </div>

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
