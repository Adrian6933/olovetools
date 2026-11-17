export default {
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "resetHint": "Start over",
  "title": "Lottie Viewer",
  "drop_active": "Drop it here",
  "drop_inactive": "Drag & drop a Lottie file, or click to browse",
  "label_lottie_file": "Lottie file",
  "btn_paste": "Paste the JSON by hand",
  "paste_placeholder": "{\"v\":\"5.5.2\",\"fr\":30,\"w\":200,\"h\":200,\"layers\":[…]}",
  "btn_open_pasted": "Open it straight away",
  "label_presets": "Sample animations",
  "preset_bars": "Bouncing Bars",
  "preset_bars_desc": "Three-colour loader, 60 frames",
  "preset_square": "Rotating Square",
  "preset_square_desc": "A single animated rotation property",
  "preset_circle": "Pulsing Circle",
  "preset_circle_desc": "Elastic scale loop",
  "preset_gradient": "Gradient Sweep",
  "preset_gradient_desc": "Gradient fill with three editable stops",
  "label_timeline": "Timeline",
  "label_speed": "Speed",
  "label_loop": "Loop",
  "label_reverse": "Reverse",
  "label_bg_color": "Backdrop",
  "bg_checkered": "Checkered",
  "bg_white": "White",
  "bg_dark": "Dark",
  "bg_custom": "Custom",
  "zoom_in": "Zoom in",
  "zoom_out": "Zoom out",
  "zoom_fit": "Fit to view",
  "compare_label": "Compare",
  "compare_hint": "Hold to see the original",
  "compare_badge": "Original",
  "btn_play": "Play",
  "btn_pause": "Pause",
  "btn_stop": "Stop",
  "btn_rewind": "Back to the start",
  "btn_prev_frame": "Previous frame",
  "btn_next_frame": "Next frame",
  "shortcuts_hint": "Space play/pause · ← → step one frame (Shift for ten) · L loop · R reverse · +/− zoom · 0 fit · wheel to zoom, drag to pan",
  "status_playing": "Playing",
  "status_paused": "Paused",
  "btn_undo": "Undo",
  "btn_redo": "Redo",
  "btn_close": "Close the animation",
  "btn_dismiss": "Dismiss",
  "label_layers_colors": "Colours",
  "btn_reset_colors": "Reset colours",
  "kind_fill": "fill",
  "kind_stroke": "stroke",
  "kind_gradient": "gradient",
  "kind_solid": "solid",
  "kind_animated": "animated",
  "palette_hint": "Fills, strokes, gradient stops, animated colour keyframes and solid layers are all editable. Hold Compare on the player to see the original.",
  "palette_empty": "This animation carries no editable colour values — its visuals probably come from embedded images or effects rather than vector fills.",
  "label_layers_tree": "Layers",
  "btn_show_layer": "Show this layer",
  "btn_hide_layer": "Hide this layer",
  "layers_hint": "Hidden layers stay inside the file until you export with “drop hidden layers” enabled in the optimizer.",
  "label_metadata": "Inspector",
  "inspector_empty": "Open an animation to see its structure.",
  "meta_version": "Version",
  "meta_dimensions": "Dimensions",
  "meta_framerate": "Framerate",
  "meta_duration": "Duration",
  "meta_total_frames": "Frames",
  "meta_layers": "Layers",
  "meta_size": "Size",
  "label_fps_override": "Override fps",
  "label_trim": "Trim (in / out)",
  "btn_reset_timing": "Back to the file’s own timing",
  "label_report": "Compatibility",
  "finding_external_assets": "{n} image asset(s) are referenced by URL instead of embedded. They will not render here, and the animation is not self-contained.",
  "finding_expressions": "{n} expression(s) found. The web player evaluates them, but the iOS and Android players ignore them.",
  "finding_text": "{n} text layer(s). Unless the fonts are outlined or bundled, they fall back to a system font on other devices.",
  "finding_mattes": "{n} track matte(s). Widely supported, but the most expensive thing a renderer has to do.",
  "finding_merge_paths": "{n} merge path(s). Not supported by the Android player and only partially on iOS.",
  "finding_effects": "{n} layer effect(s). Only a small subset of After Effects effects survives the export.",
  "finding_3d": "{n} layer(s) marked as 3D. Lottie renderers flatten these to 2D.",
  "finding_heavy": "This file is heavy for the web. Try the optimizer below — trimming decimal precision usually removes a large chunk of it.",
  "finding_many_layers": "{n} layers. Above roughly 60, frame time starts to show on mid-range phones.",
  "finding_clean": "No compatibility problems found. This animation should render the same everywhere.",
  "label_optimize": "Optimizer",
  "opt_precision": "Decimal precision",
  "opt_drop_hidden": "Drop hidden layers",
  "opt_drop_names": "Drop layer names (breaks keypaths and dynamic text in apps)",
  "opt_drop_expressions": "Drop expressions",
  "btn_optimize": "Optimize",
  "opt_removed_layers": "{n} hidden layer(s) removed",
  "label_export": "Export",
  "export_width": "Raster width",
  "export_transparent": "Transparent background",
  "export_bg": "Export background",
  "export_sequence": "PNG sequence (ZIP)",
  "export_webm": "Video (WebM)",
  "export_hint": "The PNG, the sequence and the video are rasterised frame by frame on a canvas in this tab. WebM has no alpha channel, so a transparent export falls back to a solid colour.",
  "btn_copy_json": "Copy the JSON",
  "copied": "Copied",
  "label_embed": "Embed",
  "embed_wc": "Web",
  "embed_react": "React",
  "embed_vanilla": "JS",
  "embed_hint": "The player script comes from a CDN; the animation file itself stays on your own server.",
  "btn_copy_embed": "Copy the snippet",
  "nextStepTitle": "Keep going",
  "nextStepHint": "The result travels with you — no re-upload",
  "nextSvgOptimize": "Optimize the SVG",
  "nextJson": "Inspect the JSON",
  "nextCompress": "Compress the frame",
  "nextCrop": "Crop the frame",
  "nextFavicon": "Make a favicon",
  "error_invalid_json": "That is not valid JSON.",
  "error_no_lottie": "That file does not contain a Lottie animation.",
  "error_too_large": "That file is {n} MB. Anything above 12 MB will lock up the tab while it parses.",
  "error_render": "The animation parsed, but it failed while rendering.",
  "error_no_svg": "Nothing is rendered yet, so there is no SVG to export.",
  "error_clipboard": "The browser blocked clipboard access.",
  "error_no_gzip": "This browser cannot decompress gzip files.",
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "How do I open a Lottie JSON file?",
      "answer": "Drop it on this page or click the box to choose it. It plays immediately in the browser, with no app and no account. You can also paste a link to the file."
    },
    {
      "question": "Can I view a .lottie (dotLottie) file?",
      "answer": "Yes. .lottie files are unzipped in the browser and the first animation inside plays at once. You can export it back to plain JSON if your project needs it."
    },
    {
      "question": "How do I preview a Telegram .tgs sticker?",
      "answer": "Drop the .tgs file here. It is a gzipped Lottie animation, so it plays like any other, and the inspector shows whether it meets Telegram's 512×512 and 60 fps rules."
    },
    {
      "question": "Can I open several Lottie files at once?",
      "answer": "Yes. Select or drop several and they are shown in a grid, all animating. Click one to open it in the full editor."
    },
    {
      "question": "Why won't my link open?",
      "answer": "Some servers do not allow their files to be loaded from another website (CORS). If that happens, download the file and drop it here; it works the same way."
    },
    {
      "question": "Are my animations uploaded anywhere?",
      "answer": "No. Files are read and played in your browser. When you open a link, the file is downloaded straight from that address into your browser, never through our servers."
    },
    {
      "question": "Can I export a Lottie animation as a video or GIF?",
      "answer": "You can export a WebM video (with transparency in Chrome and Edge), a PNG frame sequence or single frames as PNG and SVG. To get a GIF, convert the WebM or the frames with a GIF tool."
    },
    {
      "question": "Which colours can I change?",
      "answer": "Solid fills, strokes and gradient stops defined in the file. Colours baked into embedded images or driven by expressions cannot be changed here."
    },
    {
      "question": "Does it work offline?",
      "answer": "Once the page has loaded, local files keep working without a connection. Opening a link obviously needs the internet."
    }
  ],
  "footerTagline": "Free online Lottie viewer: play, check, recolour and export .json, .lottie and .tgs animations.",
  "footerCredit": "Part of the oLoveTools suite",
  "seo_title": "Lottie Viewer Online: Play and Preview Lottie JSON, .lottie and TGS",
  "seo_description": "Free online Lottie player: drop a .json, .lottie or Telegram .tgs file, or paste a link, and it plays at once. Preview whole packs, change colours, check compatibility and export to GIF-style WebM, PNG, SVG or JSON. Nothing is uploaded.",
  "seo_title_exact": true,
  "h1": "Lottie viewer and player online",
  "subtitle": "Play .json, .lottie and .tgs animations online, check them, change their colours and export them. Free, in your browser, nothing uploaded.",
  "galleryTitle": "{n} animations",
  "galleryHint": "Click one to open it in the player and editor.",
  "galleryLight": "Light background",
  "galleryDark": "Dark background",
  "galleryFailed": "{n} files could not be read as Lottie.",
  "urlLabel": "Link to a Lottie file",
  "urlPlaceholder": "Paste a link: https://…/animation.json",
  "urlOpen": "Open link",
  "urlInvalid": "Paste a link that starts with https://",
  "urlFailed": "That link could not be loaded. The server may not allow it to be opened from another site: download the file and drop it here instead.",
  "shareLink": "Copy a link that plays this animation",
  "shareLinkShort": "Share link",
  "howTitle": "How to play a Lottie file online",
  "howIntro": "Lottie animations are JSON files exported from After Effects with Bodymovin, or made in LottieFiles, Figma plugins and other tools. A browser cannot open them by double-clicking: you need a player like this one.",
  "howSteps": [
    "Drop your .json, .lottie or .tgs file in the box, or click it to choose one. You can select several at once to see them all.",
    "Or paste a link to the file (LottieFiles, GitHub, your own server) and press “Open link”.",
    "It plays straight away. Change the speed, loop it, scrub frame by frame and switch the background to check transparency.",
    "Optionally recolour it, hide layers, shrink it or export it to WebM, PNG frames, SVG, JSON or .lottie."
  ],
  "formatsTitle": "Formats it opens",
  "formatsList": [
    {
      "ext": ".json",
      "text": "The standard Lottie / Bodymovin file, exported from After Effects or downloaded from LottieFiles as “Lottie JSON”."
    },
    {
      "ext": ".lottie",
      "text": "dotLottie: a zip with one or more animations and their images. Smaller than JSON and used by the newer LottieFiles players."
    },
    {
      "ext": ".tgs",
      "text": "Telegram animated stickers. They are gzipped Lottie JSON at 512×512 and 60 fps, so you can preview and check a sticker before uploading it."
    },
    {
      "ext": ".json.gz",
      "text": "Any gzipped Lottie JSON. It is unpacked in the browser."
    }
  ],
  "sections": [
    {
      "title": "Preview a whole pack at once",
      "text": "Select or drop several files and they appear in a grid, all playing at the same time on a dark or light background. It is the quickest way to check an icon set or a sticker pack and find the one you want.\n\nClick any of them to open it in the full player with the inspector, the colour editor and the exports."
    },
    {
      "title": "Check it before it reaches your app",
      "text": "The inspector lists the version, size, frame rate, duration, number of layers and file size, and warns about things that break on some players: expressions, missing images, effects that lottie-web, iOS or Android do not support, or very large files.\n\nThat way you find problems here instead of in production."
    },
    {
      "title": "Change colours and export",
      "text": "Every fill, stroke and gradient colour in the file is collected into a palette you can edit. Changes are applied live and can be undone.\n\nWhen it looks right, export it as JSON or .lottie, as an SVG or PNG of the current frame, as a numbered PNG sequence, or as a WebM video with transparency."
    },
    {
      "title": "Share a link that plays it",
      "text": "If the animation came from a link, the “Share link” button copies an address that opens this page and plays it straight away. Useful for sending a designer's file to a developer or a client without asking them to download anything."
    }
  ],
  "finding_tgs_size": "Telegram stickers must be exactly 512×512. This one is {d}.",
  "finding_tgs_fps": "Telegram stickers must run at 30 or 60 fps. This one is {d} fps.",
  "finding_tgs_duration": "Telegram stickers can last 3 seconds at most. This one lasts {d} s.",
  "finding_tgs_ok": "Meets Telegram’s sticker rules: 512×512, 30/60 fps, 3 s or less.",
  "openAnother": "Open another"
};
