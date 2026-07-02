import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, Language } from '../../locales/dictionary';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { JSONTree } from './components/JSONTree';
import { 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  RefreshCw, 
  Search, 
  FileUp, 
  Braces, 
  ChevronRight, 
  ChevronDown, 
  Grid,
  FileCode,
  Shield,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface JSONFlowProps {
  lang: Language;
  dictionary: any;
}

// Mock Templates
const MOCK_TEMPLATES = {
  user: {
    id: 101,
    name: "Jane Doe",
    username: "janedoe",
    email: "jane.doe@example.com",
    address: {
      street: "123 Tech Lane",
      suite: "Apt. 45",
      city: "San Francisco",
      zipcode: "94101"
    },
    skills: ["JavaScript", "React", "TypeScript", "Node.js"],
    isActive: true,
    preferences: {
      theme: "dark",
      notifications: {
        email: true,
        sms: false
      }
    }
  },
  products: [
    {
      productId: "P001",
      title: "Ultra-Wide Developer Monitor",
      price: 449.99,
      specs: {
        size: "34 inch",
        resolution: "3440 x 1440",
        refreshRate: "144Hz"
      },
      inStock: true,
      tags: ["hardware", "monitor", "developer"]
    },
    {
      productId: "P002",
      title: "Mechanical Keyboard (Hot-swappable)",
      price: 129.50,
      specs: {
        layout: "75%",
        switches: "Linear Red",
        backlight: "RGB"
      },
      inStock: true,
      tags: ["hardware", "keyboard"]
    },
    {
      productId: "P003",
      title: "Ergonomic Office Chair",
      price: 319.00,
      specs: {
        material: "Mesh",
        armrests: "4D adjustable"
      },
      inStock: false,
      tags: ["furniture", "office"]
    }
  ],
  weather: {
    location: "Madrid, Spain",
    coordinates: {
      latitude: 40.4168,
      longitude: -3.7038
    },
    forecast: [
      {
        day: "Monday",
        temperature: { high: 28, low: 16 },
        condition: "Sunny",
        humidity: 35
      },
      {
        day: "Tuesday",
        temperature: { high: 30, low: 18 },
        condition: "Clear",
        humidity: 30
      },
      {
        day: "Wednesday",
        temperature: { high: 25, low: 15 },
        condition: "Partly Cloudy",
        humidity: 45
      }
    ],
    updatedAt: "2026-06-15T12:00:00Z"
  }
};

// Flatten utility for CSV grids
function flattenObject(ob: any, prefix = ''): Record<string, any> {
  const toReturn: Record<string, any> = {};
  for (const i in ob) {
    if (!Object.prototype.hasOwnProperty.call(ob, i)) continue;
    if ((typeof ob[i]) === 'object' && ob[i] !== null) {
      const flatObject = flattenObject(ob[i], prefix ? `${prefix}_${i}` : i);
      for (const x in flatObject) {
        if (!Object.prototype.hasOwnProperty.call(flatObject, x)) continue;
        toReturn[x] = flatObject[x];
      }
    } else {
      toReturn[prefix ? `${prefix}_${i}` : i] = ob[i];
    }
  }
  return toReturn;
}

// Convert JSON to XML string
function jsonToXml(data: any, rootName = 'root'): string {
  const convert = (val: any, name: string, indent = ''): string => {
    const cleanName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (val === null || val === undefined) {
      return `${indent}<${cleanName} xsi:nil="true" />`;
    }
    if (typeof val !== 'object') {
      const escaped = String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      return `${indent}<${cleanName}>${escaped}</${cleanName}>`;
    }
    if (Array.isArray(val)) {
      return val.map(item => convert(item, 'item', indent)).join('\n');
    }
    const children = Object.keys(val)
      .map(key => convert(val[key], key, indent + '  '))
      .join('\n');
    return `${indent}<${cleanName}>\n${children}\n${indent}</${cleanName}>`;
  };
  
  return `<?xml version="1.0" encoding="UTF-8"?>\n` + convert(data, rootName);
}

// Parse CSV text to JSON array
function csvToJson(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];
  
  const parseLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };
  
  const headers = parseLine(lines[0]);
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let val: any = values[index] !== undefined ? values[index] : '';
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (!isNaN(Number(val)) && val !== '') val = Number(val);
      else if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
        try {
          val = JSON.parse(val);
        } catch (e) {}
      }
      
      // Support nested paths (e.g. user_name or user.name)
      const cleanHeader = header.replace(/_/g, '.');
      if (cleanHeader.includes('.')) {
        const parts = cleanHeader.split('.');
        let currentObj = obj;
        for (let p = 0; p < parts.length - 1; p++) {
          const part = parts[p];
          if (!currentObj[part]) currentObj[part] = {};
          currentObj = currentObj[part];
        }
        currentObj[parts[parts.length - 1]] = val;
      } else {
        obj[header] = val;
      }
    });
    result.push(obj);
  }
  return result;
}

export const JSONFlow: React.FC<JSONFlowProps> = ({ lang, dictionary }) => {
  const { t } = useTranslation(lang, 'json-flow');
  
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parsedJSON, setParsedJSON] = useState<any>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [validationError, setValidationError] = useState<string>('');
  const [indentSpaces, setIndentSpaces] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tree' | 'formatted' | 'csv' | 'xml'>('tree');
  
  // CSV Input/Output states
  const [csvInputText, setCsvInputText] = useState<string>('');
  const [csvResultRows, setCsvResultRows] = useState<Record<string, any>[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  
  // Local trigger toggles for tree viewer
  const [isExpandedAll, setIsExpandedAll] = useState<boolean>(false);
  const [isCollapsedAll, setIsCollapsedAll] = useState<boolean>(false);
  
  // Copy indicators
  const [copiedInput, setCopiedInput] = useState<boolean>(false);
  const [copiedFormatted, setCopiedFormatted] = useState<boolean>(false);
  const [copiedXml, setCopiedXml] = useState<boolean>(false);
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);
  
  // Drag & drop file status
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  // Modal layout
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  
  // Refs for scrolling line numbers sync
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  // Sync scrolling of line numbers panel and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Parsing JSON on input change
  useEffect(() => {
    if (!jsonInput.trim()) {
      setParsedJSON(null);
      setIsValid(true);
      setValidationError('');
      setCsvResultRows([]);
      setCsvColumns([]);
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedJSON(parsed);
      setIsValid(true);
      setValidationError('');
      
      // Calculate CSV structures
      const rows = Array.isArray(parsed) 
        ? parsed.map(item => typeof item === 'object' && item !== null ? flattenObject(item) : { value: item })
        : [typeof parsed === 'object' && parsed !== null ? flattenObject(parsed) : { value: parsed }];
      
      const cols = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
      setCsvResultRows(rows);
      setCsvColumns(cols);
    } catch (err) {
      setIsValid(false);
      setValidationError((err as Error).message);
    }
  }, [jsonInput]);

  // Load Mock Template
  const handleLoadMock = (type: 'user' | 'products' | 'weather') => {
    const data = MOCK_TEMPLATES[type];
    const spacer = indentSpaces === -1 ? '\t' : indentSpaces;
    setJsonInput(JSON.stringify(data, null, spacer));
  };

  // Beautify JSON in input
  const handleBeautify = () => {
    if (!isValid || !parsedJSON) return;
    const spacer = indentSpaces === -1 ? '\t' : indentSpaces;
    setJsonInput(JSON.stringify(parsedJSON, null, spacer));
  };

  // Minify JSON in input
  const handleMinify = () => {
    if (!isValid || !parsedJSON) return;
    setJsonInput(JSON.stringify(parsedJSON));
  };

  // Sort Keys alphabetically
  const sortKeys = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    
    return Object.keys(obj)
      .sort()
      .reduce((sorted: Record<string, any>, key) => {
        sorted[key] = sortKeys(obj[key]);
        return sorted;
      }, {});
  };

  const handleSortKeys = () => {
    if (!isValid || !parsedJSON) return;
    const sorted = sortKeys(parsedJSON);
    const spacer = indentSpaces === -1 ? '\t' : indentSpaces;
    setJsonInput(JSON.stringify(sorted, null, spacer));
  };

  // Clear inputs
  const handleClear = () => {
    setJsonInput('');
  };

  // Copy helpers
  const handleCopyInput = () => {
    navigator.clipboard.writeText(jsonInput);
    setCopiedInput(true);
    setTimeout(() => setCopiedInput(false), 2000);
  };

  const handleCopyFormatted = () => {
    if (!parsedJSON) return;
    const spacer = indentSpaces === -1 ? '\t' : indentSpaces;
    const formatted = JSON.stringify(parsedJSON, null, spacer);
    navigator.clipboard.writeText(formatted);
    setCopiedFormatted(true);
    setTimeout(() => setCopiedFormatted(false), 2000);
  };

  const handleCopyXml = () => {
    if (!parsedJSON) return;
    navigator.clipboard.writeText(jsonToXml(parsedJSON));
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  // File Upload Handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      loadFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFile(file);
    }
  };

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (file.name.endsWith('.csv')) {
        try {
          const jsonResult = csvToJson(text);
          const spacer = indentSpaces === -1 ? '\t' : indentSpaces;
          setJsonInput(JSON.stringify(jsonResult, null, spacer));
        } catch (err) {
          alert("Error parsing CSV: " + (err as Error).message);
        }
      } else {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
  };

  // Download CSV
  const handleDownloadCsv = () => {
    if (csvResultRows.length === 0) return;
    const headerRow = csvColumns.join(',');
    const bodyRows = csvResultRows.map(row => 
      csvColumns.map(col => {
        const val = row[col];
        if (val === undefined || val === null) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    );
    const csvText = [headerRow, ...bodyRows].join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "json-flow-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download XML
  const handleDownloadXml = () => {
    if (!parsedJSON) return;
    const xmlText = jsonToXml(parsedJSON);
    const blob = new Blob([xmlText], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "json-flow-export.xml");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert CSV input to JSON
  const handleConvertCsvInput = () => {
    if (!csvInputText.trim()) return;
    try {
      const jsonResult = csvToJson(csvInputText);
      const spacer = indentSpaces === -1 ? '\t' : indentSpaces;
      setJsonInput(JSON.stringify(jsonResult, null, spacer));
      setActiveTab('tree');
    } catch (err) {
      alert("Error parsing CSV data: " + (err as Error).message);
    }
  };

  // Calculate input line count
  const lines = jsonInput.split('\n');

  // Modal handlers
  const openModal = (modal: 'privacy' | 'terms' | 'cookies') => {
    setActiveModal(modal);
  };

  const getModalContent = () => {
    if (!activeModal) return { title: '', content: '' };
    const navKey = activeModal === 'privacy' ? 'privacy' : activeModal === 'terms' ? 'terms' : 'cookies';
    const title = legalTranslations[lang]?.nav[navKey] || '';
    const content = legalTranslations[lang]?.sections[activeModal]?.join('\n\n') || '';
    return { title, content };
  };

  const { title: modalTitle, content: modalText } = getModalContent();

  return (
    <div className="min-h-screen bg-[#050807] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-200">
      <Header 
        currentLang={lang} 
        onLanguageChange={(newLang) => window.location.href = `/${newLang}/json-flow`}
        onReset={() => setJsonInput('')}
        t={t}
      />

      {/* Main Workspace Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 pt-32 pb-24 flex flex-col space-y-12">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-json-flow-top" />
        
        {/* SEO Premium Hero Header */}
        <section className="text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 py-8 border-b border-white/5 relative overflow-hidden">
          
          <div className="max-w-2xl space-y-4 relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-outfit">
              {t.seoHeroTitle}
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">
              {t.seoHeroText}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((item: string, idx: number) => (
                <div key={idx} className="flex items-center space-x-2 text-sm text-slate-300 font-semibold bg-emerald-950/20 border border-emerald-900/50 px-3.5 py-1.5 rounded-full shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl text-white shadow-xl shadow-emerald-950/20 flex flex-col items-center space-y-4 border border-emerald-500/20 w-full md:w-auto shrink-0 relative z-10 max-w-xs">
            <Shield className="w-12 h-12 text-emerald-200" />
            <h4 className="font-extrabold text-lg tracking-tight font-outfit text-center">100% Offline Security</h4>
            <p className="text-xs text-emerald-100 text-center leading-relaxed font-medium">
              No servers, no databases, no logs. All computation and operations are fully run locally inside your sandbox browser.
            </p>
          </div>
        </section>

        {/* Dropzone & Playground Workspace */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch transition-all duration-300 relative ${
            isDragOver ? 'scale-[1.01] border-2 border-dashed border-emerald-500 rounded-3xl bg-emerald-950/10' : ''
          }`}
        >
          {isDragOver && (
            <div className="absolute inset-0 bg-[#050807]/90 z-50 flex flex-col items-center justify-center space-y-4 rounded-3xl pointer-events-none">
              <FileUp className="w-16 h-16 text-emerald-400 animate-bounce" />
              <h3 className="text-xl font-bold text-white">{t.drop_file_prompt}</h3>
            </div>
          )}

          {/* Left Panel: Raw Input / Editor */}
          <div className="flex flex-col bg-[#0c100e] border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden flex-1 min-h-[500px]">
            {/* Action Bar Header */}
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0d0c] gap-3 shrink-0">
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">Input Editor</span>
              </div>
              
              {/* Indent Options & Load Mocks */}
              <div className="flex items-center space-x-2.5">
                <select 
                  value={indentSpaces}
                  onChange={(e) => setIndentSpaces(Number(e.target.value))}
                  className="bg-white/5 border border-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none font-bold cursor-pointer hover:border-emerald-500/30 transition-colors"
                >
                  <option value={2} className="bg-[#050807]">{t.indent_2_spaces}</option>
                  <option value={4} className="bg-[#050807]">{t.indent_4_spaces}</option>
                  <option value={-1} className="bg-[#050807]">{t.indent_tabs}</option>
                </select>

                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      handleLoadMock(e.target.value as any);
                      e.target.value = '';
                    }
                  }}
                  className="bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 text-xs px-3 py-1.5 rounded-xl outline-none font-bold cursor-pointer hover:bg-emerald-950/60 transition-colors"
                >
                  <option value="" className="bg-[#050807]">{t.load_mock}</option>
                  <option value="user" className="bg-[#050807]">{t.mock_user_profile}</option>
                  <option value="products" className="bg-[#050807]">{t.mock_product_catalog}</option>
                  <option value="weather" className="bg-[#050807]">{t.mock_weather_data}</option>
                </select>
              </div>
            </div>

            {/* Validation Feedback Line */}
            <div className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between shrink-0 border-b border-white/5 ${
              isValid ? 'bg-emerald-950/20 text-emerald-400' : 'bg-red-950/20 text-red-400'
            }`}>
              <div className="flex items-center space-x-2 truncate">
                <span className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="truncate">
                  {isValid ? t.status_valid : `${t.status_invalid} ${validationError}`}
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleCopyInput}
                  className="p-1 hover:text-white transition-colors cursor-pointer text-slate-400 outline-none"
                  title="Copy current editor content"
                >
                  {copiedInput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <label className="p-1 hover:text-white transition-colors cursor-pointer text-slate-400 select-none">
                  <FileUp className="w-3.5 h-3.5" />
                  <input type="file" onChange={handleFileInputChange} accept=".json,.csv" className="hidden" />
                </label>
              </div>
            </div>

            {/* Custom Interactive Textarea Workspace with Sync Line Numbers */}
            <div className="flex-1 flex overflow-hidden relative">
              <div 
                ref={lineNumbersRef}
                className="w-10 bg-[#070908] border-r border-white/5 py-4 text-right pr-2 text-slate-600 font-mono text-[11px] leading-[1.6rem] select-none overflow-hidden shrink-0"
              >
                {lines.map((_, i) => (
                  <div key={i} className="h-[1.6rem]">{i + 1}</div>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                onScroll={handleScroll}
                className="flex-1 bg-transparent py-4 px-4 font-mono text-[12px] leading-[1.6rem] text-slate-200 outline-none resize-none overflow-y-auto"
                placeholder={t.empty_placeholder}
                spellCheck={false}
              />
            </div>

            {/* Editor Action Buttons Footer */}
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-white/5 bg-[#0a0d0c] gap-3 shrink-0">
              <button 
                onClick={handleClear}
                disabled={!jsonInput}
                className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl border border-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clear}</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleSortKeys}
                  disabled={!isValid || !parsedJSON}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#0c1e15] hover:bg-[#122e20] text-emerald-300 border border-emerald-900/50 text-xs font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Sort object keys recursively"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.sort_keys}</span>
                </button>
                <button 
                  onClick={handleMinify}
                  disabled={!isValid || !parsedJSON}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#0c1e15] hover:bg-[#122e20] text-emerald-300 border border-emerald-900/50 text-xs font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t.minify}</span>
                </button>
                <button 
                  onClick={handleBeautify}
                  disabled={!isValid || !parsedJSON}
                  className="flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-950/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t.beautify}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Output Workspace / Tab Panels */}
          <div className="flex flex-col bg-[#0c100e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex-1 min-h-[500px]">
            {/* Tab Controls */}
            <div className="flex border-b border-white/5 bg-[#0a0d0c] overflow-x-auto shrink-0 select-none scrollbar-hide">
              <button 
                onClick={() => setActiveTab('tree')}
                className={`flex items-center space-x-2 px-6 py-4.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap outline-none ${
                  activeTab === 'tree' ? 'border-emerald-500 text-white bg-white/[0.02]' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Braces className="w-3.5 h-3.5" />
                <span>{t.tab_tree_viewer}</span>
              </button>
              <button 
                onClick={() => setActiveTab('formatted')}
                className={`flex items-center space-x-2 px-6 py-4.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap outline-none ${
                  activeTab === 'formatted' ? 'border-emerald-500 text-white bg-white/[0.02]' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{t.tab_formatted_json}</span>
              </button>
              <button 
                onClick={() => setActiveTab('csv')}
                className={`flex items-center space-x-2 px-6 py-4.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap outline-none ${
                  activeTab === 'csv' ? 'border-emerald-500 text-white bg-white/[0.02]' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{t.tab_csv_export}</span>
              </button>
              <button 
                onClick={() => setActiveTab('xml')}
                className={`flex items-center space-x-2 px-6 py-4.5 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap outline-none ${
                  activeTab === 'xml' ? 'border-emerald-500 text-white bg-white/[0.02]' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.tab_xml_export}</span>
              </button>
            </div>

            {/* Dynamic Workspace Container */}
            <div className="flex-1 overflow-y-auto p-6 relative min-h-[350px]">
              
              {/* Tab 1: Tree Viewer */}
              {activeTab === 'tree' && (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Tree Controls & Search */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.search_placeholder}
                        className="w-full bg-[#050807] border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>
                    <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto">
                      <button 
                        onClick={() => {
                          setIsExpandedAll(true);
                          // Reset after triggering down the tree
                          setTimeout(() => setIsExpandedAll(false), 200);
                        }}
                        className="flex-1 sm:flex-initial text-xs font-bold px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {t.expand_all}
                      </button>
                      <button 
                        onClick={() => {
                          setIsCollapsedAll(true);
                          // Reset after triggering down the tree
                          setTimeout(() => setIsCollapsedAll(false), 200);
                        }}
                        className="flex-1 sm:flex-initial text-xs font-bold px-4 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        {t.collapse_all}
                      </button>
                    </div>
                  </div>

                  {/* Render Visual Tree */}
                  <div className="flex-1 bg-[#050807] border border-white/5 rounded-2xl p-4 overflow-y-auto max-h-[450px]">
                    <JSONTree 
                      data={parsedJSON} 
                      searchTerm={searchQuery} 
                      isExpandedAll={isExpandedAll} 
                      isCollapsedAll={isCollapsedAll} 
                      t={t}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Formatted Code */}
              {activeTab === 'formatted' && (
                <div className="space-y-4 h-full flex flex-col relative">
                  {parsedJSON ? (
                    <>
                      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
                        <button
                          onClick={handleCopyFormatted}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-900/50 text-emerald-300 text-[11px] font-bold rounded-xl transition-colors hover:bg-emerald-950/80 cursor-pointer"
                        >
                          {copiedFormatted ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedFormatted ? t.copied : t.copy}</span>
                        </button>
                      </div>
                      <pre className="flex-1 bg-[#050807] border border-white/5 rounded-2xl p-5 overflow-auto font-mono text-[12px] leading-relaxed text-emerald-300/90 whitespace-pre max-h-[480px]">
                        {JSON.stringify(parsedJSON, null, indentSpaces === -1 ? '\t' : indentSpaces)}
                      </pre>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      <FileCode className="w-12 h-12 text-slate-600 mb-3" />
                      <p className="text-sm font-medium">{t.no_nodes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: CSV Grid & Conversions */}
              {activeTab === 'csv' && (
                <div className="space-y-6 h-full flex flex-col">
                  {/* CSV Export Area */}
                  {parsedJSON ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">JSON to CSV Grid</h4>
                        <button 
                          onClick={handleDownloadCsv}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t.export_csv}</span>
                        </button>
                      </div>

                      {/* Display Flattened Preview Grid */}
                      <div className="bg-[#050807] border border-white/5 rounded-2xl overflow-x-auto max-h-[300px] shadow-inner">
                        {csvResultRows.length > 0 ? (
                          <table className="w-full text-left font-mono text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-white/[0.02] border-b border-white/10 text-slate-300">
                                {csvColumns.map((col) => (
                                  <th key={col} className="p-3 font-semibold border-r border-white/5 whitespace-nowrap">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {csvResultRows.slice(0, 10).map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.02] text-slate-400">
                                  {csvColumns.map((col) => {
                                    const val = row[col];
                                    return (
                                      <td key={col} className="p-3 border-r border-white/5 truncate max-w-xs" title={String(val)}>
                                        {val === null ? 'null' : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-8 text-center text-slate-500">No columns resolved.</div>
                        )}
                      </div>
                      {csvResultRows.length > 10 && (
                        <p className="text-[10px] text-slate-500 italic text-right font-medium">
                          Showing first 10 rows. Export to download all {csvResultRows.length} rows.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs italic bg-[#050807] border border-white/5 rounded-2xl">
                      Enter valid JSON on the left to activate CSV export table preview.
                    </div>
                  )}

                  {/* CSV to JSON Converter Section (No generic uploader look) */}
                  <div className="border-t border-white/5 pt-6 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.import_csv}</span>
                    </h4>
                    <div className="relative">
                      <textarea
                        value={csvInputText}
                        onChange={(e) => setCsvInputText(e.target.value)}
                        placeholder={t.csv_placeholder}
                        className="w-full h-32 bg-[#050807] border border-white/10 rounded-2xl p-4 font-mono text-xs text-emerald-300/80 outline-none focus:border-emerald-500/50 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleConvertCsvInput}
                      disabled={!csvInputText.trim()}
                      className="w-full py-2.5 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-900/50 text-emerald-300 font-bold text-xs rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {t.convert_csv_btn}
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: XML Export */}
              {activeTab === 'xml' && (
                <div className="space-y-4 h-full flex flex-col relative">
                  {parsedJSON ? (
                    <>
                      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
                        <button
                          onClick={handleCopyXml}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-900/50 text-emerald-300 text-[11px] font-bold rounded-xl transition-colors hover:bg-emerald-950/80 cursor-pointer"
                        >
                          {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedXml ? t.copied : t.copy}</span>
                        </button>
                        <button
                          onClick={handleDownloadXml}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t.export_xml}</span>
                        </button>
                      </div>
                      <pre className="flex-1 bg-[#050807] border border-white/5 rounded-2xl p-5 overflow-auto font-mono text-[12px] leading-relaxed text-indigo-300/90 whitespace-pre max-h-[480px]">
                        {jsonToXml(parsedJSON)}
                      </pre>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                      <FileCode className="w-12 h-12 text-slate-600 mb-3" />
                      <p className="text-sm font-medium">{t.no_nodes}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Informative SEO Panel in Main Container */}
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

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-json-flow-bottom" />
      </main>

      {/* FAQs & Suit Branding Footer */}
      <Footer lang={lang} t={t} onOpenModal={openModal} />

      {/* Legal terms Modals */}
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
