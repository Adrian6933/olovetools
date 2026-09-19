export default {
  "riskTrackers_one": "{0} tracking parameter is attached to this link.",
  "resetHint": "Start over",
  "title": "URLBolt",
  "seo_title": "URLBolt | URL Encoder, Decoder, Inspector & Tracker Cleaner",
  "seo_description": "Encode and decode URLs with eight character-set profiles, take any link apart, edit its query string by hand, strip tracking parameters and clean whole lists at once. Free and entirely in your browser.",
  "badge": "URL toolkit",
  "description": "Encode with the profile the spec actually asks for, unwrap double-encoded redirects, take a link apart down to its credentials and its real hostname, edit the query string by hand, and drop every tracking parameter in one click.",
  "heroPoints": [
    "8 encoding profiles",
    "Editable query string",
    "Tracker cleanup"
  ],

  "tab_convert": "Encode / Decode",
  "tab_inspect": "Inspect",
  "tab_build": "Build",
  "tab_batch": "Batch",

  "undo": "Undo",
  "redo": "Redo",
  "loadSample": "Load an example",
  "button_clear": "Clear all",
  "copied": "Copied!",
  "copyFailed": "Your browser blocked clipboard access",
  "tooltip_copy": "Copy to clipboard",
  "copyBtn": "Copy",

  "dirEncode": "Encode",
  "dirDecode": "Decode",
  "profile_component": "encodeURIComponent (JavaScript)",
  "profile_uri": "encodeURI (JavaScript)",
  "profile_strict": "RFC 3986 strict",
  "profile_form": "Form (x-www-form-urlencoded)",
  "profile_path": "Path segment",
  "profile_query": "Query string",
  "profile_fragment": "Fragment",
  "profile_rfc5987": "RFC 5987 (headers)",
  "profileHint_component": "What JavaScript does: escapes everything except A-Z a-z 0-9 and - _ . ! ~ * ' ( ). Fine for a single value, but it leaves the sub-delimiters alone.",
  "profileHint_uri": "What JavaScript does to a whole address: keeps : / ? & = + $ , # intact so the URL still works as a URL.",
  "profileHint_strict": "Only the unreserved set of RFC 3986 survives. Escapes ! ' ( ) * as well, which is what signing schemes and AWS-style canonical requests expect.",
  "profileHint_form": "The encoding every HTML form sends: spaces become +, and only * - . _ survive alongside the alphanumerics.",
  "profileHint_path": "Safe inside one path segment: keeps the sub-delimiters but escapes / so a value cannot invent a new segment.",
  "profileHint_query": "Safe inside a query string: escapes & = + and # so a value cannot break out and become another parameter.",
  "profileHint_fragment": "Safe after the #, where a slash and a question mark are ordinary characters.",
  "profileHint_rfc5987": "For filenames in Content-Disposition and other header parameters, where only attr-char may appear unescaped.",
  "optDeep": "Decode until stable",
  "optPlus": "Space as +",
  "optLowerHex": "Lowercase hex",
  "altHint": "Hold Alt to preview the reverse",

  "label_input": "Input",
  "label_output": "Encoded",
  "label_decoded_output": "Decoded",
  "placeholder_encode": "Type or paste text to URL-encode…",
  "placeholder_decode": "Paste an encoded URL or value to decode…",
  "placeholder_output": "The result appears here…",
  "bigInputHint": "This input is large, so it is not re-encoded on every keystroke. Press Run when you are ready.",
  "runBtn": "Run",

  "button_swap": "Send result back to the input",
  "statEscaped": "{0} characters escaped",
  "statOverhead": "{0}% size",
  "statRounds": "Double-encoded: {0} passes",
  "roundTripOk": "Reversible",
  "roundTripFail": "Not reversible",
  "roundTripHint": "Decoding the result reproduces your input byte for byte",
  "lostSurrogate": "The input carried a lone surrogate; it was replaced instead of failing",
  "issuesTitle": "Problems found while decoding",
  "issue_truncated": "A % escape is cut off: {0}",
  "issue_bad-hex": "Not a valid hex escape: {0}",
  "issue_bad-utf8": "These bytes are not valid UTF-8: {0}",
  "issuesHint": "The rest of the text was decoded anyway — nothing was thrown away.",

  "label_url_input": "URL to inspect",
  "placeholder_parse": "Paste any URL — https, ftp, mailto, magnet…",
  "parse_error": "That is not a URL we can parse. Check the scheme and the host.",
  "assumedScheme": "No scheme was given, so https:// was assumed for the analysis.",
  "holdCompare": "Hold to see the original",

  "riskCredentials": "This URL carries a username and password in plain text ({0}). Anything that logs the URL logs the credentials.",
  "riskJavascript": "This is a javascript: URL. Opening it runs code in whatever page is showing.",
  "riskIdn": "International hostname. It really reads: {0}",
  "riskHomograph": "One label mixes writing systems ({0}) — the classic way of spelling a familiar brand with lookalike letters.",
  "riskInsecure": "Plain http://, so everything including the query string travels unencrypted.",
  "riskIpHost": "The host is a bare IP address ({0}) rather than a domain name.",
  "riskTrackers": "{0} tracking parameters are attached to this link.",
  "riskNested": "The parameter {0} contains another whole URL — this link redirects somewhere else.",
  "riskDoubleEncoded": "The parameter {0} is encoded more than once. Use Decode until stable to unwrap it.",
  "riskRepeated": "The key {0} appears more than once. Different servers pick a different one.",

  "cleanTitle": "Clean up tracking",
  "cleanAggressive": "Also drop ref, source, s",
  "trackerCatalog": "{0} known trackers",
  "cleanBtn": "Remove {0} parameters",
  "cleanSaved": "{0} bytes shorter",
  "cleanNone": "No tracking parameters in this URL.",
  "cleanApplied": "{0} parameters removed",

  "label_anatomy": "Anatomy",
  "label_protocol": "Scheme",
  "label_user": "Credentials",
  "label_host": "Host",
  "label_port": "Port",
  "label_path": "Path",
  "label_query": "Query",
  "label_params": "params",
  "label_hash": "Fragment",
  "opaqueBody": "Payload",
  "label_decoded": "Decoded",
  "label_path_segments": "Path segments",
  "label_query_params": "Query parameters",
  "paramsHint": "Edit, reorder or delete freely: parameters you do not touch keep their original bytes, down to + versus %20.",

  "paramKey": "key",
  "paramValue": "value",
  "paramNoValue": "(no value)",
  "paramAdd": "Add parameter",
  "paramRemove": "Remove",
  "paramMoveUp": "Move up",
  "paramMoveDown": "Move down",
  "paramsEmpty": "This URL has no query parameters. Add one to build a query string.",
  "trackerBadgeHint": "Recognised tracking parameter",
  "group_campaign": "campaign",
  "group_ads": "ads",
  "group_social": "social",
  "group_email": "email",
  "group_analytics": "analytics",
  "group_misc": "other",

  "buildHint": "Compose a URL field by field. Nothing is parsed or guessed here: what you type is what gets assembled.",
  "buildStart": "Start from a blank URL",
  "fieldScheme": "Scheme",
  "fieldHost": "Host",
  "fieldPort": "Port",
  "fieldPath": "Path",
  "fieldFragment": "Fragment",
  "rebuiltTitle": "Assembled URL",
  "buildInspect": "Inspect it",

  "batchOpen": "Open a .txt or .csv",
  "batchHint": "One URL per line. Nothing runs until you press the button.",
  "batchTitle": "URL list",
  "batchCount": "{0} URLs",
  "batchPlaceholder": "https://example.com/a?utm_source=x\nhttps://example.com/b?fbclid=y",
  "batchStaged": "{0} is staged and waiting",
  "handoffReceived": "Received from {0} — ready when you are",
  "batchRun": "Analyse {0} URLs",
  "batchStatUrls": "URLs",
  "batchStatRemoved": "Parameters removed",
  "batchStatSaved": "Bytes saved",
  "batchStatRisky": "With warnings",
  "batchColUrl": "Cleaned URL",
  "batchColHost": "Host",
  "batchColRemoved": "Removed",
  "batchColSaved": "Bytes",
  "batchCopyAll": "Copy every URL",
  "batchExportCsv": "Export CSV",
  "batchExportJson": "Export JSON",
  "errTooLarge": "That file is too large (8 MB maximum).",
  "errRead": "That file could not be read.",

  "nextStepTitle": "Keep going",
  "nextStepHint": "The result travels with you — no download, no re-upload",
  "nextDiff": "Compare two versions",
  "nextHash": "Hash it",
  "nextJson": "Open the JSON",
  "nextCodecard": "Turn it into an image",
  "nextWordflow": "Edit as text",

  "howItWorksTitle": "How it works",
  "step1Title": "The link arrives",
  "step1Text": "Paste it, open a .txt full of them, or let another oLoveTools tool hand its result straight over. Nothing is processed until you ask.",
  "step2Title": "It comes apart",
  "step2Text": "Scheme, credentials, real hostname, port, path segments and every parameter, each with its raw and its decoded form side by side.",
  "step3Title": "You correct it",
  "step3Text": "Rename a key, reorder the query string, unwrap a double-encoded redirect or drop every tracker. Ctrl+Z undoes any of it.",
  "step4Title": "It leaves clean",
  "step4Text": "Copy it, export the batch as CSV or JSON, or send the result on to another tool without a round trip through your downloads folder.",

  "features": [
    {
      "title": "Eight encoding profiles",
      "text": "encodeURIComponent and encodeURI are only two of the answers. RFC 3986 strict, form-urlencoded, path, query, fragment and RFC 5987 are here too, each with a note on when it is the right one."
    },
    {
      "title": "A query string you can edit",
      "text": "Rename keys, change values, reorder rows, delete what you do not need. Parameters you never touch are written back byte for byte — even the difference between + and %20 survives."
    },
    {
      "title": "One-click tracker removal",
      "text": "utm_*, fbclid, gclid, msclkid, mc_eid and dozens more, grouped by where they come from, with the exact number of bytes the cleanup saved."
    },
    {
      "title": "It tells you what is wrong",
      "text": "Credentials in plain text, a hostname spelled with lookalike letters, a parameter that is really another URL, an escape that has been applied twice — all flagged before you click anything."
    },
    {
      "title": "Double encoding, unwrapped",
      "text": "Redirect chains arrive encoded two or three times over. Decode until stable unwraps them in one go and tells you how many passes it took."
    },
    {
      "title": "Whole lists at once",
      "text": "Drop in a text file of links and clean every one of them in a single pass, then export the result as CSV or JSON with the per-URL savings."
    }
  ],

  "seoHeroTitle": "URL Encoder, Decoder & Inspector",
  "seoSecondaryTitle": "The escape that is correct depends on where the value lands",
  "seoHeroText": "A value going into a path segment, a query string, a form body and a Content-Disposition header needs four different escapes, and JavaScript only ships two of them. URLBolt gives you all eight, tells you which characters each one leaves alone, and verifies that decoding the result reproduces your input exactly before you paste it anywhere.",
  "seoHeroList": [
    "RFC 3986 strict escaping",
    "Form encoding with +",
    "Round-trip verification",
    "Byte-exact editing"
  ],
  "seoBrowserSpeedTitle": "Nothing leaves your browser",
  "seoBrowserSpeedText": "Every operation — encoding, decoding, parsing, punycode conversion, tracker removal, batch cleanup — runs on native browser APIs in your own tab. There is no upload, no request, no server-side step and nothing to log. The links you inspect are frequently the ones you least want to send to a stranger's server, which is exactly why none of them go anywhere.",
  "seoUseCaseTitle": "Built for the links that arrive broken",
  "seoUseCaseText": "Affiliate URLs that redirect three times, campaign links carrying a dozen tracking parameters, an API callback that has been percent-encoded twice, a legacy endpoint with the password sitting in the authority, an international domain that your terminal shows as xn--. URLBolt reads all of them, shows the punycode hostname the way a human would write it, unwraps nested redirects, and lets you fix the query string by hand instead of rebuilding the whole address in a text editor.",
  "seoPrivacyTitle": "No accounts, no limits, no upload",
  "seoPrivacyText": "There is no sign-up, no daily quota and no paid tier hiding the useful half of the tool. Files you open are read locally and never transmitted; the tab forgets everything when you close it.",
  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "url encoder",
    "url decoder",
    "url parser",
    "percent encoding",
    "query string editor",
    "remove utm parameters",
    "punycode decoder",
    "double encoded url",
    "rfc 3986 encoding",
    "clean tracking links"
  ],

  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "What is the difference between encodeURIComponent and encodeURI?",
      "answer": "encodeURI escapes a whole address but leaves the characters that build URL syntax — : / ? & = + $ , # — intact, so the result is still a working URL. encodeURIComponent escapes those too, which is what you want for a single parameter value. Neither escapes ! ' ( ) *, so if you are signing a request you probably want the RFC 3986 strict profile instead."
    },
    {
      "question": "Why does my decoded text come back with a % still in it?",
      "answer": "Because the input contained a broken escape — a % with fewer than two hex digits after it, or two characters that are not hex at all. Rather than throwing the whole string away, URLBolt keeps the literal % , decodes everything else, and lists the exact offset of each problem so you can see where the link was truncated."
    },
    {
      "question": "When should spaces be + instead of %20?",
      "answer": "Inside an application/x-www-form-urlencoded body or query string — what an HTML form sends — a space is +. Everywhere else, including path segments, it is %20. Getting this backwards is the single most common URL bug, so both directions have a switch for it and the encoder marks which one is in use."
    },
    {
      "question": "Does removing tracking parameters break the link?",
      "answer": "Almost never. utm_*, fbclid, gclid and their relatives are read by analytics, not by the page, so the destination is identical without them. The parameters that are sometimes genuine — ref, source, s — are kept by default and only removed if you tick the aggressive option."
    },
    {
      "question": "What does the punycode line under the hostname mean?",
      "answer": "Browsers convert international domain names to an ASCII form beginning with xn-- before sending them. URLBolt converts that form back so you can read it, and warns you when a single label mixes writing systems — that is how a Cyrillic а gets passed off as the Latin one in a lookalike domain."
    },
    {
      "question": "Is anything sent to a server?",
      "answer": "No. Encoding, decoding, parsing, punycode conversion and batch cleanup are all native browser APIs running in your tab. There is no network request at any point, so the tool works offline once the page has loaded."
    }
  ],

  "footerTagline": "Encode, decode, dissect and clean up URLs — eight escaping profiles, an editable query string and one-click tracker removal, entirely in your browser.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:"
};
