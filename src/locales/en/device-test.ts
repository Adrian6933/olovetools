export default {
  "resetHint": "Start over",
  "title": "Device Test",
  "seo_title": "Device Test | Check your camera, mic, speakers and screen",
  "seo_description": "Check that your webcam, microphone, speakers, screen, keyboard and pointer actually work — with the real numbers: capture resolution, frame rate, input level in dBFS and the resolutions your camera really supports. Nothing is uploaded.",
  "seoHeroTitle": "Device Test",
  "seoHeroText": "Check your camera, microphone, speakers, screen, keyboard and pointer, and see the numbers behind each one instead of a green tick.",
  "seoBrowserSpeedTitle": "Measured, not assumed",
  "seoBrowserSpeedText": "The camera is asked for 4K, 1440p, 1080p, 720p and 480p in turn and we report what it actually delivered. The microphone is measured in dBFS with peak hold, clipping and silence detection. Asking is not the same as getting, so we look at the result.",
  "seoUseCaseTitle": "Six tests, none of them automatic",
  "seoUseCaseText": "Camera, microphone, speakers, screen, keyboard and pointer. Each has its own button and asks for permission only when you start it: opening the page never turns on your webcam.",
  "seoPrivacyTitle": "Nothing leaves your device",
  "seoPrivacyText": "The video preview, the audio meter and the five-second recording all stay in the tab. No upload, no account, no analytics on any of it, and everything disappears when you close the page.",
  "hero": {
    "badge": "Runs in your browser",
    "title": "Check your camera, mic and screen —",
    "titleHighlight": "with the actual numbers",
    "subtitle": "Not a green tick that tells you nothing. The resolution and frame rate the camera really delivers, the input level in dBFS, which resolutions it supports, and tests for speakers, screen, keyboard and touch.",
    "trust1": "No upload, no account",
    "trust2": "Nothing starts on its own",
    "trust3": "Six separate tests"
  },
  "ui": {
    "tabCamera": "Camera",
    "tabMic": "Microphone",
    "tabSpeakers": "Speakers",
    "tabScreen": "Screen",
    "tabKeyboard": "Keyboard",
    "tabPointer": "Pointer",
    "start": "Start",
    "stop": "Stop",
    "refresh": "Refresh device list",
    "defaultDevice": "System default",
    "labelsHint": "Device names stay hidden until you grant permission once — that is a browser rule, not a bug. Start any test and the real names appear.",
    "probeResolutions": "Probe resolutions",
    "probeResults": "What the camera actually delivered",
    "probeHint": "Each resolution is requested in turn and we report what came back. A request is not a promise: browsers hand you the closest thing they can rather than failing.",
    "actualResolution": "Capturing at",
    "frameRate": "Frame rate",
    "facing": "Facing",
    "maxSupported": "Reported max",
    "notAvailable": "not available",
    "capture": "Take a photo",
    "download": "Download",
    "clear": "Clear",
    "record": "Record 5 s",
    "peak": "Peak",
    "clipping": "Clipping — turn the input gain down",
    "silent": "No signal — is it muted?",
    "meterHint": "RMS is the level you hear; peak catches the short spikes. Speaking normally should sit around −18 dBFS, and the bar should never stay in the red.",
    "speakersIntro": "A 440 Hz tone on the channel you choose. If you only hear one side, or they come out swapped, the problem is the cable or the system settings, not the browser.",
    "speakersHint": "The tone fades in and out on purpose: starting a raw sine wave produces a click that is louder than the tone itself in headphones.",
    "channelLeft": "Left",
    "channelBoth": "Both",
    "channelRight": "Right",
    "screenIntro": "Full-screen flat colours to hunt for dead or stuck pixels, plus a gradient and a fine grid for banding and backlight bleed.",
    "screenStart": "Start screen test",
    "screenHint": "Click or press → for the next screen, Esc to leave.",
    "screenGradient": "Gradient",
    "screenGrid": "Grid",
    "screenNext": "Next screen",
    "close": "Close",
    "keyboardStart": "Start listening",
    "keyboardStop": "Stop listening",
    "keysSeen": "keys registered",
    "keyboardHint": "While listening, keys are captured instead of doing their usual job — otherwise pressing Tab or F5 would take you off the page. Green means the key has been seen at least once.",
    "reset": "Reset",
    "pointerHint": "Press and drag here. On a touchscreen, use several fingers at once.",
    "pointerActive": "Active",
    "pointerMax": "Max at once",
    "pointerType": "Type",
    "pointerButtons": "Buttons",
    "sysTitle": "System",
    "sysNote": "Read locally through standard browser APIs, and re-read whenever you resize the window or rotate the device.",
    "sysScreen": "Screen",
    "sysViewport": "Viewport",
    "sysPixelRatio": "Pixel ratio",
    "sysColorDepth": "Colour depth",
    "sysColorGamut": "Colour gamut",
    "sysBrowser": "Browser",
    "sysEngine": "Engine",
    "sysOS": "Operating system",
    "sysGpu": "GPU",
    "sysCpuCores": "CPU threads",
    "sysMemory": "Device memory",
    "sysTouchPoints": "Touch points",
    "sysPointer": "Pointer",
    "sysLanguages": "Languages",
    "sysTimezone": "Time zone",
    "sysConnection": "Connection",
    "sysOnline": "Online",
    "sysReducedMotion": "Reduced motion",
    "unknown": "—",
    "yes": "Yes",
    "no": "No",
    "errors": {
      "NotAllowedError": "Permission denied. Allow access in the browser’s address bar and try again.",
      "NotFoundError": "No device of that type was found.",
      "NotReadableError": "The device is busy — another app is probably using it.",
      "OverconstrainedError": "That device cannot do what was asked of it.",
      "AbortError": "The device stopped responding."
    }
  },
  "next": {
    "nextStepTitle": "Keep going",
    "nextStepHint": "The photo travels with you — no re-upload",
    "nextCrop": "Crop it",
    "nextCutout": "Remove background",
    "nextCompress": "Compress it",
    "nextFormat": "Change format",
    "nextWatermark": "Add a watermark"
  },
  "how": {
    "title": "How it works",
    "subtitle": "Three steps, and your webcam stays off until you say so.",
    "steps": [
      {
        "title": "Pick a test",
        "text": "Camera, microphone, speakers, screen, keyboard or pointer. Nothing runs until you choose."
      },
      {
        "title": "Grant permission",
        "text": "Only for the test you started, and only when you start it. Opening the page asks for nothing."
      },
      {
        "title": "Read the numbers",
        "text": "Capture resolution and frame rate, input level in dBFS, supported resolutions — not a tick that tells you nothing."
      }
    ]
  },
  "features": {
    "title": "What it measures that a green tick does not",
    "items": [
      {
        "title": "The resolutions your camera really does",
        "desc": "4K, 1440p, 1080p, 720p and 480p are each requested in turn and we report what came back. Browsers give you the nearest thing they can instead of refusing, so the only way to know is to ask and look."
      },
      {
        "title": "Input level in dBFS",
        "desc": "RMS and peak with hold, plus clipping and silence detection — the numbers that answer \"is my mic picking anything up?\". A bar of anonymous height does not."
      },
      {
        "title": "Left, right and both",
        "desc": "A 440 Hz tone per channel, so you can tell a dead speaker from a swapped cable. Fading in and out, because a raw sine wave clicks louder than it plays."
      },
      {
        "title": "Dead pixels and banding",
        "desc": "Full-screen flat colours, a gradient and a fine grid. Real full screen, because you cannot judge black or backlight bleed with a browser bar in the way."
      },
      {
        "title": "Keyboard and multi-touch",
        "desc": "Which physical keys respond — captured so that Tab and F5 register instead of navigating away — and how many fingers the screen tracks at once."
      },
      {
        "title": "Nothing leaves the tab",
        "desc": "Preview, meter and recording all stay local. No upload, no account, and the device list refreshes on its own when you plug something in."
      }
    ]
  },
  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Is any of this uploaded?",
      "answer": "No. The camera preview, the audio meter and the five-second recording all live in this tab and nowhere else. There is no account, no upload and no server involved; close the page and every trace is gone."
    },
    {
      "question": "Why does the device list show no names before I start?",
      "answer": "Because browsers hide device labels until a page has been granted access at least once — it stops any site from fingerprinting your hardware just by loading. Start any test and the real names appear. The previous version enumerated on load and showed \"Camera 1\" for everything as a result."
    },
    {
      "question": "What does \"Probe resolutions\" actually do?",
      "answer": "It asks your camera for 4K, 1440p, 1080p, 720p and 480p one at a time, and reports the frame size that actually came back. A constraint is a request, not a promise: browsers hand you the nearest thing they can rather than failing, so the only way to know what a webcam supports is to ask and measure."
    },
    {
      "question": "What is a good microphone level?",
      "answer": "Speaking normally should sit around −18 dBFS on RMS, with peaks below −6. If the bar reaches the red the input is clipping and the sound will distort, so lower the gain in your system settings. If it never leaves the far left, the mic is muted or the wrong device is selected."
    },
    {
      "question": "Does the page turn my webcam on by itself?",
      "answer": "Never. Each test has its own button and asks for permission only when you press it, so simply visiting this page requests nothing. Stopping a test releases the device immediately, and the indicator light on your camera goes out."
    },
    {
      "question": "Why does the screen test need full screen?",
      "answer": "Because you cannot judge black level, backlight bleed or the edges of the panel with a browser toolbar and a taskbar in shot. It uses the browser’s full-screen mode; press Esc, or leave full screen any other way, and it closes itself."
    },
    {
      "question": "Why do keys not do their normal thing during the keyboard test?",
      "answer": "While the test is listening, key presses are captured rather than acted on. Otherwise pressing Tab would move focus away, F5 would reload the page and F11 would toggle full screen — none of which would let you check whether the key works."
    },
    {
      "question": "The system panel says my GPU is generic. Why?",
      "answer": "The real model comes from a WebGL extension that some browsers deliberately hide to reduce fingerprinting, and Firefox in particular often masks it. When that happens the generic string is shown, which is itself a true answer: it is what the page is allowed to see."
    }
  ],
  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "webcam test",
    "microphone test",
    "test my camera online",
    "mic test online",
    "speaker test left right",
    "dead pixel test",
    "screen test online",
    "keyboard tester",
    "multi touch test",
    "check webcam resolution",
    "browser device test",
    "system info online"
  ],
  "footer_seo_title": "A device check that shows the numbers",
  "footer_seo_paragraph1": "Device Test checks your webcam, microphone, speakers, screen, keyboard and pointer entirely inside your browser. Rather than a tick that tells you nothing, it reports the resolution and frame rate the camera is actually delivering, probes which resolutions it really supports by asking for each one and measuring the result, and meters your microphone in dBFS with peak hold, clipping and silence detection.",
  "footer_seo_paragraph2": "Nothing runs on its own: every test has its own button and asks for permission only when you press it, so opening the page never turns on a camera. The preview, the meter and the five-second recording stay in the tab, the device list refreshes by itself when you plug something in, and the system panel re-reads when you resize the window or rotate the device instead of showing what was true when the page loaded.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "footerTagline": "Check your camera, microphone, speakers, screen, keyboard and pointer, with the real numbers behind each one. Everything stays in your browser."
};
