import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  Check,
  Copy,
  Download,
  FileJson2,
  FileSpreadsheet,
  GitCompareArrows,
  ListTree,
  Search,
  Shapes,
  Terminal,
} from 'lucide-react';
import type { IndentMode, JsonNode, OutputTab } from '../types';
import type { SortMode } from '../lib/serialize';
import { printJson, printJsonLines } from '../lib/serialize';
import { toXml, toYaml } from '../lib/convert';
import { buildTable, DEFAULT_FLATTEN, delimitedToRecords, toDelimited, type ArrayMode } from '../lib/table';
import { toGo, toJsonSchema, toTypeScript } from '../lib/schema';
import { runQuery } from '../lib/query';
import { diffJson, preview as previewValue } from '../lib/diff';
import { parseJson, toValue } from '../lib/parse';
import { copyText, downloadText } from '../lib/io';
import { TreeView } from './TreeView';
import type { SearchScope } from '../lib/tree';

// ============================================================================
// Everything downstream of a parsed document.
// ----------------------------------------------------------------------------
// Every panel derives from the AST through a useMemo. The old version called
// `jsonToXml(parsed)` straight inside the render body, so the whole XML string
// was rebuilt on every keystroke whether or not that tab was even open.
// ============================================================================

/** Above this many characters the <pre> shows a prefix; copy/download stay complete. */
const PREVIEW_CAP = 250_000;
const TABLE_ROW_CAP = 50;
const TABLE_COL_CAP = 40;

interface OutputProps {
  t: any;
  tab: OutputTab;
  setTab: (tab: OutputTab) => void;
  root: JsonNode | null;
  indent: IndentMode;
  sort: SortMode;
  stale: boolean;
  emptyLabel: string;
  onLocate: (offset: number) => void;
  onUseAsDocument: (text: string) => void;
  notify: (message: string) => void;
  /** Tree state is owned by the parent so toolbar buttons can drive it. */
  query: string;
  setQuery: (value: string) => void;
  scope: SearchScope;
  setScope: (value: SearchScope) => void;
  expanded: Set<string>;
  setExpanded: (next: Set<string>) => void;
  autoDepth: number;
  setAutoDepth: (value: number) => void;
}

const TABS: { id: OutputTab; key: string; fallback: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'tree', key: 'tab_tree_viewer', fallback: 'Tree', icon: ListTree as never },
  { id: 'code', key: 'tab_formatted_json', fallback: 'Code', icon: FileJson2 as never },
  { id: 'table', key: 'tab_table', fallback: 'Table', icon: FileSpreadsheet as never },
  { id: 'convert', key: 'tab_convert', fallback: 'Convert', icon: ArrowDownToLine as never },
  { id: 'schema', key: 'tab_schema', fallback: 'Types', icon: Shapes as never },
  { id: 'diff', key: 'tab_diff', fallback: 'Diff', icon: GitCompareArrows as never },
];

// ---------------------------------------------------------------------------

const Pill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}> = ({ active, onClick, children, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
      active
        ? 'bg-emerald-600/25 border-emerald-500/40 text-white'
        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
    }`}
  >
    {children}
  </button>
);

const CodeBox: React.FC<{
  text: string;
  filename: string;
  mime?: string;
  t: any;
  tone?: string;
  notify: (message: string) => void;
}> = ({ text, filename, mime, t, tone = 'text-emerald-200/90', notify }) => {
  const [copied, setCopied] = useState(false);
  const clipped = text.length > PREVIEW_CAP;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono text-slate-500">
          {(t.output_size || '{0} characters').replace('{0}', text.length.toLocaleString())}
        </span>
        <span className="h-px flex-1 bg-white/5 min-w-[1rem]" />
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(text);
            setCopied(ok);
            if (!ok) notify(t.copy_failed || 'The browser refused clipboard access.');
            window.setTimeout(() => setCopied(false), 1600);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 text-[11px] font-bold transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t.copied : t.copy}
        </button>
        <button
          type="button"
          onClick={() => downloadText(text, filename, mime)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer border-none"
        >
          <Download className="w-3.5 h-3.5" />
          {filename.split('.').pop()?.toUpperCase()}
        </button>
      </div>
      <pre
        className={`flex-1 min-h-0 bg-[#050807] border border-white/5 rounded-2xl p-4 overflow-auto font-mono text-[12px] leading-[1.55] whitespace-pre ${tone}`}
      >
        {clipped ? `${text.slice(0, PREVIEW_CAP)}\n\n…` : text}
      </pre>
      {clipped && (
        <p className="text-[11px] text-amber-300/80">
          {(t.preview_clipped || 'Preview stops at {0} characters. Copy and download give you the whole thing.').replace(
            '{0}',
            PREVIEW_CAP.toLocaleString()
          )}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------

export const Output: React.FC<OutputProps> = props => {
  const { t, root, tab, setTab, indent, sort, stale, notify } = props;

  // Convert
  const [convertFormat, setConvertFormat] = useState<'xml' | 'yaml' | 'jsonl'>('xml');
  const [xmlRoot, setXmlRoot] = useState('root');

  // Table
  const [arrayMode, setArrayMode] = useState<ArrayMode>('json');
  const [separator, setSeparator] = useState('.');
  const [delimiter, setDelimiter] = useState(',');
  const [csvInput, setCsvInput] = useState('');
  const [csvNest, setCsvNest] = useState(false);

  // Types
  const [schemaFormat, setSchemaFormat] = useState<'json-schema' | 'typescript' | 'go'>('typescript');
  const [typeName, setTypeName] = useState('Root');

  // Query
  const [expression, setExpression] = useState('$..');
  const [liveExpression, setLiveExpression] = useState('$..');

  // Diff
  const [otherText, setOtherText] = useState('');
  const [diffNonce, setDiffNonce] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setLiveExpression(expression), 200);
    return () => window.clearTimeout(id);
  }, [expression]);

  const codeText = useMemo(() => (root ? printJson(root, { indent, sort }) : ''), [root, indent, sort]);

  const convertText = useMemo(() => {
    if (!root) return '';
    if (convertFormat === 'xml') return toXml(root, { rootName: xmlRoot });
    if (convertFormat === 'yaml') return toYaml(root);
    return printJsonLines(root);
  }, [root, convertFormat, xmlRoot]);

  const table = useMemo(
    () => (root ? buildTable(root, { ...DEFAULT_FLATTEN, separator, arrayMode }) : null),
    [root, separator, arrayMode]
  );

  const schemaText = useMemo(() => {
    if (!root) return '';
    if (schemaFormat === 'typescript') return toTypeScript(root, typeName);
    if (schemaFormat === 'go') return toGo(root, typeName);
    return toJsonSchema(root, typeName);
  }, [root, schemaFormat, typeName]);

  const queryResult = useMemo(() => {
    if (!root) return null;
    const trimmed = liveExpression.trim();
    if (!trimmed || trimmed === '$' || trimmed === '$..') return null;
    return runQuery(toValue(root), trimmed);
  }, [root, liveExpression]);

  const diffResult = useMemo(() => {
    if (!root || !otherText.trim() || diffNonce === 0) return null;
    const other = parseJson(otherText);
    if (!other.ok) return { error: other.issues.find(i => i.severity === 'error')?.message || 'Invalid JSON' };
    return { summary: diffJson(toValue(root), toValue(other.root!)) };
  }, [root, otherText, diffNonce]);

  const empty = (
    <div className="flex flex-col items-center justify-center h-full min-h-[240px] p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
      <p className="text-sm font-medium max-w-xs">{props.emptyLabel}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tabs wrap instead of scrolling: at 375px a horizontal scroller hides
          half the destinations behind an edge nobody notices. */}
      <div className="flex flex-wrap gap-1 p-1.5 bg-slate-900/50 rounded-2xl border border-white/5 shrink-0" role="tablist">
        {TABS.map(item => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                active
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {t[item.key] || item.fallback}
            </button>
          );
        })}
      </div>

      {stale && (
        <p className="mt-3 text-[11px] text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 shrink-0">
          {t.stale_notice || 'The editor has changed since this was built. Press Parse to refresh it.'}
        </p>
      )}

      <div className="flex-1 min-h-0 mt-3 flex flex-col">
        {/* ---------------------------------------------------------------- */}
        {tab === 'tree' && (
          <div className="flex flex-col h-full min-h-0 gap-3">
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="relative flex-1 min-w-[10rem]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={props.query}
                  onChange={e => props.setQuery(e.target.value)}
                  placeholder={t.search_placeholder}
                  className="w-full bg-[#050807] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                {(['both', 'keys', 'values'] as SearchScope[]).map(item => (
                  <Pill key={item} active={props.scope === item} onClick={() => props.setScope(item)}>
                    {t[`scope_${item}`] || item}
                  </Pill>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    props.setExpanded(new Set());
                    props.setAutoDepth(999);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 cursor-pointer"
                >
                  {t.expand_all}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    props.setExpanded(new Set());
                    props.setAutoDepth(0);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 cursor-pointer"
                >
                  {t.collapse_all}
                </button>
                <select
                  value={props.autoDepth > 9 ? 'all' : String(props.autoDepth)}
                  onChange={e => {
                    props.setExpanded(new Set());
                    props.setAutoDepth(e.target.value === 'all' ? 999 : Number(e.target.value));
                  }}
                  aria-label={t.depth_label || 'Open to depth'}
                  className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2 py-2 rounded-xl outline-none font-bold cursor-pointer"
                >
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n} className="bg-[#050807]">
                      {(t.depth_option || 'Depth {0}').replace('{0}', String(n))}
                    </option>
                  ))}
                  <option value="all" className="bg-[#050807]">
                    {t.depth_all || 'All'}
                  </option>
                </select>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <TreeView
                root={root}
                query={props.query}
                scope={props.scope}
                expanded={props.expanded}
                setExpanded={props.setExpanded}
                autoDepth={props.autoDepth}
                t={t}
                onLocate={props.onLocate}
                onCopy={async text => {
                  const ok = await copyText(text);
                  if (!ok) notify(t.copy_failed || 'The browser refused clipboard access.');
                }}
                emptyLabel={props.emptyLabel}
              />
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {tab === 'code' &&
          (root ? (
            <CodeBox text={codeText} filename="json-flow.json" mime="application/json" t={t} notify={notify} />
          ) : (
            empty
          ))}

        {/* ---------------------------------------------------------------- */}
        {tab === 'table' && (
          <div className="flex flex-col h-full min-h-0 gap-3 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t.flatten_title || 'Flatten'}
              </span>
              <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                {(['json', 'expand', 'join'] as ArrayMode[]).map(mode => (
                  <Pill key={mode} active={arrayMode === mode} onClick={() => setArrayMode(mode)}>
                    {t[`array_${mode}`] || mode}
                  </Pill>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                {['.', '_', '/'].map(sep => (
                  <Pill key={sep} active={separator === sep} onClick={() => setSeparator(sep)} title={t.separator_label}>
                    {sep}
                  </Pill>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                <Pill active={delimiter === ','} onClick={() => setDelimiter(',')}>
                  CSV
                </Pill>
                <Pill active={delimiter === ';'} onClick={() => setDelimiter(';')}>
                  CSV ;
                </Pill>
                <Pill active={delimiter === '\t'} onClick={() => setDelimiter('\t')}>
                  TSV
                </Pill>
              </div>
              <button
                type="button"
                disabled={!table}
                onClick={() =>
                  table &&
                  downloadText(
                    toDelimited(table, delimiter),
                    delimiter === '\t' ? 'json-flow.tsv' : 'json-flow.csv',
                    'text/csv;charset=utf-8'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold transition-colors cursor-pointer border-none disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                {t.export_csv}
              </button>
            </div>

            {table ? (
              <>
                <div className="bg-[#050807] border border-white/5 rounded-2xl overflow-auto max-h-[320px] shrink-0">
                  <table className="w-full text-left font-mono text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-[#0a0f0d]">
                      <tr className="border-b border-white/10 text-slate-300">
                        {table.columns.slice(0, TABLE_COL_CAP).map(col => (
                          <th key={col} className="p-2.5 font-semibold border-r border-white/5 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, TABLE_ROW_CAP).map((row, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] text-slate-400">
                          {table.columns.slice(0, TABLE_COL_CAP).map(col => {
                            const cell = row[col];
                            const label =
                              cell === undefined || cell === null
                                ? ''
                                : typeof cell === 'object'
                                  ? JSON.stringify(cell)
                                  : String(cell);
                            return (
                              <td
                                key={col}
                                className="p-2.5 border-r border-white/5 max-w-[16rem] truncate"
                                title={label}
                              >
                                {label}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500 shrink-0">
                  {(t.table_summary || '{0} rows × {1} columns. The preview shows the first {2}.')
                    .replace('{0}', table.rows.length.toLocaleString())
                    .replace('{1}', String(table.columns.length))
                    .replace('{2}', String(Math.min(TABLE_ROW_CAP, table.rows.length)))}
                  {table.wrapped ? ` ${t.table_wrapped || 'The document is not an array, so it became a single row.'}` : ''}
                </p>
              </>
            ) : (
              empty
            )}

            <div className="border-t border-white/5 pt-4 space-y-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {t.import_csv}
                </span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={csvNest}
                    onChange={e => setCsvNest(e.target.checked)}
                    className="accent-emerald-500 cursor-pointer"
                  />
                  {t.csv_nest || 'Rebuild nesting from a.b headers'}
                </label>
              </div>
              <textarea
                value={csvInput}
                onChange={e => setCsvInput(e.target.value)}
                placeholder={t.csv_placeholder}
                className="w-full h-24 bg-[#050807] border border-white/10 rounded-2xl p-3 font-mono text-[11.5px] text-emerald-200/80 outline-none focus:border-emerald-500/50 resize-y"
              />
              <p className="text-[11px] text-slate-500">
                {t.csv_nest_hint ||
                  'Off by default on purpose: a first_name column must stay first_name, not turn into { first: { name } }.'}
              </p>
              <button
                type="button"
                disabled={!csvInput.trim()}
                onClick={() => {
                  const records = delimitedToRecords(csvInput, { nest: csvNest });
                  props.onUseAsDocument(JSON.stringify(records, null, indent === -1 ? '\t' : indent));
                }}
                className="w-full py-2.5 bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-900/50 text-emerald-300 font-bold text-[11.5px] rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {t.convert_csv_btn}
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {tab === 'convert' &&
          (root ? (
            <div className="flex flex-col h-full min-h-0 gap-3">
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                  {(['xml', 'yaml', 'jsonl'] as const).map(format => (
                    <Pill key={format} active={convertFormat === format} onClick={() => setConvertFormat(format)}>
                      {format.toUpperCase()}
                    </Pill>
                  ))}
                </div>
                {convertFormat === 'xml' && (
                  <label className="flex items-center gap-2 text-[11px] text-slate-400">
                    {t.xml_root || 'Root element'}
                    <input
                      value={xmlRoot}
                      onChange={e => setXmlRoot(e.target.value)}
                      className="w-28 bg-[#050807] border border-white/10 rounded-lg px-2 py-1 font-mono text-[11px] text-slate-200 outline-none focus:border-emerald-500/50"
                    />
                  </label>
                )}
              </div>
              <CodeBox
                text={convertText}
                filename={`json-flow.${convertFormat === 'jsonl' ? 'jsonl' : convertFormat}`}
                mime={convertFormat === 'xml' ? 'application/xml;charset=utf-8' : 'text/plain;charset=utf-8'}
                tone={convertFormat === 'xml' ? 'text-cyan-200/90' : 'text-emerald-200/90'}
                t={t}
                notify={notify}
              />
            </div>
          ) : (
            empty
          ))}

        {/* ---------------------------------------------------------------- */}
        {tab === 'schema' &&
          (root ? (
            <div className="flex flex-col h-full min-h-0 gap-3">
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                  <Pill active={schemaFormat === 'typescript'} onClick={() => setSchemaFormat('typescript')}>
                    TypeScript
                  </Pill>
                  <Pill active={schemaFormat === 'json-schema'} onClick={() => setSchemaFormat('json-schema')}>
                    JSON Schema
                  </Pill>
                  <Pill active={schemaFormat === 'go'} onClick={() => setSchemaFormat('go')}>
                    Go
                  </Pill>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-slate-400">
                  {t.type_name || 'Name'}
                  <input
                    value={typeName}
                    onChange={e => setTypeName(e.target.value || 'Root')}
                    className="w-28 bg-[#050807] border border-white/10 rounded-lg px-2 py-1 font-mono text-[11px] text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-500 shrink-0">
                {t.schema_hint ||
                  'Inferred from every record, not just the first: a field missing from some of them comes out optional.'}
              </p>
              <CodeBox
                text={schemaText}
                filename={
                  schemaFormat === 'typescript'
                    ? 'json-flow.d.ts'
                    : schemaFormat === 'go'
                      ? 'json-flow.go'
                      : 'json-flow.schema.json'
                }
                tone="text-sky-200/90"
                t={t}
                notify={notify}
              />
            </div>
          ) : (
            empty
          ))}

        {/* ---------------------------------------------------------------- */}
        {tab === 'diff' &&
          (root ? (
            <div className="flex flex-col h-full min-h-0 gap-3 overflow-y-auto pr-1">
              <p className="text-[11px] text-slate-500 shrink-0">
                {t.diff_hint ||
                  'Compared by path, not by line: reordering keys does not show up as a change.'}
              </p>
              <textarea
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                placeholder={t.diff_placeholder || 'Paste the other JSON document here…'}
                className="w-full h-32 bg-[#050807] border border-white/10 rounded-2xl p-3 font-mono text-[11.5px] text-slate-300 outline-none focus:border-emerald-500/50 resize-y shrink-0"
              />
              <button
                type="button"
                disabled={!otherText.trim()}
                onClick={() => setDiffNonce(n => n + 1)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11.5px] rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none shrink-0"
              >
                {t.diff_run || 'Compare'}
              </button>

              {diffResult && 'error' in diffResult && (
                <p className="text-[12px] text-rose-300 bg-rose-500/5 border border-rose-500/20 rounded-xl px-3 py-2">
                  {diffResult.error}
                </p>
              )}

              {diffResult && 'summary' in diffResult && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                      +{diffResult.summary.added}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300">
                      −{diffResult.summary.removed}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300">
                      ~{diffResult.summary.changed}
                    </span>
                  </div>
                  <div className="bg-[#050807] border border-white/5 rounded-2xl divide-y divide-white/5 max-h-[280px] overflow-auto">
                    {diffResult.summary.entries.length === 0 ? (
                      <p className="p-6 text-center text-sm text-slate-500">
                        {t.diff_identical || 'The two documents are structurally identical.'}
                      </p>
                    ) : (
                      diffResult.summary.entries.slice(0, 300).map((entry, i) => (
                        <div key={i} className="px-3 py-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span
                            className={`text-[10px] font-black uppercase w-16 shrink-0 ${
                              entry.kind === 'added'
                                ? 'text-emerald-400'
                                : entry.kind === 'removed'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                            }`}
                          >
                            {t[`diff_${entry.kind}`] || entry.kind}
                          </span>
                          <code className="font-mono text-[11.5px] text-slate-300 break-all">{entry.path}</code>
                          <span className="font-mono text-[11px] text-slate-500 break-all">
                            {previewValue(entry.before)} → {previewValue(entry.after)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            empty
          ))}
      </div>

      {/* Query bar: always visible under the panel, because a path expression is
          useful whatever tab you are on. */}
      {root && (
        <div className="mt-3 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              value={expression}
              onChange={e => setExpression(e.target.value)}
              spellCheck={false}
              placeholder={t.query_placeholder || '$.users[?(@.age > 30)].name'}
              className="flex-1 min-w-0 bg-[#050807] border border-white/10 rounded-xl px-3 py-2 font-mono text-[11.5px] text-emerald-200 outline-none focus:border-emerald-500/50"
            />
            {queryResult?.ok && queryResult.matches.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  props.onUseAsDocument(
                    JSON.stringify(
                      queryResult.matches.map(m => m.value),
                      null,
                      indent === -1 ? '\t' : indent
                    )
                  )
                }
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 cursor-pointer shrink-0"
              >
                {t.query_use || 'Use as document'}
              </button>
            )}
          </div>
          {queryResult && (
            <div className="text-[11px]">
              {queryResult.ok ? (
                <div className="space-y-1">
                  <p className="text-slate-500">
                    {(t.query_matches || '{0} matches').replace('{0}', String(queryResult.matches.length))}
                  </p>
                  {queryResult.matches.length > 0 && (
                    <div className="max-h-28 overflow-auto bg-[#050807] border border-white/5 rounded-xl divide-y divide-white/5">
                      {queryResult.matches.slice(0, 40).map((m, i) => (
                        <div key={i} className="px-3 py-1.5 flex items-baseline gap-3">
                          <code className="font-mono text-[11px] text-slate-500 shrink-0">{m.path}</code>
                          <code className="font-mono text-[11px] text-emerald-300 truncate">{previewValue(m.value, 80)}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-rose-300">{queryResult.error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
