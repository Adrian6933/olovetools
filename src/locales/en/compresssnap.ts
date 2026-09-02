export default {
  "resetHint": "Start over",
  "title": "CompressSnap",
  "badge": "Image compression",
  "description": "Compress JPEG, PNG, WebP, AVIF and HEIC in your browser — to a quality you choose or to a size you have to hit — and see exactly what the compression cost.",
  "seo_title": "CompressSnap | Compress images to an exact target size",
  "seo_description": "Compress and resize JPEG, PNG, WebP, AVIF, HEIC and TIFF images. Hit a size budget in kilobytes, reduce a PNG palette, convert between formats and see the measured SSIM quality loss on every file. Runs off the main thread, uploads nothing.",
  "dropzonePrompt": "Drop images here, or click to choose",
  "dropzoneSubtitle": "JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF and iPhone HEIC. Very large images are capped to what a browser canvas can hold.",
  "rejectedFiles": "{n} file(s) were not images and were left out.",
  "compressBtn": "Compress {n}",
  "recompressBtn": "Settings changed — run again",
  "downloadBtn": "Download",
  "downloadAllBtn": "Download All (ZIP)",
  "clearBtn": "Clear All",
  "removeBtn": "Remove",
  "closeBtn": "Close",
  "statusQueued": "waiting",
  "statusDecoding": "decoding…",
  "statusCompressing": "compressing…",
  "statusSkipped": "already smaller than we could make it",
  "statusError": "failed",
  "workerOn": "off main thread",
  "workerOff": "main thread",
  "workerHint": "Where the encoding runs. Off the main thread the page keeps responding during a batch.",
  "attemptsHint": "Encodes needed to fit the budget",
  "originalSize": "Original size",
  "compressedSize": "Compressed size",
  "savings": "Saved",
  "avgSsim": "avg SSIM",
  "presetLight": "Light",
  "presetBalanced": "Balanced",
  "presetWeb": "For the web",
  "presetStrong": "Strong",
  "formatLabel": "Format",
  "formatOriginal": "Keep",
  "avifUnsupported": "This browser cannot write AVIF, so it is not offered.",
  "qualityLabel": "Quality",
  "qualityHint": "Lower quality, smaller file. The measured loss is shown on each result.",
  "qualityFromBudget": "Quality is being searched for to fit the size budget below.",
  "pngColorsLabel": "PNG colours",
  "pngColorsAll": "all",
  "ditherLabel": "Dither the gradients",
  "pngNote": "PNG has no quality setting — every encoder ignores it. Reducing the palette is what makes one smaller, and on flat artwork, screenshots and logos it is invisible.",
  "budgetLabel": "Size budget",
  "budgetToggle": "Get every image under a set size",
  "budgetHint": "Quality is bisected until it fits.",
  "budgetPngNote": "A byte budget needs a quality knob to search; PNG has none. Use the palette instead.",
  "resizeModeLabel": "Resize mode",
  "resizeNone": "None",
  "resizeLongEdge": "Long edge",
  "resizeScale": "Scale",
  "resizeCustom": "Custom",
  "longEdgeLabel": "Longest side (px)",
  "longEdgeHint": "Never upscales — a smaller image is left alone.",
  "scaleLabel": "Scale",
  "widthLabel": "Width (px)",
  "heightLabel": "Height (px)",
  "keepAspectLabel": "Keep aspect ratio",
  "measureLabel": "Measure the quality loss (SSIM)",
  "measureHint": "Decodes the result back and compares it. Adds a little time per image.",
  "bandIdentical": "Indistinguishable",
  "bandExcellent": "Excellent",
  "bandGood": "Good",
  "bandFair": "Fair",
  "bandPoor": "Visible loss",
  "compareBtn": "Preview & Compare",
  "originalLabel": "Original",
  "compressedLabel": "Compressed",
  "nextStepTitle": "Keep going",
  "nextStepHint": "The image travels with you — no download, no re-upload",
  "nextCrop": "Crop it",
  "nextWatermark": "Watermark it",
  "nextExif": "Check its metadata",
  "nextZip": "Zip it",
  "howItWorksTitle": "How it works",
  "step1Title": "Drop the photos in",
  "step1Text": "Paste, pick or drag them. They queue up — nothing is encoded until you press the button, so a folder of forty does not lock the tab.",
  "step2Title": "Choose the trade",
  "step2Text": "A quality, a size in kilobytes to stay under, a format, a maximum long edge. PNG gets a palette instead of a quality slider.",
  "step3Title": "Let it run",
  "step3Text": "Encoding happens off the main thread, so the page keeps responding while the batch works through.",
  "step4Title": "Take the files",
  "step4Text": "One by one, all of them as a ZIP, or straight into the next tool without a download.",
  "features": [
    {
      "title": "Encodes off the main thread",
      "text": "A Web Worker with OffscreenCanvas does the work and the bitmaps are transferred rather than copied, so a batch of phone photos no longer freezes the tab it is running in."
    },
    {
      "title": "Compress to a size, not a guess",
      "text": "Give it a kilobyte budget and it bisects the quality until the file fits, then tells you which quality it settled on and how many tries it took."
    },
    {
      "title": "The loss is a number",
      "text": "Every result is decoded back and compared to its source with SSIM, so \"quality 70\" stops being a feeling and becomes 0.981 next to the file size it bought."
    },
    {
      "title": "PNG that actually shrinks",
      "text": "Median-cut palette reduction with optional dithering. It is the only knob a PNG has — the quality argument is ignored by every PNG encoder — and it pays off on screenshots, logos and flat artwork. A photo saved as PNG is better served by converting it to JPEG or WebP, and the tool says so rather than handing back a bigger file."
    },
    {
      "title": "The formats you actually have",
      "text": "iPhone HEIC and TIFF are converted on the way in, AVIF and WebP are written on the way out when the browser can, and rotation from EXIF is applied so nothing lands on its side."
    },
    {
      "title": "Nothing leaves the tab",
      "text": "Decoding, encoding, the palette and the measurement all run in your browser. No API, no upload, no account."
    }
  ],
  "seoHeroTitle": "The image compressor that tells you what the compression cost",
  "seoHeroText": "CompressSnap reads JPEG, PNG, WebP, AVIF, GIF, BMP, TIFF and the HEIC files an iPhone produces, and writes JPEG, PNG, WebP and AVIF back. It hits a byte budget by searching for the quality that fits, shrinks PNGs by reducing their palette rather than pretending a quality slider does anything, and measures every result against its source so the trade you made is visible.",
  "seoHeroList": [
    "No registration required",
    "Compress multiple images at once",
    "Convert to WebP, JPG, or PNG"
  ],
  "seoBrowserSpeedTitle": "Measured, not guessed",
  "seoBrowserSpeedText": "Every compressed file is decoded again and compared to what went in. The number is SSIM, the measure that tracks what people actually notice, and it sits next to the file size so the two can be weighed against each other.",
  "seoSecondaryTitle": "Why compress your images?",
  "seoUseCaseTitle": "The awkward cases, handled",
  "seoUseCaseText": "A HEIC straight off an iPhone, a portrait photo whose rotation lives in an EXIF tag, a screenshot PNG that gets bigger when you push it through JPEG, a 48 megapixel frame that will not fit in a canvas — all of them are the normal case, and each one is converted, rotated, flagged or capped instead of failing quietly.",
  "seoPrivacyTitle": "Entirely in your browser",
  "seoPrivacyText": "There is no API behind this page. The decoders, the encoder, the palette reduction and the quality measurement are all JavaScript running in your tab, so a client photo that has not been published yet never leaves your machine.",
  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "image compressor",
    "compress jpeg online",
    "compress png",
    "convert to webp",
    "convert to avif",
    "heic to jpg",
    "compress image to 200kb",
    "reduce image size",
    "batch image compression",
    "resize images online",
    "png palette reduction",
    "image quality ssim"
  ],
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Is my data sent to any server?",
      "answer": "No. Decoding, encoding, the palette reduction and the quality measurement all run inside your browser. An image you open here never leaves the tab."
    },
    {
      "question": "Why does compressing a PNG do nothing?",
      "answer": "Because PNG is lossless and every encoder ignores the quality argument — the old behaviour of showing a quality slider for PNG was misleading. What does make a PNG smaller is using fewer colours, so for PNG you get a palette control instead. On screenshots, logos and flat artwork, dropping to 64 or 128 colours is invisible and often halves the file."
    },
    {
      "question": "Can it compress to a specific size?",
      "answer": "Yes. Turn on the size budget, type a number in kilobytes, and the encoder bisects the quality until the file fits — up to eight attempts. Each result shows the quality it settled on and how many encodes it needed."
    },
    {
      "question": "What is SSIM and why should I care?",
      "answer": "Structural similarity: a number from 0 to 1 for how close the compressed image is to the original, weighted the way human vision is. It is measured by decoding the result back and comparing it pixel by pixel. Above 0.98 almost nobody can tell; below 0.95 the artefacts start to show. It turns \"does quality 70 look alright?\" into something you can read off the screen."
    },
    {
      "question": "Does it accept photos from my iPhone?",
      "answer": "Yes. HEIC and HEIF are converted on the way in, as are TIFF files, and the rotation an iPhone stores in the EXIF tag is applied so a portrait photo does not come out on its side. The old version rejected HEIC at the file picker."
    },
    {
      "question": "Why did one of my images come back unchanged?",
      "answer": "Because compressing it would have made it bigger. That happens most often with screenshots and flat graphics pushed through JPEG at a high quality. Rather than hand you a worse file, the tool marks it and keeps the original."
    },
    {
      "question": "Is EXIF data removed?",
      "answer": "Yes — re-encoding through a canvas drops every metadata block, including GPS coordinates and camera details. The one piece that matters visually, the orientation tag, is applied to the pixels first so the image stays upright."
    },
    {
      "question": "Does a big batch freeze the page?",
      "answer": "No. The encoding runs in a Web Worker with OffscreenCanvas and the image data is transferred rather than copied, so the page keeps responding while the queue works through. Two images are encoded at a time, which is fast without holding several full-resolution frames in memory at once."
    }
  ],
  "footerTagline": "Compress, resize and convert images in your browser, with the quality loss measured.",
  "footerCredit": "Part of oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Email copied to clipboard!",
  "contactForIdeas": "Contact for ideas and feedback:",
  "presetsLabel": "Quick presets",
  "presetExtreme": "Extreme",
  "summaryTitle": "Estimated result",
  "scaleHint": "Shrinks the image width and height.",
  "followGlobalBtn": "Use global settings",
  "statusDone": "Success",
  "individualSettings": "Custom Settings",
  "globalSettings": "Global Settings",
  "originalFormat": "Original Format",
  "compareTitle": "Before & After Visual Comparison",
  "privacyPolicy": "Privacy Policy",
  "termsOfService": "Terms of Service",
  "cookiePolicy": "Cookie Policy",
  "privacyContent": "Your privacy is important to us.\n\nWe only collect information necessary to provide our service. This includes technical data about your browser and device to ensure the tool works correctly.\n\nWe never store, track, or analyze your images. All processing happens locally in your browser, ensuring your data never leaves your device.",
  "termsContent": "By using CompressSnap, you agree to these terms.\n\n1. This tool is provided \"as-is\" without any warranties.\n2. We are not responsible for any data loss or issues arising from the use of this tool.\n3. You are responsible for the content you process using this tool.\n4. We reserve the right to modify these terms at any time.",
  "cookiesContent": "We use cookies to improve your experience.\n\n1. Essential Cookies: Required for the basic functionality of the site.\n2. Preference Cookies: Used to remember your language and cookie consent settings.\n\nYou can manage or disable cookies through your browser settings at any time.",
  "contact": "Contact"
};
