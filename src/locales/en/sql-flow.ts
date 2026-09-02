export default {
  "resetHint": "Start over",
  "title": "SQLFlow",

  // --- barra de opciones ---------------------------------------------------
  "dialect": "Dialect",
  "dialect_detected": "Looks like {0} — switch?",
  "keywordCase": "Keywords",
  "identifierCase": "Identifiers",
  "dataTypeCase": "Data types",
  "functionCase": "Functions",
  "case_preserve": "As is",
  "indentWidth": "Indent",
  "indent_tabs": "Tab",
  "indentStyle": "Layout",
  "indent_standard": "Standard",
  "indent_tabularLeft": "Column, left",
  "indent_tabularRight": "Column, right",
  "logicalOperatorNewline": "AND / OR",
  "operator_before": "Line start",
  "operator_after": "Line end",
  "expressionWidth": "Wrap expressions at",
  "denseOperators": "Tight operators",
  "newlineBeforeSemicolon": "Semicolon on its own line",
  "stripComments": "Drop comments when minifying",
  "auto_format": "Format as I type",
  "auto_format_hint": "Off by default: nothing runs until you press Format.",
  "advanced_options": "More options",

  // --- banco de trabajo ----------------------------------------------------
  "input": "Your query",
  "output": "Result",
  "output_original": "Original",
  "output_empty": "Nothing runs on its own. Press Format when your query is ready.",
  "placeholder": "Paste a query, drop a .sql file, or load a sample…",
  "format_btn": "Format",
  "minify_btn": "Minify",
  "working": "Working…",
  "use_as_input": "Edit it",
  "use_as_input_hint": "Send the result back to the editor to keep working on it",
  "hold_compare": "Hold to see the original",
  "copy": "Copy",
  "paste": "Paste",
  "download": "Download .sql",
  "open_file": "Open a .sql file",
  "load_sample": "Load a sample",
  "undo": "Undo",
  "redo": "Redo",
  "reset": "Clear",
  "discard": "Discard",
  "parked_load": "Load it",
  "parked_hint": "Waiting for you: nothing was loaded or formatted yet.",
  "lines": "lines",
  "chars": "chars",
  "offthread": "· worker",
  "engine_error_label": "The engine refused this query",

  // --- atajos --------------------------------------------------------------
  "shortcuts": "Shortcuts",
  "sc_format": "Format",
  "sc_minify": "Minify",
  "sc_comment": "Comment the selection",
  "sc_undo": "Undo and redo",

  // --- avisos --------------------------------------------------------------
  "validation": "Review",
  "status_empty": "Nothing loaded yet.",
  "status_clean": "Nothing to flag",
  "status_clean_hint": "Parentheses, quotes and clauses all check out.",
  "status_errors": "{0} problems",
  "status_warnings": "{0} things to check",
  "issue_unterminatedString": "Unclosed string literal",
  "issueHint_unterminatedString": "A quote opens here and never closes, so the rest of the file is being read as text.",
  "issue_unterminatedComment": "Unclosed block comment",
  "issueHint_unterminatedComment": "The /* has no matching */, so everything after it is commented out.",
  "issue_unterminatedIdentifier": "Unclosed quoted name",
  "issueHint_unterminatedIdentifier": "A double quote or backtick opens a name that never closes.",
  "issue_unclosedParen": "Parenthesis never closes",
  "issueHint_unclosedParen": "This ( is still open at the end of the statement.",
  "issue_extraClosingParen": "One closing parenthesis too many",
  "issueHint_extraClosingParen": "There is no matching ( for this ).",
  "issue_noStatementKeyword": "\"{0}\" does not start a statement",
  "issueHint_noStatementKeyword": "A statement begins with SELECT, INSERT, UPDATE, CREATE and the like.",
  "issue_deleteWithoutWhere": "DELETE with no WHERE on {0}",
  "issueHint_deleteWithoutWhere": "As written, this empties the whole table.",
  "issue_updateWithoutWhere": "UPDATE with no WHERE on {0}",
  "issueHint_updateWithoutWhere": "As written, this rewrites every row in the table.",
  "issue_destructiveStatement": "{0} cannot be undone",
  "issueHint_destructiveStatement": "The structure and its data go away together, and no transaction log brings them back on every engine.",
  "issue_selectStar": "SELECT *",
  "issueHint_selectStar": "It reads more data than you need and breaks silently when a column is added.",
  "issue_cartesianJoin": "Tables joined with a comma and no condition",
  "issueHint_cartesianJoin": "Every row of one table pairs with every row of the other.",
  "issue_limitWithoutOrder": "LIMIT with no ORDER BY",
  "issueHint_limitWithoutOrder": "Which rows you get is up to the engine, and it can change between runs.",
  "issue_insertWithoutColumns": "INSERT INTO {0} with no column list",
  "issueHint_insertWithoutColumns": "It breaks the day someone adds or reorders a column.",
  "issue_missingSemicolon": "No semicolon at the end",
  "issueHint_missingSemicolon": "Most clients need one to know the statement is finished.",

  // --- resumen -------------------------------------------------------------
  "outline_title": "What this query does",
  "outline_empty": "The breakdown shows up as soon as there is a statement.",
  "stat_statements": "Statements",
  "stat_tables": "Tables",
  "stat_joins": "Joins",
  "stat_ctes": "CTEs",

  // --- parámetros ----------------------------------------------------------
  "params_title": "Placeholders",
  "params_hint": "Fill these in to get a query you can run as-is. Leave them empty to keep them.",
  "params_placeholder": "value",

  // --- ejemplos ------------------------------------------------------------
  "sample_report": "Customer report",
  "sample_cte": "CTE and window function",
  "sample_ddl": "Table and index",
  "sample_params": "Placeholders",
  "sample_messy": "Messy MySQL",
  "sample_broken": "Broken query",

  // --- avisos flotantes ----------------------------------------------------
  "toast_engineError": "The engine could not parse this query.",
  "toast_fileTooLarge": "That file is too large ({0} max).",
  "toast_fileFailed": "That file could not be read.",
  "toast_copyFailed": "The browser refused clipboard access.",
  "toast_pasteFailed": "The browser refused clipboard access.",
  "toast_movedBack": "The result is now your query.",

  // --- encadenado con otras herramientas -----------------------------------
  "nextStepTitle": "Keep going",
  "nextStepHint": "The query travels with you — no download, no re-upload",
  "nextDiff": "Compare versions",
  "nextCodecard": "Make a code image",
  "nextHash": "Hash it",
  "nextBase64": "Encode it",
  "nextZip": "Zip it",

  // --- features ------------------------------------------------------------
  "feature1Title": "Nineteen dialects, not one",
  "feature1Text": "PostgreSQL, MySQL, MariaDB, SQLite, SQL Server, BigQuery, Snowflake, Redshift, DuckDB, Oracle and more — each with its own reserved words, quoting and placeholders. Paste a query and the dialect is guessed for you.",
  "feature2Title": "Problems with a line number",
  "feature2Text": "Unclosed quotes and parentheses, a DELETE with no WHERE, a LIMIT with no ORDER BY. Every finding names the line and column, and clicking it puts your cursor there.",
  "feature3Title": "Off the main thread",
  "feature3Text": "Formatting happens in a Web Worker, so a 5 MB dump does not freeze the page while it runs. The timing shown next to the result is the real one.",
  "feature4Title": "Nothing leaves the tab",
  "feature4Text": "No upload, no account, no server round trip. Production queries carry table names, ids and business logic, and none of it travels anywhere.",

  // --- cómo funciona -------------------------------------------------------
  "hero_badge": "SQL workbench",
  "howItWorksTitle": "How it works",
  "step1Title": "Bring the query in",
  "step1Text": "Paste it, drop a .sql file, load a sample, or let another tool hand it over. A dropped file waits: nothing is loaded or formatted until you say so.",
  "step2Title": "Set the rules",
  "step2Text": "Dialect, keyword case, indent width, where AND and OR sit, how wide an expression can get before it wraps. Every option changes the result the next time you format.",
  "step3Title": "Press Format",
  "step3Text": "The engine reformats, the review panel lists what is worth checking, and the outline shows the statements, tables, joins and CTEs involved.",
  "step4Title": "Take it with you",
  "step4Text": "Copy it, download the .sql, or send it straight to another tool in the suite — compare two versions, turn it into an image, hash it.",

  // --- texto largo ---------------------------------------------------------
  "deepTitle": "A formatter is only half the job",
  "deepText1": "Most online SQL beautifiers do one thing: they add line breaks. That helps until the query is not just ugly but wrong — a quote left open somewhere in the middle, a parenthesis that never closes, a WHERE that got lost during a copy and paste. SQLFlow reads the query as tokens before touching it, so it can tell you the line and column where the problem starts instead of quietly producing mangled output.",
  "deepText2": "That token pass also protects your data. Naive formatters run a regular expression over the whole text, which means the spaces inside 'hello   world' get collapsed and a comma inside a comment starts a new line. Here a string literal and a comment are single, untouchable units: whatever you wrote inside them comes out byte for byte, whichever dialect you pick.",
  "deepText3": "And because the same pass builds an outline, you get more than pretty text: the statements in the file, the tables each one touches, the CTEs, the joins and the placeholders waiting for a value. It is the difference between a query that looks tidy and a query you actually understand before running it against production.",

  // --- SEO -----------------------------------------------------------------
  "seo_title": "SQLFlow | SQL formatter, beautifier and validator for 19 dialects",
  "seo_description": "Format, minify and check SQL in your browser. Nineteen dialects, syntax highlighting, a linter that points at the line, and a query outline. Nothing is uploaded.",
  "seoHeroTitle": "Format, check and understand any SQL query.",
  "seoHeroText": "Nineteen dialects, a linter that names the line and column, syntax highlighting and a breakdown of every statement — all inside this tab, with nothing uploaded anywhere.",
  "seoBrowserSpeedTitle": "Everything runs in this tab",
  "seoBrowserSpeedText": "The formatter, the tokenizer, the linter and the outline are JavaScript running in your browser, with the heavy pass moved to a Web Worker so the page stays responsive. There is no API behind this page: turn off your connection after it loads and it keeps working.",
  "seoUseCaseTitle": "What people use it for",
  "seoUseCaseText": "Making a 400-character one-liner from an ORM log readable, standardising the style of a migration before it goes into review, finding the parenthesis that breaks a stored procedure, or working out which tables a query someone sent you actually touches.",
  "seoPrivacyTitle": "Why local matters here",
  "seoPrivacyText": "A production query is rarely harmless: it carries table and column names, business rules, ids and sometimes literal customer data. Pasting one into a site that formats it on a server hands all of that to a third party. Here it never leaves the tab, and closing it is the whole cleanup.",
  "seoKeywords": [
    "sql formatter",
    "sql beautifier",
    "format sql online",
    "sql validator",
    "sql minifier",
    "postgresql formatter",
    "mysql formatter",
    "t-sql formatter",
    "bigquery formatter",
    "snowflake formatter",
    "sql pretty print",
    "sql linter"
  ],

  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Is my query sent to a server?",
      "answer": "No. The formatter and everything around it run in your browser. There is no upload and no API call, so the query never leaves your device."
    },
    {
      "question": "Which SQL dialects are supported?",
      "answer": "Nineteen: standard SQL, PostgreSQL, MySQL, MariaDB, SQLite, SQL Server (T-SQL), Oracle PL/SQL, BigQuery, Snowflake, Redshift, DuckDB, ClickHouse, Spark, Hive, Trino, Db2, SingleStore, TiDB and N1QL. Each brings its own reserved words, quoting rules and placeholder syntax, and the dialect is guessed from the query when it can be."
    },
    {
      "question": "Does it change what my query does?",
      "answer": "No. Formatting only touches whitespace and the case of keywords. String literals, comments and quoted names come out exactly as you wrote them — including the spaces inside them."
    },
    {
      "question": "What does the review panel check?",
      "answer": "Unclosed quotes, comments and parentheses; statements that do not start with a SQL keyword; DELETE and UPDATE without a WHERE; DROP and TRUNCATE; SELECT *; tables joined by comma with no condition; LIMIT without ORDER BY; INSERT with no column list; and a missing final semicolon. Each one names the line and column."
    },
    {
      "question": "Why does nothing happen when I paste a query?",
      "answer": "By design: the formatter only runs when you press Format, or Ctrl+Enter. If you prefer it to run as you type, turn on \"Format as I type\" under More options."
    },
    {
      "question": "Can I format several statements at once?",
      "answer": "Yes. Statements separated by semicolons are formatted together, and the outline lists each one with the tables it touches so you can jump straight to it."
    }
  ],

  "footerTagline": "Format, check and understand SQL — 19 dialects, entirely in your browser.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:"
};
