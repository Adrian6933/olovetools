// ============================================================================
// Ready-to-paste shapes for the encoded payload.
// ----------------------------------------------------------------------------
// Nobody wants a bare Base64 string: they want the line that goes into their
// stylesheet, their JSON body or their <img> tag. Producing those from the same
// payload is the difference between "here is your Base64" and "here is the code
// you were about to write by hand".
// ============================================================================

export type SnippetId = 'raw' | 'dataurl' | 'css' | 'html' | 'json' | 'markdown' | 'curl' | 'pem';

export interface Snippet {
  id: SnippetId;
  label: string;
  /** Prism-style language name for the label chip. */
  lang: string;
}

export const SNIPPETS: Snippet[] = [
  { id: 'raw', label: 'Base64', lang: 'text' },
  { id: 'dataurl', label: 'Data URL', lang: 'uri' },
  { id: 'css', label: 'CSS', lang: 'css' },
  { id: 'html', label: 'HTML', lang: 'html' },
  { id: 'json', label: 'JSON', lang: 'json' },
  { id: 'markdown', label: 'Markdown', lang: 'md' },
  { id: 'curl', label: 'cURL', lang: 'bash' },
  { id: 'pem', label: 'PEM', lang: 'text' },
];

interface SnippetInput {
  base64: string;
  mime: string;
  /** Original file name, when there was one. */
  name: string;
  /** True when an <img> can render this MIME type. */
  previewable: boolean;
}

/** JSON string escaping for a payload that is Base64 and therefore already safe. */
function jsonName(name: string): string {
  return JSON.stringify(name || 'payload');
}

export function renderSnippet(id: SnippetId, input: SnippetInput): string {
  const { base64, mime, name, previewable } = input;
  if (!base64) return '';
  const dataUrl = `data:${mime || 'application/octet-stream'};base64,${base64}`;
  const alt = (name || 'image').replace(/"/g, '');

  switch (id) {
    case 'raw':
      return base64;
    case 'dataurl':
      return dataUrl;
    case 'css':
      return previewable
        ? `.element {\n  background-image: url("${dataUrl}");\n  background-repeat: no-repeat;\n}`
        : `@font-face {\n  font-family: "Embedded";\n  src: url("${dataUrl}") format("${mime.includes('woff2') ? 'woff2' : 'woff'}");\n}`;
    case 'html':
      return previewable
        ? `<img src="${dataUrl}" alt="${alt}" />`
        : `<a href="${dataUrl}" download="${alt}">${alt}</a>`;
    case 'json':
      return `{\n  "name": ${jsonName(name)},\n  "mime": ${JSON.stringify(mime)},\n  "data": "${base64}"\n}`;
    case 'markdown':
      return previewable ? `![${alt}](${dataUrl})` : `[${alt}](${dataUrl})`;
    case 'curl':
      return `curl -X POST https://api.example.com/upload \\\n  -H "Content-Type: application/json" \\\n  -d '{"filename":${jsonName(name)},"data":"${base64}"}'`;
    case 'pem':
      // PEM is 64-column with CRLF-agnostic breaks; the label is generic on
      // purpose because we cannot know whether this is a key, a cert or a CSR.
      return `-----BEGIN DATA-----\n${wrap64(base64)}\n-----END DATA-----`;
    default:
      return base64;
  }
}

function wrap64(text: string): string {
  const flat = text.replace(/[\r\n]/g, '');
  const lines: string[] = [];
  for (let i = 0; i < flat.length; i += 64) lines.push(flat.slice(i, i + 64));
  return lines.join('\n');
}

/** Snippets that only make sense once we know the payload is a file. */
export function availableSnippets(hasMime: boolean): Snippet[] {
  return hasMime ? SNIPPETS : SNIPPETS.filter(s => s.id === 'raw' || s.id === 'json' || s.id === 'pem');
}
