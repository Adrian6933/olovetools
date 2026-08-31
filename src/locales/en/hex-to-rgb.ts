export default {
  "title": "Hex to RGB",
  "badge": "Colour conversion",
  "seo_title": "HEX to RGB Converter | RGB, HSL, HWB, OKLCH & CMYK with Contrast and Palette Tools",
  "seo_description": "Paste any CSS colour — hex, a keyword, oklch(), color-mix() — and get RGB, HSL, HWB, OKLCH, OKLab and CMYK back. Build ramps and harmonies, check WCAG and APCA contrast, simulate colour blindness and export the palette. Everything runs in your browser.",
  "seoHeroTitle": "Colour Converter Studio",
  "seoHeroText": "Convert any CSS colour to RGB, HSL, HWB, OKLCH, OKLab and CMYK, build ramps and harmonies, and check contrast — all locally.",
  "description": "Type a hex code, a CSS keyword or a whole oklch() function and get every other notation back instantly. Then build a ramp, check the contrast, simulate how it reads for colour-blind viewers, and take the palette with you.",

  "palette_title": "Palette",
  "palette_add": "Add a slot",
  "palette_remove": "Remove this colour",
  "tooltip_undo": "Undo (Ctrl+Z)",
  "tooltip_redo": "Redo (Ctrl+Shift+Z)",
  "button_reset": "Reset",

  "preview_hold": "Hold to compare with the starting colour",
  "preview_baseline": "Starting colour",
  "preview_complement": "Complement (Alt)",

  "label_input": "Any CSS colour",
  "placeholder_input": "#FF6347, rebeccapurple, oklch(70% 0.15 30)…",
  "error_invalid": "not a colour",
  "hint_native": "Parsed by the browser itself, so keywords, hwb(), lab(), lch(), oklch(), color-mix() and display-p3 all work.",
  "hint_fallback": "Hex with 3, 4, 6 or 8 digits plus rgb() and hsl() are understood without any browser help.",
  "tooltip_picker": "System colour picker",
  "tooltip_eyedropper": "Pick a colour from anywhere on screen (E)",
  "tooltip_paste": "Paste a list of colours",
  "tooltip_image": "Pick colours from an image",
  "tooltip_shortcuts": "Keyboard shortcuts (?)",

  "copy": "Copy",
  "copied": "Copied",
  "error_clipboard": "The browser refused clipboard access, so nothing was copied. Select the value and copy it by hand.",
  "error_clipboard_read": "The browser refused to read the clipboard. Paste the list into the text field instead.",
  "error_no_colors": "No colours found in the clipboard.",
  "cmyk_disclaimer": "CMYK here is the plain arithmetic conversion, not an ICC separation. A press-ready CMYK depends on the paper, the ink and the output profile, and cannot be derived from an sRGB value on its own.",

  "shortcuts": [
    { "keys": "1 – 8", "label": "Jump to that palette slot" },
    { "keys": "Ctrl+Z / Ctrl+Shift+Z", "label": "Undo and redo" },
    { "keys": "Alt", "label": "Hold to preview the complement" },
    { "keys": "Click", "label": "Hold on the swatch to compare with the starting colour" },
    { "keys": "Right click", "label": "Flip a palette slot to its complement" },
    { "keys": "C", "label": "Copy the hex code" },
    { "keys": "E", "label": "Open the screen eyedropper" },
    { "keys": "?", "label": "Show or hide this list" }
  ],

  "image_title": "Pick from an image",
  "image_from": "from {tool}",
  "image_close": "Close the image",
  "image_count": "{n} colours",
  "image_fewer": "Fewer colours",
  "image_more": "More colours",
  "image_extract": "Extract palette",
  "image_extracting": "Extracting…",
  "image_hint": "Click any pixel to take its exact colour. Scroll to zoom into the pixel under the cursor, drag to pan.",
  "image_error": "This file could not be decoded as an image.",
  "image_error_pixels": "No opaque pixels found in this image.",

  "tuner_title": "Fine tuning",
  "tuner_show_rgb": "RGB sliders",
  "tuner_show_oklch": "OKLCH sliders",
  "tuner_lightness": "Lightness",
  "tuner_chroma": "Chroma",
  "tuner_hue": "Hue",
  "tuner_alpha": "Alpha",
  "tuner_gamut": "Outside sRGB — chroma was reduced to fit, ΔE {n}.",

  "ramp_title": "Tint and shade ramp",
  "ramp_to_palette": "Send to palette",
  "ramp_legend": "Eleven steps built in OKLCH from your colour, anchored on the step whose lightness it already matches.",
  "ramp_clipped": "{n} steps were pulled back into sRGB.",

  "harmony_title": "Harmonies",
  "harmony_to_palette": "Send to palette",
  "harmony_complementary": "Complementary",
  "harmony_analogous": "Analogous",
  "harmony_triadic": "Triadic",
  "harmony_split": "Split complementary",
  "harmony_tetradic": "Tetradic",
  "harmony_monochrome": "Monochrome",
  "mix_title": "Blend",
  "mix_with": "with",
  "mix_hint": "Interpolated in OKLCH along the short hue arc — {n}% of the way.",

  "contrast_title": "Contrast",
  "contrast_swap": "Swap",
  "contrast_sample_large": "Large heading at 24 pixels",
  "contrast_sample_medium": "Sub-heading at 16 pixels, semi-bold",
  "contrast_sample_body": "Body copy at 13 pixels. This is the size that decides whether a colour pair is actually usable.",
  "contrast_wcag": "WCAG 2.1",
  "contrast_apca": "APCA (WCAG 3 draft)",
  "contrast_apca_flip": "Flipped, using the background as the text colour: Lc {n}",
  "contrast_bg": "Background",
  "contrast_bg_custom": "Custom background colour",
  "wcag_aaa": "AAA · passes at every text size",
  "wcag_aa": "AA · passes for body text",
  "wcag_aa_large": "AA · large text only, from 18pt or 14pt bold",
  "wcag_fail": "Below the minimum for text",
  "apca_body": "Enough for body text and smaller",
  "apca_large": "Headings from 24 pixels up",
  "apca_ui": "Large interface text and icons only",
  "apca_none": "Not usable for text",

  "cvd_title": "Colour vision",
  "cvd_hint": "Lowest distance between any two swatches, per vision type",
  "cvd_normal": "Typical vision",
  "cvd_protanopia": "Protanopia · no red cones",
  "cvd_deuteranopia": "Deuteranopia · no green cones",
  "cvd_tritanopia": "Tritanopia · no blue cones",
  "cvd_legend": "Below ΔE 0.05 two swatches are effectively the same colour for that viewer, so a palette that relies on telling them apart will break. The simulation follows Viénot, Brettel and Mollon (1999) and is applied in linear light.",

  "nearest_title": "Closest named colours",
  "nearest_css": "CSS keyword",
  "nearest_tw": "Tailwind token",
  "nearest_exact": "exact",
  "nearest_legend": "Distance is ΔE in OKLab, where roughly 0.02 is the point most people start to see two swatches as different colours. Click a row to jump to that exact colour.",

  "export_title": "Export the palette",
  "export_count": "{n} colours",
  "export_png_hint": "A swatch sheet with the hex code printed on every colour. Download it or send it straight to another tool.",
  "export_download": "Download",

  "nextStepTitle": "Keep going",
  "nextStepHint": "The palette travels with you — no download, no re-upload",
  "nextCss": "Design with these colours",
  "nextJson": "Open as JSON",
  "nextSvg": "Optimise the swatch SVG",
  "nextPng": "Compress the swatch sheet",
  "nextDiff": "Compare two palettes",

  "howItWorksTitle": "How it works",
  "steps": [
    {
      "title": "Bring a colour in",
      "text": "Type any CSS notation, use the screen eyedropper, paste a whole palette, or open an image and click the pixel you want."
    },
    {
      "title": "Shape it",
      "text": "Lightness, chroma and hue sliders that behave the same on a yellow as on a blue, plus ramps, harmonies and blending."
    },
    {
      "title": "Check it",
      "text": "WCAG 2.1 and APCA against any background, and a colour-blindness simulation that tells you when two swatches collapse into one."
    },
    {
      "title": "Take it with you",
      "text": "Copy a single notation, export CSS, Tailwind, SCSS, JSON, SVG or a swatch sheet, or hand the palette to the next tool."
    }
  ],

  "features": [
    {
      "title": "Every CSS colour syntax",
      "text": "Hex with 3, 4, 6 or 8 digits, keywords, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color-mix() and display-p3. The browser's own parser does the reading, so nothing is left out."
    },
    {
      "title": "Ramps that stay even",
      "text": "Eleven steps generated in OKLCH, so each step looks a consistent distance from the last instead of the uneven jumps an HSL ramp produces."
    },
    {
      "title": "WCAG 2.1 and APCA",
      "text": "The classic ratio plus the signed Lc value from the WCAG 3 draft, measured against any background you choose, not just white and black."
    },
    {
      "title": "Colour-blindness check",
      "text": "Protanopia, deuteranopia and tritanopia simulated in linear light, with the smallest distance between any two swatches so you know when a palette collapses."
    },
    {
      "title": "Eyedropper and images",
      "text": "Pick a colour from anywhere on screen where the browser allows it, or open an image, zoom into the pixel under your cursor and take its exact value."
    },
    {
      "title": "Harmonies and blending",
      "text": "Complementary, analogous, triadic, split, tetradic and monochrome sets rotated in OKLCH, plus perceptual blending along the short hue arc."
    },
    {
      "title": "Export anywhere",
      "text": "CSS custom properties, a Tailwind @theme block, SCSS variables, JSON, an SVG or PNG swatch sheet, and a GIMP palette file."
    },
    {
      "title": "Nothing leaves the tab",
      "text": "No upload, no API call, no account. Every conversion, every contrast figure and every palette is computed by your own browser."
    }
  ],

  "seoBrowserSpeedTitle": "Instant local processing",
  "seoBrowserSpeedText": "Every conversion is arithmetic on three numbers, so there is nothing to wait for and nothing to send anywhere. Reading your input is handed to the browser's own CSS engine, which is why keywords, color-mix() and wide-gamut notations are understood rather than rejected. The perceptual work — OKLCH ramps, gamut mapping, ΔE distances, colour-blindness simulation — is a few hundred floating-point operations, and even extracting a palette from a large photo is a k-means pass over a downsampled copy that finishes in well under a second.",
  "seoUseCaseTitle": "Built for design systems",
  "seoUseCaseText": "The awkward part of colour work is rarely the conversion itself: it is producing a scale that reads evenly, proving a pair of colours is legible, and getting the result into the shape your codebase expects. This tool anchors an eleven-step ramp on the colour you already have, tells you which steps had to be pulled back into sRGB and by how much, names the closest CSS keyword and Tailwind token with a measured distance, and exports the whole palette as custom properties, a Tailwind theme block, SCSS, JSON or a swatch sheet.",
  "seoPrivacyTitle": "Private by construction",
  "seoPrivacyText": "There is no server side to this tool. Colours you type, palettes you paste and images you open stay in the tab: an image is decoded into a canvas that never leaves your machine, and closing the tab discards everything. The only thing that travels is what you choose to put in the address bar — the palette is encoded there so you can share a link, and nothing else about your session is recorded.",

  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Which colour formats can I paste in?",
      "answer": "Hex with 3, 4, 6 or 8 digits, the 148 CSS keywords, rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(), oklab(), oklch(), color-mix() and color(display-p3 …). Input goes through the browser's own CSS parser, so anything your browser accepts in a stylesheet works here. Without a browser parser the tool still reads hex, rgb() and hsl()."
    },
    {
      "question": "Why does the tool prefer OKLCH over HSL?",
      "answer": "In HSL, two colours with the same lightness value can look wildly different in brightness — a yellow at 50% reads far lighter than a blue at 50%. OKLCH is built so that its lightness matches what the eye reports, which is why the ramps, harmonies and blending here all rotate and interpolate in that space."
    },
    {
      "question": "What does the ΔE number mean?",
      "answer": "It is the distance between two colours in OKLab. Around 0.02 is where most people start to see two swatches as genuinely different colours, so it is a useful yardstick: it tells you how far a ramp step drifted when it had to be squeezed back into sRGB, how close the nearest Tailwind token really is, and whether two palette colours survive a colour-blindness simulation."
    },
    {
      "question": "Is the contrast checker WCAG compliant?",
      "answer": "The WCAG 2.1 ratio is computed exactly as the specification defines it, against whatever background you pick, and the badge distinguishes body text from the looser large-text threshold rather than showing a single pass mark. Alongside it you get APCA, the perceptual measure proposed for WCAG 3 — useful in practice, but still a draft and not a conformance criterion."
    },
    {
      "question": "Is the CMYK output ready for print?",
      "answer": "No, and no browser tool's is. What you get is the standard arithmetic conversion, which is fine for a rough idea or for software that expects those four numbers. A real separation depends on the paper, the inks and an ICC output profile, so it has to be done in your layout or imaging application."
    },
    {
      "question": "Does anything I paste get uploaded?",
      "answer": "No. There is no server component, no analytics on your colours and no network request at any point in the conversion. Images are decoded locally into a canvas and discarded when you close them. The palette is written into the page URL so that you can share or bookmark it — that is the only place your colours are stored, and it stays on your machine unless you send the link yourself."
    }
  ],

  "seoKeywordsTitle": "Keywords",
  "seoKeywords": ["hex to rgb", "colour converter", "hex to hsl", "oklch converter", "cmyk converter", "wcag contrast checker", "apca contrast", "colour blindness simulator", "tailwind colour", "palette generator", "online tool", "free"],

  "footerTagline": "Convert any CSS colour to RGB, HSL, HWB, OKLCH, OKLab and CMYK, build ramps and harmonies, and check contrast — all locally.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:"
};
