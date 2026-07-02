import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { parseRegex, ParsedToken } from './utils/regexParser';
import { 
  Search, Copy, Check, AlertCircle, Play, 
  Sparkles, HelpCircle, FileText, Settings, BookOpen 
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface RegexFlowProps {
  lang: string;
  dictionary: any;
}

interface Preset {
  nameKey: string;
  pattern: string;
  flags: string;
  testText: string;
  replaceText: string;
}

export const RegexFlow: React.FC<RegexFlowProps> = ({ lang, dictionary }) => {
  const t = dictionary;

  // Modals state
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // Regex Editor State
  const [pattern, setPattern] = useState<string>("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
  const [flags, setFlags] = useState<string>("gi");
  const [testText, setTestText] = useState<string>(
    "Feel free to test your expressions here. Contact us at support@olovetools.com or info@example.org for any assistance! You can also reach hello@domain.co."
  );
  const [replaceText, setReplaceText] = useState<string>("*masked_email*");
  const [isReplaceEnabled, setIsReplaceEnabled] = useState<boolean>(true);

  // Status/Result State
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [matches, setMatches] = useState<any[]>([]);
  const [substitutedText, setSubstitutedText] = useState<string>("");
  const [parsedTokens, setParsedTokens] = useState<ParsedToken[]>([]);

  // Clipboard States
  const [copiedRegex, setCopiedRegex] = useState<boolean>(false);
  const [copiedResult, setCopiedResult] = useState<boolean>(false);

  // Highlight scroll syncing
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const flagOptions = [
    { char: 'g', label: 'Global (g)', desc: 'Find all matches rather than stopping after the first match' },
    { char: 'i', label: 'Case Insensitive (i)', desc: 'Ignore case differences (e.g. A matches a)' },
    { char: 'm', label: 'Multiline (m)', desc: 'Treat beginning (^) and end ($) anchors as matching lines, not just whole string' },
    { char: 's', label: 'Dot All (s)', desc: 'Allow dot (.) to match newlines as well' },
    { char: 'u', label: 'Unicode (u)', desc: 'Treat pattern as a sequence of Unicode code points' },
    { char: 'y', label: 'Sticky (y)', desc: 'Match only from the index indicated by lastIndex in target string' }
  ];

  const presets: Preset[] = [
    {
      nameKey: "preset_email",
      pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
      flags: "gi",
      testText: "Send your reports to mail@domain.com, support@example.co.uk or admin@olovetools.org.",
      replaceText: "[EMAIL]"
    },
    {
      nameKey: "preset_url",
      pattern: "https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)",
      flags: "gi",
      testText: "Check out https://olovetools.com for direct access. Or visit http://example.org/path?param=val.",
      replaceText: "[LINK]"
    },
    {
      nameKey: "preset_phone",
      pattern: "\\+?\\b[1-9]\\d{1,14}\\b",
      flags: "g",
      testText: "Contact details: +12345678901, +34987654321, or 5551234. Make sure numbers are formatted properly.",
      replaceText: "[PHONE]"
    },
    {
      nameKey: "preset_ip",
      pattern: "\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b",
      flags: "g",
      testText: "Servers are located at 192.168.1.1, 10.0.0.254, and external node 8.8.8.8.",
      replaceText: "[IP]"
    },
    {
      nameKey: "preset_date",
      pattern: "\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b",
      flags: "g",
      testText: "Milestones achieved on 2026-06-15, next launch 2026-09-01, holiday scheduled 2026-12-25.",
      replaceText: "[DATE]"
    }
  ];

  const cheatSheetItems = [
    { pattern: '.', desc: 'Any character except newline' },
    { pattern: '\\d', desc: 'Any digit (0-9)' },
    { pattern: '\\w', desc: 'Alphanumeric character plus _' },
    { pattern: '\\s', desc: 'Whitespace (space, tab, newline)' },
    { pattern: '\\b', desc: 'Word boundary' },
    { pattern: '^', desc: 'Beginning of line/string' },
    { pattern: '$', desc: 'End of line/string' },
    { pattern: '[abc]', desc: 'Any character in brackets' },
    { pattern: '[^abc]', desc: 'Any character NOT in brackets' },
    { pattern: 'a|b', desc: 'Either a or b' },
    { pattern: 'a*', desc: '0 or more of a' },
    { pattern: 'a+', desc: '1 or more of a' },
    { pattern: 'a?', desc: '0 or 1 of a' },
    { pattern: 'a{3}', desc: 'Exactly 3 of a' },
    { pattern: 'a{3,}', desc: '3 or more of a' },
    { pattern: 'a{3,6}', desc: 'Between 3 and 6 of a' },
    { pattern: '(abc)', desc: 'Capture group' },
    { pattern: '(?:abc)', desc: 'Non-capturing group' }
  ];

  // Compile regex & analyze testText
  useEffect(() => {
    if (!pattern) {
      setIsValid(true);
      setErrorMsg("");
      setMatches([]);
      setSubstitutedText(testText);
      setParsedTokens([]);
      return;
    }

    try {
      const reg = new RegExp(pattern, flags);
      setIsValid(true);
      setErrorMsg("");

      // Calculate matches
      const currentMatches: any[] = [];
      const global = flags.includes('g');

      if (global) {
        let match;
        // Reset lastIndex just in case
        reg.lastIndex = 0;
        let guard = 0;
        while ((match = reg.exec(testText)) !== null && guard < 5000) {
          guard++;
          currentMatches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1)
          });
          // Handle zero-width matches (like a*) to avoid infinite loops
          if (match[0].length === 0) {
            reg.lastIndex++;
          }
        }
      } else {
        const match = reg.exec(testText);
        if (match) {
          currentMatches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1)
          });
        }
      }
      setMatches(currentMatches);

      // Calculate Substitution Result
      if (isReplaceEnabled) {
        setSubstitutedText(testText.replace(reg, replaceText));
      } else {
        setSubstitutedText(testText);
      }

      // Parse Regex pattern structure
      setParsedTokens(parseRegex(pattern, lang));

    } catch (err: any) {
      setIsValid(false);
      setErrorMsg(err.message);
      setMatches([]);
      setSubstitutedText(testText);
      setParsedTokens([]);
    }
  }, [pattern, flags, testText, replaceText, isReplaceEnabled, lang]);

  // Sync scroll of textarea and highlighting backdrop
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Toggle flag
  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  // Copy helpers
  const handleCopyRegex = () => {
    navigator.clipboard.writeText(`/${pattern}/${flags}`);
    setCopiedRegex(true);
    setTimeout(() => setCopiedRegex(false), 2000);
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(substitutedText);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  // Load preset
  const loadPreset = (preset: Preset) => {
    setPattern(preset.pattern);
    setFlags(preset.flags);
    setTestText(preset.testText);
    setReplaceText(preset.replaceText);
    setIsReplaceEnabled(true);
  };

  // Reset helper
  const handleReset = () => {
    setPattern("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    setFlags("gi");
    setTestText("Feel free to test your expressions here. Contact us at support@olovetools.com or info@example.org for any assistance!");
    setReplaceText("*masked_email*");
    setIsReplaceEnabled(true);
  };

  // Render highlighted matches inside backdrop div
  const renderHighlightedBackdrop = () => {
    if (!isValid || !pattern || matches.length === 0) {
      return testText;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort matches by index to render sequentially
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

    sortedMatches.forEach((m, idx) => {
      const start = m.index;
      const end = start + m.text.length;

      // Avoid overlap issues (in case of sticky/lookaround edge cases)
      if (start < lastIndex) return;

      // Text before match
      if (start > lastIndex) {
        elements.push(testText.slice(lastIndex, start));
      }

      // Highlighted match element
      elements.push(
        <mark 
          key={idx} 
          className="bg-fuchsia-500/30 text-white border-b border-fuchsia-400 rounded-sm font-mono inline"
        >
          {testText.slice(start, end)}
        </mark>
      );

      lastIndex = end;
    });

    // Text after last match
    if (lastIndex < testText.length) {
      elements.push(testText.slice(lastIndex));
    }

    return elements;
  };

  // Translate preset name keys locally
  const getPresetName = (key: string): string => {
    const maps: Record<string, Record<string, string>> = {
      en: { preset_email: "Email Addresses", preset_url: "URLs / Links", preset_phone: "Phone Numbers", preset_ip: "IPv4 Addresses", preset_date: "Dates (YYYY-MM-DD)" },
      es: { preset_email: "Correos Electrónicos", preset_url: "URLs / Enlaces", preset_phone: "Números de Teléfono", preset_ip: "Direcciones IPv4", preset_date: "Fechas (AAAA-MM-DD)" },
      fr: { preset_email: "Adresses E-mail", preset_url: "URLs / Liens", preset_phone: "Numéros de Téléphone", preset_ip: "Adresses IPv4", preset_date: "Dates (AAAA-MM-JJ)" },
      de: { preset_email: "E-Mail-Adressen", preset_url: "URLs / Links", preset_phone: "Telefonnummern", preset_ip: "IPv4-Adressen", preset_date: "Daten (JJJJ-MM-TT)" },
      pt: { preset_email: "Endereços de E-mail", preset_url: "URLs / Links", preset_phone: "Números de Telefone", preset_ip: "Endereços IPv4", preset_date: "Datas (AAAA-MM-DD)" },
      ru: { preset_email: "Электронная почта", preset_url: "Ссылки / URL", preset_phone: "Номера телефонов", preset_ip: "Адреса IPv4", preset_date: "Даты (ГГГГ-ММ-ДД)" },
      hi: { preset_email: "ईमेल पते", preset_url: "यूआरएल / लिंक", preset_phone: "फ़ोन नंबर", preset_ip: "आईपीवी4 पते", preset_date: "तिथियां (YYYY-MM-DD)" },
      ja: { preset_email: "メールアドレス", preset_url: "URL / リンク", preset_phone: "電話番号", preset_ip: "IPv4アドレス", preset_date: "日付 (YYYY-MM-DD)" },
      zh: { preset_email: "电子邮件地址", preset_url: "URL / 网页链接", preset_phone: "电话号码", preset_ip: "IPv4 地址", preset_date: "日期 (YYYY-MM-DD)" }
    };

    return maps[lang]?.[key] || maps.en[key] || key;
  };

  return (
    <div className="min-h-screen bg-[#08040a] text-slate-100 flex flex-col font-sans selection:bg-fuchsia-500/30 selection:text-white">
      <Header 
        currentLang={lang} 
        onLanguageChange={(l) => { window.location.href = `/${l.toLowerCase()}/regex-flow`; }} 
        onReset={handleReset} 
        t={t} 
      />

      <main className="flex-grow pt-28 max-w-7xl w-full mx-auto px-4 md:px-8 pb-16 flex flex-col gap-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-regex-flow-top" />
        
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mt-6 mb-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-fuchsia-500/10 border border-fuchsia-500/30 px-4 py-1.5 rounded-full text-xs font-semibold text-fuchsia-400 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Client-Side & Secure</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-fuchsia-200 to-violet-400 bg-clip-text text-transparent">
            {t.seoHeroTitle}
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
            {t.description}
          </p>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Workspace (Columns 1-3) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Pattern Input Section */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-fuchsia-500"></div>
              
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-fuchsia-400" />
                  <span>{t.label_regex}</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleCopyRegex}
                    className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-lg text-slate-400 hover:text-white cursor-pointer"
                    title={t.tooltip_copy}
                  >
                    {copiedRegex ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="flex flex-col md:flex-row items-stretch gap-4">
                <div className="flex-grow relative flex items-center">
                  <span className="absolute left-4 text-xl text-slate-500 font-mono select-none">/</span>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder={t.regex_placeholder}
                    className={`w-full py-4 pl-8 pr-12 bg-black/40 border ${isValid ? 'border-white/10 focus:border-fuchsia-500/50' : 'border-red-500/50 focus:border-red-500'} rounded-2xl text-lg font-mono text-white placeholder-slate-600 focus:outline-none transition-all`}
                  />
                  <span className="absolute right-4 text-xl text-slate-500 font-mono select-none">/</span>
                </div>

                {/* Flags Selector */}
                <div className="flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-2 gap-2 overflow-x-auto min-w-[200px] justify-center md:justify-start">
                  {flagOptions.map((opt) => {
                    const active = flags.includes(opt.char);
                    return (
                      <button
                        key={opt.char}
                        onClick={() => toggleFlag(opt.char)}
                        className={`w-8 h-8 rounded-lg font-bold font-mono transition-all border flex items-center justify-center cursor-pointer ${
                          active 
                            ? 'bg-fuchsia-500 text-white border-fuchsia-400 shadow-md shadow-fuchsia-500/20' 
                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                        }`}
                        title={opt.desc}
                      >
                        {opt.char}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex items-center gap-2 text-xs">
                {isValid ? (
                  <span className="flex items-center space-x-1 text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.status_valid}</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-red-400 font-semibold bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{t.status_invalid}: {errorMsg}</span>
                  </span>
                )}

                {isValid && (
                  <span className="text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                    {matches.length === 0 ? t.no_matches : t.matches_found.replace('{count}', String(matches.length))}
                  </span>
                )}
              </div>
            </div>

            {/* Test Text & Highlight Overlay */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-4 relative overflow-hidden">
              <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                <FileText className="w-4 h-4 text-fuchsia-400" />
                <span>{t.label_test_text}</span>
              </label>

              {/* Overlay Textarea Container */}
              <div className="relative w-full h-64 rounded-2xl bg-black/40 border border-white/10 overflow-hidden focus-within:border-fuchsia-500/50 transition-colors">
                
                {/* Backdrop rendering matched highlights */}
                <div 
                  ref={highlightRef}
                  className="absolute inset-0 p-4 font-mono text-sm pointer-events-none select-none overflow-auto whitespace-pre-wrap break-all text-slate-300/80"
                  style={{
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                >
                  {renderHighlightedBackdrop()}
                </div>

                {/* Actual interactive transparent Textarea */}
                <textarea
                  ref={textareaRef}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  onScroll={handleScroll}
                  placeholder={t.text_placeholder}
                  className="absolute inset-0 w-full h-full p-4 bg-transparent border-none outline-none font-mono text-sm text-transparent caret-fuchsia-500 resize-none overflow-auto whitespace-pre-wrap break-all"
                  style={{
                    lineHeight: '1.5',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Replacement Tool Section */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-4 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                  <Play className="w-4 h-4 text-fuchsia-400" />
                  <span>{t.label_replacement}</span>
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsReplaceEnabled(!isReplaceEnabled)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isReplaceEnabled 
                        ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' 
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {isReplaceEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  {isReplaceEnabled && (
                    <button 
                      onClick={handleCopyResult}
                      className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-lg text-slate-400 hover:text-white cursor-pointer"
                      title={t.tooltip_copy}
                    >
                      {copiedResult ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {isReplaceEnabled ? (
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder={t.replace_placeholder}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 focus:border-fuchsia-500/50 rounded-xl font-mono text-white placeholder-slate-600 focus:outline-none transition-all"
                  />
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.label_result}</span>
                    <div className="w-full p-4 bg-black/50 border border-white/5 rounded-xl min-h-[60px] font-mono text-sm text-slate-300 break-all whitespace-pre-wrap">
                      {substitutedText || <span className="text-slate-600 italic">No replacement result</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-slate-500 text-sm italic">
                  Substitution mode is disabled. Toggle on to replace patterns.
                </div>
              )}
            </div>

            {/* Pattern Explanations Section */}
            {isValid && pattern && parsedTokens.length > 0 && (
              <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-4 relative overflow-hidden">
                <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-fuchsia-400" />
                  <span>{t.label_explanation}</span>
                </label>
                
                <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-2">
                  {parsedTokens.map((token, idx) => {
                    // Set styles depending on token category
                    let tagBg = 'bg-white/5 text-slate-400 border-white/10';
                    if (token.type === 'quantifier') tagBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    else if (token.type === 'anchor') tagBg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                    else if (token.type === 'character_class') tagBg = 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20';
                    else if (token.type === 'character_set') tagBg = 'bg-violet-500/10 text-violet-400 border-violet-500/20';
                    else if (token.type === 'group_start' || token.type === 'group_end') tagBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

                    return (
                      <div 
                        key={idx}
                        className="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-white/[0.01] border border-white/5 rounded-xl gap-3 text-sm"
                        style={{ marginLeft: `${token.depth * 16}px` }}
                      >
                        <span className={`px-2 py-1 rounded font-mono font-bold text-xs uppercase border ${tagBg}`}>
                          {token.text}
                        </span>
                        <div className="flex-grow text-slate-300">
                          {token.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Section (Column 4) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Presets Card */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
              <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-fuchsia-400" />
                <span>{t.label_presets}</span>
              </label>

              <div className="flex flex-col gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(preset)}
                    className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 hover:border-fuchsia-500/30 hover:bg-fuchsia-500/5 transition-all rounded-xl text-sm font-semibold text-slate-200 hover:text-fuchsia-300 cursor-pointer flex flex-col gap-1 outline-none group"
                  >
                    <span>{getPresetName(preset.nameKey)}</span>
                    <span className="font-mono text-xs text-slate-500 group-hover:text-slate-400 truncate w-full">
                      {preset.pattern}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Cheat Sheet Card */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
              <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-fuchsia-400" />
                <span>{t.label_cheat_sheet}</span>
              </label>

              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                {cheatSheetItems.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-center gap-2 border-b border-white/5 pb-2 text-xs"
                  >
                    <span className="font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-1.5 py-0.5 rounded select-all">
                      {item.pattern}
                    </span>
                    <span className="text-slate-400 text-right font-medium">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-regex-flow-bottom" />
      </main>

      <Footer 
        lang={lang} 
        t={t} 
        onOpenModal={(modal) => setActiveModal(modal)} 
      />

      {/* Legal Modals */}
      <LegalModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'privacy' 
            ? (legalTranslations[lang]?.privacy.title || 'Privacy Policy')
            : activeModal === 'terms'
            ? (legalTranslations[lang]?.terms.title || 'Terms of Service')
            : (legalTranslations[lang]?.cookies.title || 'Cookie Policy')
        }
        content={
          activeModal === 'privacy' 
            ? (legalTranslations[lang]?.privacy.content || '')
            : activeModal === 'terms'
            ? (legalTranslations[lang]?.terms.content || '')
            : (legalTranslations[lang]?.cookies.content || '')
        }
        t={t}
      />
    </div>
  );
};

export default RegexFlow;
