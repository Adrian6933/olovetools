export default {
  "resetHint": "Start over",
  "title": "SocialBolt",
  "description": "Paste a TikTok or X link and pick exactly what you take: video without watermark, HD track, MP3 audio, cover art or every photo in the carousel.",
  "heroKicker": "Social media downloader",
  "noAutoNote": "Pasting a link downloads nothing. You choose the files, then you press the button.",
  "inputLabel": "Links (one per line)",
  "placeholder": "https://www.tiktok.com/@user/video/…\nhttps://x.com/user/status/…",
  "unsupportedTag": "Not supported",
  "shortcutHint": "Enter to analyse · Shift+Enter for a new line · Esc clears",
  "btn_analyze": "Analyse links",
  "btn_fetching": "Analysing…",
  "btn_paste": "Paste",
  "btn_cancel": "Cancel",
  "btn_clear": "Clear queue",
  "btn_retry": "Try again",
  "btn_remove": "Remove from queue",
  "btn_download": "Download",
  "btn_download_selected": "Download selection",
  "btn_download_zip": "Download as ZIP",
  "queueTitle": "Queue",
  "assetsTitle": "Available files",
  "selectAll": "Select all",
  "selectNone": "Clear selection",
  "status_queued": "Waiting",
  "status_resolving": "Reading the post…",
  "status_ready": "Ready",
  "status_error": "Failed",
  "manualTitle": "Manual mode: paste a direct media link",
  "manualHint": "Skips the resolver",
  "manualText": "If you already have the direct CDN address of the file, drop it here and SocialBolt goes straight to downloading it — no post to read, no metadata request.",
  "manualPlaceholder": "https://v19.tiktokcdn-us.com/….mp4",
  "manualAdd": "Add",
  "assetVideo": "Video",
  "assetVideoHd": "Video in HD",
  "assetVideoNoWatermark": "Video without watermark",
  "assetVideoWatermark": "Video with watermark",
  "assetAudio": "Audio track (MP3)",
  "assetCover": "Cover image",
  "assetAvatar": "Author avatar",
  "assetSlide": "Slide",
  "assetPhoto": "Photo",
  "assetPoster": "Video poster",
  "assetThumbnail": "Thumbnail, best resolution",
  "assetThumbnailAlt": "Thumbnail, standard resolution",
  "assetGif": "Animated GIF (MP4)",
  "assetDirect": "Direct file",
  "views": "views",
  "likes": "likes",
  "comments": "comments",
  "shares": "shares",
  "error_invalid_url": "That is not a link SocialBolt can read. Use a TikTok, X, YouTube or Instagram address.",
  "error_failed": "Something went wrong with that link.",
  "err_network": "Could not reach the server. Check your connection and try again.",
  "err_rate_limited": "The TikTok resolver is rate limiting us. Wait a few seconds and retry.",
  "err_not_found": "That post no longer exists, or it is private.",
  "err_bad_url": "The address is missing the post id.",
  "err_unsupported_platform": "That platform is not supported.",
  "err_no_media": "The post carries no downloadable media.",
  "err_instagram_blocked": "Instagram refused the request. It blocks server addresses for most posts, so only a few public ones come through.",
  "err_resolver_unavailable": "The resolver is not answering right now. Try again in a minute.",
  "err_resolve_failed": "Could not read that post.",
  "err_download_failed": "The file could not be downloaded. Its link may have expired — analyse the post again.",
  "err_cancelled": "Cancelled.",
  "err_missing_url": "No link was sent.",
  "warn_youtube_video": "For YouTube only the metadata and the thumbnails are available here: downloading the video stream needs signature decryption that no browser can do for free.",
  "warn_no_media": "No media found in this post.",
  "supportTitle": "What actually works, honestly",
  "supportTiktok": "Complete: video in HD, video without watermark, the watermarked original, MP3 audio, cover art, author avatar and every photo of a slideshow.",
  "supportTwitter": "Complete: every bitrate of the video, animated GIFs, photos at original resolution and the poster frame.",
  "supportYoutube": "Partial: title, channel and thumbnails in every resolution. The video stream itself is not available — the card explains why.",
  "supportInstagram": "Best effort: Instagram blocks requests coming from servers, so only some public posts resolve.",
  "howTitle": "How it works",
  "howSteps": [
    {
      "title": "Paste the links",
      "text": "One or several, one per line. SocialBolt marks the platform of each one and stops there: nothing is fetched until you say so."
    },
    {
      "title": "Pick what you take",
      "text": "Every version of the post is listed with its size. Tick the ones you want — the rest is never downloaded."
    },
    {
      "title": "Download or keep working",
      "text": "One file downloads on its own, several arrive in a ZIP. Or send the result straight to another oLoveTools tool without saving it first."
    }
  ],
  "features": [
    {
      "title": "No watermark, no re-encoding",
      "text": "TikTok videos come from the source track, so nothing is compressed a second time. The watermarked original is offered as well when you need it."
    },
    {
      "title": "You choose the quality",
      "text": "HD or standard on TikTok, and every bitrate X published for its videos, with the resolution written on each row."
    },
    {
      "title": "Several links at once",
      "text": "Paste a whole list. Each link is resolved in turn, at the pace the resolver allows, and any that fails can be retried on its own."
    },
    {
      "title": "Audio, covers and avatars",
      "text": "The MP3 of the sound, the cover at full resolution and the author avatar are separate files, not something you have to crop out yourself."
    },
    {
      "title": "Your link stays here",
      "text": "The address travels to our own function and nowhere else — no third-party CORS proxies, no tracking, nothing kept after the answer."
    },
    {
      "title": "Chained to the other tools",
      "text": "Send the video to FrameSnap or GIFBolt, or the image to CropSnap or MemeBolt, without downloading and uploading it again."
    }
  ],
  "nextStepTitle": "Keep going",
  "nextStepHint": "The file travels with you — no re-upload",
  "nextFrames": "Extract frames",
  "nextGif": "Turn it into a GIF",
  "nextCrop": "Crop it",
  "nextCompress": "Compress it",
  "nextCutout": "Remove the background",
  "nextWatermark": "Add a watermark",
  "nextMeme": "Make a meme",
  "scrollTopLabel": "Back to top",
  "seo_title": "SocialBolt | Download TikTok videos without watermark and X videos",
  "seo_description": "Paste a TikTok or X link and download the video without watermark, in HD, its MP3 audio, the cover or every photo of the carousel. No account and no install.",
  "seoHeroTitle": "A downloader that tells you what it can and cannot do",
  "seoHeroText": "Most social downloaders promise every platform and then hand you a broken file or a chain of redirects. SocialBolt resolves the link on its own server function, lists every file the post really contains, and says plainly where the free web ends.",
  "seoHeroList": [
    "TikTok without watermark, in HD",
    "Every bitrate of an X video",
    "Audio, covers and avatars apart",
    "Batch queue with ZIP output"
  ],
  "seoBrowserSpeedTitle": "No third-party proxies",
  "seoBrowserSpeedText": "The previous version routed your link through public CORS proxies run by strangers. Now the request goes to oLoveTools' own function, and the file itself is pulled straight from the platform CDN by your browser whenever the CDN allows it.",
  "seoSecondaryTitle": "Made for people who work with the clips afterwards",
  "seoUseCaseTitle": "For creators and editors",
  "seoUseCaseText": "Back up your own posts before an account change, gather reference clips for an edit, pull the sound of a trend, or grab a cover at full resolution for a thumbnail.",
  "seoPrivacyTitle": "What is stored: nothing",
  "seoPrivacyText": "The link is used to answer your request and is not written to any database. The downloaded file is assembled in your browser's memory and saved by you — it never sits on a server.",
  "seoKeywordsTitle": "Related searches",
  "seoKeywords": [
    "tiktok downloader",
    "download tiktok without watermark",
    "tiktok mp3",
    "download x video",
    "twitter video downloader",
    "tiktok slideshow download",
    "youtube thumbnail download",
    "social media downloader"
  ],
  "faqTitle": "Frequently Asked Questions",
  "faq": [
    {
      "question": "Does it really remove the TikTok watermark?",
      "answer": "Yes. TikTok itself serves a clean copy of the track and that is the one you get; the watermarked version is offered as a separate row in case you need it."
    },
    {
      "question": "Why can I not download YouTube videos?",
      "answer": "Because it cannot be done for free from a browser or a small server: YouTube's streams are protected by a signature that changes constantly and needs its own player to be decrypted. Rather than pretend, SocialBolt gives you the metadata and the thumbnails."
    },
    {
      "question": "And Instagram?",
      "answer": "Instagram closed its public endpoints and refuses requests coming from server addresses, so only part of the public posts can be resolved. When it fails, the tool says so instead of spinning forever."
    },
    {
      "question": "Can I download several links at once?",
      "answer": "Yes. Paste one per line and they are queued. If you pick more than one file, they come down together in a ZIP."
    },
    {
      "question": "Is it legal to download these videos?",
      "answer": "Downloading for personal use — a backup of your own posts, a reference for an edit — is generally accepted. Republishing someone else’s content or using it commercially without permission is not. That part is on you."
    }
  ],
  "footerTagline": "Clean, honest, fast tools for social creators.",
  "footerCredit": "Part of the oLoveTools suite"
};
