export default {
  "resetHint": "Start over",
  "title": "MorseFlow",
  "label_text": "Text",
  "label_morse": "Morse",
  "label_reference": "Morse Reference",
  "button_play": "Play",
  "button_stop": "Stop",
  "button_reset": "Reset",
  "tooltip_copy": "Copy",
  "tooltip_mute": "Mute",
  "tooltip_unmute": "Unmute",
  "seoPrivacyTitle": "100% Private & Secure",
  "seoPrivacyText": "Your content never leaves this tab: it is not uploaded, stored or logged anywhere. The site does count how many times each tool is opened, as a plain total with no cookie and no identifier — nothing that could tie a visit to you.",
  "faqTitle": "Frequently Asked Questions",
  "footerCredit": "Part of the oLoveTools suite",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "Copied!",
  "contactForIdeas": "Contact for ideas and comments:",
  "heroBadge": "Keyer + reader",
  "badgeSource": "source",
  "placeholderText": "SOS HELP",
  "issuesTitle": "{n} characters have no Morse equivalent, shown as {mark}:",
  "labelTimeline": "Timeline",
  "wpmShort": "wpm",
  "badgeFarnsworth": "farnsworth",
  "labelCharSpeed": "Character wpm",
  "labelOverall": "Overall wpm",
  "labelTone": "Tone (Hz)",
  "labelWave": "Waveform",
  "waveSine": "Sine",
  "waveSquare": "Square",
  "waveTriangle": "Triangle",
  "waveSaw": "Sawtooth",
  "buttonWav": "Download as WAV",
  "buttonCopyBoth": "Copy both",
  "tabListen": "Listen",
  "listenIntro": "Open a recording or use the microphone. The tone is found by sweeping the band, the on/off threshold comes from the recording itself, and the unit length is measured from the run lengths — so nothing here assumes 600 Hz or 20 wpm.",
  "buttonOpenAudio": "Open a recording",
  "buttonRecord": "Record from the mic",
  "buttonStopRecording": "Stop recording",
  "buttonAnalyse": "Decode it",
  "parkedHint": "waiting — nothing has been analysed yet",
  "heardTone": "Tone",
  "heardUnit": "Unit",
  "heardWpm": "Speed",
  "heardConfidence": "Separation",
  "listenFail_no-audio": "That recording is too short to read.",
  "listenFail_no-tone": "No steady tone was found between 250 and 1600 Hz.",
  "listenFail_no-elements": "The tone was found but the marks and spaces did not separate cleanly.",
  "listenFailGeneric": "Nothing readable came out of that recording.",
  "ref_letters": "Letters",
  "ref_digits": "Digits",
  "ref_punctuation": "Punctuation",
  "ref_accented": "Accented",
  "ref_prosigns": "Prosigns",
  "errorAudio": "This browser would not give the page an audio context.",
  "errorRender": "This browser cannot render audio offline.",
  "errorTooLarge": "That recording is too big.",
  "errorDecodeAudio": "That file could not be decoded as audio.",
  "errorMic": "The microphone was not available.",
  "errorRead": "That file could not be read.",
  "errorFormat": "Drop a text file or a recording.",
  "errorClipboard": "The clipboard is not available on this page.",
  "handoffReceived": "Received from {tool}.",
  "nextStepTitle": "Keep going",
  "nextStepHint": "The message travels with you — no download, no re-upload",
  "nextAudio": "Edit the audio",
  "nextBinary": "Convert to binary",
  "nextQr": "Make a QR",
  "nextWordflow": "Count the text",
  "nextBase64": "Encode it",
  "seo_description": "Translate text to Morse and back, hear it at any speed with Farnsworth spacing, export it as a WAV, and decode a recording back into text — all in your browser, nothing uploaded.",
  "seoHeroText": "A keyer and a receiver in one page: the full ITU alphabet with punctuation and prosigns, standard PARIS timing with Farnsworth spacing, and a decoder that reads Morse back out of a recording.",
  "heroText": "Type on either side and the other follows. Nothing is dropped without saying so, the timing is the one the standard specifies, and a recording can go back the other way — tone, speed and threshold all measured rather than assumed.",
  "seoHeroList": [
    "Punctuation and prosigns",
    "Standard PARIS timing",
    "Farnsworth spacing",
    "Decodes a recording"
  ],
  "seoSecondaryTitle": "Both directions, and neither of them guessing",
  "howItWorksTitle": "How it works",
  "step1Title": "Type it",
  "step1Text": "Either box drives the other. Punctuation, accented letters and prosigns like <SK> are all in the table, and anything that genuinely has no code is marked rather than deleted.",
  "step2Title": "Shape the sending",
  "step2Text": "Character speed and overall speed are separate dials, which is what Farnsworth means. Tone and waveform are yours too, and the timeline shows every dit, dah and gap at its real length before you press play.",
  "step3Title": "Or let it listen",
  "step3Text": "Open a recording or use the microphone. It sweeps for the carrier, thresholds the envelope with Otsu, clusters the run lengths to find the unit, and reports the tone, the speed and how cleanly it separated.",
  "step4Title": "Take it with you",
  "step4Text": "Copy either side, download the tone as a WAV rendered offline at full quality, or hand the message straight to another tool in the suite.",
  "features": [
    {
      "title": "The whole alphabet",
      "text": "Letters, digits, the eighteen punctuation marks, the national accented letters, and the prosigns operators actually send. Anything with no code is flagged instead of quietly deleted."
    },
    {
      "title": "One oscillator, one envelope",
      "text": "The whole message is a single tone gated by a scheduled gain curve with 5 ms ramps, rather than one oscillator per dit. Fewer nodes, no key clicks, and one audio context reused instead of a new one per press."
    },
    {
      "title": "It can hear",
      "text": "Point it at a recording or the microphone. A Goertzel sweep finds the carrier, Otsu thresholds the envelope, and clustering the run lengths gives the unit — so tone and speed are measured, not assumed."
    },
    {
      "title": "Farnsworth, properly",
      "text": "Character speed and overall speed are separate, with the extra time spread over the gaps in the 3:4 ratio the ARRL specifies. That is how you learn to hear letters instead of counting dots."
    },
    {
      "title": "A timeline you can read",
      "text": "Every dit, dah and gap drawn at its real length, with the playhead moving across it. Hovering a block tells you how many milliseconds it lasts."
    },
    {
      "title": "Export the tone",
      "text": "Rendered offline into a 16-bit WAV at 44.1 kHz, so it can go into a video, a lesson or a ringtone without re-recording it off the speakers."
    },
    {
      "title": "Nothing is uploaded",
      "text": "Translation, synthesis and decoding all happen in this tab. The microphone stream never leaves the page and no recording is stored anywhere."
    },
    {
      "title": "Hands off to the rest of the suite",
      "text": "Send the message straight to AudioSnap, Binary-Flow, QR Bolt or WordFlow without downloading and re-uploading it."
    }
  ],
  "seoBrowserSpeedTitle": "The browser is the transmitter",
  "seoBrowserSpeedText": "Web Audio synthesises the tone, an offline context renders the WAV, and decodeAudioData plus a Goertzel filter read a recording back. None of it needs a server, an account or a network request, and closing the tab is all it takes for the message and the recording to be gone.",
  "seoUseCaseTitle": "For learning it, and for reading it",
  "seoUseCaseText": "Learning Morse means hearing characters at full speed with room between them, which is exactly what Farnsworth spacing is for, so character speed and overall speed are separate here. Reading it means the other direction: a clip from a film, a beacon recorded off a receiver, a puzzle someone sent as an audio note. Both live on the same page, and the second one tells you what it measured — the tone in hertz, the unit in milliseconds, the resulting words per minute and how cleanly the marks separated from the spaces — so a wrong answer can be argued with instead of just being wrong.",
  "seoKeywords": [
    "morse code translator",
    "morse decoder",
    "text to morse",
    "morse audio",
    "farnsworth timing",
    "morse from audio",
    "cw practice",
    "morse alphabet"
  ],
  "faq": [
    {
      "question": "Is my text or my recording sent anywhere?",
      "answer": "No. Translation, tone synthesis, WAV rendering and audio decoding all run inside your browser. The microphone stream never leaves the page and nothing is stored between visits."
    },
    {
      "question": "Which characters are supported?",
      "answer": "The full ITU set: A–Z, 0–9, eighteen punctuation marks, the national accented letters (À, Ä, Ç, É, Ñ, Ö, Ü, ß and friends) and the common prosigns, which you type in angle brackets like <SK>. A character with no Morse equivalent is marked with # and listed, rather than dropped."
    },
    {
      "question": "What is the difference between character speed and overall speed?",
      "answer": "That is Farnsworth spacing. The dits and dahs are sent at the character speed you set, while the gaps between letters and words are stretched until the whole message comes out at the overall speed. It is how you learn to recognise a letter by its rhythm instead of counting elements."
    },
    {
      "question": "How does it decode a recording?",
      "answer": "It sweeps 250–1600 Hz with a Goertzel filter to find the carrier, measures the magnitude at that one frequency in 5 ms windows to get an envelope, picks the on/off threshold with Otsu’s method, and clusters the resulting run lengths to find the unit. Tone, unit length, speed and the separation between the two clusters are all reported."
    },
    {
      "question": "The decoder got it wrong. Why?",
      "answer": "Look at the separation figure and the envelope graph. A noisy recording, a fading signal or a hand-sent fist with uneven spacing makes the marks and spaces overlap, and when they overlap there is no threshold that splits them correctly. Trimming the clip to the cleanest part usually fixes it."
    },
    {
      "question": "Can I use the audio elsewhere?",
      "answer": "Yes. The WAV is rendered offline at 44.1 kHz, 16-bit mono, at whatever tone, waveform and speed you set, so it drops straight into a video or a lesson."
    }
  ],
  "seoKeywordsTitle": "Related searches",
  "footerTagline": "Morse both ways: keyed, heard, and measured.",
  "footer_seo_title": "Timing is the whole of Morse",
  "footer_seo_paragraph1": "A dot and a dash are not two symbols so much as one symbol at two lengths, and everything else in Morse is silence of three prescribed durations. The standard word PARIS is fifty units long counting the space after it, which is where the familiar figure comes from: at twenty words per minute a unit is sixty milliseconds, a dit is one unit, a dah is three, the gap inside a letter is one, between letters three, and between words seven. Get any of those wrong and the rhythm stops being readable long before the individual elements do, which is why a player that spends two units on the letter gap instead of three sounds subtly rushed without ever being obviously wrong. Every duration here comes from that table rather than from a constant that happened to sound right.",
  "footer_seo_paragraph2": "Reading Morse out of a recording is the same table used backwards, and the difficulty is that none of the numbers are known in advance. The tone could be anywhere a receiver happened to put it; the speed is whatever the operator felt like; the line between \"loud enough to be a mark\" and \"background\" depends on the recording rather than on any constant. So each one is derived: the carrier from a Goertzel sweep of the band, the threshold from Otsu's method on the envelope histogram, and the unit from the two clusters the run lengths naturally fall into, since a dah is three times a dit and no hand is uneven enough to erase that ratio entirely. When the recording is too rough for those clusters to separate, that shows up as a low separation figure, and the honest answer is to say so rather than to print confident nonsense.",
  "seo_title": "MorseFlow | Morse Code Translator, Player and Audio Decoder",
  "seoHeroTitle": "Morse Code Translator & Audio Decoder"
};
