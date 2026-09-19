export default {
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "resetHint": "Start over",
  "title": "GIFBolt",
  "description": "Pull frames from a video or line up stills, edit the timeline, and encode a GIF with a global palette and inter-frame compression — all in your browser.",
  "tab_video": "Video to GIF",
  "tab_images": "Images to GIF",
  "label_upload_video": "Upload Video",
  "label_upload_images": "Upload Images",
  "label_duration": "Frame Delay (ms)",
  "label_fps": "Frame Rate (FPS)",
  "label_size": "GIF Width",
  "label_quality": "Compression Quality",
  "label_trim": "Trimming Range",
  "label_start": "Start Time",
  "label_end": "End Time",
  "btn_generate": "Generate GIF",
  "btn_generating": "Compiling GIF...",
  "btn_download": "Download GIF",
  "text_progress_extract": "Extracting frames...",
  "text_progress_compile": "Compiling frames...",
  "history_title": "Recent GIF History",
  "no_history": "No GIF history yet.",
  "clear_history": "Clear History",
  "quality_high": "High Quality",
  "quality_medium": "Medium Quality",
  "quality_low": "Low Quality (Fast)",
  "drop_zone_video": "MP4, WebM, MOV, MKV, AVI — or PNG, JPG, WebP, AVIF, GIF, BMP and HEIC stills.",
  "drop_zone_images": "PNG, JPG, WebP, AVIF, GIF, BMP and HEIC. Drop them in the order you want them played.",
  "seo_title": "GIFBolt | Free Online Video to GIF and Image to GIF Converter",
  "seo_description": "Convert video or image sequences into animated GIFs in your browser: editable frame timeline, global palette, Floyd–Steinberg dithering and inter-frame compression. Nothing is uploaded.",
  "seoHeroTitle": "Turn a Video or a Pile of Images Into a GIF, Right in the Browser",
  "seoHeroText": "Pull frames out of a clip, edit the timeline, then encode with a global palette, dithering and inter-frame compression. Nothing is uploaded.",
  "seoHeroList": [
    "Frames stay editable before you encode",
    "One palette across the whole loop",
    "Nothing is uploaded, nothing is downloaded"
  ],
  "seoBrowserSpeedTitle": "A real GIF encoder, not a canvas dump",
  "seoBrowserSpeedText": "Frames are read straight from the decoded video with a high-quality resize, never round-tripped through a JPEG. The palette is built by median cut over the whole animation, the pixels are mapped with serpentine Floyd–Steinberg dithering, and everything a frame shares with the one before it is written as transparent and inherited. The work is split across a pool of web workers, so the page stays responsive and the progress bar tracks real frames.",
  "seoUseCaseTitle": "For bug reports, demos and reaction loops",
  "seoUseCaseText": "Record a bug once and cut it down to the four seconds that matter. Turn a design walkthrough into something that autoplays inside a pull request. Or line up a handful of stills and time them by hand. The timeline stays editable until you press encode.",
  "seoPrivacyTitle": "Nothing is uploaded, and nothing is downloaded either",
  "seoPrivacyText": "Every step runs in this tab: the video decoder is the browser's own, the quantiser and the LZW compressor are JavaScript loaded with the page, and the result is a Blob that never leaves your machine. There is no server to send files to and no model or codec fetched from a CDN. The trade-off is honest: everything is bounded by your RAM, so a 4K clip has to be trimmed and scaled down before it will encode.",
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Is there a file size limit?",
      "answer": "Not a fixed one, but there is a real one: the frames live in your tab's memory. A 480 px, 4-second GIF at 12 fps is around 50 MB of working data and encodes in a couple of seconds; a 4K clip will exhaust the tab long before it finishes. Trim the range and lower the working size — that is what those controls are for."
    },
    {
      "question": "Why is my GIF still so big?",
      "answer": "GIF is a format from 1987: 256 colours and no motion compensation. Cut the width first, then the frame rate, then the palette. Leaving “reuse unchanged pixels” on is usually worth more than all three — on a screen recording it removes most of the file."
    },
    {
      "question": "Why is the frame rate not exactly what I picked?",
      "answer": "GIF stores each delay in hundredths of a second, so only rates of the form 100/n exist. Asking for 12 fps really means 8 hundredths per frame, which is 12.5. The panel shows the rate you will actually get, not the one you asked for."
    },
    {
      "question": "Which formats can I feed it?",
      "answer": "Any video the browser can play — MP4/H.264, WebM, MOV and often MKV — plus PNG, JPG, WebP, AVIF, GIF, BMP and iPhone HEIC for stills. An animated GIF dropped in as a still contributes its first frame only."
    },
    {
      "question": "Does anything get uploaded?",
      "answer": "No. There is no upload step and no external request: the encoder ships with the page and runs in web workers inside this tab."
    },
    {
      "question": "Can I keep transparency?",
      "answer": "Yes, with the “keep transparency” switch. GIF supports exactly one fully transparent colour, so soft edges become hard ones. It cannot be combined with pixel reuse, because both need that same transparent slot."
    }
  ],
  "footerTagline": "Free, private, and customizable client-side GIF creator tools.",
  "footerCredit": "Part of the oLoveTools suite",
  "badge": "Video & stills → GIF",
  "dropTitle": "Drop a video or a set of images",
  "dropHintNothing": "Dropping a file starts nothing: you choose the settings and press the button.",
  "modeAuto": "Pull a range",
  "modeManual": "Pick frames by hand",
  "manualHint": "Scrub the video and add exactly the frames you want. No automatic pass runs at all.",
  "btnCapture": "Capture this frame",
  "labelWorkingSize": "Working size",
  "extractSummary": "{0} frames at {1}×{2}. The GIF can only be scaled down from here.",
  "btnExtract": "Pull the frames",
  "btnExtractAgain": "Pull these frames again",
  "waitingHint": "Set the range and press the button. Nothing runs until you do.",
  "btnPlay": "Play",
  "btnPause": "Pause",
  "btnPrevFrame": "Previous frame",
  "btnNextFrame": "Next frame",
  "btnUndo": "Undo",
  "btnRedo": "Redo",
  "frameSummary": "{0} frames · {1} fps real",
  "btnSelectAll": "Select all",
  "btnSelectNone": "Deselect",
  "btnDeleteSelected": "Delete {0}",
  "btnKeepSelected": "Keep only these",
  "btnReverse": "Reverse",
  "btnPingPong": "Ping-pong",
  "btnHalve": "Drop every other",
  "btnAddImages": "Add stills",
  "btnResetDelays": "Reset the timing",
  "delayHint": "GIF stores delays in hundredths of a second, so the value snaps to the nearest 10 ms and never goes below 20.",
  "outputTitle": "Output",
  "qualityCustom": "Custom",
  "labelDiff": "Reuse unchanged pixels",
  "diffHint": "Writes only what moved between frames. The single biggest saving on screen recordings.",
  "showAdvanced": "Fine-tune it",
  "hideAdvanced": "Hide the fine print",
  "labelColors": "Palette size",
  "labelDither": "Dithering",
  "ditherHint": "Trades a little noise for the banding a flat palette leaves on gradients.",
  "labelDitherStrength": "Dither strength",
  "labelTolerance": "Pixel tolerance",
  "labelAlpha": "Keep transparency",
  "alphaHint": "Carries transparent pixels over as GIF's 1-bit alpha. Cannot be combined with pixel reuse.",
  "labelBackground": "Background",
  "labelFit": "When the shapes disagree",
  "fitContain": "Fit with margins",
  "fitCover": "Fill and crop",
  "fitStretch": "Stretch",
  "labelLoop": "Loop forever",
  "loopHint": "Turn it off to play a fixed number of times and stop on the last frame.",
  "labelLoopCount": "Plays",
  "btnCancel": "Cancel",
  "phaseRaster": "Preparing frames…",
  "phasePalette": "Building the palette…",
  "resultTitle": "Result",
  "statSize": "Weight",
  "statFrames": "Frames",
  "statSizePx": "Size",
  "statColors": "Colours",
  "statReuse": "Pixels reused",
  "statTime": "Encoded in",
  "statFps": "Real frame rate",
  "statPerFrame": "Per frame",
  "btnCopy": "Copy",
  "dismissLabel": "Dismiss",
  "errorVideo": "This browser cannot decode that video. Try MP4 (H.264) or WebM.",
  "errorImages": "At least one of those images could not be decoded.",
  "errorExtract": "The frames could not be read. The video may use a codec this browser only half-supports.",
  "errorEncode": "The encode failed. Try fewer frames or a smaller width.",
  "errorClipboard": "Your browser blocked the clipboard. Download it instead.",
  "errorTooManyFrames": "Stopped at {0} frames — past that a GIF is not the right format.",
  "stageSource": "Source frame",
  "stageResult": "Encoded GIF",
  "stageHint": "Wheel zooms to the cursor, drag pans.",
  "stageHintCompare": "Wheel zooms to the cursor, drag pans. Hold Alt or the right button to see the source under the GIF.",
  "zoomIn": "Zoom in",
  "zoomOut": "Zoom out",
  "zoomReset": "Reset the view",
  "stripHint": "Drag across the strip to select frames. Hold Alt or use the right button to deselect.",
  "shortcutsTitle": "Shortcuts",
  "shortcuts": [
    {
      "keys": "Space",
      "label": "play / pause"
    },
    {
      "keys": "← →",
      "label": "step a frame"
    },
    {
      "keys": "Del",
      "label": "delete the selection"
    },
    {
      "keys": "A / D",
      "label": "select all / none"
    },
    {
      "keys": "Ctrl+Z",
      "label": "undo"
    },
    {
      "keys": "Enter",
      "label": "encode"
    }
  ],
  "nextStepTitle": "Keep going",
  "nextStepHint": "Sends the frame on screen as a PNG — no re-upload",
  "nextCrop": "Crop it",
  "nextCompress": "Compress it",
  "nextCutout": "Cut the background",
  "nextWatermark": "Add a watermark",
  "nextMeme": "Make a meme",
  "howItWorksTitle": "How it works",
  "step1Title": "Drop it in",
  "step1Text": "A video or a pile of stills. Nothing is uploaded and nothing starts running on its own.",
  "step2Title": "Choose the range",
  "step2Text": "Set the in and out points and the frame rate, then pull the frames — or grab them one at a time by hand.",
  "step3Title": "Edit the timeline",
  "step3Text": "Delete frames, reverse them, hold one longer, and dial in colours and dithering.",
  "step4Title": "Encode and check",
  "step4Text": "Hold Alt over the preview to compare the GIF against the source, then download it or send it on.",
  "features": [
    {
      "title": "One palette for the whole clip",
      "text": "The colours are chosen by median cut across every frame at once, so nothing shifts hue halfway through the loop."
    },
    {
      "title": "Only what moved gets written",
      "text": "Pixels a frame shares with the one before it are inherited instead of re-encoded. On a screen recording that is most of the file."
    },
    {
      "title": "Dithering that kills banding",
      "text": "Serpentine Floyd–Steinberg diffusion, with the strength on a slider, so gradients stay smooth even at 64 colours."
    },
    {
      "title": "An editable timeline",
      "text": "Delete frames, reverse the run, make it a palindrome, hold a single frame longer. Undo costs nothing: it stores ids, not bitmaps."
    },
    {
      "title": "Encoded across your cores",
      "text": "The animation is split over a pool of web workers, so the tab stays usable and the progress bar tracks real frames."
    },
    {
      "title": "Nothing leaves the tab",
      "text": "The decoder, the palette and the compressor are all JavaScript running on your machine. No upload, no model fetched from a CDN."
    },
    {
      "title": "Chained with the suite",
      "text": "Hand the frame on screen straight to crop, compress or the background remover without downloading it first."
    }
  ],
  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "video to gif",
    "gif maker",
    "images to gif",
    "mp4 to gif",
    "gif compressor",
    "animated gif",
    "free gif converter",
    "gif editor"
  ]
};
