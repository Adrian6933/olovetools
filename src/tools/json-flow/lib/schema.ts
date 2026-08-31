// ============================================================================
// Type inference: JSON Schema, TypeScript interfaces and Go structs.
// ----------------------------------------------------------------------------
// The paid formatters all sell this. It is pure structure work on a document
// that is already parsed, so there is nothing to charge for.
//
// Arrays are inferred from *every* element, not just the first: a list where
// half the records lack `email` yields `email?: string`, which is the whole
// reason to generate the type from real data instead of writing it by hand.
// ============================================================================

import type { JsonNode } from '../types';
import { toValue } from './parse';

type Shape =
  | { t: 'string' | 'number' | 'integer' | 'boolean' | 'null' }
  | { t: 'array'; items: Shape | null }
  | { t: 'object'; props: Map<string, { shape: Shape; count: number }>; total: number }
  | { t: 'union'; options: Shape[] };

function shapeOf(value: unknown): Shape {
  if (value === null) return { t: 'null' };
  if (Array.isArray(value)) {
    let items: Shape | null = null;
    for (const item of value) items = items ? merge(items, shapeOf(item)) : shapeOf(item);
    return { t: 'array', items };
  }
  if (typeof value === 'object') {
    const props = new Map<string, { shape: Shape; count: number }>();
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      props.set(key, { shape: shapeOf(child), count: 1 });
    }
    return { t: 'object', props, total: 1 };
  }
  if (typeof value === 'number') return { t: Number.isInteger(value) ? 'integer' : 'number' };
  if (typeof value === 'boolean') return { t: 'boolean' };
  return { t: 'string' };
}

function key(shape: Shape): string {
  switch (shape.t) {
    case 'array':
      return `array<${shape.items ? key(shape.items) : 'any'}>`;
    case 'object':
      return `object{${[...shape.props.keys()].sort().join(',')}}`;
    case 'union':
      return `union(${shape.options.map(key).sort().join('|')})`;
    default:
      return shape.t;
  }
}

function merge(a: Shape, b: Shape): Shape {
  if (a.t === 'object' && b.t === 'object') {
    const props = new Map(a.props);
    for (const [name, entry] of b.props) {
      const existing = props.get(name);
      props.set(
        name,
        existing
          ? { shape: merge(existing.shape, entry.shape), count: existing.count + entry.count }
          : { shape: entry.shape, count: entry.count }
      );
    }
    return { t: 'object', props, total: a.total + b.total };
  }
  if (a.t === 'array' && b.t === 'array') {
    const items = a.items && b.items ? merge(a.items, b.items) : a.items || b.items;
    return { t: 'array', items };
  }
  // integer widens into number, everything else becomes a union.
  if ((a.t === 'integer' && b.t === 'number') || (a.t === 'number' && b.t === 'integer')) {
    return { t: 'number' };
  }
  if (key(a) === key(b)) return a;

  const options = [...(a.t === 'union' ? a.options : [a]), ...(b.t === 'union' ? b.options : [b])];
  const unique: Shape[] = [];
  const seen = new Set<string>();
  for (const option of options) {
    const id = key(option);
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(option);
    }
  }
  return unique.length === 1 ? unique[0] : { t: 'union', options: unique };
}

// ---------------------------------------------------------------------------
// JSON Schema (draft 2020-12)
// ---------------------------------------------------------------------------

function schemaOf(shape: Shape): Record<string, unknown> {
  switch (shape.t) {
    case 'array':
      return { type: 'array', items: shape.items ? schemaOf(shape.items) : {} };
    case 'object': {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [name, entry] of shape.props) {
        properties[name] = schemaOf(entry.shape);
        if (entry.count === shape.total) required.push(name);
      }
      const out: Record<string, unknown> = { type: 'object', properties };
      if (required.length) out.required = required;
      out.additionalProperties = false;
      return out;
    }
    case 'union': {
      const nullable = shape.options.some(o => o.t === 'null');
      const rest = shape.options.filter(o => o.t !== 'null');
      if (rest.length === 1 && nullable) {
        const base = schemaOf(rest[0]);
        return { ...base, type: [base.type, 'null'] };
      }
      return { anyOf: shape.options.map(schemaOf) };
    }
    default:
      return { type: shape.t };
  }
}

export function toJsonSchema(root: JsonNode, title = 'Root'): string {
  const shape = shapeOf(toValue(root));
  return JSON.stringify(
    { $schema: 'https://json-schema.org/draft/2020-12/schema', title, ...schemaOf(shape) },
    null,
    2
  );
}

// ---------------------------------------------------------------------------
// TypeScript
// ---------------------------------------------------------------------------

function pascal(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  const head = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return /^[A-Za-z]/.test(head) ? head : `Type${head}`;
}

function safeKey(name: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
}

function singular(name: string): string {
  if (/ies$/i.test(name)) return `${name.slice(0, -3)}y`;
  if (/(s|ss|sh|ch|x|z)es$/i.test(name)) return name.slice(0, -2);
  if (/s$/i.test(name) && !/ss$/i.test(name)) return name.slice(0, -1);
  return name;
}

export function toTypeScript(root: JsonNode, rootName = 'Root'): string {
  const shape = shapeOf(toValue(root));
  const blocks: string[] = [];
  const names = new Set<string>();

  const reserve = (base: string): string => {
    let name = pascal(base) || 'Node';
    let n = 2;
    while (names.has(name)) name = `${pascal(base)}${n++}`;
    names.add(name);
    return name;
  };

  const render = (current: Shape, hint: string): string => {
    switch (current.t) {
      case 'array':
        return current.items ? `${render(current.items, singular(hint))}[]` : 'unknown[]';
      case 'object': {
        if (current.props.size === 0) return 'Record<string, unknown>';
        const name = reserve(hint);
        const lines = [...current.props].map(([prop, entry]) => {
          const optional = entry.count < current.total ? '?' : '';
          return `  ${safeKey(prop)}${optional}: ${render(entry.shape, prop)};`;
        });
        blocks.push(`export interface ${name} {\n${lines.join('\n')}\n}`);
        return name;
      }
      case 'union':
        return current.options.map(option => render(option, hint)).join(' | ');
      case 'integer':
        return 'number';
      case 'null':
        return 'null';
      default:
        return current.t;
    }
  };

  const rootType = render(shape, rootName);
  // Nested interfaces are emitted depth-first, so reversing puts the root type
  // at the top where a reader expects it.
  blocks.reverse();
  if (!blocks.length || !blocks[0].startsWith(`export interface ${rootType}`)) {
    blocks.unshift(`export type ${pascal(rootName)}Document = ${rootType};`);
  }
  return blocks.join('\n\n');
}

// ---------------------------------------------------------------------------
// Go
// ---------------------------------------------------------------------------

export function toGo(root: JsonNode, rootName = 'Root'): string {
  const shape = shapeOf(toValue(root));
  const blocks: string[] = [];
  const names = new Set<string>();

  const reserve = (base: string): string => {
    let name = pascal(base) || 'Node';
    let n = 2;
    while (names.has(name)) name = `${pascal(base)}${n++}`;
    names.add(name);
    return name;
  };

  const render = (current: Shape, hint: string): string => {
    switch (current.t) {
      case 'array':
        return `[]${current.items ? render(current.items, singular(hint)) : 'interface{}'}`;
      case 'object': {
        if (current.props.size === 0) return 'map[string]interface{}';
        const name = reserve(hint);
        const lines = [...current.props].map(([prop, entry]) => {
          const optional = entry.count < current.total ? ',omitempty' : '';
          return `\t${pascal(prop)} ${render(entry.shape, prop)} \`json:"${prop}${optional}"\``;
        });
        blocks.push(`type ${name} struct {\n${lines.join('\n')}\n}`);
        return name;
      }
      case 'union':
        return 'interface{}';
      case 'integer':
        return 'int64';
      case 'number':
        return 'float64';
      case 'boolean':
        return 'bool';
      case 'null':
        return 'interface{}';
      default:
        return 'string';
    }
  };

  const rootType = render(shape, rootName);
  blocks.reverse();
  if (!blocks.length) blocks.push(`type ${pascal(rootName)} ${rootType}`);
  return `package main\n\n${blocks.join('\n\n')}\n`;
}
