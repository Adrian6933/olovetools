export default {
  "resetHint": "Start over",
  "title": "FrameSnap",
  "seo_title": "FrameSnap | Extract Frames From Video Online",
  "seoHeroTitle": "Extract the perfect frame from any video",
  "seoPrivacyTitle": "100% Private & Secure",
  "seoPrivacyText": "Your video stays on your device. There are no uploads, no databases and no tracking — the file lives only in local memory and disappears when you close the tab.",
  "faqTitle": "Frequently Asked Questions",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "ui_drop": "Drag & drop a video or click to upload",
  "ui_capture": "Capture frame",
  "ui_copy": "Copy",
  "ui_speed": "Speed",
  "ui_quality": "Quality",
  "ui_frame": "Frame",
  "ui_captured": "Captured frames",
  "ui_downloadAll": "Download all (ZIP)",
  "ui_download": "Download",
  "ui_clear": "Clear video",
  "ui_fullscreen": "Fullscreen",
  "heroBadge": "Frame extractor",
  "ui_formats": "MP4 · WebM · MOV and anything else your browser can decode — the file never leaves your device",
  "ui_hint": "← / → step one frame · Space play/pause · S capture · C copy · F fullscreen · Alt compare · Esc stop",
  "ui_empty": "Land on the frame you want and press Capture — or take a whole run from the Batch tab.",
  "tabSingle": "Single frame",
  "tabBatch": "Batch",
  "tabScenes": "Scene cuts",
  "actionPrev": "Previous frame",
  "actionNext": "Next frame",
  "actionPlay": "Play / pause",
  "actionCompare": "Hold to compare with the last capture (or hold Alt)",
  "compareBadge": "last capture",
  "actionStop": "Stop",
  "actionRunBatch": "Extract",
  "actionScan": "Scan for cuts",
  "actionGrabScenes": "Grab them",
  "actionClearFrames": "Clear the gallery",
  "actionRemove": "Remove",
  "labelFormat": "Format",
  "labelScale": "Scale",
  "labelHeld": "In memory",
  "labelMode": "Pick by",
  "labelInterval": "Seconds",
  "labelCount": "How many",
  "labelFrom": "From (s)",
  "labelTo": "To (s, 0 = end)",
  "labelStep": "Sample every (s)",
  "labelThreshold": "Cut above",
  "modeInterval": "Every N seconds",
  "modeCount": "N evenly spaced",
  "modeEveryFrame": "Every frame",
  "batchPlan": "{n} frames will be grabbed.",
  "scanResult": "{cuts} cuts out of {samples} samples, in {ms} ms.",
  "fpsUnknown": "fps unknown",
  "fpsMeasured": "measured",
  "fpsGuess": "not measured",
  "noRvfc": "This browser has no per-frame callback: stepping falls back to seeking.",
  "errorNotVideo": "That does not look like a video file.",
  "warnCodec": "Trying {name} — the browser may not have this codec.",
  "errorDecode": "The browser could not decode this video.",
  "errorClipboard": "This browser will not let the page write images to the clipboard.",
  "warnMemory": "The gallery is holding {size}. Download and clear it before it gets heavy.",
  "toastBatchStopped": "Stopped. The frames grabbed so far are in the gallery.",
  "handoffReceived": "Received from {tool}.",
  "nextStepTitle": "Keep going",
  "nextStepHint": "The frame travels with you — no download, no re-upload",
  "nextCrop": "Crop it",
  "nextCompress": "Compress it",
  "nextCutout": "Cut out the subject",
  "nextMeme": "Add a caption",
  "nextWatermark": "Watermark it",
  "seo_description": "Extract exact frames from a video in your browser. The frame rate is measured, not guessed, every capture waits for the frame to be on screen, and batch extraction and scene-cut detection come as standard. Nothing is uploaded.",
  "seoHeroText": "The frame rate is measured from the video itself and every capture waits for the frame to actually be on screen, so the still you save is the still you were looking at.",
  "heroText": "Step one true frame at a time, take a whole run at an interval, or let the difference graph find the cuts for you. Everything decodes in this tab and the file never goes anywhere.",
  "seoHeroList": [
    "Measured frame rate",
    "Capture waits for the frame",
    "Batch and scene cuts",
    "Nothing leaves your device"
  ],
  "seoSecondaryTitle": "The frame you saw, not the one before it",
  "howItWorksTitle": "How it works",
  "step1Title": "Drop a video",
  "step1Text": "Anything the browser can decode. The size, the resolution and the real frame rate are read off the file itself — the fps box is gone because it was a guess.",
  "step2Title": "Land on the frame",
  "step2Text": "Arrow keys step whole frames and each step waits for the picture to change. Zoom with the wheel to check focus, and hold Alt to compare against your last capture.",
  "step3Title": "Or take a whole run",
  "step3Text": "Every N seconds, N evenly spaced, or every frame of a range. The scene scanner draws the difference between samples so you can move the threshold instead of trusting it.",
  "step4Title": "Export",
  "step4Text": "PNG, JPG or WebP, at full size or scaled down, one at a time or as a ZIP. The gallery tells you how much memory it is holding, and hands a frame straight to the next tool.",
  "features": [
    {
      "title": "The capture waits for the frame",
      "text": "Seeking is asynchronous, so drawing the video straight after moving grabs whatever was on screen before — usually the previous frame. Every capture here awaits the frame that is actually presented."
    },
    {
      "title": "The frame rate is measured",
      "text": "requestVideoFrameCallback reports the presentation time of each frame, so the rate comes from the video instead of a box you had to fill in. Common rates snap, but 23.976 stays 23.976."
    },
    {
      "title": "Batch extraction",
      "text": "Every N seconds, N evenly spaced across a range, or every frame between two points. It shows how many it will take before it starts, and stops the moment you ask."
    },
    {
      "title": "Scene-cut detection",
      "text": "A luma difference between downscaled samples, plotted as a graph you can click. The threshold is a number you control, not a hidden verdict."
    },
    {
      "title": "Zoom to the cursor",
      "text": "Wheel-zoom up to 12×, drag to pan, double-click to reset — for checking focus or reading small text before you commit to a still."
    },
    {
      "title": "Memory you can see",
      "text": "Full-size blobs add up fast, so the strip shows thumbnails, every frame reports its own weight, and the total warns you before the tab gets heavy."
    },
    {
      "title": "Nothing is uploaded",
      "text": "The video is decoded by the browser from a local object URL. No server, no queue, no telemetry on what you are working with."
    },
    {
      "title": "Hands off to the rest of the suite",
      "text": "Send a frame straight to CropSnap, CompressSnap, the background remover or MemeBolt without downloading and re-uploading it."
    }
  ],
  "seoBrowserSpeedTitle": "Decoded by the browser you already have",
  "seoBrowserSpeedText": "The video is played from a local object URL and the frames are drawn to a canvas, so extraction runs at the speed of your own decoder with no encoding queue in front of it. Nothing is uploaded, nothing waits on a server, and closing the tab is all it takes to be rid of the file.",
  "seoUseCaseTitle": "Thumbnails, evidence, reference, proof",
  "seoUseCaseText": "Pulling the cleanest still for a thumbnail, catching the exact frame where a bug appears, collecting reference for a design, or documenting what happened at 00:04:11 — all of them need the frame you were looking at, not the one before it. With the rate measured and the seek awaited, the frame number on screen is the frame number in the file, and stepping back and forth lands on the same picture every time.",
  "seoKeywords": [
    "video frame extractor",
    "extract frame from video",
    "video to image",
    "frame by frame",
    "video screenshot",
    "scene detection",
    "batch frame export",
    "save video still"
  ],
  "faq": [
    {
      "question": "Is my video uploaded anywhere?",
      "answer": "No. The browser decodes it from a local object URL and the frames are drawn to a canvas in the same tab. There is no server component, and the file is gone when you close the page."
    },
    {
      "question": "How does it know the frame rate?",
      "answer": "It measures it. The video plays muted for a fraction of a second while requestVideoFrameCallback reports the presentation time of each frame, and the median gap becomes the rate. Where the browser does not provide that callback the tool says so instead of pretending."
    },
    {
      "question": "Why is stepping slower than it used to be?",
      "answer": "Because each step now waits for the new frame to be presented before it says it has moved. That wait is the difference between saving the frame you are looking at and saving the previous one."
    },
    {
      "question": "Can I extract many frames at once?",
      "answer": "Yes. The batch tab takes one every N seconds, N evenly spaced across a range, or every frame between two points, up to 500 at a time. It tells you the count before it starts and stops as soon as you press Stop or Escape."
    },
    {
      "question": "What does scene detection actually measure?",
      "answer": "The mean absolute luma difference between consecutive samples taken at a 64-pixel-wide downscale. Everything is plotted, so you can see how far each sample sits from your threshold and move the threshold rather than trust a hidden score."
    },
    {
      "question": "In what quality are frames exported?",
      "answer": "At the video’s native resolution by default, as lossless PNG or as JPG/WebP with a quality slider. You can also export at 50% or 25% when you need a contact sheet rather than a master."
    }
  ],
  "seoKeywordsTitle": "Related searches",
  "footerTagline": "Exact frames out of any video, measured and local.",
  "footer_seo_title": "Why \"one frame back\" is harder than it looks",
  "footer_seo_paragraph1": "An HTML video element has no notion of a frame. It has a current time in seconds, and setting it starts an asynchronous seek that finishes whenever the decoder gets there. Almost every browser-based frame grabber therefore does two hopeful things: it divides one second by a frame rate the user typed into a box, and it draws the video onto a canvas the instant after moving. Both are wrong in the same direction. If the real rate is 23.976 and the box says 24, the position drifts by a whole frame every forty-two seconds; and if the seek has not landed yet, the canvas receives the frame that was on screen before the move. This tool removes both guesses: requestVideoFrameCallback reports the presentation timestamp of each frame that the compositor actually shows, which makes the rate measurable and makes it possible to wait for a specific frame rather than hope for it.",
  "footer_seo_paragraph2": "The same awaited seek is what makes the rest possible. A batch run is a loop of seek-and-wait, so asking for one frame every two seconds actually returns frames two seconds apart rather than whatever the decoder happened to have ready. Scene detection is the same loop with a comparison in the middle: each sample is downscaled to 64 pixels wide and compared to the previous one by mean absolute luma difference, and every score is plotted so the threshold is something you argue with rather than something the tool decides for you. What is left is bookkeeping, and it matters more than it sounds: a dozen 4K PNGs is half a gigabyte of live blobs, so the gallery shows thumbnails, each capture reports its own size, and the running total says when it is time to download and clear. All of it in the tab, on a file that never moves.",
  "ui_stepRate": "Step rate",
  "ui_stepRateHint": "How far each press moves. At the video rate you get every frame; lower rates jump several at a time.",
  "stepRateNative": "every frame",
  "zoomIn": "Zoom in",
  "zoomOut": "Zoom out",
  "zoomReset": "Fit to the frame",
  "zoomActual": "Actual pixels (1:1)",
  "zoomCloser": "Get much closer"
};
