import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { AlignLeft, Copy, Check, Download, RotateCcw, FileText, Wand2 } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface LoremFlowProps {
  lang: string;
  dictionary: any;
}

type UnitType = 'paragraphs' | 'sentences' | 'words';

const WORD_POOL: string[] = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'eiusmod', 'tempor', 'incididunt', 'labore', 'dolore', 'magna', 'aliqua',
  'enim', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris',
  'nisi', 'aliquip', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'proident', 'sunt', 'culpa', 'officia', 'deserunt',
  'mollit', 'anim', 'laborum', 'diam', 'voluptas', 'vero', 'eos', 'accusamus',
  'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis', 'praesentium', 'voluptatum',
  'deleniti', 'atque', 'corrupti', 'quos', 'dolores', 'molestias', 'excepturi',
  'cupiditate', 'provident', 'similique', 'mollitia', 'animi', 'dolorum', 'fuga',
  'harum', 'quidem', 'rerum', 'facilis', 'expedita', 'distinctio', 'nam', 'libero',
  'tempore', 'soluta', 'nobis', 'eligendi', 'optio', 'cumque', 'nihil', 'impedit',
  'quo', 'minus', 'maxime', 'placeat', 'facere', 'possimus', 'omnis', 'assumenda',
  'repellendus', 'temporibus', 'autem', 'quibusdam', 'debitis', 'necessitatibus',
  'saepe', 'eveniet', 'voluptates', 'repudiandae', 'recusandae', 'itaque', 'earum',
  'tenetur', 'sapiente', 'delectus', 'reiciendis', 'voluptatibus', 'maiores', 'alias',
  'consequatur', 'perferendis', 'doloribus', 'asperiores', 'repellat', 'maiores',
  'veritatis', 'architecto', 'beatae', 'vitae', 'dicta', 'explicabo', 'nemo',
  'ipsam', 'quia', 'modi', 'tempora', 'incidunt', 'magnam', 'quaerat', 'voluptatem',
  'adipisci', 'numquam', 'eius', 'modi', 'tempora', 'voluptas', 'nostri', 'sequi',
  'necessitatibus', 'saepe', 'eveniet', 'quas', 'totam', 'rem', 'aperiam', 'earum',
  'voluptas', 'corporis', 'commodi', 'consequatur', 'accusamus', 'accusantium',
  'doloremque', 'laudantium', 'totam', 'rem', 'aperiam', 'ipsa', 'quae', 'ab',
  'illo', 'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'ipsam',
  'natus', 'ratione', 'sequi', 'perspiciatis', 'unde', 'omnis', 'iste', 'natus',
  'error', 'voluptatem', 'accusantium', 'doloremque', 'laudantium'
];

const CLASSIC_OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const UNITS: { id: UnitType; label: string }[] = [
  { id: 'paragraphs', label: 'Paragraphs' },
  { id: 'sentences', label: 'Sentences' },
  { id: 'words', label: 'Words' },
];

const pickRandom = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const generateSentence = (minWords = 8, maxWords = 18): string => {
  const length = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words: string[] = [];
  for (let i = 0; i < length; i++) words.push(pickRandom(WORD_POOL));
  return capitalize(words.join(' ')) + '.';
};

const generateParagraph = (): string => {
  const sentenceCount = Math.floor(Math.random() * 4) + 3;
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) sentences.push(generateSentence());
  return sentences.join(' ');
};

const buildText = (unit: UnitType, count: number, startClassic: boolean): string => {
  const safeCount = Math.max(1, Math.min(100, Math.floor(count)));

  if (unit === 'words') {
    if (startClassic) {
      const classicWords = CLASSIC_OPENING.replace(/\./g, '').split(/\s+/).filter(Boolean);
      const head = classicWords.slice(0, Math.min(safeCount, classicWords.length));
      const remaining = Math.max(0, safeCount - head.length);
      const tail: string[] = [];
      for (let i = 0; i < remaining; i++) tail.push(pickRandom(WORD_POOL));
      return [...head, ...tail].join(' ');
    }
    const words: string[] = [];
    for (let i = 0; i < safeCount; i++) words.push(pickRandom(WORD_POOL));
    return words.join(' ');
  }

  if (unit === 'sentences') {
    const sentences: string[] = [];
    for (let i = 0; i < safeCount; i++) {
      sentences.push(i === 0 && startClassic ? CLASSIC_OPENING : generateSentence());
    }
    return sentences.join(' ');
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    if (i === 0 && startClassic) {
      paragraphs.push(CLASSIC_OPENING + ' ' + generateParagraph());
    } else {
      paragraphs.push(generateParagraph());
    }
  }
  return paragraphs.join('\n\n');
};

export default function LoremFlow({ lang, dictionary }: LoremFlowProps) {
  const t = dictionary || {};
  const [unit, setUnit] = useState<UnitType>('paragraphs');
  const [count, setCount] = useState<number>(5);
  const [startClassic, setStartClassic] = useState<boolean>(true);
  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [text]);

  const handleGenerate = useCallback(() => {
    setText(buildText(unit, count, startClassic));
    setCopied(false);
  }, [unit, count, startClassic]);

  useEffect(() => {
    setText(buildText('paragraphs', 5, true));
  }, []);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lorem-flow-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetWorkspace = useCallback(() => {
    setUnit('paragraphs');
    setCount(5);
    setStartClassic(true);
    setCopied(false);
    setText(buildText('paragraphs', 5, true));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0408] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l}/lorem-flow`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-lorem-flow-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <AlignLeft className="w-8 h-8 text-violet-400" />
            <span>{t.seoHeroTitle || 'LoremFlow'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="flex flex-col bg-violet-950/20 border border-violet-500/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-violet-400" />
                <label className="text-xs font-black text-violet-400 uppercase tracking-widest text-left">
                  {t.label_unit_type || 'Unit Type'}
                </label>
              </div>
              <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-[#0a0408]/60 border border-white/5 p-1">
                {UNITS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUnit(u.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer outline-none border-none ${
                      unit === u.id
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                        : 'text-slate-400 hover:text-white bg-transparent'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <label className="text-xs font-black text-violet-400 uppercase tracking-widest text-left">
                    {t.label_count || 'Count'}
                  </label>
                </div>
                <span className="text-2xl font-black text-white font-mono tabular-nums">
                  {count}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/5 accent-violet-500 outline-none"
                style={{
                  background: `linear-gradient(to right, rgb(139 92 246 / 0.6) 0%, rgb(139 92 246 / 0.6) ${(count / 100) * 100}%, rgba(255,255,255,0.05) ${(count / 100) * 100}%, rgba(255,255,255,0.05) 100%)`,
                }}
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-600 font-mono">
                <span>1</span>
                <span>100</span>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 border-t border-white/5 pt-5">
              <div className="flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-violet-400" />
                <label className="text-xs font-black text-violet-400 uppercase tracking-widest text-left">
                  {t.label_start_lorem || 'Start with "Lorem ipsum"'}
                </label>
              </div>
              <button
                onClick={() => setStartClassic((v) => !v)}
                role="switch"
                aria-checked={startClassic}
                className={`relative w-12 h-6 rounded-full transition-all cursor-pointer outline-none border-none ${
                  startClassic ? 'bg-violet-500/60' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                    startClassic ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleGenerate}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer outline-none shadow-lg shadow-violet-600/30"
            >
              <Wand2 className="w-4 h-4" />
              {t.button_generate || 'Generate'}
            </button>
          </div>
        </div>

        <div className="flex flex-col bg-violet-950/20 border border-violet-500/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-3.5">
            <span className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-violet-400" />
              {t.label_output || 'Generated Text'}
            </span>
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              {t.label_words || 'Words'}: <span className="text-violet-300">{wordCount.toLocaleString()}</span>
            </span>
          </div>
          <div className="px-6 py-6 min-h-[280px] max-h-[480px] overflow-y-auto">
            {text ? (
              <p className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-light">
                {text}
              </p>
            ) : (
              <p className="text-slate-600 text-sm italic">
                {t.message_empty || 'Press Generate to create Lorem Ipsum text.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-white/5 pt-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-mono">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span>{t.label_total_words || 'Total words'}: <span className="text-violet-300 font-black">{wordCount.toLocaleString()}</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              disabled={!text}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-white/5 border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-violet-300'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? (t.message_copied || 'Copied!') : (t.button_copy || 'Copy')}
            </button>
            <button
              onClick={handleDownload}
              disabled={!text}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
            >
              <Download className="w-4 h-4" />
              {t.button_download || 'Download .txt'}
            </button>
            <button
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_reset || 'Reset'}
            </button>
          </div>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-lorem-flow-bottom" />
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
