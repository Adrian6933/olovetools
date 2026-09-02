export default {
  "previewTitle": "Preview of the cleaned HTML",
  "resetHint": "Start over",
  "title": "HTML Sanitizer",
  "seo_title": "HTML Sanitizer | Free Online HTML Cleaner with Removal Report",
  "seo_description": "Clean HTML with a real allow-list policy: strip scripts, event handlers, javascript: URLs and unwanted tags, then see exactly what was removed and put any of it back. Runs entirely in your browser.",
  "seoHeroTitle": "HTML Cleaner & Sanitizer",
  "badge": "Allow-list sanitizer",
  "description": "Paste HTML, pick a policy, and press the button. You get the cleaned markup plus an itemised report of every tag and attribute that was dropped — and you can overrule any single decision without pasting anything again.",
  "heroPoints": [
    "Nothing runs until you press it",
    "Every removal is itemised",
    "Never leaves your browser"
  ],

  "label_input": "Raw HTML input",
  "label_policy": "Cleaning policy",
  "placeholder_input": "Paste HTML here, drop a .html file, or load one of the samples below. Nothing runs until you press Sanitize.",

  "button_open_file": "Open file",
  "button_clear": "Clear",
  "button_run": "Sanitize",
  "button_working": "Cleaning…",
  "button_manual": "Manual",
  "button_undo": "Undo",
  "button_redo": "Redo",
  "button_copy": "Copy",
  "button_copied": "Copied!",
  "button_download": "Download",
  "button_reset": "Reset",

  "samples_title": "Try it",
  "sample_messy": "Messy CMS paste",
  "sample_attack": "Known XSS payloads",

  "preset_strict": "Strict",
  "preset_strict_hint": "Text and links only. For anything you are going to store.",
  "preset_email": "Email-safe",
  "preset_email_hint": "Tables and inline style survive; scripting does not.",
  "preset_content": "Rich content",
  "preset_content_hint": "A CMS body: media, tables, data-* and aria-*.",
  "preset_text": "Plain text",
  "preset_text_hint": "Drop all markup, keep the reading order.",
  "preset_custom_active": "Custom policy — edited by hand.",

  "stale_hint": "Policy changed — run it again",
  "shortcut_hint": "Ctrl+Enter to run · Ctrl+Z to undo a policy change",

  "tab_source": "Cleaned source",
  "tab_preview": "Preview",
  "tab_report": "Removed",

  "format_pretty": "Pretty",
  "format_min": "Minified",
  "format_raw": "As parsed",

  "compare_hold": "Hold to compare",
  "compare_showing": "Original",
  "output_empty": "Everything was removed — nothing survived this policy.",
  "copy_failed": "Your browser blocked clipboard access.",

  "stat_size": "size",
  "stat_elements": "elements",
  "stat_removed": "removed",
  "stat_dangerous": "executable",
  "stat_time": "time",

  "policy_allowed_tags": "Allowed tags",
  "policy_allowed_attrs": "Allowed attributes",
  "policy_add_tag": "add tag…",
  "policy_add_attr": "add attribute…",
  "policy_no_tags": "No tags allowed — output will be plain text",
  "policy_no_attrs": "No attributes kept",
  "policy_strip_tags": "Delete with contents",
  "policy_strip_hint": "never unwrapped — the inside goes too",
  "policy_no_strip": "Nothing deleted with its contents",
  "policy_unknown": "Tags that are not allowed",
  "policy_unwrap": "Unwrap — keep the text inside",
  "policy_drop": "Drop — remove the whole subtree",
  "policy_schemes": "URL schemes accepted",
  "policy_schemes_hint": "anything else in href/src is dropped",
  "policy_data_note": "data:image accepts raster formats only. SVG data URLs are never allowed: an inline SVG runs its own <script> when opened directly.",
  "policy_other": "Attributes and extras",
  "policy_keep_style": "Keep style=\"…\"",
  "policy_keep_class": "Keep class=\"…\"",
  "policy_keep_id": "Keep id / name",
  "policy_keep_comments": "Keep comments",
  "policy_data_attrs": "Keep data-* attributes",
  "policy_aria_attrs": "Keep aria-* and role",
  "policy_svg_math": "Allow <svg> and <math>",
  "policy_harden_links": "Add rel=\"noopener noreferrer\"",
  "policy_strip_target": "Remove target=\"_blank\"",

  "scheme_https_hint": "Encrypted links and images.",
  "scheme_http_hint": "Plain HTTP — fine for internal pages, leaks over the network.",
  "scheme_relative_hint": "Paths and anchors with no scheme: /page, #section, ?q=1.",
  "scheme_mailto_hint": "Email links.",
  "scheme_tel_hint": "Phone, SMS and click-to-call links.",
  "scheme_ftp_hint": "Legacy file transfer links.",
  "scheme_data_hint": "Images inlined as data URLs. Raster formats only.",

  "report_empty": "Nothing was removed — the input already matched the policy.",
  "report_dangerous": "{0} removals could have executed code.",
  "report_on": "on",
  "report_keep": "Keep",
  "report_kept": "Kept",
  "report_keep_it": "Keep this in the output",
  "report_remove_again": "Remove it again",
  "reason_tag-not-allowed": "Tag not on the allow list",
  "reason_tag-stripped": "Tag deleted with its contents",
  "reason_event-handler": "Inline event handler",
  "reason_attr-not-allowed": "Attribute not on the allow list",
  "reason_bad-scheme": "URL scheme not allowed",
  "reason_comment": "HTML comment",
  "reason_inline-style": "Inline style attribute",
  "reason_class-attr": "class attribute",
  "reason_id-attr": "id / name attribute",

  "nextStepTitle": "Keep going",
  "nextStepHint": "The cleaned HTML travels with you — no re-upload",
  "nextDiff": "Compare with the original",
  "nextCodecard": "Make a code image",
  "nextWordflow": "Analyse the text",
  "nextBase64": "Encode to Base64",
  "nextZip": "Zip it",

  "howItWorksTitle": "How it works",
  "step1Title": "Bring the HTML in",
  "step1Text": "Paste it, drop a .html file, or arrive from another tool. It just sits there — opening a file never starts the cleaning.",
  "step2Title": "Choose the policy",
  "step2Text": "Four presets cover the usual cases. Open the manual panel to edit the tag list, the attribute list and the accepted URL schemes yourself.",
  "step3Title": "Run it",
  "step3Text": "One pass builds the cleaned tree and records every decision on the way. A megabyte of markup takes a few milliseconds.",
  "step4Title": "Review and overrule",
  "step4Text": "The report lists what went and why. Disagree with any row and press Keep: the pass runs again with that one exception.",

  "featuresTitle": "What it does",
  "features": [
    {
      "title": "Real allow-list policy",
      "text": "Tags, attributes and URL schemes are separate lists you control. Blocking a tag but leaving its attributes untouched is not sanitising."
    },
    {
      "title": "Itemised removal report",
      "text": "Every dropped element and attribute is grouped with a count, a sample of what it held, and the reason it went."
    },
    {
      "title": "Overrule any decision",
      "text": "Press Keep on a row and the sanitiser runs again allowing exactly that one thing. Your original text is never edited."
    },
    {
      "title": "URL schemes are checked",
      "text": "javascript:, data:text/html and vbscript: in href, src, formaction, srcset or xlink:href are caught, including whitespace and entity tricks."
    },
    {
      "title": "Sandboxed preview",
      "text": "The result renders in an iframe with an empty sandbox and no-referrer, so nothing in it can run, submit or navigate."
    },
    {
      "title": "Pretty, minified or as-parsed",
      "text": "Re-serialise the same cleaned tree three ways. Whitespace inside <pre> is preserved even when the rest is re-indented."
    },
    {
      "title": "Hands off to the next tool",
      "text": "Send the result straight to DiffSnap, CodeCard, WordFlow, Base64Bolt or ZipFlow without a download-and-upload round trip."
    },
    {
      "title": "Nothing leaves the tab",
      "text": "The sanitiser is a JavaScript library bundled with the page. There is no upload, no API call and no CDN fetch at any point."
    }
  ],

  "seoSecondaryTitle": "A sanitiser that shows its work",
  "seoHeroText": "Most online HTML cleaners hand you a string and expect you to trust it. This one keeps the decision log: which tag was dropped, which attribute was stripped, which URL failed the scheme check — and lets you overrule any of it in one click, because the cleaned output is regenerated from your policy rather than patched after the fact.",
  "seoHeroList": [
    "Allow-list, not block-list",
    "Attributes checked, not just tags",
    "Counts and reasons for every removal",
    "Undo and redo on the policy"
  ],

  "seoUseCaseTitle": "When you need it",
  "seoUseCaseText": "Cleaning what a rich-text editor produced before storing it. Stripping Word and Google Docs cruft out of a CMS paste. Making third-party markup safe to render. Pulling readable text out of a saved page. Checking whether the markup you are about to trust contains anything that could execute — the sample of known payloads is there so you can see the answer rather than assume it.",

  "seoBrowserSpeedTitle": "Built on DOMPurify",
  "seoBrowserSpeedText": "The parsing and the security decisions come from DOMPurify, the library that browsers' own security teams cite, rather than a hand-written pass over querySelectorAll. It is used through its hook API and asked for the intermediate DOM rather than a finished string, which is what makes the removal report and the per-item overrides possible. It handles mutation XSS, namespace confusion and the URL tricks a naive cleaner misses.",

  "seoPrivacyTitle": "100% local",
  "seoPrivacyText": "No uploads, no API keys, no tracking of what you paste. The library is bundled with the page, so nothing is fetched from a CDN either. Your HTML stays in the tab's memory and disappears when you close it.",

  "seoKeywordsTitle": "Also known as",
  "seoKeywords": [
    "html sanitizer",
    "html cleaner",
    "remove scripts from html",
    "clean html online",
    "sanitize html",
    "strip tags",
    "dompurify online",
    "xss filter",
    "html allow list"
  ],

  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Why does nothing happen when I paste?",
      "answer": "By design. Pasting or opening a file only loads the HTML; the sanitiser runs when you press Sanitize. That way you choose the policy first instead of watching the tool guess, and a large document is never parsed on every keystroke."
    },
    {
      "question": "What does the removal report actually let me do?",
      "answer": "Every row is a decision you can reverse. Pressing Keep adds that one exception and runs the whole pass again — so allowing <iframe> back does not also let its onload attribute through. Your input text is never rewritten, which is why undo and redo stay cheap."
    },
    {
      "question": "Does whitelisting tags make the output safe on its own?",
      "answer": "No, and that is the mistake most tag-only cleaners make. An <a> tag on any allow list can still carry href=\"javascript:…\", so attributes and URL schemes are checked separately here. Blocking a tag while leaving its attributes untouched is not sanitising."
    },
    {
      "question": "Which URL schemes get through?",
      "answer": "Only the ones you tick. Everything else is dropped from href, src, srcset, action, formaction, poster, cite and xlink:href, including values hidden behind tabs, newlines or HTML entities. data: is limited to raster images — an SVG data URL runs its own script when opened directly, so it is never allowed."
    },
    {
      "question": "Is the live preview safe?",
      "answer": "Yes. It renders in an iframe with sandbox set to the empty string, which blocks scripts, forms, popups and navigation, plus a no-referrer policy so any surviving image cannot leak the page you came from."
    },
    {
      "question": "Is my HTML sent anywhere?",
      "answer": "No. The sanitiser is JavaScript bundled with this page and runs in your tab. There is no upload, no API call, and no CDN request — you can check with the network tab open."
    },
    {
      "question": "How big a document can it handle?",
      "answer": "Parsing is roughly linear, so a few megabytes of markup finish in well under a second on a normal laptop; the measured time is shown after every run. Syntax highlighting in the output pane switches off above 200 KB, since colouring costs more than it is worth at that size."
    }
  ],

  "footerTagline": "An HTML sanitizer with a real allow-list policy and a removal report you can argue with — 100% local in your browser.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:"
};
