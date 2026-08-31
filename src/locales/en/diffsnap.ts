export default {
  "title": "DiffSnap",
  "description": "Compare two texts or two versions of a file and see exactly what changed: aligned columns, the rewritten words picked out inside each line, and a unified patch you can apply.",

  // Editors
  "label_original": "Original (A)",
  "label_modified": "Modified (B)",
  "label_import": "Import file",
  "placeholder_a": "Paste the original here, or drop a file…",
  "placeholder_b": "Paste the new version here, or drop a file…",
  "drop_file_prompt": "Drop a text or code file",
  "open_file": "Open a file",
  "clear": "Clear",
  "undo": "Undo",
  "redo": "Redo",
  "close": "Close",
  "shortcuts": "Keyboard shortcuts",
  "swap": "Swap",

  // Samples
  "sample_label": "Try it with",
  "sample_code": "A rewritten function",
  "sample_indent": "A re-indented block",
  "sample_config": "A changed config",
  "sample_prose": "An edited paragraph",

  // Files
  "file_too_large": "That file is larger than {0} — a browser tab cannot hold it.",
  "file_failed": "That file could not be read.",
  "parked_hint": "Held back on purpose: loading a file this size into the editor is the expensive part.",
  "parked_load": "Load it",

  // Comparison options
  "opt_title": "Compare by",
  "gran_line": "Lines",
  "gran_word": "Words",
  "gran_char": "Characters",
  "opt_whitespace": "Whitespace",
  "ws_none": "Whitespace matters",
  "ws_trailing": "Ignore trailing spaces",
  "ws_all": "Ignore all whitespace",
  "opt_ignore_case": "Ignore case",
  "opt_ignore_blank": "Ignore blank lines",

  // Manual alignment
  "anchors_count": "Forced alignments: {0}",
  "anchors_hint": "The comparison is solved independently on each side of every pin.",
  "anchors_clear": "Clear pins",
  "anchor_added": "Alignment pinned. Press Compare to apply it.",
  "anchor_hint": "Click a line number on each side to force them to line up",
  "anchor_pending": "Line {0} of {1} selected — now click the line it should line up with.",

  // Running
  "btn_compare": "Compare",
  "btn_running": "Comparing…",
  "btn_cancel": "Stop",
  "btn_reset": "Start over",
  "run_hint": "Nothing is compared until you press this — loading a file never starts it.",
  "run_failed": "The comparison failed:",
  "badge_stale": "The result below is from the previous input",
  "badge_worker": "Worker",
  "badge_truncated": "These two files share so little that finding the exact minimal alignment would take longer than it is worth. The block below is reported as fully rewritten.",

  // Empty state
  "empty_title": "No comparison yet",
  "empty_text": "Put a version on each side and press Compare. Everything happens inside this tab — nothing is uploaded.",

  // Statistics
  "stat_additions": "Added",
  "stat_deletions": "Removed",
  "stat_modified": "Rewritten",
  "stat_unchanged": "Unchanged",
  "stat_blocks": "Blocks",
  "stat_similarity": "Identical",
  "stat_lines": "lines",

  // The result view
  "btn_split": "Side by side",
  "btn_unified": "Unified",
  "opt_context": "Context",
  "ctx_lines": "Context: {0}",
  "ctx_all": "Whole file",
  "opt_language": "Syntax",
  "lang_auto": "Auto",
  "opt_wrap": "Wrap",
  "wrap_too_big": "Soft wrap is off above {0} rows: variable row heights would stop the view from windowing, and this comparison would render every line at once.",
  "fold_expand": "{0} unchanged lines",
  "font_smaller": "Smaller text",
  "font_bigger": "Bigger text",
  "btn_invert": "Hold to mirror",
  "invert_hint": "Hold to mirror the comparison (or hold Alt anywhere)",
  "prose_only_changes": "Dim the untouched text",
  "nav_prev": "Previous change",
  "nav_next": "Next change",
  "nav_counter": "{0} / {1}",
  "no_diff": "No differences",
  "identical_text": "The two sides match character for character.",
  "identical_relaxed": "Identical under the rules you chose. Turn the \"ignore\" options off to compare them literally.",

  // Exports
  "export_title": "Take it with you",
  "export_patch_copy": "Copy the .patch",
  "export_patch": "Download .patch",
  "export_html": "HTML report",
  "export_summary": "Copy the summary",
  "export_revised": "Download the new version",
  "nothing_to_export": "There is nothing to export yet.",
  "copy_failed": "The browser refused clipboard access.",

  // Handoff
  "nextStepTitle": "Keep going",
  "nextStepHint": "The revised text travels with you — no download, no re-upload",
  "nextJson": "Format the JSON",
  "nextCodecard": "Make a code image",
  "nextMarkdown": "Write it up",
  "nextHash": "Hash it",
  "nextXml": "XML ⇄ JSON",

  // Shortcuts
  "sc_run": "Compare",
  "sc_undo": "Undo in the focused editor",
  "sc_redo": "Redo in the focused editor",
  "sc_next": "Next change",
  "sc_prev": "Previous change",
  "sc_swap": "Swap the two sides",
  "sc_wrap": "Toggle soft wrap",
  "sc_invert": "Mirror the comparison while held",
  "sc_font": "Font size",
  "sc_help": "This panel",

  // How it works
  "hero_badge": "Compare",
  "howItWorksTitle": "How it works",
  "step1Title": "Bring both versions in",
  "step1Text": "Paste them, drop two files, or let another tool hand one over. Nothing is uploaded, and nothing is compared yet.",
  "step2Title": "Say what counts as a change",
  "step2Text": "Lines, words or characters; ignore indentation, case or blank lines. Then press Compare — the expensive step only runs when you ask for it.",
  "step3Title": "Read the result",
  "step3Text": "Aligned columns with the rewritten words picked out, untouched blocks folded away, and jump-to-next-change on a single key.",
  "step4Title": "Take it away",
  "step4Text": "A unified patch that git apply accepts, a standalone HTML report, or the revised text sent straight into another tool.",

  "features": [
    {
      "title": "Myers, in linear space",
      "text": "The classic O(ND) algorithm with the divide-and-conquer refinement. Memory stays flat however far apart the two files are: 5 000 lines compare in about 7 ms against the 590 ms and 200 MB a plain LCS matrix costs."
    },
    {
      "title": "Word-level highlighting",
      "text": "A rewritten line is compared a second time, word by word, so what lights up is the three characters that actually moved — not a solid block of red facing a solid block of green."
    },
    {
      "title": "Indentation is optional",
      "text": "Re-indent a file and a literal comparison calls every single line different. Ignore trailing spaces, all whitespace, letter case or blank lines, and only the real edits survive."
    },
    {
      "title": "Untouched blocks fold away",
      "text": "One change in a 4 000-line file should not mean scrolling through 4 000 lines. Keep one, three or eight lines of context, and open any folded block with a click."
    },
    {
      "title": "Pin the alignment yourself",
      "text": "When two moved blocks pair up wrongly, click a line number on each side to pin them together. Each side of a pin is then solved on its own, so one correction never disturbs the rest."
    },
    {
      "title": "Syntax colour, kept intact",
      "text": "Twenty-two grammars, loaded only when the file needs one. A changed word inside a string keeps the string colour and gains the change background, instead of one wiping out the other."
    },
    {
      "title": "A patch that actually applies",
      "text": "Real unified diff output with correct hunk headers, so git apply and patch accept it. Or export a self-contained HTML report with no fonts, scripts or assets to host."
    },
    {
      "title": "Large files stay usable",
      "text": "Big comparisons move to a web worker so the editors keep responding, only the rows on screen are ever mounted, and undo stores the characters that changed rather than a copy of the document."
    }
  ],

  // SEO
  "seo_title": "DiffSnap | Free online text and code diff checker",
  "seo_description": "Compare two texts or two versions of a file side by side. Word-level highlighting, syntax colour, whitespace options, folded context and a unified .patch export — all computed in your browser, nothing uploaded.",
  "seoHeroTitle": "See exactly what changed between two versions.",
  "seoHeroText": "A diff is usually the first thing you run on something you are not allowed to share: a config with credentials in it, a contract before signature, a patient export, a competitor's quote. DiffSnap computes the comparison inside this tab, so the two documents stay on the machine you opened them on.",
  "seoHeroList": [
    "100% local — nothing is uploaded",
    "Word-level highlighting inside each line",
    "Unified .patch and HTML report export"
  ],
  "seoBrowserSpeedTitle": "Myers' algorithm, running on your machine",
  "seoBrowserSpeedText": "The comparison is Myers' O(ND) difference algorithm with the linear-space refinement, written in plain JavaScript and running on your device. There is no upload step, no backend and no request carrying your text: cut your connection after the page loads and everything still works.",
  "seoSecondaryTitle": "A diff checker built for the files people actually compare.",
  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "diff checker",
    "text compare",
    "code diff",
    "compare two files",
    "online diff tool",
    "side by side diff",
    "unified diff",
    "patch generator",
    "word diff",
    "JSON diff",
    "compare documents",
    "find differences",
    "merge review",
    "file comparison"
  ],
  "seoUseCaseTitle": "What people use it for",
  "seoUseCaseText": "Checking what a colleague changed in a config before it ships, finding the clause that moved between two drafts of a contract, proving a translation matches the source it was made from, reviewing a patch on a machine with no git installed, and settling which of two exports is the current one.",
  "seoPrivacyTitle": "Why local matters here",
  "seoPrivacyText": "The documents worth diffing are rarely public: environment files with keys in them, agreements under NDA, exports with customer records. Pasting those into a hosted comparison service hands both versions to somebody else's server in full. Here they never leave the tab, so there is nothing to log, cache or leak.",

  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "How large a file can it compare?",
      "answer": "Files up to 32 MB open, and anything past 512 KB waits behind a click instead of dropping into the editor unannounced. Past roughly 120 000 characters the comparison moves to a web worker so the page keeps responding. Two files that share almost nothing hit a work limit and are reported as a wholesale rewrite — the tool says so on screen rather than pretending otherwise."
    },
    {
      "question": "Are my files sent to a server?",
      "answer": "No. There is no upload and no backend involved: the comparison, the highlighting and every export run inside your browser tab. You can disconnect from the network after the page has loaded and keep using it."
    },
    {
      "question": "Why does it say everything changed when I only re-indented?",
      "answer": "Because by default every character counts, including spaces and tabs. Switch the whitespace option to \"Ignore all whitespace\" and only the real edits are left. There are matching options for letter case and blank lines."
    },
    {
      "question": "Does it highlight syntax?",
      "answer": "Yes — twenty-two grammars, detected from the file extension or the shape of the text, and loaded only when a comparison actually needs one. Syntax colour and the word-level change highlight are drawn together, so neither hides the other."
    },
    {
      "question": "Can I export the result?",
      "answer": "Yes. A unified .patch with correct hunk headers that git apply and patch accept, a self-contained HTML report with nothing external to load, a plain-text summary for a commit message or a ticket, and the revised text on its own."
    },
    {
      "question": "The two versions lined up wrongly. Can I fix it?",
      "answer": "Yes. Click a line number on one side and then the line it belongs with on the other, and that pair is pinned. Everything before and after each pin is compared independently, so one correction never shifts the rest of the file."
    }
  ],

  "footerTagline": "Free, private, in-browser comparison for text, code, configuration and drafts.",
  "footerCredit": "Part of the oLoveTools suite"
};
