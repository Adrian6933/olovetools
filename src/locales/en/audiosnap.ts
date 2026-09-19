export default {
  "contactForIdeas": "Contact for ideas and comments:",
  "resetHint": "Start over",
  "title": "AudioSnap",
  "badge": "Voice recorder & audio trimmer",
  "description": "Record from your microphone or open an audio file, cut it on the waveform, level it, and export lossless WAV or a compressed clip. Everything runs inside this tab.",
  "btn_record": "Record",
  "btn_pause_record": "Pause",
  "btn_resume_record": "Resume",
  "btn_stop_record": "Stop",
  "tabRecord": "Record",
  "tabFile": "Open a file",
  "recordTitle": "Record from your microphone",
  "recordHint": "The mic only opens while you are recording, and the audio never leaves this tab.",
  "levelLabel": "Input level",
  "clipWarn": "The input hit full scale — move back from the mic or turn its gain down.",
  "captureTitle": "Microphone settings",
  "captureHint": "Turn the three processors off for music or room tone; leave them on for speech in a noisy place.",
  "micLabel": "Input device",
  "micDefault": "System default",
  "micEcho": "Echo cancellation",
  "micNoise": "Noise suppression",
  "micAgc": "Automatic gain",
  "micChannels": "Channels",
  "micMono": "Mono",
  "micStereo": "Stereo",
  "micBitrate": "Quality",
  "dropTitle": "Drop an audio file",
  "dropHint": "MP3, WAV, M4A, OGG, Opus, FLAC, WebM — and the audio track of a video file.",
  "browseBtn": "Choose a file",
  "pendingHint": "Nothing has been decoded yet. Press the button when you are ready.",
  "loadBtn": "Load it into the editor",
  "discardBtn": "Discard",
  "decodingLabel": "Reading the audio…",
  "label_trim": "Waveform editor",
  "label_recording": "Recording",
  "label_paused": "Paused",
  "label_start": "In",
  "label_end": "Out",
  "label_duration": "Selection",
  "outputLabel": "Output",
  "newSourceBtn": "Start over",
  "undoBtn": "Undo",
  "redoBtn": "Redo",
  "transportPlay": "Play / pause (Space)",
  "transportStop": "Stop",
  "transportLoop": "Loop the selection",
  "compareBtn": "Hold: original",
  "compareHint": "Hold to hear the untouched original (or hold Alt)",
  "zoomLabel": "Zoom",
  "zoomIn": "Zoom in",
  "zoomOut": "Zoom out",
  "zoomFit": "Whole clip",
  "zoomSelection": "Fit selection",
  "zoomHint": "Wheel = zoom · Shift+wheel = pan · drag = select",
  "setInBtn": "Set in (I)",
  "setOutBtn": "Set out (O)",
  "selectAll": "Select all (A)",
  "autoTrimBtn": "Trim the silence",
  "autoTrimNone": "No audible section stood out — the selection was left alone.",
  "autoTrimDone": "Trimmed to {d}s of audible sound.",
  "processTitle": "Processing",
  "resetProcessing": "Neutral",
  "gainLabel": "Gain",
  "normalizeLabel": "Normalise peak to",
  "dcLabel": "Remove DC offset",
  "fadeInLabel": "Fade in",
  "fadeOutLabel": "Fade out",
  "speedLabel": "Speed",
  "channelsLabel": "Channels",
  "channelSource": "Keep",
  "rateLabel": "Sample rate",
  "rateSource": "Keep",
  "statsTitle": "Measured",
  "statPeak": "Source peak",
  "statRms": "Source RMS",
  "statOutPeak": "Output peak",
  "statGain": "Applied gain",
  "statSize": "Estimated size",
  "statClipWarn": "The output would clip. Lower the gain or switch the normaliser on.",
  "infoResampled": "resampled on decode",
  "exportTitle": "Export",
  "formatLabel": "Format",
  "fmtWav16": "WAV · 16-bit (dithered)",
  "fmtWav24": "WAV · 24-bit",
  "fmtWav32": "WAV · 32-bit float",
  "fmtCompressed": "Compressed · Opus",
  "bitrateLabel": "Bitrate",
  "realtimeWarn": "The browser has no offline audio encoder, so this one runs in real time: about {s}s.",
  "exportBtn": "Render & download",
  "exportingLabel": "Rendering",
  "downloadOriginalBtn": "Download the untouched source",
  "shortcutsTitle": "Keyboard",
  "shortcutPlay": "Play / pause",
  "shortcutInOut": "Set in / out at the playhead",
  "shortcutAll": "Select the whole clip",
  "shortcutAlt": "Hold to hear the untouched original",
  "shortcutZoom": "Zoom in, out, whole clip, selection",
  "shortcutUndo": "Undo / redo",
  "history_title": "This session",
  "clear_history": "Clear",
  "error_mic": "Microphone access denied or not available.",
  "errorDecode": "That audio could not be decoded in this browser.",
  "errorEncoder": "This browser cannot encode compressed audio. Use WAV instead.",
  "errorExport": "The export failed. Try a shorter selection or the WAV format.",
  "errorTooShort": "The selection is too short to export.",
  "nextStepTitle": "Keep going",
  "nextStepHint": "The clip travels with you — no re-upload",
  "nextZip": "Package it",
  "nextHash": "Checksum it",
  "howItWorksTitle": "How it works",
  "howItWorks": [
    {
      "title": "Record or open a file",
      "text": "Pick your microphone and decide whether the browser's noise suppression helps or hurts, then hit record. Or drop in an MP3, WAV, M4A, OGG, FLAC or the audio of a video — nothing is decoded until you ask for it."
    },
    {
      "title": "Cut on the waveform",
      "text": "Drag the in and out markers, drag across the wave to select, roll the wheel to zoom in on a single word. The playhead, the selection and the zoom are all independent."
    },
    {
      "title": "Level it and check it",
      "text": "Normalise the peak, add fades, change the speed, fold it to mono. Every setting is a number, not a new copy of the audio, so undo always takes you back and the source never degrades."
    },
    {
      "title": "Export what you need",
      "text": "16-bit dithered WAV for editing elsewhere, 24-bit or 32-bit float to keep the headroom, or a compressed Opus clip when the file has to be small. The estimated size is shown before you commit."
    }
  ],
  "features": [
    {
      "title": "Sample-accurate trimming",
      "text": "The cut points are seconds in the decoded buffer, not positions in a media element, so the export starts and ends exactly where the markers sit — no quarter-second overshoot."
    },
    {
      "title": "Real microphone control",
      "text": "Choose the input device, switch echo cancellation, noise suppression and automatic gain off one by one, pick mono or stereo, and set the recording bitrate before you start."
    },
    {
      "title": "Non-destructive editing",
      "text": "Gain, normalisation, fades, speed and channel changes are stored as a small description of the edit and applied once at export. Undo and redo cost nothing in memory."
    },
    {
      "title": "Measured, not guessed",
      "text": "Peak and RMS of the selection in dBFS, the gain the render will actually apply, the resulting peak, and a warning before the output would clip."
    },
    {
      "title": "Exports worth keeping",
      "text": "16-bit WAV is written with TPDF dither so quiet fades stay clean, 24-bit and 32-bit float keep the headroom, and the sample rate is yours to choose."
    },
    {
      "title": "Nothing is uploaded",
      "text": "Decoding, drawing, rendering and encoding all happen in this tab with the browser's own audio engine. No server, no account, no third-party library fetched from a CDN."
    }
  ],
  "seo_title": "AudioSnap | Free Online Voice Recorder & Audio Trimmer",
  "seo_description": "Record your voice or open an MP3, WAV, M4A, OGG or FLAC, trim it on a zoomable waveform, normalise it, and download lossless WAV or a compressed clip. 100% in your browser, free, no sign-up.",
  "seoHeroTitle": "Record, Cut and Export Audio Without Uploading Anything",
  "seoHeroText": "AudioSnap is a microphone recorder and a waveform trimmer in one page. It decodes your file with the browser's own audio engine, draws a real min/max envelope you can zoom into, and renders the finished cut offline — so the audio never travels anywhere.",
  "seoHeroList": [
    "Records from any microphone, with the processing switches exposed",
    "Opens MP3, WAV, M4A, OGG, Opus, FLAC and video soundtracks",
    "Zoomable waveform with draggable in and out markers",
    "Normalisation, fades, speed and mono fold-down, all undoable",
    "Lossless WAV at 16, 24 or 32-bit float, or a compressed clip",
    "Nothing is uploaded and nothing is downloaded from a CDN"
  ],
  "seoBrowserSpeedTitle": "One decoded buffer, rendered on demand",
  "seoBrowserSpeedText": "Your file is decoded once into raw samples and then left alone. Trimming, gain, fades, speed and channel changes are kept as numbers and applied in a single offline render when you export, which is why undo is instant and repeated edits never stack up quality loss.",
  "seoSecondaryTitle": "A recorder for the takes, an editor for what comes after",
  "seoUseCaseTitle": "Voice notes, podcasts, voiceovers and samples",
  "seoUseCaseText": "Capture a voice memo and cut the dead air off both ends. Pull a clean twenty seconds out of an hour-long interview. Level a voiceover before it goes into a video edit. Fold a stereo recording down to mono for a phone system, or drop a 48 kHz take to 16 kHz for a speech model. The waveform zooms down to individual words, so the cut lands where you meant it to.",
  "seoPrivacyTitle": "Private because there is nowhere for it to go",
  "seoPrivacyText": "Microphone access is requested when you press record and released when you press stop. The recording, the decoded samples and every export live in this tab's memory until you close it. There is no upload endpoint, no analytics on your audio, and no model or codec fetched from a third-party CDN.",
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Can I trim an audio file I already have, or only recordings?",
      "answer": "Both. The 'Open a file' tab takes MP3, WAV, M4A/AAC, OGG, Opus, FLAC and WebM, plus the audio track of a video file. Dropping a file does not decode it: it waits until you press the load button, so a long recording never freezes the page behind your back."
    },
    {
      "question": "Is there a recording length limit?",
      "answer": "There is no limit built into the tool, only your device's memory: the audio is held as raw samples, which is roughly 10 MB per minute of stereo at 48 kHz. Long sessions are fine on a desktop; on an older phone, keep it to a few minutes at a time."
    },
    {
      "question": "Is any of this uploaded?",
      "answer": "No. Recording, decoding, drawing, rendering and encoding all use APIs built into your browser. Nothing is sent to a server, and no library, model or codec is downloaded from a CDN while you work."
    },
    {
      "question": "Which export format should I pick?",
      "answer": "16-bit WAV is the safe default and what other editors expect. 24-bit and 32-bit float keep the extra headroom if you plan to process the file again. The compressed Opus option makes a much smaller file, but browsers have no offline audio encoder, so it re-encodes in real time — a two-minute clip takes about two minutes."
    },
    {
      "question": "What does the 'hold: original' button do?",
      "answer": "It plays the untouched source while you hold it — no trim, no gain, no fades — and returns to your edited version when you let go. Holding Alt does the same thing. It is the only reliable way to tell whether the normalisation actually helped."
    },
    {
      "question": "What is the difference between gain and normalise?",
      "answer": "Gain is a fixed amount you choose, in decibels. Normalise measures the loudest peak in your selection and works out the gain needed to bring it to the ceiling you set, so two clips recorded at different distances end up at the same level. If you enable both, the manual gain is applied on top of the normalised level."
    },
    {
      "question": "Why does the browser ask for microphone permission?",
      "answer": "Capturing audio always needs your explicit consent, and the browser handles that prompt itself. AudioSnap only asks when you press record, and the microphone indicator goes out as soon as you stop."
    }
  ],
  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "online voice recorder",
    "audio trimmer",
    "cut mp3 online",
    "browser audio editor",
    "record voice online free",
    "trim audio without uploading",
    "wav converter online",
    "normalise audio online",
    "mp3 to wav in browser",
    "free audio cutter no watermark"
  ],
  "footerTagline": "Free, private, client-side audio recording and editing.",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!"
};
