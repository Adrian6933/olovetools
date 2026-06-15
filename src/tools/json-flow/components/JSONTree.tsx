import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, FileCode, List } from 'lucide-react';

interface JSONTreeProps {
  data: any;
  searchTerm: string;
  isExpandedAll: boolean;
  isCollapsedAll: boolean;
  t: any;
}

interface JSONNodeProps {
  name: string | number;
  value: any;
  depth: number;
  path: string;
  searchTerm: string;
  isExpandedAll: boolean;
  isCollapsedAll: boolean;
  t: any;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, highlight: string) {
  if (!highlight) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
          ? <mark key={i} className="bg-emerald-500/30 text-emerald-200 px-0.5 rounded font-semibold">{part}</mark>
          : part
      )}
    </span>
  );
}

function nodeContainsSearch(name: string | number, value: any, query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase();
  if (String(name).toLowerCase().includes(q)) return true;
  if (value === null) return 'null'.includes(q);
  if (typeof value !== 'object') {
    return String(value).toLowerCase().includes(q);
  }
  if (Array.isArray(value)) {
    return value.some((item, index) => nodeContainsSearch(index, item, query));
  }
  return Object.keys(value).some(key => nodeContainsSearch(key, value[key], query));
}

const JSONNode: React.FC<JSONNodeProps> = ({
  name,
  value,
  depth,
  path,
  searchTerm,
  isExpandedAll,
  isCollapsedAll,
  t
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedVal, setCopiedVal] = useState(false);

  useEffect(() => {
    if (isExpandedAll) {
      setIsExpanded(true);
    }
  }, [isExpandedAll]);

  useEffect(() => {
    if (isCollapsedAll) {
      setIsExpanded(false);
    }
  }, [isCollapsedAll]);

  useEffect(() => {
    if (searchTerm && nodeContainsSearch(name, value, searchTerm)) {
      setIsExpanded(true);
    }
  }, [searchTerm, name, value]);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 1500);
  };

  const handleCopyValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setCopiedVal(true);
    setTimeout(() => setCopiedVal(false), 1500);
  };

  // Render Primitive Values
  const renderPrimitive = () => {
    if (value === null) {
      return <span className="text-slate-500 font-mono italic">null</span>;
    }
    switch (typeof value) {
      case 'string':
        return (
          <span className="text-emerald-400 font-mono break-all font-medium">
            "{highlightText(value, searchTerm)}"
          </span>
        );
      case 'number':
        return (
          <span className="text-cyan-400 font-mono font-medium">
            {highlightText(String(value), searchTerm)}
          </span>
        );
      case 'boolean':
        return (
          <span className="text-purple-400 font-mono font-bold">
            {value ? 'true' : 'false'}
          </span>
        );
      default:
        return <span className="text-slate-300 font-mono">{String(value)}</span>;
    }
  };

  // If node doesn't match search and none of its children match, optionally hide or fade
  const matchesSearch = !searchTerm || nodeContainsSearch(name, value, searchTerm);
  if (!matchesSearch) return null;

  if (!isObject) {
    return (
      <div className="group flex items-center py-1.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors relative">
        {/* Indentation spacing & line guides */}
        <div className="flex shrink-0" style={{ width: `${depth * 20}px` }}>
          {Array.from({ length: depth }).map((_, i) => (
            <div key={i} className="w-5 h-full border-r border-white/5" />
          ))}
        </div>

        <div className="flex items-center space-x-2 w-full text-sm">
          <span className="text-slate-400 font-mono font-semibold shrink-0">
            {highlightText(String(name), searchTerm)}:
          </span>
          <div className="flex-1 min-w-0">
            {renderPrimitive()}
          </div>
        </div>

        {/* Copy utilities on Hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1.5 ml-2 transition-opacity duration-200 bg-[#050807] px-2 py-0.5 rounded border border-white/10 shrink-0">
          <button
            onClick={handleCopyPath}
            title="Copy path"
            className="p-1 hover:text-emerald-400 text-slate-400 bg-transparent border-none cursor-pointer outline-none transition-colors"
          >
            {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleCopyValue}
            title="Copy value"
            className="p-1 hover:text-emerald-400 text-slate-400 bg-transparent border-none cursor-pointer outline-none transition-colors text-[10px] font-bold uppercase flex items-center"
          >
            {copiedVal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px] px-0.5">Val</span>}
          </button>
        </div>
      </div>
    );
  }

  // Render Object / Array collapsible node
  const keys = isArray ? value : Object.keys(value);
  const size = isArray ? value.length : keys.length;

  return (
    <div className="w-full">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center py-1.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer relative"
      >
        {/* Indentation guide lines */}
        <div className="flex shrink-0" style={{ width: `${depth * 20}px` }}>
          {Array.from({ length: depth }).map((_, i) => (
            <div key={i} className="w-5 h-full border-r border-white/5" />
          ))}
        </div>

        <div className="flex items-center space-x-2 text-sm w-full">
          <span className="text-slate-400 shrink-0">
            {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-500/80" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          </span>
          {isArray ? (
            <List className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <span className="text-indigo-300 font-mono font-semibold shrink-0">
            {highlightText(String(name), searchTerm)}
          </span>
          <span className="text-slate-500 font-mono text-xs">
            {isArray ? `[${size} items]` : `{${size} keys}`}
          </span>
        </div>

        {/* Copy path on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1.5 ml-2 transition-opacity duration-200 bg-[#050807] px-2 py-0.5 rounded border border-white/10 shrink-0">
          <button
            onClick={handleCopyPath}
            title="Copy path"
            className="p-1 hover:text-emerald-400 text-slate-400 bg-transparent border-none cursor-pointer outline-none transition-colors"
          >
            {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleCopyValue}
            title="Copy whole branch"
            className="p-1 hover:text-emerald-400 text-slate-400 bg-transparent border-none cursor-pointer outline-none transition-colors text-[10px] font-bold uppercase flex items-center"
          >
            {copiedVal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="text-[10px] px-0.5">Obj</span>}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="w-full">
          {isArray ? (
            value.map((item: any, idx: number) => {
              const currentPath = `${path}[${idx}]`;
              return (
                <JSONNode
                  key={idx}
                  name={idx}
                  value={item}
                  depth={depth + 1}
                  path={currentPath}
                  searchTerm={searchTerm}
                  isExpandedAll={isExpandedAll}
                  isCollapsedAll={isCollapsedAll}
                  t={t}
                />
              );
            })
          ) : (
            keys.map((key: string) => {
              const currentPath = path ? `${path}.${key}` : key;
              return (
                <JSONNode
                  key={key}
                  name={key}
                  value={value[key]}
                  depth={depth + 1}
                  path={currentPath}
                  searchTerm={searchTerm}
                  isExpandedAll={isExpandedAll}
                  isCollapsedAll={isCollapsedAll}
                  t={t}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export const JSONTree: React.FC<JSONTreeProps> = ({
  data,
  searchTerm,
  isExpandedAll,
  isCollapsedAll,
  t
}) => {
  if (data === null || data === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
        <FileCode className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm font-medium">{t.no_nodes || 'No data available in tree.'}</p>
      </div>
    );
  }

  const isObject = typeof data === 'object';

  return (
    <div className="w-full text-slate-200 select-text pr-2 py-2">
      {isObject ? (
        Array.isArray(data) ? (
          data.map((item, idx) => (
            <JSONNode
              key={idx}
              name={idx}
              value={item}
              depth={0}
              path={`[${idx}]`}
              searchTerm={searchTerm}
              isExpandedAll={isExpandedAll}
              isCollapsedAll={isCollapsedAll}
              t={t}
            />
          ))
        ) : (
          Object.keys(data).map(key => (
            <JSONNode
              key={key}
              name={key}
              value={data[key]}
              depth={0}
              path={key}
              searchTerm={searchTerm}
              isExpandedAll={isExpandedAll}
              isCollapsedAll={isCollapsedAll}
              t={t}
            />
          ))
        )
      ) : (
        <JSONNode
          name="root"
          value={data}
          depth={0}
          path="root"
          searchTerm={searchTerm}
          isExpandedAll={isExpandedAll}
          isCollapsedAll={isCollapsedAll}
          t={t}
        />
      )}
    </div>
  );
};
