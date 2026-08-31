export default {
  "title": "HashBolt",
  "badge": "Checksums & file integrity",
  "description": "Compute MD5, SHA-1, SHA-256, SHA-512, SHA-3, BLAKE3 or CRC-32 for files of any size, or for plain text, and check the result against the checksum a vendor published. The file is streamed inside your browser and never uploaded.",
  "seo_title": "HashBolt | Free Online MD5, SHA-256, SHA-512 & BLAKE3 Checksum Tool",
  "seo_description": "Generate and verify file checksums in your browser: MD5, SHA-1, SHA-256, SHA-384, SHA-512, SHA-3, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32, xxHash and HMAC. Multi-gigabyte files, batches and SHA256SUMS verification. Nothing is ever uploaded.",
  "modeFile": "Files",
  "modeText": "Text",
  "modeCompare": "Compare",
  "dropTitle": "Drop your files here",
  "dropHint": "Any type, any size, as many as you like. Nothing is read until you press Compute.",
  "browseBtn": "Choose files",
  "folderBtn": "Whole folder",
  "pasteHint": "or paste with Ctrl+V",
  "queueTitle": "Queue ({count})",
  "clearBtn": "Clear",
  "removeBtn": "Remove",
  "statusQueued": "waiting",
  "statusCancelled": "stopped",
  "staleNotice": "settings changed",
  "pendingCount": "{count} still to compute",
  "computeBtn": "Compute hashes",
  "computeAgainBtn": "Compute again",
  "cancelBtn": "Stop",
  "algoTitle": "Algorithms",
  "algoNone": "Nothing selected",
  "algoHint": "Tick as many as you need: the file is read once and every digest is computed on that single pass.",
  "groupChecksum": "Checksums & legacy",
  "groupSha2": "SHA-2 family",
  "groupModern": "Modern",
  "brokenTag": "Collisions are practical: fine against corruption, useless against tampering",
  "outputTitle": "Output",
  "formatHex": "Hex",
  "formatBase64": "Base64",
  "formatBase64Url": "Base64URL",
  "uppercaseLabel": "UPPERCASE",
  "groupedLabel": "Grouped",
  "hmacTitle": "HMAC (keyed hash)",
  "hmacHint": "Signs the content with a shared secret, so the digest means nothing to anyone without the key.",
  "hmacPlaceholder": "Secret key",
  "hmacSkipped": "{algos} have no HMAC mode and are skipped.",
  "textLabel": "Text to hash",
  "textPlaceholder": "Type or paste anything — the digest updates as you type.",
  "textHint": "Hashing text is not the same as hashing a file that contains it: a trailing newline or a Windows CRLF changes the result.",
  "normalizeEolLabel": "Normalise Windows line endings (CRLF → LF)",
  "compareHint": "Two hashes, no file. Paste the one the vendor published and the one you were given — hex or Base64, upper or lower case.",
  "compareA": "Hash A",
  "compareB": "Hash B",
  "compareEqual": "Identical. The same digest, whichever notation each side used.",
  "compareDifferent": "Different. These two describe different content.",
  "compareInvalid": "One of those is not a hash in hex or Base64.",
  "resultsTitle": "Digests",
  "resultsEmpty": "Queue a file, tick the algorithms you need and press Compute.",
  "resultsEmptyText": "Start typing and the digests appear here.",
  "resultsEmptyCompare": "Compare mode hashes nothing: it only tells you whether two digests are the same value.",
  "copyBtn": "Copy",
  "copyAllBtn": "Copy all",
  "downloadSumsBtn": "Download SUMS file",
  "verifyTitle": "Verify against a checksum",
  "verifyPlaceholder": "Paste one hash, or a whole SHA256SUMS file — lines are matched by file name.",
  "verifyHint": "Hex and Base64 both work, in any case. A digest length that no ticked algorithm produces is called out instead of being reported as a mismatch.",
  "verifySummary": "{count} checksum(s) read · {ok} verified · {bad} mismatched",
  "verifyMatch": "Match — the same {algo} digest.",
  "verifyMismatch": "No match. This file is not the one that checksum describes.",
  "verifyUnknownLength": "That checksum length matches none of the algorithms you ticked. Tick the right one and compute again.",
  "nextStepTitle": "Keep going",
  "nextStepHint": "The same file travels with you — no re-upload",
  "nextZip": "Zip it",
  "nextCompress": "Compress it",
  "nextFormat": "Change format",
  "nextExif": "Strip metadata",
  "nextCrop": "Crop it",
  "nextPdf": "Split or merge it",
  "nextFrames": "Grab a frame",
  "nextAudio": "Trim or convert it",
  "howItWorksTitle": "How it works",
  "step1Title": "Queue what you want to check",
  "step1Text": "Drop files in, pick a whole folder, paste one, or switch to the text tab. Nothing is read yet.",
  "step2Title": "Pick the algorithms",
  "step2Text": "One or a dozen. They share a single pass over the file, so three digests cost barely more than one.",
  "step3Title": "Press Compute",
  "step3Text": "The file is streamed in chunks inside a worker, so the progress bar is real and a 20 GB image never lands in RAM.",
  "step4Title": "Compare with the published one",
  "step4Text": "Paste a hash or an entire SUMS file. Matching happens by value, not by the way it was printed.",
  "features": [
    {
      "title": "Streams, never swallows",
      "text": "Files are read in chunks inside a worker, so memory stays flat and the progress bar tracks bytes actually hashed. Multi-gigabyte ISOs are ordinary work here."
    },
    {
      "title": "Twelve digests, one read",
      "text": "MD5, SHA-1, SHA-256/384/512, SHA3-256/512, BLAKE2b, BLAKE3, RIPEMD-160, CRC-32 and xxHash64, all fed from the same pass over the file."
    },
    {
      "title": "Verification that explains itself",
      "text": "Paste a hash or a whole SHA256SUMS listing. Values are compared across hex and Base64, and a length that belongs to no selected algorithm is named as such rather than called a mismatch."
    },
    {
      "title": "Folders and batches",
      "text": "Queue a hundred files, hash them one after another, then export a coreutils-compatible SUMS file to publish next to your download."
    },
    {
      "title": "HMAC and every notation",
      "text": "Keyed HMAC digests plus hex, Base64 and Base64URL output, uppercase and grouped display. Switching any of them re-renders instantly instead of re-reading the file."
    },
    {
      "title": "Nothing is uploaded",
      "text": "The engine is WebAssembly embedded in the page itself. No CDN call, no API, no upload: pull the network cable after loading and it still works."
    }
  ],
  "seoHeroTitle": "Check a download before you trust it",
  "seoHeroText": "A checksum is the only cheap way to know that the installer you just downloaded is byte for byte the one that was published, and not a truncated transfer or a swapped mirror. HashBolt computes that fingerprint locally: files are streamed through a WebAssembly engine in chunks, so size stops being a limit, and every algorithm you tick is fed from the same read. Then you paste the published value — a bare hash, a SHA256SUMS listing, a BSD-style line — and get a verdict that says which algorithm matched.",
  "seoHeroList": [
    "Files of any size",
    "Twelve algorithms in one pass",
    "SHA256SUMS verification",
    "Works offline once loaded"
  ],
  "seoBrowserSpeedTitle": "A WebAssembly engine in a worker",
  "seoBrowserSpeedText": "The hashing runs off the main thread on compiled WebAssembly, an order of magnitude faster than the hand-written JavaScript most online tools still use for MD5. Because it consumes the file as a stream, peak memory is one chunk rather than the whole file, and the interface stays responsive while a 4 GB archive is being read.",
  "seoSecondaryTitle": "What a checksum proves, and what it does not",
  "seoUseCaseTitle": "Downloads, backups and duplicates",
  "seoUseCaseText": "Verify a Linux ISO or an installer against the hash on the vendor page. Confirm that a file copied to an external drive arrived intact. Spot two identical files under different names by comparing digests instead of opening them. Produce a SUMS file to ship with a release so other people can do the same.",
  "seoPrivacyTitle": "It cannot leak what it never sends",
  "seoPrivacyText": "There is no upload endpoint in this tool, and no network request of any kind is involved in hashing: the WebAssembly module is embedded in the page, so it works with the connection switched off. Your files, your text and any HMAC key you type stay in the tab and disappear when you close it.",
  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "MD5 generator online",
    "SHA-256 checksum",
    "Verify file hash",
    "SHA256SUMS checker",
    "BLAKE3 online",
    "CRC-32 calculator",
    "HMAC generator",
    "File integrity check"
  ],
  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Is my file uploaded anywhere?",
      "answer": "No. The hashing engine is WebAssembly embedded in the page and it runs in a worker inside your browser. There is no upload endpoint, no API call and no CDN fetch, so the tool keeps working with the network disconnected."
    },
    {
      "question": "How large a file can it handle?",
      "answer": "There is no fixed ceiling: the file is consumed as a stream in small chunks, so only one chunk is in memory at a time and multi-gigabyte disk images are routine. What limits you in practice is how fast your drive can read, which is what the speed readout shows."
    },
    {
      "question": "How do I verify a downloaded ISO or installer?",
      "answer": "Queue the file, tick the algorithm the vendor used (SHA-256 in almost every case), press Compute, and paste their published value into the verification box. You can paste the whole SHA256SUMS file too — lines are matched to your files by name."
    },
    {
      "question": "Why is MD5 marked with a warning?",
      "answer": "Because building two different files with the same MD5 digest is cheap today, and the same is true of SHA-1. They remain perfectly good at catching a corrupted transfer, which is what a checksum on a download page is usually for, but they prove nothing against someone who tampered with the file on purpose."
    },
    {
      "question": "My hash does not match the one on the website. What now?",
      "answer": "First check you compared the same algorithm: a 64-character hash can be SHA-256, SHA3-256, BLAKE2b or BLAKE3, and the tool tells you which one matched. Then re-download the file — a genuine mismatch is most often an interrupted or mirrored-badly transfer. If it persists with a fresh download, do not run the file."
    },
    {
      "question": "Why does hashing text give a different result to hashing a file with the same text?",
      "answer": "Because a file usually carries something the textarea does not: a trailing newline, Windows CRLF line endings, or a UTF-8 byte order mark. The tool hashes exactly the bytes you gave it, and there is a switch to normalise CRLF to LF when you need to match a value produced on Linux."
    },
    {
      "question": "What is HMAC for?",
      "answer": "A plain hash proves that content was not altered by accident; anyone can recompute it. An HMAC mixes a secret key into the digest, so only someone holding that key can produce or check the value. It is what API signatures and webhook verification use."
    }
  ],
  "footerTagline": "Free checksum generator and verifier for files and text, running entirely in your browser.",
  "footerCredit": "Part of the oLoveTools suite"
};
