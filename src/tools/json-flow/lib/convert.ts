// ============================================================================
// JSON → XML and JSON → YAML.
// ----------------------------------------------------------------------------
// The previous XML writer produced documents no parser accepts: an array at the
// root emitted several root elements, `xsi:nil` was used without ever declaring
// the namespace, and a key like "2024" became a tag starting with a digit.
// Everything below is checked against those three cases.
// ============================================================================

import type { JsonNode } from '../types';
import { toValue } from './parse';

// ---------------------------------------------------------------------------
// XML
// ---------------------------------------------------------------------------

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, ch => XML_ESCAPES[ch]);
}

/** Turns any key into a legal XML Name (NameStartChar / NameChar). */
export function xmlName(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_.\-]/g, '_');
  if (!cleaned) return '_';
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

export interface XmlOptions {
  rootName?: string;
  itemName?: string;
  indent?: string;
  declaration?: boolean;
}

export function toXml(root: JsonNode, options: XmlOptions = {}): string {
  const rootName = xmlName(options.rootName || 'root');
  const itemName = xmlName(options.itemName || 'item');
  const unit = options.indent ?? '  ';
  const out: string[] = [];

  const writeValue = (value: unknown, name: string, pad: string) => {
    if (value === null || value === undefined) {
      out.push(`${pad}<${name}/>`);
      return;
    }
    if (Array.isArray(value)) {
      // Repeating the element name is the conventional XML shape for a list.
      if (value.length === 0) {
        out.push(`${pad}<${name}/>`);
        return;
      }
      value.forEach(item => writeValue(item, name, pad));
      return;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        out.push(`${pad}<${name}/>`);
        return;
      }
      out.push(`${pad}<${name}>`);
      for (const [key, child] of entries) writeValue(child, xmlName(key), pad + unit);
      out.push(`${pad}</${name}>`);
      return;
    }
    out.push(`${pad}<${name}>${escapeXml(String(value))}</${name}>`);
  };

  const value = toValue(root);

  if (Array.isArray(value)) {
    // A single root element wrapping <item> children — never a bare sequence.
    out.push(`<${rootName}>`);
    value.forEach(item => writeValue(item, itemName, unit));
    out.push(`</${rootName}>`);
  } else {
    writeValue(value, rootName, '');
  }

  const declaration = options.declaration === false ? '' : '<?xml version="1.0" encoding="UTF-8"?>\n';
  return declaration + out.join('\n');
}

// ---------------------------------------------------------------------------
// YAML
// ---------------------------------------------------------------------------

// Anything YAML would re-read as a different type has to be quoted.
const YAML_RESERVED = /^(?:true|false|yes|no|on|off|null|~|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)$/i;
const YAML_NEEDS_QUOTES = /^[\s&*!|>%@`"'#,[\]{}?:-]|[:#]\s|\s$|^$/;

function yamlScalar(value: unknown, pad: string): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '.nan';

  const text = String(value);
  if (text.includes('\n')) {
    // Block scalar keeps real multi-line text readable instead of one long
    // line full of \n escapes.
    const body = text
      .replace(/\n$/, '')
      .split('\n')
      .map(line => `${pad}  ${line}`)
      .join('\n');
    return `|-\n${body}`;
  }
  if (YAML_RESERVED.test(text) || YAML_NEEDS_QUOTES.test(text)) return JSON.stringify(text);
  return text;
}

function yamlKey(key: string): string {
  return YAML_RESERVED.test(key) || YAML_NEEDS_QUOTES.test(key) ? JSON.stringify(key) : key;
}

export function toYaml(root: JsonNode): string {
  const lines: string[] = [];

  const write = (value: unknown, pad: string) => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        // At the document root there is no key line to append to.
        if (lines.length === 0) lines.push('[]');
        else lines[lines.length - 1] += ' []';
        return;
      }
      for (const item of value) {
        if (item !== null && typeof item === 'object' && Object.keys(item).length > 0) {
          lines.push(`${pad}-`);
          write(item, `${pad}  `);
        } else {
          lines.push(`${pad}- ${yamlScalar(item, pad)}`);
        }
      }
      return;
    }

    if (value !== null && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        if (lines.length === 0) lines.push('{}');
        else lines[lines.length - 1] += ' {}';
        return;
      }
      for (const [key, child] of entries) {
        const isContainer = child !== null && typeof child === 'object';
        const isEmpty = isContainer && Object.keys(child as object).length === 0;
        if (isContainer && !isEmpty) {
          lines.push(`${pad}${yamlKey(key)}:`);
          write(child, Array.isArray(child) ? pad : `${pad}  `);
        } else if (isEmpty) {
          lines.push(`${pad}${yamlKey(key)}: ${Array.isArray(child) ? '[]' : '{}'}`);
        } else {
          lines.push(`${pad}${yamlKey(key)}: ${yamlScalar(child, pad)}`);
        }
      }
      return;
    }

    lines.push(`${pad}${yamlScalar(value, pad)}`);
  };

  write(toValue(root), '');
  return lines.join('\n');
}
