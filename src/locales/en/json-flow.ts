export default {
  "tree_rows_one": "{0} row",
  "tree_hits_one": "{0} hit",
  "query_matches_one": "{0} match",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "copyPath": "Copy path",
  "copyValue": "Copy value",
  "copyBranch": "Copy whole branch",
  "resetHint": "Start over",
  "title": "JSONFlow",
  "description": "Validate, explore and convert JSON in the browser: exact error positions, a folding tree that stays fast on huge files, JSONPath queries, and export to CSV, XML, YAML, JSON Schema or TypeScript.",

  // Actions
  "beautify": "Beautify",
  "minify": "Minify",
  "sort_keys": "Sort keys",
  "sort_none": "Original order",
  "sort_asc": "Keys A → Z",
  "sort_desc": "Keys Z → A",
  "clear": "Clear",
  "load_mock": "Load a sample",
  "copy": "Copy",
  "copied": "Copied!",
  "undo": "Undo",
  "redo": "Redo",
  "close": "Close",
  "shortcuts": "Keyboard shortcuts",
  "open_file": "Open a file",
  "copy_source": "Copy the source",
  "download_json": "Download .json",
  "reset_view": "Reset the view",
  "parse_btn": "Parse",
  "repair_btn": "Repair",
  "unescape_btn": "Unescape",
  "jsonl_btn": "Join JSON Lines",

  // Indent Options
  "indentation": "Indentation",
  "indent_2_spaces": "2 spaces",
  "indent_4_spaces": "4 spaces",
  "indent_tabs": "Tabs",

  // Validation
  "status_valid": "Valid JSON",
  "status_invalid": "Invalid JSON: ",
  "status_empty": "Nothing loaded yet.",
  "status_checking": "Validating off the main thread…",
  "error_at": "line {0}, column {1}",
  "jump_to_error": "Go there",
  "warnings_title": "{0} things worth knowing",
  "empty_placeholder": "Paste JSON here, drop a file, or load a sample…",
  "drop_file_prompt": "Drop a .json, .jsonl, .csv or .tsv file",
  "editor_title": "Source",
  "fix_first": "Fix the error on the left and the panels will fill in.",
  "press_parse": "Press Parse to build the tree for this document.",

  // Parser findings
  "issueSyntax": "Syntax error",
  "issueDuplicateKey": "Duplicate key",
  "issuePrecision": "Number too large for JavaScript",
  "issueDepth": "Nested too deep",
  "issueTrailingComma": "Trailing comma",
  "issueComment": "Comment",
  "issueSingleQuote": "Single-quoted string",
  "issueUnquotedKey": "Unquoted key",
  "issuePythonLiteral": "Python literal",
  "issueNonFinite": "Not a JSON number",
  "issueBom": "Byte order mark",
  "issueEmpty": "Empty document",

  // Tabs & Views
  "tab_tree_viewer": "Tree",
  "tab_formatted_json": "Code",
  "tab_table": "Table",
  "tab_convert": "Convert",
  "tab_schema": "Types",
  "tab_diff": "Diff",

  // Tree controls
  "search_placeholder": "Filter by key or value…",
  "scope_both": "All",
  "scope_keys": "Keys",
  "scope_values": "Values",
  "expand_all": "Expand all",
  "collapse_all": "Collapse all",
  "depth_label": "Open to depth",
  "depth_option": "Depth {0}",
  "depth_all": "All levels",
  "no_nodes": "Paste or drop JSON on the left to start.",
  "no_matches": "Nothing matches that search.",
  "tree_rows": "{0} rows",
  "tree_hits": "{0} hits",
  "tree_mounted": "{0} in the DOM",
  "tree_capped": "ceiling reached — collapse a level to see the rest",
  "copy_path": "Copy path",
  "copy_value": "Copy value",
  "locate": "Show it in the editor",
  "stale_notice": "The editor has changed since this was built. Press Parse to refresh it.",

  // Output
  "output_size": "{0} characters",
  "preview_clipped": "The preview stops at {0} characters. Copy and download still give you the whole thing.",
  "copy_failed": "The browser refused clipboard access.",

  // Table / CSV
  "flatten_title": "Flatten",
  "array_json": "Array as JSON",
  "array_expand": "One column each",
  "array_join": "Joined",
  "separator_label": "Path separator",
  "table_summary": "{0} rows × {1} columns. The preview shows the first {2}.",
  "table_wrapped": "The document is not an array, so it became a single row.",
  "export_csv": "Download",
  "export_xml": "Download XML",
  "import_csv": "CSV or TSV to JSON",
  "csv_placeholder": "Paste CSV or TSV here to turn it into JSON…",
  "convert_csv_btn": "Convert to JSON",
  "csv_nest": "Rebuild nesting from a.b headers",
  "csv_nest_hint": "Off by default on purpose: a first_name column must stay first_name, not turn into { first: { name } }.",

  // Convert / types
  "xml_root": "Root element",
  "type_name": "Name",
  "schema_hint": "Inferred from every record, not just the first: a field missing from some of them comes out optional.",

  // Query
  "query_placeholder": "$.users[?(@.age > 30)].name",
  "query_matches": "{0} matches",
  "query_use": "Use as document",

  // Diff
  "diff_hint": "Compared by path, not by line: reordering keys does not show up as a change.",
  "diff_placeholder": "Paste the other JSON document here…",
  "diff_run": "Compare",
  "diff_identical": "The two documents are structurally identical.",
  "diff_added": "Added",
  "diff_removed": "Removed",
  "diff_changed": "Changed",
  "diff_type": "Type",

  // Run bar / files
  "manual_mode": "Manual mode",
  "manual_on": "Nothing is built until you press Parse.",
  "manual_off": "Documents under {0} build as you type; bigger ones wait for Parse.",
  "parked_hint": "Held back on purpose: loading a file this size into the editor is the expensive part.",
  "parked_load": "Load it",
  "file_too_large": "That file is too large to open in a browser tab.",
  "file_failed": "That file could not be read.",

  // Stats
  "stat_bytes": "Size",
  "stat_lines": "Lines",
  "stat_nodes": "Nodes",
  "stat_depth": "Depth",
  "stat_keys": "Unique keys",
  "stat_time": "Parse",
  "stat_offthread": "Worker",

  // Toasts
  "toast_csv_loaded": "Imported {0} rows from {1}.",
  "toast_jsonl_loaded": "JSON Lines joined into a single array.",
  "toast_needs_valid": "Fix the error first — there is nothing to build yet.",
  "toast_repaired": "Repaired into strict JSON.",
  "toast_unrepairable": "This document is too broken to repair automatically.",
  "toast_unescaped": "Unwrapped the JSON that was hiding inside the string.",
  "toast_unescape_failed": "That is not a quoted JSON string.",

  // Shortcuts
  "sc_undo": "Undo",
  "sc_redo": "Redo",
  "sc_parse": "Parse the document",
  "sc_beautify": "Beautify",
  "sc_minify": "Minify",
  "sc_copy": "Copy the formatted output",
  "sc_help": "This panel",

  // Handoff
  "nextStepTitle": "Keep going",
  "nextStepHint": "The document travels with you — no download, no re-upload",
  "nextDiff": "Compare it",
  "nextCodecard": "Make a code image",
  "nextXml": "XML ⇄ JSON",
  "nextHash": "Hash it",
  "nextMarkdown": "Write it up",

  // Samples
  "mock_user_profile": "User profile",
  "mock_product_catalog": "Product catalog",
  "mock_weather_data": "Weather forecast",
  "sample_broken": "Broken config (repairable)",
  "sample_bigint": "64-bit ids",

  // How it works
  "hero_badge": "Workbench",
  "howItWorksTitle": "How it works",
  "step1Title": "Bring the JSON in",
  "step1Text": "Paste it, drop a file, or let another tool hand it over. Nothing is uploaded, and nothing heavy runs until you ask for it.",
  "step2Title": "Read the verdict",
  "step2Text": "Valid, or the exact line and column that breaks — plus duplicate keys and numbers JavaScript cannot hold.",
  "step3Title": "Explore it",
  "step3Text": "Fold the tree, filter by key or value, or run a JSONPath expression across the whole document.",
  "step4Title": "Take it away",
  "step4Text": "CSV, XML, YAML, JSON Lines, a JSON Schema, TypeScript or Go types — or send it straight to another tool.",

  "features": [
    {
      "title": "A real parser, not JSON.parse",
      "text": "Errors arrive with a line, a column and a highlighted row in the gutter, instead of a character offset you have to count to."
    },
    {
      "title": "64-bit ids survive",
      "text": "Long numeric ids are re-printed digit for digit. Every formatter built on JSON.parse quietly rounds them to the nearest double."
    },
    {
      "title": "One-click repair",
      "text": "Comments, trailing commas, single quotes, unquoted keys, Python True/False/None and a stray byte order mark become strict JSON."
    },
    {
      "title": "JSONPath queries",
      "text": "Wildcards, recursive descent, slices and filters like [?(@.price > 10)], evaluated by hand — nothing you type is ever executed."
    },
    {
      "title": "Types from real data",
      "text": "JSON Schema, TypeScript interfaces or Go structs, inferred across every record so fields that are sometimes missing come out optional."
    },
    {
      "title": "Honest flattening",
      "text": "Choose the path separator and what happens to nested arrays. Empty objects keep their column instead of vanishing from the export."
    },
    {
      "title": "Structural diff",
      "text": "Two documents compared path by path, so a different key order is not reported as a thousand changes."
    },
    {
      "title": "Big files stay usable",
      "text": "Validation moves to a web worker, the tree only mounts the rows on screen, and undo stores the characters that changed, not a copy of the document."
    }
  ],

  // SEO & Texts
  "seo_title": "JSONFlow | JSON formatter, validator, viewer and converter",
  "seo_description": "Format, validate and explore JSON with exact error positions and a tree that stays fast on large files. Convert to CSV, XML, YAML or JSON Lines, generate JSON Schema and TypeScript types, and run JSONPath queries — all in your browser.",
  "seoHeroTitle": "Format, explore and convert JSON safely.",
  "seoHeroText": "API payloads carry tokens, customer records and internal ids. JSONFlow never sends any of it anywhere: the parser, the tree, the queries and the exports all run inside this tab, so pasting a production response here is as private as opening it in your editor.",
  "seoHeroList": [
    "100% local — nothing is uploaded",
    "Exact line and column for every error",
    "CSV, XML, YAML, Schema and TypeScript"
  ],
  "seoBrowserSpeedTitle": "Everything runs in this tab",
  "seoBrowserSpeedText": "The parser, the folding tree, the JSONPath engine and every export are plain JavaScript running on your device. There is no upload step, no backend, and no request carrying your data — turn off your connection after the page loads and the tool keeps working.",
  "seoSecondaryTitle": "The complete developer workbench for JSON.",
  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "JSON formatter",
    "JSON validator",
    "JSON viewer",
    "JSON to CSV",
    "JSON to XML",
    "JSON to YAML",
    "CSV to JSON",
    "JSON beautifier",
    "JSONPath",
    "JSON Schema generator",
    "JSON to TypeScript",
    "JSON diff",
    "JSON repair",
    "JSON Lines"
  ],
  "seoUseCaseTitle": "What people use it for",
  "seoUseCaseText": "Finding the one comma that breaks a config file, turning an API response into a spreadsheet, generating the TypeScript interface for an endpoint nobody documented, checking whether two versions of a payload actually differ, and pasting logs where the JSON arrived wrapped in a quoted string.",
  "seoPrivacyTitle": "Why local matters here",
  "seoPrivacyText": "A JSON payload is rarely anonymous: it holds bearer tokens, e-mail addresses, order ids and internal endpoints. Pasting that into a hosted formatter hands all of it to someone else's server. Here it never leaves the tab, so there is nothing to log, cache or leak.",

  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Are my JSON payloads sent to any server?",
      "answer": "No. Parsing, validation, the tree, queries and every export run inside this browser tab. You can disconnect from the network once the page has loaded and everything still works."
    },
    {
      "question": "How large a file can it really handle?",
      "answer": "On a normal laptop a 1.5 MB document with 180 000 nodes parses in well under a tenth of a second, and files of several tens of megabytes still open — validation moves to a web worker and the tree only renders the rows on screen. What actually limits you is memory, not the tool: past roughly 100 MB a browser tab starts to struggle whatever you use. Anything over 2 MB is held back behind a button instead of being loaded automatically, so a big file never freezes the page on arrival."
    },
    {
      "question": "Why do my long ids change in other formatters?",
      "answer": "JSON.parse turns every number into a 64-bit float, which cannot represent integers above 2^53 exactly — a Twitter, Discord or Snowflake id loses its last digits. JSONFlow keeps the original digits from the source text and warns you when a number is in that range."
    },
    {
      "question": "My file has comments and trailing commas. Is that a problem?",
      "answer": "No. When strict parsing fails, a tolerant pass runs automatically and, if it succeeds, a Repair button appears. It handles comments, trailing commas, single quotes, unquoted keys, Python True/False/None, NaN and Infinity, and rewrites the document as strict JSON."
    },
    {
      "question": "How does the JSON to CSV flattening work?",
      "answer": "Each element of the top-level array becomes a row, and nested keys become dotted columns such as user.address.city. You choose the separator and whether nested arrays get one column each, stay as JSON, or are joined. On the way back, headers are taken literally — a first_name column stays first_name unless you explicitly ask for nesting."
    },
    {
      "question": "What can I write in the query bar?",
      "answer": "A JSONPath subset: $.users[0].name, wildcards with [*], recursive descent with .., slices like [0:5], negative indexes, and filters such as [?(@.price > 10)] or [?(@.name =~ ^a)]. Expressions are interpreted by hand, never evaluated as code."
    }
  ],
  "footerTagline": "Building fast, premium, and private utilities for designers and developers.",
  "footerCredit": "Part of the oLoveTools suite"
};
