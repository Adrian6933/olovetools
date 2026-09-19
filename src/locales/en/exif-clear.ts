export default {
  "cleanBtn_one": "Clean {n} file",
  "badgeTags_one": "{n} tag",
  "resetHint": "Start over",
  "title": "EXIF Cleaner",
  "badge": "Image metadata cleaner",
  "description": "See every tag hidden inside a photo — coordinates, serial numbers, edit history — then remove exactly the ones you want. The pixels are never re-encoded.",
  "seo_title": "EXIF Cleaner | Remove GPS and Metadata From Photos Online",
  "seo_description": "Inspect and strip EXIF, GPS, XMP and IPTC metadata from JPEG, PNG, WebP and iPhone HEIC photos. Per-tag control, no quality loss, entirely in your browser.",

  "dropTitle": "Drop your photos here",
  "dropHint": "JPEG, PNG, WebP and iPhone HEIC — or press Ctrl+V anywhere on this page",
  "browseBtn": "Choose files",
  "pasteBtn": "Paste",
  "filesTitle": "Queue",
  "clearAllBtn": "Clear",
  "noFiles": "Nothing queued yet",
  "noFilesHint": "Adding a photo only reads its headers. Nothing is rewritten until you press the button.",
  "removeFile": "Remove from the queue",
  "badgeGps": "GPS",
  "badgeTags": "{n} tags",
  "badgeClean": "Clean",
  "customBadge": "custom",
  "doneBadge": "done",

  "errSize": "That file is larger than {max}.",
  "errFormat": "Only JPEG, PNG, WebP and HEIC files carry the metadata this tool reads.",
  "errHeic": "That HEIC could not be converted. Export it as JPEG from your phone and try again.",
  "errRead": "That file could not be read.",
  "errClean": "One of the files could not be rewritten and was left untouched.",
  "errNoClipboardImage": "There is no image in your clipboard.",
  "errClipboardBlocked": "Your browser blocked clipboard access. Press Ctrl+V over the page instead.",

  "statFiles": "Files",
  "statTags": "Tags",
  "statMetadata": "Metadata",
  "statCleaned": "Cleaned",
  "statSaved": "Bytes dropped",
  "statLeftover": "Tags left",
  "metaSize": "metadata {n}",

  "inspectorTitle": "What is inside",
  "afterLabel": "After cleaning",
  "compareBtn": "Hold to see the result",
  "undoLabel": "Undo",
  "redoLabel": "Redo",
  "emptyInspector": "Add a photo and every tag hidden inside it shows up here — before anything is changed.",
  "convertedNote": "HEIC files have to be re-encoded to JPEG before they can be rewritten, so this one is not byte-identical to the original.",
  "partialScan": "The byte scan stopped early on this file, so the list below may be incomplete.",
  "verifiedTitle": "{n} of metadata removed",
  "verifiedText": "This is not what we intended to remove — it is what a fresh parse of the finished file actually found.",

  "presetTitle": "What to remove",
  "presetFull": "Remove everything",
  "presetFullDesc": "Exif, GPS, XMP, IPTC, comments and the embedded preview.",
  "presetGps": "Location only",
  "presetGpsDesc": "Deletes the GPS tags and rebuilds the Exif block with everything else intact.",
  "presetIdentity": "Keep the photography",
  "presetIdentityDesc": "Drops coordinates, serial numbers, owner names and edit history; keeps exposure, lens and dates.",
  "presetCustom": "Manual",
  "presetCustomDesc": "Nothing is removed until you tick it yourself, tag by tag.",
  "resetSelection": "Back to the preset",

  "optKeepOrientation": "Keep the rotation flag",
  "optKeepOrientationHint": "Writes back a 30-byte Exif block holding nothing but Orientation, so portrait shots do not come out sideways.",
  "optRemoveIcc": "Also remove the colour profile",
  "optRemoveIccHint": "The ICC profile is not personal data and dropping it can visibly shift colours, so it stays by default.",

  "cleanBtn": "Clean {n} files",
  "cleaningLabel": "Cleaning…",
  "downloadBtn": "Download",
  "downloadZipBtn": "Download .zip",
  "shortcutsHint": "Ctrl+Enter cleans, Ctrl+Z and Ctrl+Shift+Z undo and redo your tag picks, ↑ ↓ walk the queue, Del removes a file, Ctrl+V pastes one in.",

  "alreadyCleanTitle": "Nothing to remove",
  "alreadyCleanText": "This file carries no Exif, no XMP, no IPTC and no embedded comments. It is already as anonymous as the format allows.",
  "gpsFoundTitle": "This photo knows where you were",
  "gpsAltitude": "Altitude",
  "gpsTime": "GPS clock",
  "copyCoords": "Copy coordinates",
  "copiedLabel": "Copied",
  "openMap": "Open in OpenStreetMap",
  "mapWarning": "That link opens a third-party site and hands it these coordinates. Nothing is sent unless you click it.",

  "blocksTitle": "Metadata blocks in the file",
  "selectAll": "All",
  "selectNone": "None",
  "blockExif": "Exif block — everything the camera recorded",
  "blockXmp": "XMP — editing history and author fields",
  "blockIptc": "IPTC / Photoshop — captions, credits, keywords",
  "blockIcc": "ICC colour profile — removing it can shift colours",
  "blockComment": "Text comment embedded in the file",
  "blockTime": "Last-modified timestamp",
  "blockOther": "Non-standard block",
  "iccWarnBadge": "affects colour",
  "thumbnailTitle": "Embedded preview image",
  "thumbnailText": "A second copy of the picture stored inside the Exif block. It is frequently the version from before you cropped or retouched anything.",
  "wholeBlockNotice": "The whole Exif block is selected for removal, so every tag below goes with it. Untick the block to pick tags one by one.",

  "catLocation": "Where it was taken",
  "catIdentity": "Who and which machine",
  "catTime": "When it was taken",
  "catSoftware": "What edited it",
  "catDevice": "The gear",
  "catCapture": "Exposure settings",
  "catImage": "The picture itself",

  "nextStepTitle": "Keep going",
  "nextStepHint": "The cleaned file travels with you — no re-upload",
  "nextCompress": "Compress it",
  "nextCrop": "Crop it",
  "nextWatermark": "Add a watermark",
  "nextFormat": "Change format",
  "nextCutout": "Cut the background",

  "howItWorksTitle": "How it works",
  "step1Title": "Bring the photos in",
  "step1Text": "Drop a batch, choose them from disk, or paste a screenshot. iPhone HEIC files are converted on arrival.",
  "step2Title": "Read what is inside",
  "step2Text": "Every tag is decoded and grouped: coordinates, serial numbers, exposure, edit history, hidden previews.",
  "step3Title": "Choose what goes",
  "step3Text": "Pick a preset or tick tags one at a time. Nothing is written until you press the button.",
  "step4Title": "Clean and check",
  "step4Text": "The finished file is parsed again from scratch and the tool shows you what actually survived.",

  "features": [
    {
      "title": "Real location-only cleaning",
      "text": "Removing the coordinates does not mean deleting the whole Exif block. The tag tree is rebuilt without the GPS directory, so aperture, lens and date stay exactly where they were."
    },
    {
      "title": "Tag by tag, if you want",
      "text": "Every field has its own checkbox. Drop the body serial number and keep the shutter speed, or start from nothing and pick manually."
    },
    {
      "title": "The pixels are never touched",
      "text": "Only header segments are rewritten. The compressed image data is copied byte for byte, so there is no second round of JPEG loss."
    },
    {
      "title": "Nothing leaves the tab",
      "text": "There is no upload, no endpoint and no account. The parser is JavaScript running on your machine, and it works with the network switched off."
    },
    {
      "title": "JPEG, PNG, WebP and HEIC",
      "text": "Including the WebP chunks and PNG text blocks most cleaners ignore. HEIC is converted to JPEG first, and the tool says so instead of pretending otherwise."
    },
    {
      "title": "It checks its own work",
      "text": "The result is re-parsed after writing and the leftover tag count is shown. If something survived, you see it rather than being told everything went fine."
    }
  ],

  "seoHeroTitle": "Every photo you send carries more than the picture",
  "seoHeroText": "A phone writes the coordinates of the room you were standing in, the exact second, the model of the handset and often its serial number. An edited file adds the software, the author field your editor filled in years ago, and a thumbnail of the shot as it looked before you cropped anything out of it. None of that is visible when you look at the image, and all of it travels with the file. This tool decodes those blocks, shows them to you in plain words, and rewrites the file without the parts you choose to lose.",
  "seoHeroList": [
    "Shows the coordinates before deleting them",
    "No re-encoding, no quality loss",
    "Runs offline once the page has loaded"
  ],
  "seoBrowserSpeedTitle": "Header surgery, not re-compression",
  "seoBrowserSpeedText": "Most tools strip metadata by loading the photo into a canvas and saving it again, which quietly re-compresses every pixel and can add several megabytes or throw away detail. Here the file is walked segment by segment and the ones you keep are copied unchanged, so the image data that comes out is identical to the image data that went in.",
  "seoSecondaryTitle": "A metadata cleaner that tells you what it found",
  "seoUseCaseTitle": "Listings, portfolios, dating profiles, forums",
  "seoUseCaseText": "The classic accident is a photo of something for sale, taken at home, posted with the coordinates of the front door attached. The same applies to a portfolio shot that still names the client, a screenshot carrying the editor that made it, or a picture shared in a public thread with the camera's serial number in it — the same number stamped on every other picture from that camera.",
  "seoPrivacyTitle": "It cannot leak what it never sends",
  "seoPrivacyText": "The file is read by the browser's own file API, parsed in memory and written back in memory. There is no server component and no analytics on the content. Coordinates found in a photo are shown to you and copied only if you ask; the map link is an ordinary link you have to click.",

  "seoKeywordsTitle": "Keywords",
  "seoKeywords": [
    "Remove EXIF data online",
    "Strip GPS from photo",
    "Image metadata remover",
    "Delete EXIF without losing quality",
    "View EXIF data online",
    "Remove metadata from PNG",
    "WebP metadata cleaner",
    "HEIC EXIF remover"
  ],

  "faqTitle": "Frequently asked questions",
  "faq": [
    {
      "question": "Does removing the metadata reduce the image quality?",
      "answer": "No. The compressed pixel data is copied across untouched — only the header blocks around it are rewritten. That is the difference between this and any tool that re-saves the picture through a canvas, which re-compresses everything it touches."
    },
    {
      "question": "Why did my photo end up sideways after cleaning it somewhere else?",
      "answer": "Because the rotation of most phone photos is not in the pixels, it is an Exif tag, and deleting the whole block deletes it too. The 'keep the rotation flag' option here writes back a minimal Exif block containing only Orientation, which is a few dozen bytes and gives away nothing."
    },
    {
      "question": "What is the difference between the presets?",
      "answer": "'Remove everything' deletes every metadata block in the file. 'Location only' rebuilds the Exif tag tree without the GPS directory and leaves the rest alone. 'Keep the photography' drops coordinates, serial numbers, owner names, edit history and the embedded preview but keeps exposure, lens and dates. 'Manual' removes nothing until you tick it."
    },
    {
      "question": "Which formats are supported?",
      "answer": "JPEG, PNG and WebP are rewritten byte by byte. HEIC and HEIF from an iPhone are converted to JPEG first, which does re-encode the picture — the tool marks those files so you know. AVIF and camera RAW files are not supported."
    },
    {
      "question": "What is the embedded preview and why does it matter?",
      "answer": "Cameras store a small JPEG copy of the shot inside the Exif block so previews load quickly. Some editors never regenerate it, so the preview can still show the uncropped, unretouched original of a photo you carefully edited before publishing."
    },
    {
      "question": "Is anything uploaded?",
      "answer": "No. Everything happens in your browser: the file is read locally, parsed in memory and written back in memory. You can disconnect from the network after the page loads and the tool keeps working."
    },
    {
      "question": "Should I remove the ICC colour profile too?",
      "answer": "Usually not. It describes how colours should be interpreted, not who you are, and removing it can visibly shift the colours of a wide-gamut photo on other screens. It is offered as a separate tick for the cases where you want the file as bare as possible."
    },
    {
      "question": "How do I know it actually worked?",
      "answer": "After writing, the finished file is parsed again from scratch and the result is what the panel reports. The 'tags left' counter is a genuine re-read, not a record of what the tool intended to do, and you can hold the compare button to see the after state in the same inspector."
    }
  ],

  "footerTagline": "Free, private, local image metadata inspector and cleaner.",
  "footerCredit": "Part of the oLoveTools suite",
  "contactForIdeas": "Contact for ideas and feedback:",
  "emailCopied": "Email copied to clipboard!",
  "emailAddress": "adrian.contact.me.69@gmail.com"
};
