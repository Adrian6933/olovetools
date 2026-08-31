export default {
  "title": "UUID Generator",
  "badge": "Unique identifiers",
  "description": "Generate UUID v1, v3, v4, v5, v6 and v7, plus ULID, NanoID and MongoDB ObjectId — in batches, in the exact shape your code expects, without a single network request.",
  "seo_title": "UUID Generator | v4, v7, v5, ULID & NanoID in bulk",
  "seo_description": "Free online UUID generator: v1, v3, v4, v5, v6, v7, nil and max UUIDs plus ULID, NanoID and MongoDB ObjectId. Bulk batches, custom output formatting and a byte-level inspector, all running in your browser.",
  "groupUuid": "RFC 9562 UUIDs",
  "groupOther": "Other identifiers",
  "kindHelp_v4": "122 bits of entropy from the browser's cryptographic random source. The default when you just need something unique.",
  "kindHelp_v7": "A 48-bit Unix millisecond timestamp followed by random bits, with a counter so ids minted in the same millisecond still sort in order. The modern pick for database keys.",
  "kindHelp_v1": "Timestamp plus a node identifier. This tool uses a random node with the multicast bit set, so your real MAC address is never exposed.",
  "kindHelp_v6": "The v1 fields reordered so the timestamp comes first. Sorts chronologically as raw bytes, which v1 does not.",
  "kindHelp_v3": "MD5 of a namespace and a name. The same pair always yields the same UUID — pass one name per line to get a batch.",
  "kindHelp_v5": "SHA-1 of a namespace and a name. Deterministic like v3, with the stronger digest. One name per line.",
  "kindHelp_nil": "All 128 bits set to zero: the canonical \"no value\" UUID.",
  "kindHelp_max": "All 128 bits set to one: the upper bound of the UUID space, used as a sentinel.",
  "kindHelp_ulid": "26 Crockford base32 characters — 48 bits of time and 80 of randomness, lexicographically sortable and case-insensitive.",
  "kindHelp_nanoid": "21 URL-safe characters, around 126 bits of entropy. Shorter than a UUID and safe in a URL without escaping.",
  "kindHelp_objectid": "The 12-byte identifier MongoDB puts on every document: 4 bytes of time, 5 random, 3 of counter.",
  "label_count": "How many",
  "hint_big_batch": "Above 10 000 the slider stops; type the exact number. The preview stays at 300 rows — copying and downloading always cover the whole batch.",
  "label_namespace": "Namespace",
  "label_names": "Names — one per line",
  "hint_deterministic": "The same namespace and name always produce the same identifier — that is the entire point of v3 and v5. To get a batch, give it a batch of names.",
  "button_generate": "Generate",
  "button_working": "Working…",
  "tooltip_undo": "Previous batch (Ctrl+Z)",
  "tooltip_redo": "Next batch (Ctrl+Shift+Z)",
  "button_clear": "Clear everything",
  "error_invalid_namespace": "That namespace is not a valid UUID.",
  "error_clipboard": "The browser refused clipboard access. Use the download button instead.",
  "error_generic": "Something went wrong while generating. Try a smaller batch.",
  "error_unrecognised": "That does not look like an identifier this tool knows.",
  "stat_count": "generated",
  "stat_time": "milliseconds",
  "stat_rate": "per second",
  "stat_duplicates": "duplicates",
  "empty_state": "Nothing has been generated yet. Choose a type, set the amount and press Generate.",
  "label_showing": "Showing {shown} of {total}",
  "label_uuids_generated": "identifiers",
  "tooltip_copy": "Copy to clipboard",
  "button_copy_all": "Copy all",
  "button_copied_all": "Copied",
  "label_format": "Output shape",
  "placeholder_prefix": "prefix",
  "placeholder_suffix": "suffix",
  "label_inspect": "Inspect & craft",
  "button_load_list": "Load a list from a file",
  "button_blank": "Start from 16 empty bytes",
  "placeholder_inspect": "Paste any UUID, ULID or ObjectId",
  "field_timestamp": "timestamp",
  "byte_version": "byte 6 — version nibble",
  "byte_variant": "byte 8 — variant bits",
  "button_now": "now",
  "button_reroll": "Re-roll the trailing 8 bytes",
  "button_revert": "revert",
  "button_copy": "Copy",
  "button_use_crafted": "Use as output",
  "imported_summary": "{count} identifiers found in the list from {from}.",
  "imported_unique": "{n} unique",
  "imported_inspect": "Inspect the first one",
  "nextStepTitle": "Keep going",
  "nextStepHint": "The list travels with you — no download, no re-upload",
  "nextDiff": "Compare two batches",
  "nextHash": "Checksum the list",
  "nextJson": "Open as JSON",
  "nextRegex": "Test a pattern",
  "nextZip": "Zip it",
  "howItWorksTitle": "How it works",
  "step1Title": "Pick a flavour",
  "step1Text": "Eleven of them, from plain v4 to time-ordered v7, ULID or a Mongo ObjectId.",
  "step2Title": "Set the batch",
  "step2Text": "How many, and in what shape: case, hyphens, wrapping, prefix, export format.",
  "step3Title": "Press generate",
  "step3Text": "Nothing runs until you do. The batch is built in a worker and timed to the tenth of a millisecond.",
  "step4Title": "Take it with you",
  "step4Text": "Copy, download as txt, csv, json or SQL, or send the list straight to another tool.",
  "features": [
    {
      "title": "Eleven identifier types",
      "text": "UUID v1, v3, v4, v5, v6, v7, nil and max, plus ULID, NanoID and MongoDB ObjectId."
    },
    {
      "title": "Time-ordered and monotonic",
      "text": "v7, v6 and ULID keep a counter, so identifiers minted inside the same millisecond still sort in creation order."
    },
    {
      "title": "Reads them back",
      "text": "Paste any identifier to see its version, variant, timestamp, node and raw bytes — then edit a single nibble."
    },
    {
      "title": "Off the main thread",
      "text": "Batches run in a Web Worker, with the exact generation time and a duplicate sweep over the whole batch."
    },
    {
      "title": "Output the way you need it",
      "text": "Case, hyphens, braces, urn:uuid:, quotes, prefix and suffix — exported as txt, csv, json or SQL."
    },
    {
      "title": "Nothing leaves the tab",
      "text": "Web Crypto entropy, no network call of any kind, and nothing kept between visits."
    }
  ],
  "seoHeroTitle": "Every identifier format, generated locally",
  "seoHeroText": "Most generators give you a v4 and stop there. This one covers the whole RFC 9562 family, the sortable formats that replaced it in practice, and the identifiers other ecosystems use — with the output shaped exactly the way your migration, seed file or test fixture needs it.",
  "seoHeroList": [
    "11 identifier types",
    "Batches up to 100 000",
    "Byte-level inspector",
    "Zero network calls"
  ],
  "seoBrowserSpeedTitle": "Sortable by construction",
  "seoBrowserSpeedText": "Random v4 keys scatter writes across a B-tree index. v7, v6 and ULID put the timestamp first, so new rows land at the end of the index instead of everywhere at once — and this tool keeps a counter inside each millisecond so the order holds even in a tight loop.",
  "seoSecondaryTitle": "Built for the work that comes after the identifier",
  "seoUseCaseTitle": "Seeding, fixtures and migrations",
  "seoUseCaseText": "Generate a hundred thousand keys, export them straight as a SQL INSERT or a JSON array, and hand the list to the diff, hash or archive tool without touching your downloads folder.",
  "seoPrivacyTitle": "Local, and verifiably so",
  "seoPrivacyText": "Entropy comes from the Web Crypto API inside your tab. There is no API call, no CDN fetch and no WebAssembly download: the hashing used by v3 and v5 is embedded in the page itself, so the tool works with the network switched off.",
  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "uuid generator",
    "random uuid v4",
    "time-ordered uuid v7",
    "named uuid v5",
    "guid generator",
    "ulid generator",
    "short nanoid",
    "bulk uuid",
    "uuid decoder"
  ],
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Which UUID version should I use?",
      "answer": "v4 when you just need uniqueness and nothing else. v7 when the identifier becomes a database primary key, because its leading timestamp keeps index writes local. v5 when the same input must always map to the same identifier."
    },
    {
      "question": "Why does asking for ten v5 UUIDs give me ten identical ones?",
      "answer": "Because that is what v5 means: one namespace plus one name always hashes to one identifier. If you need ten different ones, give it ten different names — one per line."
    },
    {
      "question": "What is the difference between v7 and ULID?",
      "answer": "Both are a 48-bit millisecond timestamp followed by randomness. v7 is a real UUID and fits a UUID column; ULID is 26 base32 characters, shorter to read and case-insensitive, but not a UUID."
    },
    {
      "question": "Are these identifiers cryptographically secure?",
      "answer": "The randomness comes from crypto.getRandomValues, the same source the browser uses for its own key material. Note that a v1 or v7 identifier deliberately exposes its creation time, so it is not a secret."
    },
    {
      "question": "How many can I generate at once?",
      "answer": "Up to 100 000 per batch. The on-screen list shows the first 300 rows so the page stays responsive; copy, download and the handoff buttons always work on the complete batch."
    },
    {
      "question": "Does anything get sent to a server?",
      "answer": "No. Generation, inspection and export all happen in your browser, and the page makes no request while you use it."
    }
  ],
  "footerTagline": "UUID v1 to v7, ULID, NanoID and ObjectId — generated, inspected and exported entirely inside your browser.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "emailAddress": "adrian.contact.me.69@gmail.com"
};
