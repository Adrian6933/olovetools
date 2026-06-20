import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { 
  Bold, 
  Italic, 
  Heading, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Code, 
  Terminal, 
  Quote, 
  List, 
  ListOrdered, 
  Table as TableIcon, 
  Minus, 
  Download, 
  Copy, 
  FileCode, 
  Printer, 
  RotateCcw,
  Sparkles,
  Eye,
  Settings
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface MarkdownLiveProps {
  lang: string;
  dictionary: any;
}

type ThemeType = 'slate' | 'journal' | 'retro' | 'cyberpunk';

export default function MarkdownLive({ lang, dictionary }: MarkdownLiveProps) {
  const t = dictionary || {};
  
  // Initial markdown content
  const initialMarkdown = t.placeholder || `# Welcome to Markdown-Live!

Type some markdown here on the left to see it rendered instantly on the right.

## Basic Styling

You can make text **bold** or *italic* easily, or embed \`inline code\` or custom links like [oLoveTools](https://olovetools.com).

### Code Block Example

\`\`\`javascript
function greet(name) {
  console.log('Hello, ' + name + '!');
}
greet('World');
\`\`\`

### Blockquotes & Lists

> Markdown is a lightweight markup language with plain-text-formatting syntax.

- Quick markdown editor
- 100% offline client-side parsing
- Responsive split-screen preview

### Tables Support

| Item | Count | Status |
| :--- | :---: | :---: |
| Editor | 1 | Done |
| Previewer | 1 | Live |
`;

  const [markdown, setMarkdown] = useState<string>(initialMarkdown);
  const [activeTab, setActiveTab] = useState<'preview' | 'html'>('preview');
  const [activeTheme, setActiveTheme] = useState<ThemeType>('slate');
  const [copySuccess, setCopySuccess] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const activeScrollRef = useRef<'editor' | 'preview' | null>(null);

  // Synchronize initial placeholder if dictionary changes
  useEffect(() => {
    if (t.placeholder) {
      setMarkdown(t.placeholder);
    }
  }, [t.placeholder]);

  // Markdown parser
  const parseMarkdown = (md: string): string => {
    if (!md) return '';

    // 1. Escape HTML
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Extract and preserve Code Blocks
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(
        `<pre class="bg-gray-950/90 border border-white/10 p-4 rounded-xl overflow-x-auto my-4 font-mono text-sm text-gray-200"><code class="language-${lang}">${code.trim()}</code></pre>`
      );
      return placeholder;
    });

    // 3. Extract and preserve Inline Code
    const inlineCodes: string[] = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
      inlineCodes.push(
        `<code class="bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded font-mono text-xs text-violet-400 font-semibold">${code}</code>`
      );
      return placeholder;
    });

    // 4. Horizontal Rules
    html = html.replace(/^---$/gm, '<hr class="my-6 border-t border-white/10" />');

    // 5. Headings
    html = html.replace(/^######\s+(.*)$/gm, '<h6 class="text-xs font-bold text-gray-400 mt-6 mb-2 uppercase tracking-wider">$1</h6>');
    html = html.replace(/^#####\s+(.*)$/gm, '<h5 class="text-sm font-bold text-gray-300 mt-6 mb-2">$1</h5>');
    html = html.replace(/^####\s+(.*)$/gm, '<h4 class="text-base font-bold text-gray-200 mt-6 mb-2">$1</h4>');
    html = html.replace(/^###\s+(.*)$/gm, '<h3 class="text-lg font-bold text-white mt-6 mb-3">$1</h3>');
    html = html.replace(/^##\s+(.*)$/gm, '<h2 class="text-xl font-extrabold text-white mt-8 mb-4 border-b border-white/5 pb-2">$1</h2>');
    html = html.replace(/^#\s+(.*)$/gm, '<h1 class="text-3xl font-black text-white mt-10 mb-6">$1</h1>');

    // 6. Blockquotes
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inBlockquote = false;
    let blockquoteContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('&gt;')) {
        inBlockquote = true;
        blockquoteContent.push(line.substring(4).trim());
      } else {
        if (inBlockquote) {
          processedLines.push(
            `<blockquote class="border-l-4 border-violet-500 bg-violet-950/20 px-4 py-3 my-4 rounded-r-xl italic text-gray-300">${blockquoteContent.join('<br />')}</blockquote>`
          );
          blockquoteContent = [];
          inBlockquote = false;
        }
        processedLines.push(line);
      }
    }
    if (inBlockquote) {
      processedLines.push(
        `<blockquote class="border-l-4 border-violet-500 bg-violet-950/20 px-4 py-3 my-4 rounded-r-xl italic text-gray-300">${blockquoteContent.join('<br />')}</blockquote>`
      );
    }
    html = processedLines.join('\n');

    // 7. Tables
    const tableLines = html.split('\n');
    const tableProcessed: string[] = [];
    let inTable = false;
    let tableHeader: string[] = [];
    let tableAlignments: string[] = [];
    let tableRows: string[][] = [];

    for (let i = 0; i < tableLines.length; i++) {
      const line = tableLines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        if (!inTable) {
          inTable = true;
          tableHeader = cells;
        } else {
          const isSeparator = cells.every(c => c.match(/^:?-+:?$/));
          if (isSeparator) {
            tableAlignments = cells.map(c => {
              if (c.startsWith(':') && c.endsWith(':')) return 'center';
              if (c.endsWith(':')) return 'right';
              return 'left';
            });
          } else {
            tableRows.push(cells);
          }
        }
      } else {
        if (inTable) {
          let tableHtml = `<div class="overflow-x-auto my-6"><table class="w-full text-sm text-left border-collapse border border-white/10 rounded-xl overflow-hidden">`;
          tableHtml += `<thead class="bg-white/5 border-b border-white/10 text-white font-bold"><tr>`;
          tableHeader.forEach((th, idx) => {
            const align = tableAlignments[idx] || 'left';
            tableHtml += `<th class="px-4 py-3 text-${align}">${th}</th>`;
          });
          tableHtml += `</tr></thead><tbody class="divide-y divide-white/5">`;
          tableRows.forEach(row => {
            tableHtml += `<tr class="hover:bg-white/[0.02] transition-colors">`;
            row.forEach((td, idx) => {
              const align = tableAlignments[idx] || 'left';
              tableHtml += `<td class="px-4 py-3 text-gray-300 text-${align}">${td}</td>`;
            });
            tableHtml += `</tr>`;
          });
          tableHtml += `</tbody></table></div>`;
          tableProcessed.push(tableHtml);
          inTable = false;
          tableHeader = [];
          tableAlignments = [];
          tableRows = [];
        }
        tableProcessed.push(tableLines[i]);
      }
    }
    if (inTable) {
      let tableHtml = `<div class="overflow-x-auto my-6"><table class="w-full text-sm text-left border-collapse border border-white/10 rounded-xl overflow-hidden">`;
      tableHtml += `<thead class="bg-white/5 border-b border-white/10 text-white font-bold"><tr>`;
      tableHeader.forEach((th, idx) => {
        const align = tableAlignments[idx] || 'left';
        tableHtml += `<th class="px-4 py-3 text-${align}">${th}</th>`;
      });
      tableHtml += `</tr></thead><tbody class="divide-y divide-white/5">`;
      tableRows.forEach(row => {
        tableHtml += `<tr class="hover:bg-white/[0.02] transition-colors">`;
        row.forEach((td, idx) => {
          const align = tableAlignments[idx] || 'left';
          tableHtml += `<td class="px-4 py-3 text-gray-300 text-${align}">${td}</td>`;
        });
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody></table></div>`;
      tableProcessed.push(tableHtml);
    }
    html = tableProcessed.join('\n');

    // 8. Lists (Unordered & Ordered)
    const listLines = html.split('\n');
    const listProcessed: string[] = [];
    let currentListType: 'ul' | 'ol' | null = null;

    for (let i = 0; i < listLines.length; i++) {
      const line = listLines[i];
      const ulMatch = line.match(/^(\s*)([*\-+])\s+(.*)$/);
      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

      if (ulMatch) {
        const content = ulMatch[3];
        if (currentListType !== 'ul') {
          if (currentListType === 'ol') listProcessed.push('</ol>');
          listProcessed.push('<ul class="list-disc pl-6 my-4 space-y-1.5 text-gray-300">');
          currentListType = 'ul';
        }
        listProcessed.push(`<li>${content}</li>`);
      } else if (olMatch) {
        const content = olMatch[3];
        if (currentListType !== 'ol') {
          if (currentListType === 'ul') listProcessed.push('</ul>');
          listProcessed.push('<ol class="list-decimal pl-6 my-4 space-y-1.5 text-gray-300">');
          currentListType = 'ol';
        }
        listProcessed.push(`<li>${content}</li>`);
      } else {
        if (currentListType === 'ul') {
          listProcessed.push('</ul>');
          currentListType = null;
        } else if (currentListType === 'ol') {
          listProcessed.push('</ol>');
          currentListType = null;
        }
        listProcessed.push(line);
      }
    }
    if (currentListType === 'ul') listProcessed.push('</ul>');
    else if (currentListType === 'ol') listProcessed.push('</ol>');
    html = listProcessed.join('\n');

    // 9. Inline formatting (Images, Links, Bold, Italic, Strikethrough)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-xl border border-white/10 max-w-full h-auto my-4 shadow-lg" />');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:text-violet-300 underline font-semibold transition-colors">$1</a>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 10. Paragraph breaks
    const blocks = html.split(/\n\s*\n/);
    const blockProcessed = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      const isBlockElement = /^(<h[1-6]|<ul|<ol|<table|<div|<pre|<blockquote|<hr|<li)/i.test(trimmed);
      if (isBlockElement) return trimmed;
      const content = trimmed.replace(/\n/g, '<br />');
      return `<p class="leading-relaxed mb-4 text-gray-300">${content}</p>`;
    });
    html = blockProcessed.join('\n');

    // 11. Restore placeholdered codes
    inlineCodes.forEach((codeHtml, idx) => {
      html = html.replace(`__INLINE_CODE_${idx}__`, codeHtml);
    });
    codeBlocks.forEach((codeHtml, idx) => {
      html = html.replace(`__CODE_BLOCK_${idx}__`, codeHtml);
    });

    return html;
  };

  const compiledHtml = parseMarkdown(markdown);

  // Scroll Sync
  const handleEditorScroll = () => {
    if (activeScrollRef.current === 'preview') return;
    activeScrollRef.current = 'editor';
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (editor && preview) {
      const scrollPct = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      preview.scrollTop = scrollPct * (preview.scrollHeight - preview.clientHeight);
    }
    setTimeout(() => {
      if (activeScrollRef.current === 'editor') activeScrollRef.current = null;
    }, 50);
  };

  const handlePreviewScroll = () => {
    if (activeScrollRef.current === 'editor') return;
    activeScrollRef.current = 'preview';
    const editor = editorRef.current;
    const preview = previewRef.current;
    if (editor && preview) {
      const scrollPct = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
      editor.scrollTop = scrollPct * (editor.scrollHeight - editor.clientHeight);
    }
    setTimeout(() => {
      if (activeScrollRef.current === 'preview') activeScrollRef.current = null;
    }, 50);
  };

  // Toolbar Formatting Injection
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = textarea.value.substring(start, end);
    const textToInsert = selection || defaultText;
    
    const replacement = prefix + textToInsert + suffix;
    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    
    setMarkdown(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + textToInsert.length);
    }, 0);
  };

  // Metric calculation
  const getMetrics = () => {
    const text = markdown || '';
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    return { words: wordCount, chars: charCount };
  };

  const metrics = getMetrics();

  // Exporters
  const downloadMarkdownFile = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'document.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHtmlFile = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>Exported Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    pre { background: #f4f4f4; border: 1px solid #ddd; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { font-family: Courier, monospace; background: #eee; padding: 2px 4px; border-radius: 3px; }
    blockquote { border-left: 4px solid #8b5cf6; padding-left: 15px; color: #555; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  ${compiledHtml}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'document.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyHtmlToClipboard = () => {
    navigator.clipboard.writeText(compiledHtml);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const printDocument = () => {
    window.print();
  };

  const resetWorkspace = () => {
    if (confirm('Are you sure you want to reset the editor? All current writing will be cleared.')) {
      setMarkdown(initialMarkdown);
    }
  };

  // Custom styling block for templates
  const themeStyles = `
    /* Modern Slate */
    .preview-body.theme-slate {
      color: #cbd5e1;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .preview-body.theme-slate h1, 
    .preview-body.theme-slate h2, 
    .preview-body.theme-slate h3 {
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
    }

    /* Clean Journal */
    .preview-body.theme-journal {
      background-color: #fcfbf9 !important;
      color: #2d3748 !important;
      font-family: Georgia, Merriweather, serif !important;
      padding: 2.5rem !important;
      border-radius: 1rem;
    }
    .preview-body.theme-journal h1, 
    .preview-body.theme-journal h2, 
    .preview-body.theme-journal h3 {
      color: #1a202c !important;
      font-family: Georgia, serif !important;
      border-color: #e2e8f0 !important;
    }
    .preview-body.theme-journal p {
      color: #2d3748 !important;
      line-height: 1.8 !important;
    }
    .preview-body.theme-journal pre {
      background: #f7f6f3 !important;
      border: 1px solid #e2e8f0 !important;
      color: #1a202c !important;
    }
    .preview-body.theme-journal code {
      background: #f7f6f3 !important;
      color: #c026d3 !important;
      border: none !important;
    }
    .preview-body.theme-journal blockquote {
      border-color: #8b5cf6 !important;
      background: #faf5ff !important;
      color: #4a5568 !important;
    }
    .preview-body.theme-journal table {
      border-color: #e2e8f0 !important;
    }
    .preview-body.theme-journal th {
      background-color: #f7f6f3 !important;
      border-color: #e2e8f0 !important;
      color: #1a202c !important;
    }
    .preview-body.theme-journal td {
      border-color: #e2e8f0 !important;
      color: #4a5568 !important;
    }

    /* Retro Typewriter */
    .preview-body.theme-retro {
      background-color: #f5f2eb !important;
      color: #3b3a36 !important;
      font-family: 'Courier New', Courier, monospace !important;
      padding: 2.5rem !important;
      border-radius: 1rem;
      box-shadow: inset 0 0 40px rgba(0,0,0,0.05);
    }
    .preview-body.theme-retro h1, 
    .preview-body.theme-retro h2, 
    .preview-body.theme-retro h3 {
      color: #1c1b18 !important;
      font-family: 'Courier New', Courier, monospace !important;
      border-bottom: 1px dashed #b5b2a9 !important;
    }
    .preview-body.theme-retro p {
      color: #3b3a36 !important;
    }
    .preview-body.theme-retro pre {
      background: #ebe7dd !important;
      border: 1px dashed #b5b2a9 !important;
      color: #2b2a27 !important;
    }
    .preview-body.theme-retro code {
      background: #ebe7dd !important;
      color: #b91c1c !important;
      border: none !important;
    }
    .preview-body.theme-retro blockquote {
      border-color: #78716c !important;
      background: #e7e5e4/30 !important;
      color: #57534e !important;
    }
    .preview-body.theme-retro table {
      border-color: #b5b2a9 !important;
    }
    .preview-body.theme-retro th, 
    .preview-body.theme-retro td {
      border-color: #b5b2a9 !important;
      color: #3b3a36 !important;
    }

    /* Cyberpunk Neon */
    .preview-body.theme-cyberpunk {
      background-color: #05050d !important;
      color: #00ffcc !important;
      font-family: 'Courier New', Courier, monospace !important;
      border: 1px solid #ff0055;
      padding: 2.5rem !important;
      border-radius: 1rem;
      box-shadow: 0 0 20px rgba(255, 0, 85, 0.15);
    }
    .preview-body.theme-cyberpunk h1, 
    .preview-body.theme-cyberpunk h2, 
    .preview-body.theme-cyberpunk h3 {
      color: #ff0055 !important;
      text-shadow: 0 0 8px rgba(255, 0, 85, 0.6) !important;
      border-color: #ff0055 !important;
    }
    .preview-body.theme-cyberpunk p {
      color: #00ffcc !important;
    }
    .preview-body.theme-cyberpunk pre {
      background: #090915 !important;
      border: 1px solid #00ffcc !important;
      color: #00ffcc !important;
      box-shadow: 0 0 10px rgba(0, 255, 204, 0.1);
    }
    .preview-body.theme-cyberpunk code {
      background: #ff0055/10 !important;
      color: #ff0055 !important;
      border: 1px solid #ff0055/20 !important;
    }
    .preview-body.theme-cyberpunk blockquote {
      border-color: #ff0055 !important;
      background: #ff0055/10 !important;
      color: #ff0055 !important;
    }
    .preview-body.theme-cyberpunk table {
      border-color: #00ffcc !important;
    }
    .preview-body.theme-cyberpunk th, 
    .preview-body.theme-cyberpunk td {
      border-color: #00ffcc !important;
      color: #00ffcc !important;
    }
  `;

  return (
    <div className="min-h-screen flex flex-col bg-[#030208] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      
      {/* Dynamic glow decoration */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <Header 
        currentLang={lang} 
        onLanguageChange={(l) => window.location.href = `/${l.toLowerCase()}/markdown-live`}
        onReset={resetWorkspace}
        t={t}
      />

      {/* Main workspace */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">
        
        {/* Banner Title */}
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span>{t.seoHeroTitle || 'Interactive Markdown split-screen editor'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        {/* Dashboard workspace */}
        <div className="flex flex-col flex-grow bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl min-h-[600px]">
          
          {/* Toolbar & controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900/80 border-b border-white/5 gap-4">
            
            {/* Format actions */}
            <div className="flex flex-wrap items-center gap-1.5 no-print">
              <button 
                onClick={() => insertFormatting('**', '**', 'bold text')} 
                title={t.tooltip_bold || 'Bold'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <Bold className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('*', '*', 'italic text')} 
                title={t.tooltip_italic || 'Italic'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <Italic className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('\n## ', '', 'Heading')} 
                title={t.tooltip_heading || 'Heading'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <Heading className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-white/10 mx-1"></div>

              <button 
                onClick={() => insertFormatting('[', '](https://example.com)', 'link text')} 
                title={t.tooltip_link || 'Link'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <LinkIcon className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('![', '](https://example.com/image.png)', 'Image Alt')} 
                title={t.tooltip_image || 'Image'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('`', '`', 'code')} 
                title={t.tooltip_code || 'Inline Code'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <Code className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('\n```javascript\n', '\n```\n', '// code snippet')} 
                title={t.tooltip_codeblock || 'Code Block'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <Terminal className="w-4 h-4" />
              </button>

              <div className="w-px h-6 bg-white/10 mx-1"></div>

              <button 
                onClick={() => insertFormatting('\n> ', '', 'Blockquote text')} 
                title={t.tooltip_quote || 'Blockquote'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <Quote className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('\n- ', '', 'list item')} 
                title={t.tooltip_ul || 'Unordered List'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <List className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('\n1. ', '', 'list item')} 
                title={t.tooltip_ol || 'Ordered List'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('\n| Header 1 | Header 2 |\n| :--- | :---: |\n| Cell 1 | Cell 2 |\n')} 
                title={t.tooltip_table || 'Table'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <TableIcon className="w-4 h-4" />
              </button>

              <button 
                onClick={() => insertFormatting('\n---\n')} 
                title={t.tooltip_hr || 'Horizontal Rule'}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-slate-300 hover:text-white transition-all cursor-pointer outline-none"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Options Deck (Themes & Tabs) */}
            <div className="flex flex-wrap items-center gap-4 no-print">
              
              {/* Theme skin select */}
              <div className="flex items-center space-x-2 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-white/5">
                <Settings className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-semibold text-slate-400">{t.style_label || 'Skin'}:</span>
                <select 
                  value={activeTheme} 
                  onChange={(e) => setActiveTheme(e.target.value as ThemeType)}
                  className="bg-transparent border-none text-xs text-white font-bold cursor-pointer outline-none focus:ring-0"
                >
                  <option value="slate" className="bg-slate-900 text-white">{t.style_default || 'Default Slate'}</option>
                  <option value="journal" className="bg-slate-900 text-white">{t.style_clean || 'Clean Journal'}</option>
                  <option value="retro" className="bg-slate-900 text-white">{t.style_retro || 'Retro Typewriter'}</option>
                  <option value="cyberpunk" className="bg-slate-900 text-white">{t.style_cyberpunk || 'Cyberpunk Neon'}</option>
                </select>
              </div>

              {/* View Selector */}
              <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-1.5 ${
                    activeTab === 'preview' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.preview_mode || 'Preview Pane'}</span>
                </button>
                <button
                  onClick={() => setActiveTab('html')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-1.5 ${
                    activeTab === 'html' ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{t.html_mode || 'Raw HTML'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Split workspace area */}
          <div className="flex flex-col md:flex-row flex-grow min-h-[500px]">
            
            {/* Left Column: Editor text panel */}
            <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-white/5 relative bg-slate-950/20 no-print">
              <textarea
                ref={editorRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onScroll={handleEditorScroll}
                placeholder="Type some markdown here..."
                className="w-full flex-grow p-6 md:p-8 bg-transparent text-slate-300 font-mono text-sm resize-none border-none outline-none focus:ring-0 focus:border-none scrollbar-thin"
              />
            </div>

            {/* Right Column: Viewer render panel */}
            <div className="w-full md:w-1/2 flex flex-col relative bg-slate-950/45 overflow-hidden">
              <div 
                ref={previewRef}
                onScroll={handlePreviewScroll}
                className="w-full flex-grow p-6 md:p-8 overflow-y-auto scrollbar-thin print-document-content preview-panel"
              >
                {activeTab === 'preview' ? (
                  <div 
                    className={`preview-body theme-${activeTheme} prose prose-invert max-w-none transition-all duration-300`}
                    dangerouslySetInnerHTML={{ __html: compiledHtml }}
                  />
                ) : (
                  <pre className="bg-transparent text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                    {compiledHtml}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Workspace Footer status metrics */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-slate-900/60 border-t border-white/5 text-xs text-slate-400 gap-4 no-print">
            
            {/* Word count indicators */}
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <span className="text-white font-bold">{metrics.words}</span>
                <span className="opacity-60">{t.words || 'words'}</span>
              </span>
              <span className="w-px h-3.5 bg-white/10"></span>
              <span className="flex items-center space-x-1">
                <span className="text-white font-bold">{metrics.chars}</span>
                <span className="opacity-60">{t.characters || 'characters'}</span>
              </span>
            </div>

            {/* Downloader & Export commands deck */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadMarkdownFile}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-white transition-all cursor-pointer outline-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.btn_download_md || 'Download MD'}</span>
              </button>

              <button
                onClick={downloadHtmlFile}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-white transition-all cursor-pointer outline-none"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{t.btn_download_html || 'Download HTML'}</span>
              </button>

              <button
                onClick={copyHtmlToClipboard}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer outline-none ${
                  copySuccess 
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                    : 'bg-white/5 border-white/5 hover:bg-violet-500/20 hover:border-violet-500/30 text-white'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copySuccess ? (t.copied || 'Copied!') : (t.btn_copy_html || 'Copy HTML')}</span>
              </button>

              <button
                onClick={printDocument}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all cursor-pointer outline-none shadow-lg shadow-violet-600/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t.btn_download_pdf || 'Export PDF'}</span>
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <Footer 
        lang={lang} 
        t={t} 
        onOpenModal={(modal) => setLegalModal(modal)} 
      />

      {/* Legal Modals */}
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
