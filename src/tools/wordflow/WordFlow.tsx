import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, Language } from '../../locales/dictionary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  BookOpen, 
  Volume2, 
  Clock,
  Code,
  Heading,
  RefreshCw,
  Sliders,
  AlignLeft,
  Briefcase,
  PenTool,
  Smile,
  Shield,
  Search
} from 'lucide-react';

interface WordFlowProps {
  lang: Language;
  dictionary: any;
}

interface SentimentMetrics {
  positive: number;
  neutral: number;
  negative: number;
}

interface ToneMetrics {
  formal: number;
  casual: number;
  academic: number;
  confident: number;
  creative: number;
}

// Multilingual Sentiment Dictionary Seeds (Stemmed / Root Words)
const SENTIMENT_SEEDS = {
  positive: [
    'happy', 'good', 'great', 'love', 'excellent', 'win', 'wonderful', 'beautiful', 'positive', 'success', 'best', 'amazing', 'joy', 'smile', 'glad', 'pleased', 'progress', 'clean', 'easy', 'simple',
    'feliz', 'bueno', 'genial', 'amor', 'excelente', 'ganar', 'maravilloso', 'hermoso', 'positivo', 'exito', 'mejor', 'increible', 'alegría', 'sonrisa', 'alegre', 'progreso', 'limpio', 'facil', 'simple',
    'heureux', 'bon', 'excellent', 'aimer', 'magnifique', 'positif', 'succes', 'joie', 'progres', 'facile',
    'glücklich', 'gut', 'liebe', 'ausgezeichnet', 'wunderbar', 'schön', 'positiv', 'erfolg', 'freude', 'einfach',
    'feliz', 'bom', 'ótimo', 'maravilhoso', 'lindo', 'sucesso', 'alegria', 'fácil',
    'счастливый', 'хороший', 'отличный', 'любовь', 'прекрасный', 'успех', 'радость', 'легко',
    'खुश', 'अच्छा', 'महान', 'प्यार', 'सफलता', 'सुंदर', 'प्रगति', 'आसान',
    '嬉しい', '良い', '素晴らしい', '愛', '成功', '美しい', '喜び', '簡単',
    '快乐', '好', '棒', '爱', '成功', '美丽', '喜悦', '简单', '容易'
  ],
  negative: [
    'sad', 'bad', 'hate', 'terrible', 'fail', 'lose', 'poor', 'negative', 'worst', 'danger', 'angry', 'worry', 'pain', 'fault', 'broke', 'error', 'fear', 'doubt', 'stress', 'difficult', 'slow',
    'triste', 'malo', 'odio', 'terrible', 'fallar', 'perder', 'pobre', 'negativo', 'peor', 'peligro', 'enojado', 'preocupado', 'dolor', 'culpa', 'roto', 'error', 'miedo', 'duda', 'estres', 'dificil', 'lento',
    'triste', 'mauvais', 'détester', 'terrible', 'échouer', 'perdre', 'pauvre', 'négatif', 'danger', 'colère',
    'traurig', 'schlecht', 'hassen', 'schrecklich', 'fehler', 'verlieren', 'schlecht', 'negativ', 'gefahr',
    'triste', 'ruim', 'odiar', 'terrível', 'falhar', 'perder', 'negativo', 'pior', 'perigo',
    'грустный', 'плохой', 'ужасный', 'ошибка', 'потерять', 'негативный', 'опасность',
    'दुखी', 'खराब', 'नफरत', 'दर्द', 'गलती', 'खतरा', 'तनाव', 'मुश्किल',
    '悲しい', '悪い', '嫌い', '失敗', '失う', '怒り', '困難', '遅い',
    '悲伤', '坏', '讨厌', '失败', '失去', '糟糕', '危险', '生气', '困难', '慢'
  ]
};

// Multilingual Tone Dictionary Seeds
const TONE_SEEDS = {
  formal: [
    'however', 'therefore', 'furthermore', 'consequently', 'respectively', 'initial', 'establish', 'execute', 'framework', 'implementation', 'structure', 'regards', 'sincerely',
    'sin embargo', 'por lo tanto', 'además', 'consecuentemente', 'respectivamente', 'inicial', 'establecer', 'ejecutar', 'marco', 'implementacion', 'estructura', 'saludos', 'atentamente',
    'cependant', 'par conséquent', 'établir', 'sincèrement', 'somit', 'daher', 'bezüglich', 'etablieren', 'portanto', 'estabelecer', 'sinceramente', 'однако', 'следовательно', 'установить',
    'तथापि', 'इसलिए', 'स्थापित', 'しかしながら', 'したがって', '設立', '然而', '因此', '此外'
  ],
  casual: [
    'hey', 'cool', 'stuff', 'vibe', 'anyway', 'wow', 'kid', 'guess', 'guy', 'bit', 'totally', 'super', 'awesome', 'literally', 'lol', 'haha',
    'hola', 'genial', 'cosas', 'vibra', 'de todos modos', 'wow', 'chico', 'adivinar', 'tipo', 'un poco', 'totalmente', 'super', 'increible', 'literalmente',
    'salut', 'truc', 'mec', 'marrant', 'hallo', 'zeug', 'kumpel', 'cool', 'olá', 'cara', 'coisas', 'legal', 'привет', 'круто', 'штука', 'парень',
    'अरे', 'कूल', 'चीजें', 'यार', 'ねえ', 'すごい', 'やつ', 'とにかく', '嘿', '酷', '玩意', '伙计', '哈哈'
  ],
  academic: [
    'analysis', 'data', 'research', 'result', 'methodology', 'hypothesis', 'conclude', 'evidence', 'context', 'theory', 'examine', 'experiment', 'significant',
    'analisis', 'datos', 'investigacion', 'resultado', 'metodologia', 'hipotesis', 'concluir', 'evidencia', 'contexto', 'teoria', 'examinar', 'experimento', 'significativo',
    'recherche', 'hypothèse', 'données', 'forschung', 'daten', 'hypothese', 'pesquisa', 'dados', 'hipótese', 'анализ', 'данные', 'исследование', 'методология',
    'विश्लेषण', 'आंकड़े', 'अनुसंधान', 'निष्कर्ष', '解析', 'データ', '研究', '仮説', '分析', '数据', '研究', '假设', '结论'
  ],
  confident: [
    'will', 'must', 'definitely', 'clear', 'absolute', 'essential', 'crucial', 'guarantee', 'resolve', 'primary', 'standard', 'assure', 'strongly',
    'sera', 'debe', 'definitivamente', 'claro', 'absoluto', 'esencial', 'crucial', 'garantizar', 'resolver', 'primario', 'estandar', 'asegurar', 'fuertemente',
    'dois', 'absolument', 'crucial', 'muss', 'sicher', 'garantieren', 'certamente', 'garantir', 'обязан', 'ясно', 'абсолютно',
    'अवश्य', 'निश्चित', 'स्पष्ट', 'गारंटी', '絶対に', '確信', '明確', '必须', '绝对', '关键', '保证'
  ],
  creative: [
    'feel', 'see', 'imagine', 'bright', 'dark', 'sound', 'flow', 'visual', 'paint', 'magic', 'story', 'dream', 'wild', 'breath', 'poetic', 'canvas',
    'sentir', 'ver', 'imaginar', 'brillante', 'oscuro', 'sonido', 'fluir', 'visual', 'pintar', 'magia', 'historia', 'sueño', 'salvaje', 'aliento', 'poetico', 'lienzo',
    'imaginer', 'sombre', 'magique', 'rêve', 'fühlen', 'traum', 'magisch', 'sentir', 'imaginar', 'sonho', 'чувствовать', 'мечта', 'магия',
    'महसूस', 'कल्पना', 'जादू', 'सपना', '感じる', '想像', '夢', '魔法', '感觉', '想象', '梦境', '魔法'
  ]
};

// Common Stop Words for SEO Keyword Density Filter
const COMMON_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'as', 'at', 'from', 'into', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'which', 'who', 'whom', 'whose', 'what', 'how', 'why', 'where', 'when',
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'en', 'sobre', 'en', 'a', 'de', 'para', 'con', 'por', 'como', 'desde', 'hacia', 'es', 'son', 'era', 'eran', 'ser', 'sido', 'estar', 'tengo', 'tiene', 'mi', 'tu', 'su', 'este', 'ese', 'aquel', 'que', 'quien', 'cual', 'como', 'cuando', 'donde', 'porque',
  'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'dans', 'sur', 'à', 'de', 'pour', 'avec', 'par', 'comme',
  'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'in', 'auf', 'zu', 'von', 'für', 'mit', 'von', 'wie',
  'o', 'a', 'os', 'as', 'um', 'uma', 'e', 'ou', 'mas', 'em', 'no', 'na', 'para', 'com', 'por', 'como', 'de',
  'и', 'в', 'во', 'на', 'с', 'со', 'у', 'о', 'об', 'обо', 'к', 'ко', 'из', 'от', 'до', 'для', 'за', 'под', 'над', 'перед', 'при', 'а', 'но', 'или', 'да', 'что', 'как', 'это', 'то', 'он', 'она', 'оно', 'они',
  'और', 'या', 'लेकिन', 'में', 'पर', 'तक', 'को', 'के', 'लिए', 'से', 'द्वारा', 'है', 'हैं', 'था', 'थे',
  'の', 'に', 'は', 'を', 'た', 'が', 'で', 'て', 'と', 'し', 'れ', 'さ', 'ある', 'する', 'も',
  '的', '了', '和', '是', '在', '我', '你', '他', '她', '它', '们', '这', '那', '都', '就', '也', '而', '及'
]);

export const WordFlow: React.FC<WordFlowProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang, 'wordflow');

  const [text, setText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Multilingual Word Count Helper
  const getWordCount = (val: string) => {
    const clean = val.trim();
    if (!clean) return 0;
    // Count CJK characters (Chinese, Japanese character count is usually per glyph)
    const cjkMatches = clean.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g);
    const cjkCount = cjkMatches ? cjkMatches.length : 0;
    // Strip CJK to count latin words correctly
    const latinText = clean.replace(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, ' ');
    const latinWords = latinText.trim().split(/\s+/).filter(w => w.length > 0).length;
    return cjkCount + latinWords;
  };

  // Metric Computations
  const wordCount = getWordCount(text);
  const charCountWithSpaces = text.length;
  const charCountNoSpaces = text.replace(/\s/g, '').length;
  
  const paragraphCount = text.split(/\n+/).filter(p => p.trim().length > 0).length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const lineCount = text === '' ? 0 : text.split('\n').length;

  // Reading & Speaking Times
  // Average reading speed: 200 words per minute
  // Average speaking speed: 130 words per minute
  const formatTime = (words: number, speed: number) => {
    if (words === 0) return '0s';
    const totalMinutes = words / speed;
    if (totalMinutes < 1) {
      const seconds = Math.ceil(totalMinutes * 60);
      return `${seconds}s`;
    }
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  };

  const readingTime = formatTime(wordCount, 200);
  const speakingTime = formatTime(wordCount, 130);

  // Automated Readability Index (ARI)
  const getReadability = () => {
    if (wordCount === 0 || sentenceCount === 0) {
      return { score: 0, label: '-' };
    }
    // Formula: 4.71 * (chars / words) + 0.5 * (words / sentences) - 21.43
    const score = Math.round(4.71 * (charCountNoSpaces / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43);
    
    // Custom label map matching education levels
    let label = '';
    if (score <= 1) label = 'Kindergarten';
    else if (score === 2) label = '1st Grade (Age 6)';
    else if (score === 3) label = '2nd Grade (Age 7)';
    else if (score === 4) label = '3rd Grade (Age 8)';
    else if (score === 5) label = '4th Grade (Age 9)';
    else if (score === 6) label = '5th Grade (Age 10)';
    else if (score === 7) label = '6th Grade (Age 11)';
    else if (score === 8) label = '7th Grade (Age 12)';
    else if (score === 9) label = '8th Grade (Age 13)';
    else if (score === 10) label = '9th Grade (Age 14)';
    else if (score === 11) label = '10th Grade (Age 15)';
    else if (score === 12) label = '11th Grade (Age 16)';
    else if (score === 13) label = '12th Grade (Age 17)';
    else label = 'College / Professional';

    return { score: Math.max(0, score), label };
  };

  const readability = getReadability();

  // Keyword Density analysis
  const getKeywordDensity = () => {
    if (!text.trim()) return [];
    
    // Extract tokens: strip punctuation, lowercase
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff-]/g, '')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 1); // skip very short single characters in English

    const counts: Record<string, number> = {};
    let totalCounted = 0;

    tokens.forEach(t => {
      // Skip common stop words
      if (COMMON_STOP_WORDS.has(t)) return;
      counts[t] = (counts[t] || 0) + 1;
      totalCounted++;
    });

    if (totalCounted === 0) return [];

    // Sort by count descending
    return Object.entries(counts)
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / wordCount) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 density keyword nodes
  };

  const keywordDensity = getKeywordDensity();

  // Client-side Local Heuristics Sentiment Analyzer
  const getSentiment = (): SentimentMetrics => {
    if (!text.trim()) {
      return { positive: 0, neutral: 100, negative: 0 };
    }

    const words = text.toLowerCase().split(/\s+/);
    let posCount = 0;
    let negCount = 0;

    words.forEach(w => {
      const cleanWord = w.replace(/[^\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, '');
      if (SENTIMENT_SEEDS.positive.some(seed => cleanWord.includes(seed))) posCount++;
      if (SENTIMENT_SEEDS.negative.some(seed => cleanWord.includes(seed))) negCount++;
    });

    const totalMatches = posCount + negCount;
    if (totalMatches === 0) {
      return { positive: 0, neutral: 100, negative: 0 };
    }

    const positive = Math.round((posCount / totalMatches) * 100);
    const negative = Math.round((negCount / totalMatches) * 100);
    const neutral = Math.max(0, 100 - positive - negative);

    return { positive, neutral, negative };
  };

  const sentiment = getSentiment();

  // Client-side Local Tone Style Gauge
  const getTone = (): ToneMetrics => {
    if (!text.trim()) {
      return { formal: 0, casual: 0, academic: 0, confident: 0, creative: 0 };
    }

    const words = text.toLowerCase().split(/\s+/);
    const counts = { formal: 0, casual: 0, academic: 0, confident: 0, creative: 0 };

    words.forEach(w => {
      const cleanWord = w.replace(/[^\w\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, '');
      if (TONE_SEEDS.formal.some(seed => cleanWord.includes(seed))) counts.formal++;
      if (TONE_SEEDS.casual.some(seed => cleanWord.includes(seed))) counts.casual++;
      if (TONE_SEEDS.academic.some(seed => cleanWord.includes(seed))) counts.academic++;
      if (TONE_SEEDS.confident.some(seed => cleanWord.includes(seed))) counts.confident++;
      if (TONE_SEEDS.creative.some(seed => cleanWord.includes(seed))) counts.creative++;
    });

    // Punctuation heuristics
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    const quotes = (text.match(/["'“”]/g) || []).length;

    counts.casual += exclamations * 2;
    counts.creative += quotes;
    counts.academic += questions;

    const total = counts.formal + counts.casual + counts.academic + counts.confident + counts.creative;
    if (total === 0) {
      // Default fallback distribution based on writing length
      return { formal: 20, casual: 20, academic: 20, confident: 20, creative: 20 };
    }

    return {
      formal: Math.round((counts.formal / total) * 100),
      casual: Math.round((counts.casual / total) * 100),
      academic: Math.round((counts.academic / total) * 100),
      confident: Math.round((counts.confident / total) * 100),
      creative: Math.round((counts.creative / total) * 100)
    };
  };

  const tone = getTone();

  // Helper formatting cleaners
  const handleUppercase = () => setText(text.toUpperCase());
  const handleLowercase = () => setText(text.toLowerCase());
  
  const handleTitleCase = () => {
    const titleCased = text.replace(/\b\w+/g, s => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase());
    setText(titleCased);
  };

  const handleSentenceCase = () => {
    const sentenceCased = text.toLowerCase().replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, sep, char) => sep + char.toUpperCase());
    setText(sentenceCased);
  };

  const handleSlugify = () => {
    const slugified = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setText(slugified);
  };

  const handleRemoveSpaces = () => {
    const cleaned = text.replace(/[ \t]+/g, ' ').trim();
    setText(cleaned);
  };

  const handleRemoveDuplicates = () => {
    const lines = text.split('\n');
    const uniqueLines = Array.from(new Set(lines));
    setText(uniqueLines.join('\n'));
  };

  const handleStripHtml = () => {
    const stripped = text.replace(/<[^>]*>/g, '');
    setText(stripped);
  };

  const handleClear = () => {
    setText('');
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Native Client-Side Export Utilities
  const handleDownloadTxt = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordflow-document-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!text) return;
    
    // Print window strategy: renders clean print layout natively inside the browser printing frame
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>WordFlow Export Document</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #111;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #0d9488;
              padding-bottom: 12px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #0d9488;
              margin: 0;
            }
            .meta {
              font-size: 11px;
              color: #666;
            }
            .content {
              font-size: 14px;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
              font-size: 10px;
              color: #888;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">WordFlow Document</h1>
            <span class="meta">${new Date().toLocaleDateString()} | Words: ${wordCount} | Chars: ${charCountWithSpaces}</span>
          </div>
          <div class="content">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <div class="footer">
            Generated locally on oLoveTools.com - 100% Secure & Private
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Modal handlers
  const openModal = (modal: 'privacy' | 'terms' | 'cookies') => {
    setActiveModal(modal);
  };

  const getModalContent = () => {
    if (!activeModal) return { title: '', content: '' };
    const navKey = activeModal === 'privacy' ? 'privacy' : activeModal === 'terms' ? 'terms' : 'cookies';
    const title = dictionary.nav[navKey] || '';
    const content = dictionary.sections[activeModal]?.join('\n\n') || '';
    return { title, content };
  };

  const { title: modalTitle, content: modalText } = getModalContent();

  return (
    <div className="min-h-screen bg-[#030708] text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-200 relative">
      <Header 
        currentLang={lang} 
        onLanguageChange={(newLang) => window.location.href = `/${newLang}/wordflow`}
        onReset={handleClear}
        t={t}
      />

      {/* Dynamic Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-teal-950/20 via-slate-950/10 to-transparent blur-[120px] pointer-events-none z-0" />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-32 pb-24 flex flex-col space-y-10 relative z-10">
        
        {/* Title / Description */}
        <section className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-teal-400 mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-outfit">
            {t.seoHeroTitle}
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mx-auto font-medium">
            {t.seoHeroText}
          </p>
        </section>

        {/* Counter Analytics Ribbon */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-md hover:border-teal-500/30 transition-all duration-300">
            <span className="text-slate-500 text-xs font-black uppercase tracking-wider">{t.words}</span>
            <span className="text-2xl font-black text-white font-mono">{wordCount.toLocaleString()}</span>
          </div>
          <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-md hover:border-teal-500/30 transition-all duration-300">
            <span className="text-slate-500 text-xs font-black uppercase tracking-wider">{t.characters}</span>
            <span className="text-2xl font-black text-white font-mono">{charCountWithSpaces.toLocaleString()}</span>
            <span className="text-[10px] text-slate-600 font-semibold font-mono">({charCountNoSpaces.toLocaleString()} no spaces)</span>
          </div>
          <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-md hover:border-teal-500/30 transition-all duration-300">
            <span className="text-slate-500 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{t.readingTime}</span>
            </span>
            <span className="text-2xl font-black text-teal-400 font-mono">{readingTime}</span>
          </div>
          <div className="bg-[#0b0c10] border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-md hover:border-teal-500/30 transition-all duration-300">
            <span className="text-slate-500 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.speakingTime}</span>
            </span>
            <span className="text-2xl font-black text-cyan-400 font-mono">{speakingTime}</span>
          </div>
        </section>

        {/* Interactive Workspace Area */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Focused Editor Workspace */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0b0c10] border border-white/10 rounded-3xl p-1 shadow-xl hover:border-teal-500/40 transition-all duration-500 focus-within:ring-2 focus-within:ring-teal-500/30">
              
              {/* Writer Header Toolbar */}
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-3.5">
                <span className="text-xs font-bold text-slate-500 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-teal-500" />
                  <span>Interactive Editor canvas</span>
                </span>
                
                {/* Clean/Export Actions */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleCopy}
                    disabled={!text}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title={t.copyText}
                  >
                    {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={handleClear}
                    disabled={!text}
                    className="p-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title={t.clearText}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Writing Area */}
              <textarea 
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t.placeholder}
                className="w-full h-80 md:h-[450px] p-6 bg-transparent border-none outline-none resize-none text-slate-100 placeholder:text-slate-600 text-sm md:text-base font-normal leading-relaxed overflow-y-auto"
              />

              {/* Writer Footer Metrics */}
              <div className="flex items-center justify-between border-t border-white/5 px-6 py-3 text-[11px] text-slate-600 font-bold font-mono">
                <span>{t.lines}: {lineCount} | {t.sentences}: {sentenceCount} | {t.paragraphs}: {paragraphCount}</span>
                <span className="text-slate-500 lowercase">100% browser sandbox</span>
              </div>
            </div>

            {/* Quick clean/format Actions Grid */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <span>{t.textTools}</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button 
                  onClick={handleUppercase}
                  disabled={!text}
                  className="px-4 py-2.5 bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 text-slate-300 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.uppercase}
                </button>
                <button 
                  onClick={handleLowercase}
                  disabled={!text}
                  className="px-4 py-2.5 bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 text-slate-300 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.lowercase}
                </button>
                <button 
                  onClick={handleTitleCase}
                  disabled={!text}
                  className="px-4 py-2.5 bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 text-slate-300 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.titlecase}
                </button>
                <button 
                  onClick={handleSentenceCase}
                  disabled={!text}
                  className="px-4 py-2.5 bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 text-slate-300 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.sentencecase}
                </button>
                <button 
                  onClick={handleSlugify}
                  disabled={!text}
                  className="px-4 py-2.5 bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 text-slate-300 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.slugify}
                </button>
                <button 
                  onClick={handleRemoveSpaces}
                  disabled={!text}
                  className="px-4 py-2.5 bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 text-slate-300 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.removeSpaces}
                </button>
                <button 
                  onClick={handleRemoveDuplicates}
                  disabled={!text}
                  className="px-4 py-2.5 bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 text-slate-300 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.removeDuplicates}
                </button>
                <button 
                  onClick={handleStripHtml}
                  disabled={!text}
                  className="px-4 py-2.5 bg-white/[0.02] hover:bg-teal-500/10 border border-white/5 text-slate-300 hover:text-teal-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t.stripHtml}
                </button>
              </div>
            </div>
          </div>

          {/* Right Floating Analytics Desk */}
          <div className="space-y-6">
            
            {/* Readability Score Gauge */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-teal-400" />
                <span>{t.analysis}</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">{t.readability}</span>
                  <span className="text-xs text-teal-400 font-black tracking-wider uppercase font-mono bg-teal-500/10 px-2 py-0.5 rounded">
                    Score: {readability.score}
                  </span>
                </div>
                <div className="text-lg font-black text-white">{readability.label}</div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  {t.readabilityDesc} (Automated Readability Index)
                </p>
              </div>

              {/* Exports */}
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleDownloadTxt}
                  disabled={!text}
                  className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-extrabold tracking-wide rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>TXT</span>
                </button>
                <button 
                  onClick={handleDownloadPdf}
                  disabled={!text}
                  className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-extrabold tracking-wide rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* AI Sentiment Analysis */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Smile className="w-4 h-4 text-teal-400" />
                <span>{t.sentiment}</span>
              </h3>

              <div className="space-y-3">
                {/* Positive */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{t.sentimentPositive}</span>
                    <span className="font-mono text-emerald-400">{sentiment.positive}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${sentiment.positive}%` }} />
                  </div>
                </div>

                {/* Neutral */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{t.sentimentNeutral}</span>
                    <span className="font-mono text-slate-300">{sentiment.neutral}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-500 rounded-full transition-all duration-500" style={{ width: `${sentiment.neutral}%` }} />
                  </div>
                </div>

                {/* Negative */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{t.sentimentNegative}</span>
                    <span className="font-mono text-rose-400">{sentiment.negative}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${sentiment.negative}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Tone Style Detector */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-teal-400" />
                <span>{t.tone}</span>
              </h3>

              <div className="space-y-3">
                {/* Formal */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{t.toneFormal}</span>
                    <span className="font-mono text-blue-400">{tone.formal}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${tone.formal}%` }} />
                  </div>
                </div>

                {/* Casual */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{t.toneCasual}</span>
                    <span className="font-mono text-amber-400">{tone.casual}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${tone.casual}%` }} />
                  </div>
                </div>

                {/* Academic */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{t.toneAcademic}</span>
                    <span className="font-mono text-purple-400">{tone.academic}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${tone.academic}%` }} />
                  </div>
                </div>

                {/* Confident */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{t.toneConfident}</span>
                    <span className="font-mono text-teal-400">{tone.confident}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${tone.confident}%` }} />
                  </div>
                </div>

                {/* Creative */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>{t.toneCreative}</span>
                    <span className="font-mono text-pink-400">{tone.creative}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full transition-all duration-500" style={{ width: `${tone.creative}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Keyword Density Matrix */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <Search className="w-4 h-4 text-teal-400" />
                <span>{t.keywordDensity}</span>
              </h3>

              {keywordDensity.length === 0 ? (
                <div className="text-slate-600 text-xs py-4 text-center leading-relaxed font-semibold italic">
                  {t.noKeywords}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-3 text-[10px] uppercase font-black tracking-wider text-slate-600 border-b border-white/5 pb-1 px-1">
                    <span>Keyword</span>
                    <span className="text-center">{t.count}</span>
                    <span className="text-right">{t.density}</span>
                  </div>
                  
                  {keywordDensity.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-3 text-xs font-bold text-slate-300 hover:text-white items-center py-1 px-1 rounded transition-colors hover:bg-white/[0.01]">
                      <span className="truncate max-w-[100px] text-slate-400 font-semibold">{item.word}</span>
                      <span className="text-center font-mono font-medium">{item.count}</span>
                      <span className="text-right text-teal-400 font-mono">{item.density}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </section>

        {/* Feature SEO Grid */}
        <section className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-white font-bold text-base">{t.seoBrowserSpeedTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoBrowserSpeedText}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold text-base">{t.seoUseCaseTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoUseCaseText}</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-bold text-base">{t.seoPrivacyTitle}</h3>
            <p className="text-slate-400 text-xs leading-relaxed font-medium">{t.seoPrivacyText}</p>
          </div>
        </section>

      </main>

      {/* Footer Accordion */}
      <Footer lang={lang} t={t} onOpenModal={openModal} />

      {/* Modal Layout */}
      <LegalModal 
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={modalTitle}
        content={modalText}
        t={t}
      />
    </div>
  );
};

export default WordFlow;
