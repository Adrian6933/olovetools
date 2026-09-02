export default {
  "resetHint": "Start over",
  "title": "DrawSnap",
  "badge": "Drawing board & tracer",
  "description": "A drawing board with pressure-aware ink, real vector export and a tracer that turns any picture into strokes you can edit. Everything runs in your browser.",
  "btn_clear": "Clear board",
  "btn_undo": "Undo",
  "btn_redo": "Redo",
  "btn_copy": "Copy",
  "btn_download_png": "Download PNG",
  "btn_download_svg": "Download SVG",
  "label_tools": "Drawing tools",
  "label_brush_size": "Size",
  "label_color": "Colour",
  "label_opacity": "Opacity",
  "label_shapes": "Shapes",
  "label_fill": "Fill shapes",
  "label_grid": "Grid background",
  "label_paper": "Paper",
  "tool_select": "Select",
  "tool_pencil": "Pencil",
  "tool_marker": "Marker",
  "tool_eraser": "Eraser",
  "tool_line": "Line",
  "tool_arrow": "Arrow",
  "tool_rect": "Rectangle",
  "tool_circle": "Ellipse",
  "tool_triangle": "Triangle",
  "tool_text": "Text",
  "patternDots": "Dots",
  "patternGrid": "Grid",
  "patternLines": "Lines",
  "patternNone": "Plain",
  "eraserMode": "Eraser mode",
  "eraserPixel": "Ink",
  "eraserObject": "Whole stroke",
  "importBtn": "Add image",
  "zoomIn": "Zoom in",
  "zoomOut": "Zoom out",
  "zoomFit": "Fit to screen",
  "shapeCount": "Shapes: {n}",
  "selectionCount": "Selected: {n}",
  "duplicate": "Duplicate",
  "bringFront": "Bring to front",
  "deleteSelected": "Delete",
  "clearSelection": "Clear selection",
  "textPlaceholder": "Type…",
  "emptyHint": "Draw straight away, or drop an image to trace it.",
  "compareOn": "Showing the picture only",
  "panHint": "Space to pan",
  "altHint": "Alt = erase",
  "exportBgBoard": "Board background",
  "exportBgTransparent": "Transparent",
  "exportBgLight": "White",
  "exportGrid": "Include grid",
  "exportedPng": "PNG exported at {w} × {h}",
  "exportedSvg": "SVG exported · {n} vector shapes",
  "copied": "Copied to the clipboard",
  "copyFailed": "Your browser blocked the clipboard. Use the PNG button instead.",
  "restoreFound": "A board with {n} shapes was saved in this browser.",
  "restoreBtn": "Restore it",
  "restoreDismiss": "Start blank",
  "errorUnsupported": "That file could not be decoded as an image.",
  "scrollTopLabel": "Back to top",
  "shortcutsTitle": "Keyboard shortcuts",
  "shortcuts": [
    { "keys": "V / P / B / E", "label": "Select · Pencil · Marker · Eraser" },
    { "keys": "L / A / R / O / G / T", "label": "Line · Arrow · Rectangle · Ellipse · Triangle · Text" },
    { "keys": "Alt / right drag", "label": "Erase without changing tool" },
    { "keys": "Space + drag", "label": "Pan the board" },
    { "keys": "Ctrl + wheel", "label": "Zoom at the cursor" },
    { "keys": "Shift", "label": "Square, circle and 45° lines" },
    { "keys": "H (hold)", "label": "Show the picture without your strokes" },
    { "keys": "[ / ]", "label": "Brush size" },
    { "keys": "Ctrl+Z / Ctrl+Shift+Z", "label": "Undo · Redo" },
    { "keys": "Ctrl+D / Del", "label": "Duplicate · delete the selection" },
    { "keys": "Ctrl+0", "label": "Fit the board to the screen" },
    { "keys": "Ctrl+V", "label": "Paste an image" }
  ],
  "importedFrom": "Handed over by {tool} — nothing has been added to the board yet.",
  "importWaiting": "Nothing has run yet. Choose how it should land on the board.",
  "discard": "Discard",
  "traceTitle": "Trace it into editable strokes",
  "traceLow": "Rough",
  "traceMedium": "Balanced",
  "traceHigh": "Detailed",
  "traceSampleColor": "Take colours from the photo",
  "traceKeepPhoto": "Keep the photo underneath",
  "traceHint": "Contours are turned into ordinary pencil strokes: every line can be moved, recoloured, erased or undone on its own.",
  "traceBtn": "Trace into strokes",
  "traceRunning": "Tracing…",
  "traceDone": "{n} editable strokes in {ms} ms{thread}",
  "traceWorker": "worker thread",
  "traceFailed": "Tracing failed. You can still place the picture and draw over it.",
  "placeBtn": "Just place it",
  "placeHint": "Drop it on the board as-is and draw over it yourself.",
  "nextStepTitle": "Keep going",
  "nextStepHint": "Your drawing travels with you — no re-upload",
  "nextCompress": "Compress it",
  "nextCrop": "Crop it",
  "nextFormat": "Change format",
  "nextWatermark": "Add a watermark",
  "nextMeme": "Make a meme",
  "howItWorksTitle": "How it works",
  "step1Title": "Start on the paper you want",
  "step1Text": "Dot grid, squares, lines or plain, on a dark, light or transparent board of any size.",
  "step2Title": "Drop a picture — or skip this",
  "step2Text": "Drag, paste or receive an image from another tool. Nothing runs until you ask for it.",
  "step3Title": "Trace it into strokes",
  "step3Text": "Contours become ordinary pencil strokes you can move, recolour and undo one by one.",
  "step4Title": "Draw and correct by hand",
  "step4Text": "Pressure-aware brush, Alt to erase, Shift to constrain, zoom straight at the cursor.",
  "step5Title": "Export or keep going",
  "step5Text": "PNG up to 4×, a real vector SVG, or send the board straight to the next tool.",
  "features": [
    {
      "title": "Ink that reacts to your hand",
      "text": "Pen pressure — or stroke speed on a mouse — drives the width of every line, and the browser's coalesced samples keep fast strokes smooth instead of angular."
    },
    {
      "title": "Vector all the way to the file",
      "text": "The SVG you download is the geometry you drew, erasers included as real masks, so it opens cleanly in Figma or Illustrator."
    },
    {
      "title": "Turn a photo into strokes",
      "text": "A local contour tracer pulls the shapes out of any picture and hands them back as editable lines, not a flattened bitmap."
    },
    {
      "title": "Edit objects, not pixels",
      "text": "Select, move, resize, duplicate, restack and recolour anything already on the board, at any point."
    },
    {
      "title": "Chained with the rest of the suite",
      "text": "Send the board to compress, crop, convert or watermark it without downloading and uploading anything."
    },
    {
      "title": "Nothing leaves the tab",
      "text": "No account, no upload, no server. Your board is saved in your own browser and restored only if you ask."
    }
  ],
  "seo_title": "DrawSnap | Free Online Drawing Board, Whiteboard & Photo Tracer",
  "seo_description": "Draw online with pressure-aware ink, trace any photo into editable vector strokes, and export PNG up to 4× or a real SVG. Free, private and entirely client-side.",
  "seoHeroTitle": "Draw, trace and export without leaving your browser",
  "seoHeroText": "A full drawing board with pressure-aware ink, object-level editing, zoom and pan, autosave, and a tracer that converts any picture into strokes you can edit. DrawSnap runs 100% locally in your browser tab.",
  "seoHeroList": [
    "Pressure- and speed-aware strokes with pencil, marker and two kinds of eraser",
    "Shapes, arrows and text with Shift constraints and object selection",
    "PNG at 1×, 2× or 4× with a transparent, dark or white background",
    "True vector SVG where erasing is a mask, not a painted-over line",
    "Photo tracing into editable strokes, run only when you press the button",
    "Autosaved in your browser — nothing is ever uploaded"
  ],
  "seoBrowserSpeedTitle": "A canvas pipeline built for real drawing",
  "seoBrowserSpeedText": "Strokes are stored as geometry in a board-sized document, not as screen pixels, so resizing the window never clips your work and the export resolution is a deliberate choice rather than whatever the container happened to measure. Committed artwork lives on a cached layer, so the cost of a stroke does not grow with the number of shapes already on the board, and the paper is painted separately from the ink — which is why the eraser removes ink without punching holes through the grid.",
  "seoSecondaryTitle": "From a photograph to lines you can edit",
  "seoUseCaseTitle": "Perfect for teachers, designers and quick brainstorms",
  "seoUseCaseText": "Sketch a wireframe, annotate a screenshot, explain a formula, or drop in a photograph and let the tracer turn it into line art you can clean up by hand. Because the tracer returns the contours themselves instead of a flattened image, every line stays selectable, movable and recolourable afterwards.",
  "seoPrivacyTitle": "No accounts, no tracking, 100% client-side",
  "seoPrivacyText": "Nothing you draw or import is uploaded anywhere: the board, the tracer and the exporters all run inside your browser tab, and the tracer uses a worker thread on your own machine rather than a remote service. Your work is kept in this browser's local storage so a closed tab no longer loses it, and clearing the board removes that copy as well.",
  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "online drawing board",
    "free digital whiteboard",
    "draw in the browser",
    "photo to line art",
    "image to SVG tracer",
    "vector sketch tool",
    "transparent PNG drawing",
    "sketch and annotate online"
  ],
  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Can I import a picture and draw on top of it?",
      "answer": "Yes. Drag a file onto the board, paste one with Ctrl+V, or send one over from another oLoveTools tool. The picture waits in a staging panel: you choose whether to simply place it or to trace it, and nothing is added to the board until you press a button."
    },
    {
      "question": "What does 'trace into strokes' actually do?",
      "answer": "It reads the picture's luminance and follows the contours at several levels, then simplifies each contour into an ordinary pencil stroke. The result is editable line art: you can move, recolour, thin out or delete each line, and undo the whole trace in one step. It runs on a worker thread on your own machine, so nothing is uploaded."
    },
    {
      "question": "Is the SVG a real vector file?",
      "answer": "Yes. Strokes are exported as filled outline paths, shapes as native rect, ellipse, line and polygon elements, and text as text. Erased areas use an SVG mask, so the holes are genuine holes and stay holes on a transparent background, instead of being painted over with the board colour."
    },
    {
      "question": "Can I export a transparent PNG?",
      "answer": "Yes. The export bar lets you pick the board background, transparent, or white, independently of what you see while drawing, and lets you leave the grid out. You can also export at 1×, 2× or 4× the board size, so a 1920 × 1080 board can leave as a 7680 × 4320 image."
    },
    {
      "question": "What happens if I close the tab?",
      "answer": "The board is autosaved in this browser's local storage a moment after each change. When you come back, DrawSnap tells you a saved board exists and lets you restore it or start blank — it never silently overwrites what you are doing. Clearing the board deletes the saved copy too."
    },
    {
      "question": "Does it work with a graphics tablet or an iPad pencil?",
      "answer": "Yes. DrawSnap listens to pointer events, so a stylus reports real pressure and the stroke thins and thickens with it. With a mouse or a finger the width follows the speed of the gesture instead, which gives a similar hand-drawn feel."
    },
    {
      "question": "What is the difference between the two erasers?",
      "answer": "The ink eraser removes what it passes over, like a real one, and is exported as a mask. The whole-stroke eraser deletes the entire line you touch, which is faster for cleaning up a trace. Holding Alt, or dragging with the right mouse button, erases temporarily without changing tools."
    },
    {
      "question": "Which image formats can I import?",
      "answer": "JPG, PNG, WebP, AVIF, GIF and SVG, plus the HEIC and HEIF files an iPhone produces, which are converted in the browser before they touch the board."
    }
  ],
  "footerTagline": "Free, private, client-side drawing board with photo tracing and real vector export.",
  "footerCredit": "Part of the oLoveTools suite"
};
