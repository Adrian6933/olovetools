export default {
  "resetHint": "Start over",
  "title": "CleanSnap",
  "seo_title": "CleanSnap | Remove watermarks and objects from photos",
  "seo_description": "Paint over a watermark, a logo or an unwanted object and CleanSnap rebuilds what was behind it by copying patches from the photo itself. Runs in your browser, with a progress bar you can cancel. Nothing is uploaded.",
  "seoHeroTitle": "CleanSnap",
  "seoHeroText": "Paint over what you want gone and the gap is rebuilt from the rest of the photo — texture and edges included, not just a smudge.",
  "seoBrowserSpeedTitle": "The work happens in a background thread",
  "seoBrowserSpeedText": "Rebuilding a gap means scanning the photo for matching patches, which is genuinely heavy. It runs in a Web Worker with a real progress bar and a cancel button, so the page never freezes while it works.",
  "seoUseCaseTitle": "Four fills, and each says what it does",
  "seoUseCaseText": "Two of them rebuild: patches for texture and detail, diffusion for skies and flat walls. Two of them only hide: blur and pixelate. They are in separate groups because covering something up is not the same as removing it.",
  "seoPrivacyTitle": "The photo never leaves your device",
  "seoPrivacyText": "No upload, no account, no model download. The image is decoded, edited and exported inside your browser, and once the page has loaded it works with no connection at all.",
  "hero": {
    "badge": "Runs in your browser",
    "title": "Paint over what you want gone.",
    "titleHighlight": "The rest of the photo fills it in.",
    "subtitle": "CleanSnap rebuilds the gap by copying patches from the picture itself, so texture and edges carry on across it. Nothing is uploaded, and nothing starts until you press the button.",
    "trust1": "No upload, no account",
    "trust2": "Full resolution",
    "trust3": "Cancel any time"
  },
  "ui": {
    "dropTitle": "Drop a photo here",
    "dropHint": "Or click to choose one. You can also paste from the clipboard.",
    "reading": "Reading the image…",
    "newImage": "New image",
    "scaledNote": "Working at a reduced size — the file was {w}×{h}",
    "shortcuts": "B/R/C/E tools · [ ] brush · Space to peek · Enter to apply",
    "brush": "Brush",
    "rect": "Rectangle",
    "circle": "Ellipse",
    "eraser": "Unpaint",
    "pan": "Pan",
    "size": "Size",
    "invert": "Invert",
    "clearSel": "Clear",
    "apply": "Fill the selection",
    "cancel": "Cancel",
    "undo": "Undo",
    "redo": "Redo",
    "reset": "Reset",
    "download": "Download",
    "quality": "Quality",
    "output": "Output",
    "tookMs": "{ms} ms",
    "stageOriginal": "Original",
    "stageCurrent": "Working copy",
    "stageHint": "Scroll to zoom · drag with H to pan · hold Space or right-click for the original",
    "zoomIn": "Zoom in",
    "zoomOut": "Zoom out",
    "fit": "Fit",
    "dismiss": "Dismiss",
    "errors": {
      "decode": "That file could not be opened as an image.",
      "nomask": "Paint over something first — there is no selection to fill."
    },
    "fill": {
      "rebuildTitle": "Rebuild what was there",
      "hideTitle": "Just hide it",
      "hideNote": "These two do not remove anything: they cover it. Useful for a face or a licence plate, useless for a watermark you want gone.",
      "methods": {
        "patch": "Patches",
        "smooth": "Smooth",
        "blur": "Blur",
        "pixelate": "Pixelate"
      },
      "methodHints": {
        "patch": "Copies matching pieces from elsewhere in the photo and works inwards, edges first. The only one that brings texture back.",
        "smooth": "Spreads the surrounding colours into the gap. Perfect for a sky or a plain wall, a smudge on anything with detail.",
        "blur": "Averages the surroundings over the selection. It hides, it does not rebuild.",
        "pixelate": "Replaces the selection with blocks. It hides, it does not rebuild."
      },
      "patchSize": "Patch size",
      "patchSizeHint": "Small follows fine detail; large copies more coherent texture. 9 px suits most watermarks.",
      "searchRadius": "Search radius",
      "searchRadiusHint": "How far around the gap to look for matching pieces. Wider is slower and rarely better — the right patch is usually next door.",
      "strength": "Strength",
      "grow": "Grow selection",
      "growHint": "Watermarks carry a soft halo you cannot see while painting. Two extra pixels usually catch it.",
      "feather": "Soften the seam",
      "featherHint": "Blends the boundary so the repair does not show as a one-pixel step."
    }
  },
  "next": {
    "nextStepTitle": "Keep going",
    "nextStepHint": "The clean photo travels with you — no re-upload",
    "nextCrop": "Crop it",
    "nextWatermark": "Add your watermark",
    "nextCompress": "Compress it",
    "nextFormat": "Change format",
    "nextExif": "Strip metadata"
  },
  "how": {
    "title": "How it works",
    "subtitle": "Three steps, and the heavy one waits for you.",
    "steps": [
      {
        "title": "Open the photo",
        "text": "It is decoded once and stays at full resolution. Nothing is changed and nothing leaves your device."
      },
      {
        "title": "Paint over the thing",
        "text": "Brush, rectangle or ellipse. Zoom in as far as you need — the selection is stored at the photo’s real size, not the preview’s."
      },
      {
        "title": "Fill it",
        "text": "Pick a method and press the button. You get a progress bar, a cancel button and the time it took."
      }
    ]
  },
  "features": {
    "title": "What changed under the hood",
    "items": [
      {
        "title": "Patches, not a smudge",
        "desc": "The gap is filled by copying pieces from elsewhere in the same photo, so brick stays brick and grass stays grass. Diffusion alone can only ever produce the smoothest surface that fits the edges."
      },
      {
        "title": "Edges carry on",
        "desc": "The fill order is decided by how much structure crosses each point of the boundary, so a line or a horizon enters the gap first and continues straight instead of being cut off."
      },
      {
        "title": "Off the main thread",
        "desc": "The work runs in a Web Worker in timed slices, so the progress bar moves, the page stays usable and Cancel actually stops it mid-way."
      },
      {
        "title": "The selection is yours to shape",
        "desc": "Grow it, shrink it, invert it, soften its seam — and re-run with a different method on the same selection without repainting a thing."
      },
      {
        "title": "Nothing is uploaded",
        "desc": "Decoding, editing and exporting all happen in your browser. No account, no model to download, and it works offline."
      },
      {
        "title": "Undo that costs kilobytes",
        "desc": "Only the rectangle that changed is stored, not the whole frame — so forty steps of history fit in the space one used to take."
      }
    ]
  },
  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Is my photo uploaded anywhere?",
      "answer": "No. It is decoded, edited and exported inside your browser using canvas and a Web Worker. Nothing is sent to a server, there is no account, and once the page has loaded it works with no connection at all."
    },
    {
      "question": "Is there an AI model behind this?",
      "answer": "No, and it no longer claims there is. The earlier version offered an \"AI mode\" that ran exactly the same diffusion as the normal one, just with more iterations. What is here instead is patch propagation: the gap is filled by copying real pieces of your own photo. No neural network, no download, and it is honest about what it does."
    },
    {
      "question": "Why does the result sometimes still look wrong?",
      "answer": "Because the fill can only use what is already in the picture. If the thing you removed covered something unique — a face, text, a one-off object — there is nothing to copy it from, and the result is a plausible texture rather than the truth. It works best on repeating backgrounds: sky, walls, foliage, pavement, water."
    },
    {
      "question": "What should I use each fill for?",
      "answer": "Patches for anything with texture or structure. Smooth for skies, plain walls and gradients, where it is both faster and better. Blur and pixelate do not remove anything at all — they cover it — which is what you want for a face or a plate and not what you want for a watermark."
    },
    {
      "question": "The selection looks right but a faint outline is left. Why?",
      "answer": "Watermarks are usually semi-transparent and have a soft halo a few pixels wide that is easy to miss while painting. Raise \"Grow selection\" by two or three pixels so the halo is inside the gap and gets rebuilt too."
    },
    {
      "question": "Can I stop a fill that is taking too long?",
      "answer": "Yes. Rebuilding scans the photo for matching patches, so a big selection genuinely takes time. The work is split into short slices in a background thread, which is what lets the progress bar move and the Cancel button take effect part-way through rather than only at the end."
    },
    {
      "question": "Does it shrink my photo?",
      "answer": "Only past about 24 megapixels, and when it does it says so on screen with the original dimensions. The previous version quietly capped every image at 1920 pixels, so you downloaded something smaller than you uploaded without ever being told."
    },
    {
      "question": "Which formats can I open and save?",
      "answer": "It opens JPG, PNG, WebP, AVIF, GIF and the HEIC that iPhones produce. It saves as PNG, JPG or WebP, with a quality slider for the two lossy ones — the old version always wrote PNG, which turned a small JPEG into a much bigger file."
    }
  ],
  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "remove watermark from photo",
    "watermark remover",
    "remove object from photo",
    "inpainting online",
    "content aware fill online",
    "erase objects from pictures",
    "remove logo from image",
    "remove text from photo",
    "photo retouch in browser",
    "free watermark remover no upload",
    "remove people from photos",
    "clone stamp online"
  ],
  "footer_seo_title": "A repair tool that shows its work",
  "footer_seo_paragraph1": "CleanSnap removes watermarks, logos, timestamps and unwanted objects from photos entirely inside your browser. You paint over what you want gone with a brush, a rectangle or an ellipse, zooming in as far as you like, and the gap is rebuilt by copying matching pieces from elsewhere in the same picture — filling edges and lines first so structure continues across the hole instead of stopping at it.",
  "footer_seo_paragraph2": "It also refuses to oversell itself. There is no AI model and no \"smart mode\" that is secretly the same code twice; blur and pixelate sit in their own group because they hide rather than remove; the image keeps its resolution and says so when it cannot; and the fill runs in a background thread with a progress bar you can cancel. Nothing is uploaded at any point.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "footerTagline": "Remove watermarks and unwanted objects from photos by painting over them. The gap is rebuilt from the picture itself, entirely in your browser."
};
