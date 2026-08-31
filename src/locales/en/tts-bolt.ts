export default {
  "title": "TTSBolt",
  "badge": "Text to speech",
  "description": "Turn a script into a narrated MP3 with neural voices, and get subtitles that line up with it to the millisecond.",
  "seo_title": "TTSBolt | Free Text-to-Speech with MP3, WAV and Subtitle Export",
  "seo_description": "Narrate any text with 300+ neural voices, download the MP3 or WAV, and export SRT and VTT subtitles generated from the render itself. A different voice per paragraph, free and with no account.",
  "engineNeural": "Neural studio",
  "engineDevice": "Device (offline)",
  "engineNeuralHint": "The script travels to our own render endpoint, comes back as an MP3 with word-level timings, and is not stored anywhere. This is the engine that can be downloaded.",
  "engineDeviceHint": "Uses the voices installed on this computer. Nothing goes out over the network — and nothing can be saved either, since browsers offer no way to record their own speech synthesis.",
  "neuralUnavailable": "The render endpoint is not answering from this deployment, so downloads and subtitles are unavailable. Device voices still work for listening.",
  "qualityHigh": "96 kbps",
  "qualitySmall": "48 kbps",
  "noDeviceVoices": "No voices installed on this device",
  "deviceVoiceHint": "Device voices are picked in the bar above. The list comes from your operating system, so it is different on every machine.",
  "label_voice": "Voice",
  "label_speed": "Reading speed",
  "label_pitch": "Voice pitch",
  "label_volume": "Volume",
  "voiceCount": "{n} neural voices",
  "loadingVoices": "Loading voices…",
  "voicePickerTitle": "Choose a voice",
  "voiceSearchPlaceholder": "Search by name, language or locale…",
  "voiceAllLanguages": "All languages",
  "voiceAnyGender": "Any",
  "voiceFemale": "Female",
  "voiceMale": "Male",
  "voiceNoResults": "No voice matches that search.",
  "voiceMultilingual": "Multilingual",
  "voicePreview": "Preview",
  "scriptTitle": "Script",
  "textarea_placeholder": "Write or paste the text you want narrated…",
  "scriptHint": "Enter starts a new paragraph, Shift+Enter keeps a line break inside one. Every paragraph can carry its own voice — that is how a dialogue gets narrated.",
  "chars": "characters",
  "words": "words",
  "undoBtn": "Undo",
  "redoBtn": "Redo",
  "importBtn": "Import",
  "resetBtn": "Reset",
  "closeLabel": "Close",
  "blockInheritVoice": "Default voice",
  "blockPreview": "Play this paragraph",
  "blockAdd": "Add a paragraph below",
  "blockRemove": "Delete this paragraph",
  "blockResetOverride": "Back to the default",
  "blockRendering": "Rendering…",
  "blockDone": "Rendered",
  "blockError": "Render failed",
  "jumpToBlock": "Jump to this paragraph",
  "btn_generate": "Generate audio",
  "btn_rerender": "Re-render {n} changed",
  "btn_rendering": "Rendering {done}/{total} — click to stop",
  "btn_speak": "Speak it now",
  "btn_play": "Listen",
  "btn_pause": "Pause",
  "btn_stop": "Stop",
  "seekLabel": "Seek",
  "rewindLabel": "Back 5 seconds",
  "forwardLabel": "Forward 5 seconds",
  "longScriptHint": "That is {n} characters — expect about {r} render requests, one per paragraph.",
  "resultTitle": "Rendered narration",
  "cuesLabel": "subtitle cues",
  "staleWarning": "{n} paragraph(s) edited since this render",
  "downloadMp3": "MP3",
  "downloadWav": "WAV",
  "downloadScript": "Script",
  "history_title": "Recent scripts",
  "clear_history": "Clear",
  "importedNotice": "{name} imported. Nothing has been synthesised yet — press Generate when you are ready.",
  "errorRead": "That file could not be read as text.",
  "errorEmpty": "Write or paste something first.",
  "errorNoEngine": "The neural engine is unavailable right now. Device voices can still read the script aloud.",
  "errorBlockTooLong": "One paragraph is over {n} characters. Split it in two with Enter.",
  "errorOffline": "Could not reach the render endpoint. Check your connection and try again.",
  "errorBlockFailed": "Paragraph {n} could not be rendered. Try again, or give it a different voice.",
  "errorDevice": "This browser refused to speak that. Try a different device voice.",
  "errorPreview": "That voice could not be previewed.",
  "nextStepTitle": "Keep going",
  "nextStepHint": "Your render travels with you — no re-uploading",
  "nextCaptions": "Retime the subtitles",
  "nextTrim": "Trim & level it",
  "nextZip": "Package the audio",
  "howItWorksTitle": "How it works",
  "step1Title": "Bring in the script",
  "step1Text": "Type it, paste it, or drop in a .txt, .md, .srt or .vtt. Each paragraph becomes an editable block. Nothing is synthesised on arrival.",
  "step2Title": "Pick the voice",
  "step2Text": "Search over 300 neural voices by language, locale or gender, and hear a sample line before committing the whole script to one.",
  "step3Title": "Render it",
  "step3Text": "Each paragraph is rendered on its own and the engine reports where every word falls. That is what feeds the waveform and the subtitles.",
  "step4Title": "Take it away",
  "step4Text": "MP3 and WAV of the exact audio you just heard, plus SRT and VTT subtitles built from the same timings.",
  "features": [
    {
      "title": "Voices that sound like people",
      "text": "Over 300 neural voices across 140 locales, including multilingual ones that keep the same timbre when the script switches language."
    },
    {
      "title": "Subtitles that really line up",
      "text": "The SRT and VTT files are built from the word and sentence timings the engine reports for that exact render — not estimated from a reading speed."
    },
    {
      "title": "A voice per paragraph",
      "text": "Give each block its own voice and narrate a dialogue, an interview or an audiobook with several characters in a single pass."
    },
    {
      "title": "Prosody you control",
      "text": "Speed, pitch and volume as a script-wide default, and overridable block by block whenever one line needs a different delivery."
    },
    {
      "title": "Edit without starting over",
      "text": "Fix a typo in paragraph seven and only paragraph seven is rendered again. Everything already rendered stays exactly as it was."
    },
    {
      "title": "An engine with no network",
      "text": "The device engine reads your script with the voices your operating system already has, with no request going anywhere. Listening only: browsers give no way to record it."
    }
  ],
  "seoHeroTitle": "Turn any text into a narrated MP3 with subtitles",
  "seoHeroText": "Write or paste your script, choose from more than 300 neural voices, and get the finished audio together with SRT and VTT subtitles built from that very render. Every paragraph can take its own voice, its own speed and its own pitch, and editing one line only re-renders that line.",
  "seoHeroList": [
    "300+ neural voices in 140 locales",
    "MP3 and WAV of the exact take you heard",
    "SRT and VTT from the engine's own timings",
    "A different voice for each paragraph",
    "Offline device voices for instant listening",
    "No account, no watermark, no limits per day"
  ],
  "seoSecondaryTitle": "Narration and subtitles from one single render",
  "seoBrowserSpeedTitle": "Where the audio is made, in plain words",
  "seoBrowserSpeedText": "With the device engine everything happens inside this tab, using the voices your system already has. With the neural engine the script is sent to our own endpoint, synthesised and sent straight back: no third-party relay in the middle, nothing written to a database, and no copy kept once the response is delivered. It is the one part that is not local, and it is the part that makes the download and the subtitles possible.",
  "seoUseCaseTitle": "For narrating, studying and publishing",
  "seoUseCaseText": "Voice-over a video and drop the matching subtitles onto the timeline. Turn a long article into audio for the commute. Give a course its narration with one voice for the lesson and another for the examples. Proofread your own writing by ear, which catches clumsy sentences no spell-checker ever will. And when the audio is done, send the subtitles on to the subtitle tool without downloading anything.",
  "seoPrivacyTitle": "What we do and do not keep",
  "seoPrivacyText": "Your scripts, your history and your settings live in this browser and nowhere else. The neural engine receives only the paragraph it has to say out loud, and keeps nothing after answering. There is no account, no analytics on your text, and no log of what you had it read.",
  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "text to speech",
    "free TTS",
    "text to MP3",
    "neural voices",
    "AI voice over",
    "generate subtitles",
    "text to SRT",
    "narrate an article",
    "audiobook voice",
    "speech synthesis"
  ],
  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Can I download the audio, and is it the same as what I heard?",
      "answer": "Yes. The MP3 is the untouched stream the engine produced, stitched paragraph by paragraph with no re-encoding, so it is identical to what the player just played. The WAV is that same audio in an uncompressed form, for editors that prefer it."
    },
    {
      "question": "Do the subtitles really match the audio?",
      "answer": "They do, because they are not guessed. While it renders, the engine reports the exact instant every word and every sentence starts and how long it lasts. The SRT and VTT are built from those numbers, so they stay in sync even when the reading speed is changed."
    },
    {
      "question": "Does my text leave the browser?",
      "answer": "With device voices, never. With neural voices, the paragraph being narrated is sent to our own render endpoint, which returns the audio and keeps nothing. That is the honest answer: neural voices cannot run inside a browser tab without downloading a model of hundreds of megabytes."
    },
    {
      "question": "Is there a length limit?",
      "answer": "Each paragraph is capped at 3,000 characters, which is a page of text; longer imports are split at sentence boundaries automatically. The script as a whole has no cap, though a very long one means many requests and takes proportionally longer."
    },
    {
      "question": "Can I use several voices in one script?",
      "answer": "Yes, and that is the point of splitting it into paragraphs. Open any block and give it its own voice, speed, pitch or volume. Everything you do not override keeps following the script-wide default."
    },
    {
      "question": "If I fix a typo, does the whole thing render again?",
      "answer": "No. Each paragraph remembers the text and settings it was rendered with, so after an edit only the paragraphs that actually changed are sent again. On a long narration that is the difference between a few seconds and several minutes."
    },
    {
      "question": "Why do device voices sound different on each computer?",
      "answer": "Because they belong to the operating system, not to us: Windows, macOS, Android, iOS and ChromeOS each ship their own set. Installing extra language packs adds voices to that list. Neural voices, by contrast, sound the same everywhere."
    }
  ],
  "footerTagline": "Free, private and precise text-to-speech, with subtitles included.",
  "footerCredit": "Part of the oLoveTools suite",
  "contactForIdeas": "Ideas or bugs? Write to me:",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!"
};
