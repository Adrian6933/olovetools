export default {
  "title": "FaviconBolt",
  "description": "Build a complete favicon pack from an emoji, a couple of letters or your own logo. Everything is generated inside your browser.",
  "badge": "Favicon & app icon generator",
  "seo_title": "FaviconBolt | Free Online Favicon Generator & ICO Compiler",
  "seo_description": "Turn an emoji, letters or a logo into a multi-resolution favicon.ico, a vector favicon.svg, Apple touch icons, Android maskable icons and a web manifest. Runs entirely offline in your browser.",

  "label_mode_emoji": "Emoji",
  "label_mode_text": "Letters",
  "label_mode_image": "Image",
  "label_emoji_input": "Type an emoji",
  "emojiHint": "Family, flag and skin-tone emoji are kept whole instead of being cut in half.",
  "label_text_input": "Letters (up to 3)",
  "label_text_color": "Letter colour",
  "label_font_family": "Font",
  "label_font_weight": "Weight",
  "label_font_scale": "Glyph size",

  "dropzonePrompt": "Drop a logo or click to pick one",
  "dropzoneSubtitle": "PNG, JPG, WebP, AVIF, SVG, GIF and iPhone HEIC. Up to 30 MB.",
  "removeFileBtn": "Remove file",
  "trimLabel": "Trim transparent margin",
  "clipLabel": "Clip artwork to the shape",

  "label_bg_shape": "Background shape",
  "shape_none": "None",
  "shape_circle": "Circle",
  "shape_square": "Square",
  "shape_rounded": "Rounded",
  "shape_squircle": "Squircle",
  "label_bg_type": "Fill",
  "fill_solid": "Solid",
  "fill_gradient": "Gradient",
  "label_bg_color": "Background colour",
  "label_bg_color2": "Second colour",
  "label_gradient_angle": "Gradient angle",
  "label_border_width": "Border width",
  "label_border_color": "Border colour",
  "label_padding": "Padding",

  "label_transform": "Manual placement",
  "label_scale": "Zoom",
  "label_rotation": "Rotation",
  "resetTransformBtn": "Reset",
  "undoBtn": "Undo",
  "redoBtn": "Redo",

  "sharpenLabel": "Sharpen the small sizes",
  "sharpenHint": "Unsharp mask on the 16-48 pixel frames, applied on premultiplied alpha so it cannot leave a coloured fringe around the edge.",
  "label_app_name": "Site name (manifest)",
  "label_app_short_name": "Short name",
  "label_theme_color": "Theme colour",
  "label_apple_bg": "iOS background",
  "appleBgHint": "iOS drops transparency on the home screen, so the touch icon is flattened onto this colour instead of turning black.",

  "stageDragHint": "Drag to move · wheel to zoom at the cursor",
  "stageCompareHint": "Hold Alt (or right-click) to see the original",
  "previewActualSize": "Actual size, exactly as exported",
  "preview_title": "Favicon previews",
  "preview_tab": "Browser tab",
  "preview_search": "Google search result",
  "preview_mobile": "Mobile home screen",

  "label_output_files": "Files to generate",
  "generateBtn": "Generate the pack",
  "readyLabel": "Ready",
  "btn_download_zip": "Download ZIP",
  "progress_generating": "Writing the icon frames and the ICO directory...",

  "snippetTitle": "Paste this in your <head>",
  "snippetHint": "It updates with the files you ticked. Drop the pack in your site root and paste this block.",
  "copyBtn": "Copy",
  "copiedLabel": "Copied",

  "asset_ico": "16, 32 and 48 pixel frames in one binary",
  "asset_png16": "Classic small tab icon",
  "asset_png32": "Standard tab and bookmark icon",
  "asset_png48": "Windows site tile and shortcuts",
  "asset_svg": "Vector icon, crisp at any resolution",
  "asset_apple": "180x180 iOS home screen, flattened",
  "asset_android192": "192x192 Android launcher icon",
  "asset_android512": "512x512 install and splash icon",
  "asset_maskable": "Full-bleed Android adaptive icon",
  "asset_mstile": "150x150 Windows tile",
  "asset_manifest": "PWA manifest with name, scope and icons",
  "asset_browserconfig": "Windows tile configuration",
  "asset_snippet": "The head tags, ready to paste",

  "error_type": "That file is not an image we can read.",
  "error_size": "That file is over 30 MB. Export a smaller version first.",
  "error_heic": "This HEIC could not be converted in the browser. Export it as PNG or JPG first.",
  "error_decode": "The file could not be decoded. It may be corrupt.",
  "error_svgSize": "This SVG has no width, height or viewBox, so browsers cannot size it.",
  "error_generate": "The pack could not be built. Try fewer files or a smaller source image.",

  "nextStepTitle": "Keep going",
  "nextStepHint": "Your icon travels with you, no re-upload",
  "nextCompress": "Compress it",
  "nextCrop": "Crop it",
  "nextFormat": "Change format",
  "nextRemoveBg": "Remove its background",
  "nextQr": "Put it on a QR",

  "howTitle": "How it works",
  "steps": [
    {
      "title": "Pick a source",
      "text": "An emoji, one to three letters, or your own logo. Uploading a file only parks it: nothing is generated until you ask."
    },
    {
      "title": "Style the plate",
      "text": "Shape, solid colour or gradient, border and padding. The preview redraws on every change."
    },
    {
      "title": "Place it by hand",
      "text": "Drag to move, scroll to zoom at the cursor, rotate. Ctrl+Z undoes any step."
    },
    {
      "title": "Ship the pack",
      "text": "Download the ZIP, drop it in your site root and paste the head snippet."
    }
  ],

  "features": [
    {
      "title": "A real multi-frame ICO",
      "text": "The 16, 32 and 48 pixel frames are written as 32-bit BMP with a proper AND mask, so old Windows shells and strict icon parsers accept the file."
    },
    {
      "title": "True squircle",
      "text": "The rounded plate is a superellipse, the same family of curve iOS uses for app icons, not a rounded rectangle pretending to be one."
    },
    {
      "title": "Vector favicon.svg",
      "text": "Emoji and letter icons are exported as real vector markup, so they stay sharp on any display and in dark mode."
    },
    {
      "title": "A correct iOS touch icon",
      "text": "The Apple touch icon is flattened onto a colour you choose, because iOS renders transparency on the home screen as solid black."
    },
    {
      "title": "Chained with the rest of the suite",
      "text": "Send the finished icon straight to compress, crop, convert or background removal without downloading and re-uploading it."
    },
    {
      "title": "Nothing leaves the tab",
      "text": "Canvas and a ZIP writer running in your browser. No upload, no API call, no account, and it keeps working offline."
    }
  ],

  "seoHeroTitle": "Create favicons and web app icons instantly",
  "seoHeroText": "One source, every file a modern site needs: a multi-resolution favicon.ico, a vector favicon.svg, Apple touch icons, Android launcher and maskable icons, a web manifest and the head snippet that wires them up.",
  "seoHeroList": [
    "Multi-resolution ICO with 16, 32 and 48 pixel frames",
    "Vector SVG favicon for emoji and letter icons",
    "Android maskable icon and a valid web manifest",
    "The head snippet, generated for the files you picked"
  ],

  "seoBrowserSpeedTitle": "Rendered once at 1024 pixels, then downsampled properly",
  "seoBrowserSpeedText": "Drawing an emoji straight into a 16 pixel frame is what makes most generated favicons look like mush: colour emoji fonts fall back to their smallest bitmap strike. FaviconBolt renders one 1024 pixel master and derives every size from it, which measures 87% closer to an ideal downsample at 16 pixels than drawing at that size directly. An optional unsharp pass, applied on premultiplied alpha, adds back the edge contrast the averaging takes away.",

  "seoSecondaryTitle": "Every file a browser will actually ask for",
  "seoUseCaseTitle": "For developers and designers",
  "seoUseCaseText": "Drop the ZIP into your site root and paste the generated head block. The manifest carries your own site name, start URL and scope instead of a placeholder, so the install prompt shows the right thing.",
  "seoCompatTitle": "Compatibility, not guesswork",
  "seoCompatText": "The ICO frames are BMP with an AND mask rather than embedded PNG streams, the Apple touch icon ships opaque, and the Android maskable icon is full-bleed so the system mask does not clip your artwork twice.",
  "seoPrivacyTitle": "100% local generation",
  "seoPrivacyText": "Your logo never leaves your computer. The rendering, the ICO binary and the ZIP are all built in the page, and the illustrations on this page are inline SVG, so nothing is fetched from a CDN either.",

  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "favicon generator",
    "ico converter",
    "apple touch icon",
    "web app manifest",
    "maskable icon",
    "svg favicon",
    "emoji favicon",
    "png to ico"
  ],

  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "What is inside the favicon.ico file?",
      "answer": "Three icon frames, 16x16, 32x32 and 48x48, packed into one binary. They are stored as 32-bit BMP with a 1-bit AND mask, which is the format every icon reader understands. PNG-compressed frames are only supported from Windows Vista onwards and some parsers still reject them."
    },
    {
      "question": "Why does the Apple touch icon have a solid background?",
      "answer": "iOS ignores the alpha channel on home screen icons and composites anything transparent onto black. Flattening the touch icon onto a colour you choose is the only way to control how it looks once installed."
    },
    {
      "question": "What is the maskable icon for?",
      "answer": "Android applies its own mask, which is a circle on some launchers and a squircle on others. A maskable icon is drawn full-bleed with the artwork inside a safe zone, so the system can crop it without cutting into your logo."
    },
    {
      "question": "Can I get a vector favicon.svg?",
      "answer": "Yes, for the emoji and letter modes it is genuine vector markup. If you upload an SVG logo it stays vector too. For a raster upload we embed the 512 pixel render inside the SVG and say so, rather than pretending a JPEG was traced."
    },
    {
      "question": "Can I position the icon by hand?",
      "answer": "Drag the artboard to move the artwork, scroll to zoom towards the cursor, and use the rotation slider. Arrow keys nudge, plus and minus zoom, 0 resets, and Ctrl+Z steps back through the history. Holding Alt shows the untouched original."
    },
    {
      "question": "Does anything get uploaded?",
      "answer": "No. Files are decoded, rendered and zipped by your own browser. There is no server call at any point, which is also why it keeps working with the network off."
    }
  ],

  "footerTagline": "Free, private, offline favicon and web app icon generation.",
  "footerCredit": "Part of the oLoveTools suite",
  "scrollTopLabel": "Back to top"
};
