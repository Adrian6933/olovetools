import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { Database, Copy, Check, RotateCcw, Code, AlertCircle, Wand2 } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface SqlFlowProps {
  lang: string;
  dictionary: any;
}

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
  'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA',
  'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'FULL', 'CROSS', 'ON', 'USING',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'AND', 'OR', 'NOT',
  'NULL', 'IS', 'IN', 'BETWEEN', 'LIKE', 'EXISTS', 'ANY', 'ALL', 'SOME',
  'DISTINCT', 'UNION', 'INTERSECT', 'EXCEPT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'WITH', 'RECURSIVE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'DEFAULT',
  'CONSTRAINT', 'UNIQUE', 'CHECK', 'CASCADE',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'SAVEPOINT',
  'GRANT', 'REVOKE', 'PRIVILEGES', 'PUBLIC', 'ROLE', 'USER',
  'TRUNCATE', 'EXPLAIN', 'ANALYZE', 'VACUUM', 'REINDEX',
  'ASC', 'DESC', 'TRUE', 'FALSE', 'IF', 'ADD', 'COLUMN', 'RENAME', 'TO',
  'TEMPORARY', 'TEMP', 'RETURNS', 'FUNCTION', 'PROCEDURE', 'TRIGGER',
];

const MAJOR_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER',
  'DROP', 'JOIN', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION',
  'INTERSECT', 'EXCEPT', 'VALUES', 'WITH', 'SET', 'ON', 'AND', 'OR',
];

interface FormatOptions {
  keywordCase: 'upper' | 'lower';
  indentWidth: number;
  newLineBeforeKeywords: boolean;
}

function formatSql(sql: string, options: FormatOptions): string {
  if (!sql.trim()) return '';

  const { keywordCase, indentWidth, newLineBeforeKeywords } = options;
  const indent = ' '.repeat(indentWidth);

  let work = sql.replace(/--[^\n]*/g, (m) => `\u0000${m.slice(2)}\u0000`);
  work = work.replace(/'([^']*)'/g, (m) => `\u0001${m}\u0001`);
  work = work.replace(/\s+/g, ' ').trim();

  const tokens = work.split(/([(),;])/).filter((t) => t !== '' && t !== ' ');

  const processedTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    const upperToken = token.toUpperCase();
    if (SQL_KEYWORDS.includes(upperToken)) {
      token = keywordCase === 'upper' ? upperToken : upperToken.toLowerCase();
    }
    processedTokens.push(token);
  }

  let result = '';
  let depth = 0;
  let afterNewline = true;
  let prevToken = '';

  const shouldBreakBefore = (token: string): boolean => {
    if (!newLineBeforeKeywords) return false;
    return MAJOR_KEYWORDS.includes(token.toUpperCase());
  };

  for (let i = 0; i < processedTokens.length; i++) {
    const token = processedTokens[i];

    if (token === '(') {
      result += token;
      depth++;
      afterNewline = false;
    } else if (token === ')') {
      depth = Math.max(0, depth - 1);
      result = result.trimEnd();
      result += '\n' + indent.repeat(depth) + token;
      afterNewline = false;
    } else if (token === ',') {
      result += token;
      result += '\n' + indent.repeat(depth);
      afterNewline = true;
    } else if (token === ';') {
      result += ';\n';
      depth = 0;
      afterNewline = true;
    } else {
      const isMajorBreak = shouldBreakBefore(token) && !afterNewline && prevToken !== '(';

      if (isMajorBreak) {
        result = result.trimEnd();
        result += '\n' + indent.repeat(depth);
        afterNewline = true;
      }

      if (result === '' || afterNewline) {
        result += indent.repeat(depth) + token;
        afterNewline = false;
      } else {
        if (prevToken === '(' || prevToken === ',' || prevToken === '.') {
          result += token;
        } else {
          result += ' ' + token;
        }
      }
    }

    prevToken = token;
  }

  result = result.replace(/\u0000([^\u0000]*)\u0000/g, '--$1');
  result = result.replace(/\u0001([^\u0001]*)\u0001/g, '$1');
  result = result.replace(/\n{3,}/g, '\n\n').trim();

  return result + (result && !result.endsWith(';') ? ';' : '');
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateSql(sql: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sql.trim()) {
    return { valid: false, errors: ['Empty query'], warnings: [] };
  }

  const trimmed = sql.trim();

  let parenDepth = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    const next = trimmed[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      if (char === "'") inString = false;
      continue;
    }

    if (char === '-' && next === '-') {
      inLineComment = true;
      i++;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === '(') parenDepth++;
    if (char === ')') parenDepth--;

    if (parenDepth < 0) {
      errors.push('Unmatched closing parenthesis');
      parenDepth = 0;
    }
  }

  if (parenDepth > 0) {
    errors.push(`Missing ${parenDepth} closing parenthesis${parenDepth > 1 ? 'es' : ''}`);
  }
  if (inString) errors.push('Unclosed string literal');
  if (inBlockComment) errors.push('Unclosed block comment');

  const upper = trimmed.toUpperCase();
  const hasStatement = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|WITH|GRANT|REVOKE|EXPLAIN|VACUUM|BEGIN|COMMIT|ROLLBACK|SET)\b/;
  if (!hasStatement.test(upper)) {
    errors.push('No recognized SQL statement keyword found');
  }

  if (!trimmed.endsWith(';')) {
    warnings.push('Query does not end with semicolon');
  }

  if (/\bSELECT\b/i.test(trimmed) && !/\bFROM\b/i.test(trimmed) && !/\bVALUES\b/i.test(trimmed)) {
    warnings.push('SELECT without FROM clause');
  }

  if (/\bINSERT\b/i.test(trimmed) && !/\bINTO\b/i.test(trimmed)) {
    warnings.push('INSERT without INTO clause');
  }

  if (/\bUPDATE\b/i.test(trimmed) && !/\bSET\b/i.test(trimmed)) {
    warnings.push('UPDATE without SET clause');
  }

  if (/\bDELETE\b/i.test(trimmed) && !/\bFROM\b/i.test(trimmed)) {
    warnings.push('DELETE without FROM clause');
  }

  return { valid: errors.length === 0, errors, warnings };
}

export default function SqlFlow({ lang, dictionary }: SqlFlowProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<FormatOptions>({
    keywordCase: 'upper',
    indentWidth: 2,
    newLineBeforeKeywords: true,
  });
  const [copied, setCopied] = useState(false);

  const formatted = useMemo(() => formatSql(input, options), [input, options]);
  const validation = useMemo(() => validateSql(input), [input]);

  const resetWorkspace = useCallback(() => {
    setInput('');
    setOptions({
      keywordCase: 'upper',
      indentWidth: 2,
      newLineBeforeKeywords: true,
    });
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!formatted) return;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [formatted]);

  const stats = useMemo(() => {
    const inputLines = input ? input.split('\n').length : 0;
    const outputLines = formatted ? formatted.split('\n').length : 0;
    return { inputLines, outputLines, inputChars: input.length, outputChars: formatted.length };
  }, [input, formatted]);

  const titleText = t.seoHeroTitle || 'SQLFlow';
  const descText = t.seoHeroText || 'Format and validate SQL queries with style.';
  const inputLabel = t.input || 'Input SQL';
  const outputLabel = t.output || 'Formatted Output';
  const copyText = t.copy || 'Copy';
  const copiedText = t.copied || 'Copied';
  const resetText = t.reset || 'Reset';
  const validationText = t.validation || 'Validation';
  const errorsText = t.errors || 'Errors';
  const warningsText = t.warnings || 'Warnings';
  const validText = t.valid || 'Valid';
  const invalidText = t.invalid || 'Invalid';
  const keywordCaseText = t.keywordCase || 'Keyword Case';
  const indentWidthText = t.indentWidth || 'Indent Width';
  const newLineText = t.newLineBeforeKeywords || 'New line before keywords';
  const formatOptionsText = t.formatOptions || 'Format Options';
  const placeholderText = t.placeholder || 'Enter your SQL query here...';
  const linesText = t.lines || 'lines';
  const charsText = t.chars || 'chars';

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0802] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/sql-flow`}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-sql-flow-top" />

        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Database className="w-8 h-8 text-amber-400" />
            <span>{titleText}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {descText}
          </p>
        </div>

        <div className="bg-black/40 border border-amber-900/30 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <div className="flex items-center gap-3">
              <Wand2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
                {formatOptionsText}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">
                {keywordCaseText}
              </label>
              <div className="inline-flex rounded-lg overflow-hidden border border-amber-900/40">
                <button
                  onClick={() => setOptions((o) => ({ ...o, keywordCase: 'upper' }))}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    options.keywordCase === 'upper'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-transparent text-slate-400 hover:text-amber-300'
                  }`}
                >
                  UPPER
                </button>
                <button
                  onClick={() => setOptions((o) => ({ ...o, keywordCase: 'lower' }))}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-amber-900/40 ${
                    options.keywordCase === 'lower'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-transparent text-slate-400 hover:text-amber-300'
                  }`}
                >
                  lower
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">
                {indentWidthText}
              </label>
              <div className="inline-flex rounded-lg overflow-hidden border border-amber-900/40">
                {[2, 4, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => setOptions((o) => ({ ...o, indentWidth: w }))}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      w !== 2 ? 'border-l border-amber-900/40' : ''
                    } ${
                      options.indentWidth === w
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-transparent text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <button
                onClick={() => setOptions((o) => ({ ...o, newLineBeforeKeywords: !o.newLineBeforeKeywords }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  options.newLineBeforeKeywords ? 'bg-amber-500/60' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    options.newLineBeforeKeywords ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-400 uppercase tracking-wider group-hover:text-amber-300 transition-colors">
                {newLineText}
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                  {inputLabel}
                </span>
              </div>
              {input && (
                <span className="text-xs text-slate-500">
                  {stats.inputLines} {linesText} Â· {stats.inputChars} {charsText}
                </span>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholderText}
              spellCheck={false}
              className="w-full h-[420px] bg-black/50 border border-amber-900/30 rounded-xl p-4 font-mono text-sm text-amber-100 placeholder-slate-600 outline-none resize-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                  {outputLabel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {formatted && (
                  <span className="text-xs text-slate-500">
                    {stats.outputLines} {linesText} Â· {stats.outputChars} {charsText}
                  </span>
                )}
                <button
                  onClick={handleCopy}
                  disabled={!formatted}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-amber-900/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {copiedText}
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      {copyText}
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="w-full h-[420px] bg-black/50 border border-amber-900/30 rounded-xl p-4 overflow-auto">
              {formatted ? (
                <pre className="font-mono text-sm text-amber-100 whitespace-pre-wrap break-words">
                  {formatted}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-sm font-mono">
                  <Wand2 className="w-5 h-5 mr-2 opacity-40" />
                  {placeholderText}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-amber-900/30 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">
                  {validationText}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {input.trim() ? (
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      validation.valid
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/15 text-red-300 border border-red-500/40'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        validation.valid ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    {validation.valid ? validText : invalidText}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">{placeholderText}</span>
                )}

                <button
                  onClick={resetWorkspace}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-amber-900/40 bg-transparent text-slate-400 hover:text-amber-300 hover:border-amber-500/60 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {resetText}
                </button>
              </div>
            </div>

            {input.trim() && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-amber-900/20">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-red-400/80 mb-2">
                    {errorsText} ({validation.errors.length})
                  </div>
                  {validation.errors.length > 0 ? (
                    <ul className="space-y-1">
                      {validation.errors.map((err, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-red-200/90 font-mono">
                          <span className="text-red-400 mt-0.5">âœ•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">â€”</span>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-400/80 mb-2">
                    {warningsText} ({validation.warnings.length})
                  </div>
                  {validation.warnings.length > 0 ? (
                    <ul className="space-y-1">
                      {validation.warnings.map((warn, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-amber-200/90 font-mono">
                          <span className="text-amber-400 mt-0.5">!</span>
                          <span>{warn}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">â€”</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-sql-flow-bottom" />
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
