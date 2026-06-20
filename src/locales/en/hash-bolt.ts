export default {
  "title": "Hash-Bolt",
  "description": "Calculate cryptographic hashes (MD5, SHA-1, SHA-256, SHA-512) for text and files 100% locally inside your browser.",
  "input_text_tab": "Text Input",
  "input_file_tab": "File Hashing",
  "placeholder_text": "Type or paste your text here to compute its hash in real-time...",
  "label_algorithm": "Hash Function",
  "label_expected_hash": "Compare with Checksum (Optional)",
  "match_success": "Verified: Hashes match successfully!",
  "match_fail: ": "Error: Hashes do not match!",
  "match_fail": "Error: Hashes do not match!",
  "match_placeholder": "Paste expected hash to verify integrity...",
  "file_drag_active": "Drop the file here...",
  "file_drag_inactive": "Drag & drop a file here, or click to select a file",
  "file_size_warning": "Large files are hashed efficiently in chunks to prevent crashes.",
  "file_processing": "Reading and computing hash...",
  "file_processing_speed": "Speed",
  "file_processing_time": "Time taken",
  "format_uppercase": "Uppercase output",
  "format_base64": "Base64 format",
  "copied": "Copied!",
  "tooltip_copy": "Copy to clipboard",
  "seoHeroTitle": "Fast Offline Cryptographic Checksum Generator",
  "seoHeroText": "Verify file integrity and generate secure cryptographic hashes (MD5, SHA-1, SHA-256, SHA-384, SHA-512) entirely in your browser. Fully sandboxed and 100% private.",
  "seoBrowserSpeedTitle": "Local Hashing Engine",
  "seoBrowserSpeedText": "All computations are executed inside your browser using the native Web Crypto API. Hashing runs at hardware speed without sending anything to a server.",
  "seoUseCaseTitle": "Gigabyte-File Support",
  "seoUseCaseText": "Drag and drop large archives, installer packages, or media files. Our chunked file reader computes the checksum in memory without exhausting tab RAM.",
  "seoPrivacyTitle": "100% Privacy Secure",
  "seoPrivacyText": "No databases, tracking, or network uploads. Your raw input text and binary files reside strictly in local memory and disappear when you close the tab.",
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Is my data uploaded to verify hashes?",
      "answer": "No. The hashing process happens 100% offline inside your browser's V8 engine. No file slices or text inputs are ever sent to any database or external API."
    },
    {
      "question": "How do I verify a downloaded installer checksum?",
      "answer": "Upload the installer file to the File Hashing panel, copy the hash provided by the vendor into the expected checksum field, and check if the matching status indicator turns green."
    },
    {
      "question": "Why does MD5 require a custom engine?",
      "answer": "Modern browsers exclude MD5 from the native Web Crypto API due to cryptographic vulnerabilities. We provide a custom, high-speed pure JS MD5 engine to support legacy checksum verification."
    }
  ],
  "footerTagline": "Secure and local cryptographic checksum generator for files and text.",
  "footerCredit": "Part of the oLoveTools suite"
};
