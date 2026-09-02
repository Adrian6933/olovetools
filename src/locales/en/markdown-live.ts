export default {
  "resetHint": "Start over",
  "title": "MarkdownLive",
  "description": "Write Markdown on the left and watch the finished document build itself on the right — nested lists, task lists, tables, footnotes and highlighted code, all parsed inside your own tab.",
  "badge": "Markdown, rendered in your tab",
  "placeholder": "# Welcome to MarkdownLive\n\nType on the left and the document builds itself on the right. Nothing is uploaded anywhere.\n\n## Everything it understands\n\nText can be **bold**, *italic*, ~~struck through~~, ==highlighted== or `inline code`, and a link like [oLoveTools](https://olovetools.com) opens in a new tab. A bare address such as https://olovetools.com becomes a link on its own.\n\n### Code, with real syntax colours\n\n```js\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\ngreet('World');\n```\n\n### Lists that nest\n\n- A bullet\n  - and a nested one\n    - and one more level\n- [x] A finished task\n- [ ] One still to do\n\n1. Numbered items\n2. count themselves\n\n### Quotes and tables\n\n> A blockquote can hold **anything**, including `code`.\n>\n> > Even another quote.\n\n| Feature | Where it runs | Status |\n| :--- | :---: | ---: |\n| Parser | Your browser | Done |\n| Themes | Your browser | 5 |\n| Exports | Your browser | MD · HTML · PDF |\n\nAnd a footnote for the details.[^1]\n\n[^1]: Footnotes are collected at the end of the document, with a link back to where you wrote them.\n",
  "editorPlaceholder": "Write Markdown here…",
  "editorLabel": "Markdown source",
  "previewEmpty": "Your rendered document will appear here.",
  "tocEmpty": "No headings yet. Add a line starting with # and it will show up here.",
  "htmlHint": "Semantic HTML with no framework classes — paste it straight into a CMS.",
  "resetTitle": "Start a new document",

  "openFile": "Open file",
  "pasteText": "Paste",
  "startFrom": "Start from",
  "tplBlank": "Blank document",
  "tplSample": "Syntax tour",
  "clear": "Clear",
  "pastedName": "Pasted text",
  "fromTool": "handed over by {tool}",
  "stagedHint": "Nothing has been loaded yet — say what should happen to the text you already have.",
  "stagedReplace": "Replace the editor",
  "stagedAppend": "Append at the end",
  "stagedDiscard": "Discard",
  "dismiss": "Dismiss",

  "style_label": "Theme",
  "style_default": "Default Slate",
  "style_github": "GitHub Light",
  "style_clean": "Clean Journal",
  "style_retro": "Retro Typewriter",
  "style_cyberpunk": "Cyberpunk Neon",

  "pane_editor": "Editor",
  "pane_split": "Split",
  "pane_preview": "Preview",
  "preview_mode": "Preview",
  "html_mode": "HTML",
  "toc_mode": "Outline",
  "syncScroll": "Sync scroll",
  "rendering": "Rendering…",
  "frontMatter": "Front matter",

  "tooltip_h1": "Heading 1",
  "tooltip_h2": "Heading 2",
  "tooltip_bold": "Bold",
  "tooltip_italic": "Italic",
  "tooltip_strike": "Strikethrough",
  "tooltip_mark": "Highlight",
  "tooltip_link": "Link",
  "tooltip_image": "Image",
  "tooltip_code": "Inline code",
  "tooltip_codeblock": "Code block",
  "tooltip_ul": "Bulleted list",
  "tooltip_ol": "Numbered list",
  "tooltip_task": "Task list",
  "tooltip_quote": "Blockquote",
  "tooltip_table": "Table",
  "tooltip_hr": "Divider",
  "tooltip_undo": "Undo",
  "tooltip_redo": "Redo",
  "tooltip_indent": "Indent",

  "sample_bold": "bold text",
  "sample_italic": "italic text",
  "sample_strike": "struck through",
  "sample_mark": "highlighted",
  "sample_link": "link text",
  "sample_image": "image description",
  "sample_code": "code",
  "sample_codeblock": "const answer = 42;",
  "sample_col1": "Column",
  "sample_col2": "Value",
  "sample_cell": "Row",

  "words": "words",
  "characters": "characters",
  "minRead": "min read",
  "headings": "headings",
  "tasksDone": "tasks",
  "historySize": "{steps} undo steps · {bytes}",

  "btn_copy_md": "Copy MD",
  "btn_copy_rich": "Copy formatted",
  "btn_copy_rich_hint": "Paste into a document or an email keeping the formatting",
  "btn_copy_html": "Copy HTML",
  "btn_download_md": "Download MD",
  "btn_download_html": "Download HTML",
  "btn_download_pdf": "Export PDF",
  "copied": "Copied!",

  "noticeCleared": "Editor cleared. Ctrl+Z brings your text back.",
  "errorTooBig": "That file is larger than {size} and will not fit in a browser tab.",
  "errorRead": "That file could not be read.",
  "errorClipboard": "The browser did not allow reading the clipboard. Paste into the editor instead.",
  "errorClipboardWrite": "The clipboard is not available in this browser.",
  "errorExport": "That export could not be produced.",

  "nextStepTitle": "Keep going",
  "nextStepHint": "Your document travels with you — no re-upload",
  "nextWordflow": "Check the prose",
  "nextDiff": "Compare two drafts",
  "nextTts": "Read it aloud",
  "nextCodecard": "Turn it into an image",
  "nextHash": "Hash it",

  "templates": [
    {
      "name": "Project README",
      "body": "# Project name\n\nOne sentence on what this does and who it is for.\n\n## Install\n\n```bash\nnpm install project-name\n```\n\n## Usage\n\n```js\nimport { thing } from 'project-name';\n\nthing({ fast: true });\n```\n\n## Options\n\n| Option | Type | Default | What it does |\n| :--- | :--- | :--- | :--- |\n| `fast` | boolean | `false` | Skips the slow path |\n\n## Contributing\n\n- [ ] Fork the repository\n- [ ] Open a pull request\n\n## Licence\n\nMIT\n"
    },
    {
      "name": "Meeting notes",
      "body": "# Meeting — topic\n\n**Date:** \n**Present:** \n\n## Agenda\n\n1. First point\n2. Second point\n\n## Decisions\n\n> Write down what was actually decided, not what was discussed.\n\n## Action items\n\n- [ ] Who does what, by when\n- [ ] Second item\n\n## Parked\n\nThings deliberately left for another day.\n"
    },
    {
      "name": "Changelog",
      "body": "# Changelog\n\nAll notable changes to this project, newest first.\n\n## [1.1.0]\n\n### Added\n\n- The new thing\n\n### Fixed\n\n- The old thing that was broken\n\n### Removed\n\n- ~~The thing nobody used~~\n\n## [1.0.0]\n\nFirst public release.\n"
    },
    {
      "name": "Blog post",
      "body": "---\ntitle: The title\ndate: 2026-01-01\ntags: [markdown, writing]\n---\n\n# The title\n\nAn opening paragraph that says what the reader will get out of this.\n\n## The first idea\n\nText, with a link to [something relevant](https://example.com) and a quote:\n\n> A line worth quoting.\n\n## The second idea\n\n![A description of the image](https://example.com/image.png)\n\n## What to take away\n\n- The first point\n- The second point\n"
    }
  ],

  "heroPoints": [
    "GitHub-flavoured Markdown, parsed properly",
    "Nested lists, task lists, footnotes, tables",
    "Syntax colouring in fenced code blocks",
    "Export to MD, standalone HTML or PDF"
  ],

  "step1Title": "Write, paste or open a file",
  "step1Text": "Type straight into the editor, paste from the clipboard, drop a .md file on the workspace, or start from one of the skeletons. A file that arrives waits in a tray until you say whether it replaces your text or is appended to it.",
  "step2Title": "Watch it render as you type",
  "step2Text": "The document is parsed off the main thread and the preview keeps pace with the caret. Scrolling one pane moves the other, so what you are editing is always the part you are looking at.",
  "step3Title": "Pick how it should look",
  "step3Text": "Five preview themes, from a plain GitHub page to a typewriter sheet. The theme is not just decoration for the screen: it travels into the exported HTML file and onto the printed page.",
  "step4Title": "Take it with you",
  "step4Text": "Download the Markdown, a standalone HTML file, or a PDF with none of this page's furniture on it. Or send the document straight to another oLoveTools tool without a round trip through your downloads folder.",

  "features": [
    {
      "title": "A real parser, not a pile of regexes",
      "text": "The document is turned into a syntax tree and only then into HTML, so nested lists keep their nesting, a stray pipe in a sentence is not read as a table, and snake_case_names stay intact instead of sprouting italics."
    },
    {
      "title": "Code blocks with syntax colours",
      "text": "Fenced blocks are highlighted for over twenty languages, from JavaScript and Python to SQL, YAML and Dockerfiles. The grammars are only fetched once a document actually contains code."
    },
    {
      "title": "Preview that keeps up",
      "text": "Parsing runs in a Web Worker, so the caret never stutters on a long README. If workers are blocked, the same code runs inline and the preview still renders."
    },
    {
      "title": "Themes that survive the export",
      "text": "Slate, GitHub Light, Clean Journal, Retro Typewriter and Cyberpunk Neon. The stylesheet used on screen is the one written into the exported file, so what you downloaded looks like what you saw."
    },
    {
      "title": "Exports that are actually usable",
      "text": "Copy semantic HTML with no framework classes, copy formatted text for an email, download a standalone page, or print a PDF containing the document and nothing else — no header, no toolbar, no ads."
    },
    {
      "title": "An outline built from your headings",
      "text": "Every heading gets a stable anchor and appears in a clickable outline, so a long specification is navigable while you are still writing it."
    },
    {
      "title": "Undo that stores edits, not copies",
      "text": "The history keeps only the characters that changed, so hundreds of undo steps over a long document cost kilobytes instead of megabytes. Your draft is also saved locally between visits."
    },
    {
      "title": "Chained with the rest of the suite",
      "text": "Send the finished document to WordFlow to check the prose, to DiffSnap to compare two drafts, or to TTS-Bolt to hear it read aloud — without downloading and re-uploading anything."
    }
  ],

  "seoHeroTitle": "Free online Markdown editor with live preview",
  "seoHeroText": "MarkdownLive is a side-by-side Markdown editor that renders as you type. It supports the GitHub-flavoured syntax people actually write: nested and task lists, tables with alignment, footnotes, strikethrough, highlights, autolinks, setext headings, front matter and fenced code blocks with syntax colouring. The editor helps as you go, continuing lists on Enter, indenting with Tab, wrapping a selection in bold or italics from the keyboard, and turning a pasted URL into a link around whatever you had selected.",
  "seoBrowserSpeedTitle": "Everything happens inside your tab",
  "seoBrowserSpeedText": "There is no upload step and no account. The parser, the syntax highlighter, the themes and every export run as JavaScript in your browser, which is why the tool works with the network unplugged. Your draft is saved to this browser's local storage so a refresh does not lose it, and clearing your browser data is all it takes to remove it — nothing was ever sent anywhere to delete.",
  "seoHeroList": [
    "No upload, no account, no server",
    "Works offline once the page has loaded",
    "Draft saved locally between visits",
    "Nothing to delete on our side"
  ],
  "seoSecondaryTitle": "Built for documents that have to leave the editor",
  "seoUseCaseTitle": "READMEs, docs, notes and posts",
  "seoUseCaseText": "Draft a project README with its options table and code samples, keep meeting notes with task lists that show what is still open, write a changelog, or lay out a blog post with front matter before it goes into a static site generator. The outline panel turns a long document into something you can jump around in, and the word count and reading-time estimate tell you when a post is long enough.",
  "seoPrivacyTitle": "Private by construction",
  "seoPrivacyText": "Unpublished drafts, internal documentation and client notes are exactly the sort of text that should not be pasted into somebody else's server. Here there is nowhere for it to go: the document never leaves the page it is typed on.",

  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Which Markdown syntax is supported?",
      "answer": "The GitHub-flavoured set: headings in both ATX (#) and setext (underline) form, bold, italic, strikethrough, highlight, inline code, fenced and indented code blocks, blockquotes that nest, ordered and unordered lists that nest, task lists, tables with per-column alignment, images, links, bare URLs, footnotes, horizontal rules, hard line breaks, backslash escapes, and YAML front matter, which is kept out of the rendered output."
    },
    {
      "question": "Is my document uploaded or stored on a server?",
      "answer": "No. Parsing, rendering, highlighting and every export run in your browser, and no part of the document is transmitted. The only copy that outlives the tab is the draft kept in this browser's local storage so a reload does not lose your work; clearing your browser data removes it."
    },
    {
      "question": "How does 'Export PDF' work?",
      "answer": "It builds a clean copy of the document in your chosen theme and hands only that to the browser's print dialogue, where you choose 'Save as PDF'. The page's header, toolbar, ad slots and footer are not part of what gets printed — you get the document, on white paper, with page breaks kept out of the middle of code blocks and tables."
    },
    {
      "question": "What is the difference between 'Copy HTML' and 'Copy formatted'?",
      "answer": "'Copy HTML' puts the markup on the clipboard as text: semantic tags with no framework classes, ready to paste into a CMS, a template or an email builder. 'Copy formatted' puts the document on the clipboard as rich text, so pasting into a word processor, a document or a mail client keeps the headings, bold and lists rather than showing angle brackets."
    },
    {
      "question": "Can I open a Markdown file I already have?",
      "answer": "Yes — use 'Open file' or drop it onto the workspace. Nothing is loaded behind your back: the file waits in a tray and you decide whether it replaces the editor or is appended to what is already there. The same applies to documents handed over from another oLoveTools tool."
    },
    {
      "question": "Which keyboard shortcuts are there?",
      "answer": "Ctrl+B for bold, Ctrl+I for italics, Ctrl+E for inline code, Ctrl+K for a link around the selection, Ctrl+Z and Ctrl+Y for undo and redo. Tab and Shift+Tab indent and outdent the selected lines, and Enter continues a list, a numbered sequence or a blockquote — pressing it on an empty item ends the list instead of adding a dead bullet."
    },
    {
      "question": "How large a document can it handle?",
      "answer": "Files up to 8 MB are accepted, which is far more than any hand-written document. Parsing happens in a Web Worker so the editor stays responsive on long files, and the undo history stores only the characters that changed rather than a copy of the document per step."
    }
  ],

  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "markdown editor",
    "markdown preview",
    "markdown to html",
    "markdown to pdf",
    "online markdown editor",
    "github flavored markdown",
    "readme editor",
    "markdown table generator",
    "live preview markdown",
    "free markdown editor"
  ],

  "footerTagline": "A free, private, local Markdown editor with live preview.",
  "footerCredit": "Part of the oLoveTools suite",
  "seo_title": "MarkdownLive | Free Online Markdown Editor with Live Preview",
  "seo_description": "Write Markdown and see it rendered as you type. Nested lists, tables, footnotes, task lists and syntax-coloured code. Export to MD, HTML or PDF. Free and fully local."
};
