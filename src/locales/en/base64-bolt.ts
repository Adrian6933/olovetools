export default {
  "title": "Base64Bolt",
  "seo_title": "Base64Bolt | Base64 Encoder, Decoder & Payload Inspector",
  "seo_description": "Encode text or any file to Base64, decode a payload back to the real file, read the bytes in hex, switch to the URL-safe alphabet, drop the padding and wrap at 76 columns. Free and entirely in your browser.",
  "seoHeroTitle": "Base64 Encoder, Decoder & Inspector",
  "badge": "Base64 toolkit",
  "description": "Encode any file — not just images — with the alphabet, padding and line width the consumer actually expects. Decode a payload and see what it really is: the format read from its magic bytes, the first bytes in hex, its gzipped size and its SHA-256.",
  "heroPoints": [
    "Any file type",
    "URL-safe alphabet",
    "Hex inspector"
  ],

  "tab_text": "Text",
  "tab_file": "File to Base64",
  "tab_decode": "Base64 to file",

  "optionsTitle": "Output",
  "alphabetStandard": "A-Z a-z 0-9 + /",
  "alphabetUrl": "URL-safe - _",
  "alphabetStandardHint": "The standard alphabet of RFC 4648: + and / for the last two values.",
  "alphabetUrlHint": "The URL-safe alphabet: - and _ instead of + and /, so the payload survives a query string, a filename or a JWT untouched.",
  "padding": "Padding =",
  "paddingHint": "The = tail pads the output to a multiple of four characters. Dropping it is legal and is what JWTs do; some strict parsers still insist on it.",
  "wrap": "Wrap",
  "wrapNone": "off",
  "crlfHint": "Break lines with CRLF instead of LF, which is what MIME and PEM actually specify.",
  "charset": "Charset",
  "engineNative": "Native engine",
  "engineFallback": "Compatibility engine",
  "engineNativeHint": "Your browser converts the bytes itself, in one engine-level call.",
  "engineFallbackHint": "Your browser has no native Base64 conversion, so the payload is processed in 32 KB blocks instead. Same result, a little slower.",

  "mode_encode": "Encode",
  "mode_decode": "Decode",
  "altHint": "Hold Alt to preview the reverse",
  "holdCompare": "Hold to see your input",
  "undo": "Undo",
  "redo": "Redo",
  "loadSample": "Load an example",
  "button_clear": "Clear all",
  "cancel": "Stop",
  "runBtn": "Run",
  "encodeBtn": "Encode to Base64",
  "decodeBtn": "Decode",
  "downloadTxt": "Download as .txt",
  "openTextFile": "Open a .txt / .b64 file",
  "copied": "Copied!",
  "copyFailed": "Your browser blocked clipboard access",
  "tooltip_copy": "Copy to clipboard",
  "chars": "chars",

  "label_input": "Plain text",
  "label_base64_input": "Base64 string",
  "label_base64_output": "Base64",
  "label_decoded_output": "Decoded text",
  "label_showing_input": "Your input",
  "label_stage_file": "Choose a file",
  "label_snippet": "Ready to paste",
  "label_decoded": "What came out",
  "placeholder_encode": "Type or paste text to encode…",
  "placeholder_decode": "Paste a Base64 string or a data: URL…",
  "placeholder_decode_file": "Paste a Base64 payload or a whole data: URL…",
  "placeholder_output": "The result appears here…",
  "placeholder_file_output": "Stage a file and press Encode to get the snippet.",
  "placeholder_decoded": "Paste a payload to see what it really is.",
  "previewTruncated": "Showing the first {0} characters. Copy and download use the whole result.",
  "bigInputHint": "This input is large, so it is not re-encoded on every keystroke. Press Run when you are ready.",

  "file_drag": "Drop any file here, or click to browse",
  "file_formats": "Any file type — images, fonts, PDFs, WASM. Up to {0}.",
  "willProduce": "will produce ~{0} characters",
  "nothingAutomatic": "Nothing has been read yet. Pick your options, then press Encode.",
  "optionsChanged": "The options changed since this ran. Press Encode again.",

  "statBytes": "Payload",
  "statChars": "Base64",
  "statOverhead": "Size vs source",
  "statGzip": "Gzipped",
  "statFormat": "Detected",
  "statAlphabet": "Alphabet",
  "statRoundTrip": "Round trip",
  "statTime": "Took",
  "roundTripOk": "Reversible",
  "roundTripFail": "Not reversible",

  "sha256Title": "SHA-256 of the original bytes",
  "sha256TitleDecoded": "SHA-256 of the decoded bytes",
  "sha256Hint": "Compare it after decoding elsewhere to prove nothing was lost in transit.",
  "hexTitle": "First bytes",
  "hexEmpty": "No bytes yet.",
  "hexTruncated": "Showing the first {0} of {1}.",
  "mimeOverrideTitle": "Treat it as",
  "mimeMismatch": "The data URL claims {0}, the bytes say {1}.",
  "noPreview": "This format has no browser preview. Download it or send it to another tool.",

  "issuesTitle": "What we noticed",
  "issue_invalid-char": "Character {0} at offset {1} is not part of the Base64 alphabet; it was skipped.",
  "issue_whitespace-stripped": "{0} line breaks or spaces were removed before decoding.",
  "issue_padding-added": "The payload was short of a whole quartet, so {0} padding character(s) were assumed.",
  "issue_non-canonical": "The final character ({0}) carries bits that get discarded. Encoders never emit that, so the string was probably truncated or hand-edited.",
  "issue_mixed-alphabet": "The input mixes both alphabets (+ / and - _). It was decoded as standard Base64.",
  "issue_data-url": "A data: URL prefix declaring {0} was stripped before decoding.",
  "issue_lost_surrogate": "{0} unpaired surrogate(s) could not be represented in UTF-8 and were replaced.",

  "error_bad-length": "This payload is one character past a whole group of four. Six leftover bits are not a byte, so the tail cannot be recovered — the string is truncated.",
  "error_undecodable": "These characters do not form valid Base64.",
  "error_not-base64-data-url": "That data: URL is percent-encoded, not Base64, so there is nothing here to decode.",
  "error_not-utf8": "The Base64 is valid, but the bytes behind it are not UTF-8 text — this is binary data. Use the Base64-to-file tab to see what it is, or switch the charset to Latin-1.",
  "error_too-large": "This payload is too large for your browser to hold as a single string.",
  "error_crashed": "The encoder failed on this file.",
  "error_no-input": "There is nothing staged to encode.",
  "errorTooBig": "That file is {0}; the limit is {1}.",

  "nextStepTitle": "Keep going",
  "nextStepHint": "The result travels with you — no download, no re-upload",
  "nextCompress": "Compress it",
  "nextCrop": "Crop it",
  "nextFavicon": "Make a favicon",
  "nextHash": "Hash it",
  "nextJson": "Open the JSON",
  "nextUrl": "URL-encode it",
  "nextDiff": "Compare two versions",
  "nextCodecard": "Turn it into an image",

  "howItWorksTitle": "How it works",
  "step1Title": "Bring the payload in",
  "step1Text": "Type it, paste it, drop a file of any type, or let another tool in the suite hand it over. Dropping a file reads nothing yet.",
  "step2Title": "Choose how it comes out",
  "step2Text": "Standard or URL-safe alphabet, padding on or off, wrapped at 64, 76 or 100 columns with LF or CRLF. The choices are the ones real parsers disagree about.",
  "step3Title": "Look at the bytes",
  "step3Text": "The format is read from the magic numbers, not guessed from the name. You get the hex dump, the gzipped size, the SHA-256 and a reversibility check.",
  "step4Title": "Take it away",
  "step4Text": "Copy the raw string, a data URL, a CSS rule, an img tag, a JSON body or a PEM block — or send the decoded file straight to another tool.",

  "features": [
    {
      "title": "Three bytes, four characters",
      "text": "Base64 always costs 33% more than the bytes it carries, and the tool shows both numbers plus the gzipped size, because on text-like payloads gzip claws most of that back and on a PNG it claws back almost none."
    },
    {
      "title": "URL-safe alphabet",
      "text": "Switch to - and _ and the payload survives a query string, a filename or a JWT with nothing to escape. Padding can be dropped too, which is what token formats expect."
    },
    {
      "title": "Hex inspector",
      "text": "See the actual bytes, sixteen to a line, with the printable ASCII beside them. The magic number is highlighted, so a truncated file gives itself away immediately."
    },
    {
      "title": "It tells you what broke",
      "text": "Which character is not in the alphabet and at what offset, whether padding was missing, whether the final character carries bits that get thrown away. Not a bare \"invalid Base64\"."
    },
    {
      "title": "Format read from the bytes",
      "text": "PNG, JPEG, GIF, WebP, AVIF, HEIC, PDF, ZIP and the Office formats inside it, WOFF2, MP4, WASM, SQLite and more, identified by signature — so the download gets the right extension."
    },
    {
      "title": "Big files stay smooth",
      "text": "Files are consumed in 3 MB blocks on a worker thread, with a real progress bar and a working Stop button. The tab keeps responding while a 200 MB payload is converted."
    },
    {
      "title": "Measurable, not just produced",
      "text": "Gzipped size and SHA-256 come with every run, computed on the same bytes. That is how you decide whether embedding beats a second request, and how you prove the round trip was lossless."
    },
    {
      "title": "Reversibility check",
      "text": "Every text encode is immediately decoded again and compared byte for byte, so an alphabet and padding combination that your consumer would reject is flagged before you paste it."
    }
  ],

  "seoSecondaryTitle": "The payload, not just the string",
  "seoHeroText": "Most Base64 tools hand you a string and stop. This one keeps the bytes: it identifies the format from its signature, dumps the first kilobyte in hex, measures what the payload really costs after gzip, hashes it so you can prove the round trip, and tells you precisely which character at which offset broke a payload instead of blaming the whole thing. Encoding accepts any file — a font, a PDF, a WebAssembly module — because Base64 was never only about images.",
  "seoHeroList": [
    "Standard and URL-safe alphabets",
    "Optional padding, 64/76/100-column wrapping",
    "Magic-byte format detection",
    "Gzipped size and SHA-256"
  ],
  "seoBrowserSpeedTitle": "Nothing leaves your browser",
  "seoBrowserSpeedText": "Encoding, decoding, format detection, the hex dump, the gzip measurement and the SHA-256 are all native browser APIs running in your own tab, on a worker thread for anything large. There is no upload, no request and nothing to log — which matters, because the payloads people paste into a Base64 tool are routinely private keys, session tokens and internal documents.",
  "seoUseCaseTitle": "Built for the payloads that arrive without a label",
  "seoUseCaseText": "A blob out of a database column with no MIME type recorded anywhere. A JWT segment that will not decode because it uses the URL-safe alphabet and has no padding. An inline SVG in a stylesheet that renders as a broken image. A data URL that claims image/png while the bytes are plainly a JPEG. A certificate wrapped at 64 columns that a strict parser refuses. Base64Bolt reads all of them, says what the bytes actually are, and lets you take the result out as a file with the right extension.",
  "seoPrivacyTitle": "No accounts, no limits, no upload",
  "seoPrivacyText": "There is no sign-up, no daily quota and no paid tier hiding the useful half of the tool. Files you open are read locally and never transmitted; the tab forgets everything when you close it.",
  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "base64 encoder",
    "base64 decoder",
    "file to base64",
    "base64 to file",
    "data url converter",
    "base64url decoder",
    "image to base64",
    "base64 to image",
    "decode base64 online",
    "base64 hex viewer"
  ],

  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Why does my JWT or token fail to decode elsewhere but work here?",
      "answer": "Because it uses the URL-safe alphabet — hyphen and underscore instead of plus and slash — and usually has its padding stripped. A decoder that only knows the standard alphabet throws on the first hyphen. Base64Bolt detects which alphabet the input uses, restores the missing padding, and tells you it did both."
    },
    {
      "question": "Does Base64 make my file bigger?",
      "answer": "Always, by exactly one third: every three bytes become four characters, plus up to two padding characters. Whether that costs you anything depends on compression, which is why the tool shows the gzipped size next to the raw one. Embedding a small SVG usually wins; embedding a large JPEG usually loses, because it is already compressed and Base64 undoes some of that."
    },
    {
      "question": "Can I encode something that is not an image?",
      "answer": "Yes, any file. Fonts for an @font-face rule, a PDF for a download link, a WebAssembly module, a ZIP, an audio clip. The old limitation to images was arbitrary — Base64 does not care what the bytes mean."
    },
    {
      "question": "What does \"the final character carries bits that get discarded\" mean?",
      "answer": "Each Base64 character holds six bits, but the last group of a payload often needs fewer. QQ== and QR== both decode to the single byte 0x41, because the last four bits of R are thrown away. No encoder produces the second form, so seeing it means the string was truncated or edited by hand — worth knowing before you trust the result."
    },
    {
      "question": "Why did decoding say the bytes are not UTF-8?",
      "answer": "Because they are not text. Base64 carries bytes, and plenty of payloads are images, archives or keys. The old behaviour was to report \"invalid Base64\", which was simply wrong: the Base64 was fine. Switch to the Base64-to-file tab and the tool will identify the format and let you download it."
    },
    {
      "question": "Should I wrap the output at 76 columns?",
      "answer": "Only if something downstream expects it. MIME bodies and PEM blocks are line-wrapped by specification — PEM at 64 columns, MIME at 76 — and some mail parsers reject a single enormous line. For a data URL in a stylesheet or a JSON field, leave wrapping off."
    },
    {
      "question": "Is anything sent to a server?",
      "answer": "No. Every step is a native browser API running in your tab, so the tool keeps working offline once the page has loaded. Nothing is uploaded, cached remotely or logged."
    }
  ],

  "footerTagline": "Encode any file to Base64 and decode any payload back — URL-safe alphabet, optional padding, hex inspector and magic-byte format detection, entirely in your browser.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:"
};
