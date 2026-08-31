// ============================================================================
// Starting points
// ----------------------------------------------------------------------------
// The "Start from" menu is the manual route into the tool: no file, no handoff,
// no clipboard — a skeleton you can type over. Bodies come from the dictionary
// so every language gets a document in its own language; the fallback below is
// only ever seen if a locale file is missing the key.
// ============================================================================

export interface Template {
  name: string;
  body: string;
}

/** Shown when the dictionary has no `placeholder` (a broken locale build). */
export const SAMPLE_FALLBACK = `# Welcome to MarkdownLive

Type on the left, watch it render on the right. Nothing is uploaded anywhere.

## What it understands

Text can be **bold**, *italic*, ~~struck through~~ or \`inline code\`, and links
like [oLoveTools](https://olovetools.com) open in a new tab.

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

> Blockquotes, footnotes and tables all work.

- [x] Nested lists
  - with real indentation
- [ ] Task lists
- [ ] GitHub-flavoured tables

| Feature | Status |
| :--- | ---: |
| Parser | Done |
| Themes | 5 |
`;

export function templatesFrom(t: any): Template[] {
  const raw = Array.isArray(t?.templates) ? t.templates : [];
  return raw
    .filter((entry: any) => entry && typeof entry.name === 'string' && typeof entry.body === 'string')
    .map((entry: any) => ({ name: entry.name, body: entry.body }));
}
