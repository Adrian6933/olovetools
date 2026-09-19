export default {
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "resetHint": "Start over",
  "title": "Lottie Viewer",
  "description": "Open .lottie, .tgs and .json animations, recolour every fill, stroke and gradient stop, check what will break on other players, and export to JSON, SVG, PNG, a frame sequence or WebM — all inside your browser.",
  "badge_local": "100% in your browser",

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

  "label_staged": "Ready to open",
  "btn_open": "Open in the player",
  "btn_discard": "Discard",
  "staged_hint": "Nothing has been rendered or modified yet — the file has only been parsed and inspected.",

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

  "howItWorksTitle": "How it works",
  "step1Title": "Drop the file",
  "step1Text": "A raw .json, a .lottie archive, a Telegram .tgs sticker or a gzipped .json.gz. Nothing is uploaded anywhere.",
  "step2Title": "Read the report",
  "step2Text": "Before anything renders you get the size, the layer count and a list of what will break on iOS, Android or older players.",
  "step3Title": "Recolour and trim",
  "step3Text": "Every fill, stroke, gradient stop and animated colour keyframe becomes a swatch. Hide layers, trim the range, override the framerate.",
  "step4Title": "Export or keep going",
  "step4Text": "JSON, .lottie, SVG, PNG, a numbered frame sequence or a WebM video — or send the result straight to another tool in the suite.",

  "features": [
    {
      "title": "Nothing leaves your machine",
      "text": "The player, the colour editor, the optimizer and every export run on your own CPU. No upload, no account, no queue — and it keeps working with the network unplugged."
    },
    {
      "title": "Colours the other viewers miss",
      "text": "Most online viewers only find static fills. This one also picks up strokes, gradient stops, solid layers and animated colour keyframes, and tells you how many times each colour is used."
    },
    {
      "title": "A real layer tree",
      "text": "Every top-level layer with its type, its expressions and its track mattes, and a switch to hide the ones you do not want. Hidden layers can then be dropped from the exported file."
    },
    {
      "title": "An optimizer that shows its work",
      "text": "Rounding the coordinates the exporter wrote with fifteen digits, dropping author metadata and removing hidden layers routinely halves the file. You see the byte count before and after, not a promise."
    },
    {
      "title": "Raster and video export",
      "text": "The current frame as PNG or SVG, the whole range as a numbered PNG sequence in a ZIP, or a frame-exact WebM video. All rendered on a canvas in this tab."
    },
    {
      "title": "A compatibility report",
      "text": "Expressions, merge paths, layer effects, text layers, 3D flags and image assets referenced by URL — the things that make an animation look right here and wrong on a phone."
    }
  ],

  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Are my animations uploaded anywhere?",
      "answer": "No. The file is read with the browser's own File API, parsed in memory and rendered by a player bundled with this page. There is no server call at any point, and nothing is stored between visits."
    },
    {
      "question": "Which file formats can I open?",
      "answer": "A raw .json Lottie, a .lottie archive (the format lottiefiles.com hands you by default), a Telegram .tgs sticker and a gzipped .json.gz. Containers are detected by their contents, so a misnamed file still opens."
    },
    {
      "question": "Why does nothing play as soon as I drop a file?",
      "answer": "On purpose. Dropping a file only parses and inspects it; you get its size, its structure and its compatibility report first, and the player starts when you press the button. If you would rather skip that entirely, paste the JSON by hand and it opens immediately."
    },
    {
      "question": "Which colours can actually be edited?",
      "answer": "Static fills and strokes, every stop of a gradient fill or gradient stroke, the colour of a solid layer, and each keyframe of an animated colour property. Colours baked into an embedded PNG or produced by a layer effect cannot be changed — no editor can do that without redrawing the asset."
    },
    {
      "question": "How much smaller does the optimizer make a file?",
      "answer": "It depends entirely on the source, which is why the tool shows the real byte count before and after instead of quoting a number. Files straight out of After Effects are usually 40-60% smaller at two decimal places, because most of their weight is coordinates written with fifteen significant digits."
    },
    {
      "question": "Can I export a GIF?",
      "answer": "Not directly, and that is deliberate: an in-browser GIF encoder would posterise the colours of a vector animation. Export a numbered PNG sequence or a WebM instead — both keep the full palette, and any encoder will turn them into a GIF without loss."
    },
    {
      "question": "Does editing the colours damage the animation?",
      "answer": "No. Every edit is stored as a patch over the original document, which is never modified. Undo, redo, reset the palette or hold the Compare button to see the untouched file at any point."
    }
  ],

  "seoHeroTitle": "Lottie Player, Colour Editor and Optimizer — All Local",
  "seoHeroText": "Open a Lottie animation, see exactly what is inside it, recolour it, strip the weight out of it and export it in the format you actually need — without uploading it to anyone.",
  "seoBrowserSpeedTitle": "A player that renders, not a preview that streams",
  "seoBrowserSpeedText": "The animation is rendered by lottie-web running on this page, at the document's own framerate, with frame-exact scrubbing and a real transport: step a frame at a time, play backwards, trim the range, override the fps. Because the renderer is local there is no upload wait and no quality ceiling imposed by a preview service.",
  "seoUseCaseTitle": "Built for shipping animations, not just looking at them",
  "seoUseCaseText": "Designers hand over a Lottie that weighs 900 KB and breaks on Android. This tool tells you why before you ship it, lets you recolour it to match the brand without going back to After Effects, drops the hidden layers the exporter left behind, and hands you the file in JSON, .lottie, SVG, PNG, frame sequence or WebM form.",
  "seoPrivacyTitle": "Nothing is uploaded, and nothing is fetched",
  "seoPrivacyText": "Every operation happens in this tab. The tool also flags animations that reference image assets by URL, because those are the one case where a Lottie is not self-contained — and it inlines them for you when they arrive inside a .lottie archive.",

  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "Lottie viewer",
    "Lottie player online",
    "edit Lottie colors",
    "dotLottie",
    "tgs viewer",
    "Lottie optimizer",
    "Lottie to WebM",
    "Lottie to PNG sequence",
    "Lottie compatibility check",
    "After Effects Bodymovin"
  ],

  "footerTagline": "A local Lottie player, colour editor, optimizer and exporter.",
  "footerCredit": "Part of the oLoveTools suite",
  "seo_title": "Lottie Viewer | Free Online Lottie Player, Editor & Optimizer",
  "seo_description": "Open .lottie, .tgs and .json animations, recolour fills, strokes and gradients, check cross-player compatibility and export to SVG, PNG, frame sequence or WebM. 100% in your browser."
};
