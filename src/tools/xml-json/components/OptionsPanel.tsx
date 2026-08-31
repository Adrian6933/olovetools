import React from 'react';
import type { ToJsonOptions, ToXmlOptions } from '../types';

// ============================================================================
// The conversion options.
// ----------------------------------------------------------------------------
// Every one of these was hardcoded before: `@` for attributes, `#text` for
// text, never an array, strings for everything, prefixes kept verbatim. They
// are the difference between "a JSON-shaped thing" and JSON your consumer can
// actually parse into a stable type.
// ============================================================================

const label = 'text-[10px] font-black uppercase tracking-[0.14em] text-slate-500';
const field =
  'w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-slate-200 outline-none transition-colors focus:border-teal-500/50';

const Row: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({ title, hint, children }) => (
  <label className="flex min-w-0 flex-col gap-1.5">
    <span className={label} title={hint}>
      {title}
    </span>
    {children}
  </label>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; title: string }> = ({
  checked,
  onChange,
  title,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-bold outline-none transition-all ${
      checked
        ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
        : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20'
    }`}
  >
    <span
      className={`relative h-3.5 w-6 shrink-0 rounded-full transition-colors ${checked ? 'bg-teal-500/70' : 'bg-white/15'}`}
    >
      <span
        className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${checked ? 'left-3' : 'left-0.5'}`}
      />
    </span>
    <span className="truncate">{title}</span>
  </button>
);

interface OptionsPanelProps {
  direction: 'xml-to-json' | 'json-to-xml';
  json: ToJsonOptions;
  xml: ToXmlOptions;
  onJson: (patch: Partial<ToJsonOptions>) => void;
  onXml: (patch: Partial<ToXmlOptions>) => void;
  t: any;
}

export const OptionsPanel: React.FC<OptionsPanelProps> = ({ direction, json, xml, onJson, onXml, t }) => {
  if (direction === 'xml-to-json') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Row title={t.opt_attr_prefix || 'Attribute prefix'} hint={t.opt_attr_prefix_hint}>
          <input className={field} value={json.attrPrefix} maxLength={4} onChange={e => onJson({ attrPrefix: e.target.value })} />
        </Row>
        <Row title={t.opt_text_key || 'Text key'} hint={t.opt_text_key_hint}>
          <input className={field} value={json.textKey} maxLength={16} onChange={e => onJson({ textKey: e.target.value || '#text' })} />
        </Row>
        <Row title={t.opt_arrays || 'Arrays'} hint={t.opt_arrays_hint}>
          <select className={field} value={json.arrays} onChange={e => onJson({ arrays: e.target.value as ToJsonOptions['arrays'] })}>
            <option value="smart">{t.opt_arrays_smart || 'Only when repeated'}</option>
            <option value="always">{t.opt_arrays_always || 'Always'}</option>
            <option value="ordered">{t.opt_arrays_ordered || 'Ordered (lossless)'}</option>
          </select>
        </Row>
        <Row title={t.opt_force_array || 'Force array for'} hint={t.opt_force_array_hint}>
          <input
            className={field}
            value={json.forceArray.join(', ')}
            placeholder="item, entry"
            onChange={e => onJson({ forceArray: e.target.value.split(',') })}
          />
        </Row>
        <Row title={t.opt_namespaces || 'Namespaces'} hint={t.opt_namespaces_hint}>
          <select
            className={field}
            value={json.namespaces}
            onChange={e => onJson({ namespaces: e.target.value as ToJsonOptions['namespaces'] })}
          >
            <option value="keep">{t.opt_ns_keep || 'Keep prefixes'}</option>
            <option value="strip">{t.opt_ns_strip || 'Strip prefixes'}</option>
            <option value="expand">{t.opt_ns_expand || 'Expand to URI'}</option>
          </select>
        </Row>
        <Row title={t.opt_empty || 'Empty elements'} hint={t.opt_empty_hint}>
          <select className={field} value={json.empty} onChange={e => onJson({ empty: e.target.value as ToJsonOptions['empty'] })}>
            <option value="empty-string">{'""'}</option>
            <option value="null">null</option>
            <option value="object">{'{}'}</option>
          </select>
        </Row>
        <Row title={t.opt_indent || 'Indent'}>
          <select
            className={field}
            value={json.minify ? 'min' : String(json.indent)}
            onChange={e =>
              e.target.value === 'min' ? onJson({ minify: true }) : onJson({ minify: false, indent: Number(e.target.value) })
            }
          >
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="min">{t.opt_minified || 'Minified'}</option>
          </select>
        </Row>
        <div className="col-span-2 flex flex-wrap items-end gap-2 sm:col-span-3 lg:col-span-4">
          <Toggle checked={json.coerce} onChange={v => onJson({ coerce: v })} title={t.opt_coerce || 'Typed values'} />
          <Toggle checked={json.trim} onChange={v => onJson({ trim: v })} title={t.opt_trim || 'Trim whitespace'} />
          <Toggle checked={json.keepCdata} onChange={v => onJson({ keepCdata: v })} title={t.opt_cdata || 'Keep CDATA'} />
          <Toggle checked={json.keepComments} onChange={v => onJson({ keepComments: v })} title={t.opt_comments || 'Keep comments'} />
          <Toggle
            checked={json.keepDeclaration}
            onChange={v => onJson({ keepDeclaration: v })}
            title={t.opt_declaration || 'Keep declaration'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <Row title={t.opt_attr_prefix || 'Attribute prefix'} hint={t.opt_attr_prefix_hint}>
        <input className={field} value={xml.attrPrefix} maxLength={4} onChange={e => onXml({ attrPrefix: e.target.value })} />
      </Row>
      <Row title={t.opt_text_key || 'Text key'} hint={t.opt_text_key_hint}>
        <input className={field} value={xml.textKey} maxLength={16} onChange={e => onXml({ textKey: e.target.value || '#text' })} />
      </Row>
      <Row title={t.opt_root_name || 'Wrapper element'} hint={t.opt_root_name_hint}>
        <input className={field} value={xml.rootName} maxLength={32} onChange={e => onXml({ rootName: e.target.value || 'root' })} />
      </Row>
      <Row title={t.opt_item_name || 'Array item name'} hint={t.opt_item_name_hint}>
        <input className={field} value={xml.itemName} maxLength={32} onChange={e => onXml({ itemName: e.target.value || 'item' })} />
      </Row>
      <Row title={t.opt_indent || 'Indent'}>
        <select
          className={field}
          value={xml.minify ? 'min' : String(xml.indent)}
          onChange={e =>
            e.target.value === 'min' ? onXml({ minify: true }) : onXml({ minify: false, indent: Number(e.target.value) })
          }
        >
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="min">{t.opt_minified || 'Minified'}</option>
        </select>
      </Row>
      <div className="col-span-2 flex flex-wrap items-end gap-2 sm:col-span-3 lg:col-span-4">
        <Toggle checked={xml.declaration} onChange={v => onXml({ declaration: v })} title={t.opt_declaration || 'XML declaration'} />
        <Toggle checked={xml.selfClose} onChange={v => onXml({ selfClose: v })} title={t.opt_self_close || 'Self-closing tags'} />
        <Toggle checked={xml.nilAttribute} onChange={v => onXml({ nilAttribute: v })} title={t.opt_nil || 'null as xsi:nil'} />
      </div>
    </div>
  );
};

export default OptionsPanel;
