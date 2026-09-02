export default {
  "resetHint": "Start over",
  "languageName": "English",
  "header": {
    "subtitle": "IMAGE FORMAT CONVERTER"
  },
  "hero": {
    "badge": "Runs in your browser",
    "title": "Convert images to the format you actually need,",
    "titleHighlight": "and see what it cost",
    "subtitle": "Drop up to 50 photos, choose the format, size and weight, and convert when you are ready. Nothing is uploaded and nothing starts without you pressing the button.",
    "trust1": "No upload, no account",
    "trust2": "Measured quality (SSIM)",
    "trust3": "Batch of 50"
  },
  "dropzone": {
    "title": "Drop your images here",
    "subtitle": "Up to {max} at a time. You can also paste from the clipboard.",
    "waits": "Files wait here: conversion only starts when you press Convert.",
    "tooMany": "The queue holds 50 images; the extra files were left out.",
    "unsupported": "EPS and camera RAW cannot be decoded in a browser, so they were skipped.",
    "decodeFailed": "That file could not be decoded as an image.",
    "full": "The queue is full. Remove an image to add another."
  },
  "stage": {
    "original": "Original",
    "converted": "Converted",
    "stale": "Settings changed",
    "zoomIn": "Zoom in",
    "zoomOut": "Zoom out",
    "fit": "Fit",
    "splitLabel": "Comparison divider",
    "stageHint": "Scroll to zoom on the pointer, drag to pan. Hold Space, Alt or right-click to see the original."
  },
  "controls": {
    "presetsTitle": "Presets",
    "presets": {
      "web": "Web (WEBP, 1920px)",
      "social": "Social (JPG, 1440px)",
      "archive": "Archive (PNG, full size)",
      "email": "Email (under 500 KB)"
    },
    "presetsHint": "A preset just fills in the controls below. Ignore it and set everything by hand if you prefer.",
    "outputFormat": "Output format",
    "formatUnavailable": "Your browser cannot write this format",
    "formatUnavailableHint": "Crossed-out formats are the ones this browser has no encoder for. We test it instead of guessing, so you never get a PNG with the wrong extension.",
    "qualityTitle": "Quality and weight",
    "quality": "Quality",
    "qualityLossless": "This format is lossless, so quality does nothing here.",
    "targetSize": "Aim for a maximum file size",
    "targetSizeHint": "The quality is found by bisection: up to 8 encodes to land just under your budget.",
    "resizeTitle": "Size",
    "resizeModes": {
      "none": "Keep",
      "scale": "Scale",
      "longEdge": "Long edge",
      "dimensions": "Exact"
    },
    "scale": "Scale",
    "longEdgeHint": "longest side",
    "lockAspect": "Keep the aspect ratio",
    "fits": {
      "contain": "Contain",
      "cover": "Cover",
      "stretch": "Stretch"
    },
    "sharpen": "Sharpen after resizing",
    "sharpenHint": "Unsharp mask on luminance only, so edges stay crisp without colour halos.",
    "transformTitle": "Rotation and background",
    "flipH": "Flip horizontally",
    "flipV": "Flip vertically",
    "background": "Background behind the image (formats without transparency)",
    "engineTitle": "Engine",
    "measureQuality": "Measure the quality",
    "measureQualityHint": "Decodes the result back and compares it with the source (SSIM). Costs a few milliseconds.",
    "livePreview": "Live preview",
    "livePreviewHint": "Off by default: with it on, every change re-converts the selected image.",
    "undo": "Undo",
    "redo": "Redo",
    "historyHint": "Settings history"
  },
  "editor": {
    "startOver": "Start over",
    "shortcuts": "← → to move, Enter to convert, Ctrl+Z to undo",
    "queue": "Queue",
    "addMore": "Add more",
    "remove": "Remove from queue",
    "perImage": "Settings just for this image",
    "perImageOn": "This image ignores the global settings.",
    "perImageOff": "This image follows the global settings.",
    "convert": "Convert",
    "convertAll": "Convert all",
    "converting": "Converting",
    "reading": "Reading",
    "download": "Download",
    "downloadZip": "ZIP",
    "dimensions": "Dimensions",
    "size": "Size",
    "vsOriginal": "vs original",
    "quality": "Quality",
    "attempts": "passes",
    "ssimBands": {
      "identical": "indistinguishable",
      "excellent": "excellent",
      "good": "good",
      "fair": "visible on close look",
      "poor": "clearly degraded"
    },
    "icoMultisize": "The .ico holds 16, 32, 48, 64, 128 and 256 px versions; the size shown is the largest one inside it.",
    "missedTarget": "The size budget could not be met, even at the lowest quality. This is the smallest result.",
    "notConverted": "Not converted yet",
    "notConvertedHint": "Your file is loaded and waiting. Adjust whatever you need and press Convert.",
    "engineNote": "Encoding runs in {n} background workers, so the page never freezes. Each image is decoded once and every conversion reuses it.",
    "dismiss": "Dismiss",
    "backToTop": "Back to top"
  },
  "next": {
    "nextStepTitle": "Keep going",
    "nextStepHint": "The result travels with you — no re-upload",
    "nextCompress": "Compress it",
    "nextCrop": "Crop it",
    "nextExif": "Strip metadata",
    "nextWatermark": "Add a watermark",
    "nextCutout": "Remove background"
  },
  "how": {
    "title": "How it works",
    "subtitle": "Three steps, and none of them start on their own.",
    "steps": [
      {
        "title": "Drop the files",
        "text": "They are decoded once and wait in the queue. Nothing is converted and nothing leaves your device."
      },
      {
        "title": "Set the output",
        "text": "Format, quality, size, rotation, background. Or one preset and done."
      },
      {
        "title": "Convert and compare",
        "text": "You get the weight, the dimensions and an SSIM score of what the conversion cost."
      }
    ]
  },
  "features": {
    "title": "What it does that a plain converter does not",
    "items": [
      {
        "title": "Parallel background workers",
        "desc": "Encoding runs off the main thread across several workers, so the page stays responsive with 50 images in the queue."
      },
      {
        "title": "Formats verified, not guessed",
        "desc": "Every encoder is tested with a real two-pixel encode at startup. A browser that cannot write AVIF will not offer it."
      },
      {
        "title": "Quality you can read",
        "desc": "An SSIM score against the source tells you what the compression actually cost, instead of only how much you saved."
      },
      {
        "title": "Target file size",
        "desc": "Say \"under 500 KB\" and the quality is found by bisection, up to 8 encodes, to land just under the limit."
      },
      {
        "title": "Nothing is uploaded",
        "desc": "Decoding, resizing and encoding all happen in your browser. No server sees your photos, and it works offline."
      },
      {
        "title": "Batch with per-image overrides",
        "desc": "Up to 50 images at once, and any of them can break away with its own format and size."
      }
    ]
  },
  "formats": {
    "title": "Formats, and what each one really gives you",
    "subtitle": "Input: JPG, PNG, WEBP, AVIF, GIF, BMP, SVG, TIFF and HEIC. EPS and camera RAW need a PostScript interpreter and per-camera tables, so they are not accepted rather than silently returned as a PNG.",
    "rows": [
      {
        "label": "WEBP",
        "desc": "The best size-to-quality trade-off for the web today, with transparency. Supported everywhere that matters."
      },
      {
        "label": "AVIF",
        "desc": "Smaller still at the same quality, but only some browsers can write it. If yours cannot, the button is disabled."
      },
      {
        "label": "JPG",
        "desc": "The universal photographic format. No transparency, so you pick the background colour that goes underneath."
      },
      {
        "label": "PNG",
        "desc": "Lossless with transparency. The quality slider does nothing here, and that is why it is greyed out."
      },
      {
        "label": "ICO",
        "desc": "A real multi-size icon: 16, 32, 48, 64, 128 and 256 px in a single file, centre-cropped to a square."
      },
      {
        "label": "PDF",
        "desc": "One page fitted to the image, with a JPEG inside at the quality you chose."
      },
      {
        "label": "TIFF",
        "desc": "Uncompressed RGBA for printing and archiving. Also accepted as input."
      },
      {
        "label": "SVG",
        "desc": "A wrapper: the raster is embedded inside an SVG. It does not trace vectors — no browser tool can — but it works wherever only .svg is accepted."
      }
    ]
  },
  "app": {
    "footer": "Everything runs in your browser.",
    "contactFeedback": "CONTACT FOR IDEAS AND FEEDBACK:",
    "copiedEmail": "Copied!"
  },
  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Are my images uploaded anywhere?",
      "answer": "No. Decoding, resizing and encoding all happen inside your browser using the canvas and web workers. Nothing is sent to a server, and once the page has loaded it works with no connection at all."
    },
    {
      "question": "Why are some formats crossed out?",
      "answer": "Because your browser has no encoder for them. Browsers do not report this: asking for a GIF or a HEIC gives you back a PNG with the type quietly changed. At startup we encode two pixels into each format and check what actually comes out, so you are only offered what works."
    },
    {
      "question": "Can it convert to HEIC, EPS or camera RAW?",
      "answer": "No, and it no longer pretends to. No browser can write HEIC, EPS needs a PostScript interpreter and RAW is a different sensor format per camera model. HEIC and TIFF are accepted as input; EPS and RAW files are rejected with a message instead of coming back as a mislabelled PNG."
    },
    {
      "question": "What is the SSIM number next to the result?",
      "answer": "It is a similarity score between the converted image and the source, from 0 to 1. Above 0.98 the difference is very hard to see; below 0.95 artefacts start to show on photographs. It exists because \"saved 68%\" only tells you the flattering half of the story."
    },
    {
      "question": "Why does nothing happen when I drop a file?",
      "answer": "That is deliberate. Dropping a file only decodes it and puts it in the queue. The conversion — the expensive part — waits for you to press Convert, so you set everything up first instead of racing a preview that keeps restarting."
    },
    {
      "question": "Does resizing lose detail?",
      "answer": "Any big reduction does, but how much depends on the engine. Some browsers reduce in one pass with a 2x2 kernel and throw the rest of the pixels away, which shows up as jagged edges. FormatFlow measures that at startup — it downscales a test pattern and compares it against an exact average — and only falls back to halving the image step by step when the browser needs it. Where the browser already filters properly, the extra passes would cost time and change nothing, so they are skipped. You can also add a sharpening pass on top."
    },
    {
      "question": "Why are my phone photos no longer rotated wrong?",
      "answer": "Because the image is decoded with createImageBitmap and the EXIF orientation applied there, once. The old approach loaded the file into an <img> element, where some browsers apply the orientation tag and others do not, and the canvas ended up with the unrotated frame."
    },
    {
      "question": "How many images can I convert at once?",
      "answer": "Fifty. They are encoded across several background workers at the same time, and each one can carry its own format and size if you switch on the per-image override."
    }
  ],
  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "image converter",
    "convert HEIC to JPG",
    "PNG to WEBP",
    "JPG to AVIF",
    "WEBP to PNG",
    "TIFF to JPG",
    "image to ICO",
    "favicon generator",
    "image to PDF",
    "batch image converter",
    "resize images online",
    "compress images to a target size",
    "offline image converter",
    "free image converter no upload"
  ],
  "footer_seo_title": "A converter that tells you what it did",
  "footer_seo_paragraph1": "FormatFlow converts images between JPG, PNG, WEBP, AVIF, ICO, PDF, TIFF and SVG entirely inside your browser. It reads HEIC from iPhones and TIFF as input, resizes by scale, long edge or exact dimensions, rotates, flips, sets the background colour for formats without transparency, and can hit a maximum file size by searching for the right quality.",
  "footer_seo_paragraph2": "What it will not do is lie to you. Formats your browser cannot encode are shown disabled instead of returning a PNG with the wrong extension, EPS and camera RAW are rejected outright, and every result comes with its weight, its dimensions and an SSIM score of the quality it cost. Nothing is uploaded: the whole pipeline runs on your machine.",
  "seo_title": "FormatFlow | Image Converter with Measured Quality",
  "seo_description": "Convert images to WEBP, AVIF, JPG, PNG, ICO, PDF, TIFF or SVG in your browser. Batch of 50, target file size, real multi-size ICO, HEIC and TIFF input, and an SSIM quality score. Nothing is uploaded."
};
