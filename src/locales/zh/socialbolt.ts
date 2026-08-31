export default {
  "title": "SocialBolt",
  "description": "粘贴 TikTok 或 X 的链接，自己挑要带走的东西：无水印视频、HD 版本、MP3 音轨、封面，或轮播里的全部照片。",
  "heroKicker": "社交媒体下载工具",
  "noAutoNote": "粘贴链接不会下载任何东西。先由你挑文件，再按按钮。",
  "inputLabel": "链接（每行一条）",
  "placeholder": "https://www.tiktok.com/@user/video/…\nhttps://x.com/user/status/…",
  "unsupportedTag": "不支持",
  "shortcutHint": "Enter 解析 · Shift+Enter 换行 · Esc 清空",
  "btn_analyze": "解析链接",
  "btn_fetching": "解析中…",
  "btn_paste": "粘贴",
  "btn_cancel": "取消",
  "btn_clear": "清空队列",
  "btn_retry": "重试",
  "btn_remove": "移出队列",
  "btn_download": "下载",
  "btn_download_selected": "下载所选",
  "btn_download_zip": "打包成 ZIP",
  "queueTitle": "队列",
  "assetsTitle": "可取的文件",
  "selectAll": "全选",
  "selectNone": "取消选择",
  "status_queued": "等待中",
  "status_resolving": "正在读取该贴…",
  "status_ready": "就绪",
  "status_error": "失败",
  "manualTitle": "手动模式：粘贴文件直链",
  "manualHint": "跳过解析",
  "manualText": "如果你手上已经有文件的 CDN 直链，直接丢进来，SocialBolt 会跳过读取贴子和索取元数据，直接进入下载。",
  "manualPlaceholder": "https://v19.tiktokcdn-us.com/….mp4",
  "manualAdd": "添加",
  "assetVideo": "视频",
  "assetVideoHd": "HD 视频",
  "assetVideoNoWatermark": "无水印视频",
  "assetVideoWatermark": "带水印视频",
  "assetAudio": "音轨（MP3）",
  "assetCover": "封面图",
  "assetAvatar": "作者头像",
  "assetSlide": "幻灯片",
  "assetPhoto": "照片",
  "assetPoster": "视频封面帧",
  "assetThumbnail": "缩略图，最高分辨率",
  "assetThumbnailAlt": "缩略图，标准分辨率",
  "assetGif": "动图 GIF（MP4）",
  "assetDirect": "直链文件",
  "views": "播放",
  "likes": "点赞",
  "comments": "评论",
  "shares": "转发",
  "error_invalid_url": "这不是 SocialBolt 能读懂的链接。请用 TikTok、X、YouTube 或 Instagram 的地址。",
  "error_failed": "这条链接出了点问题。",
  "err_network": "联系不上服务器。检查一下网络再试。",
  "err_rate_limited": "TikTok 那边在限速。等几秒再试一次。",
  "err_not_found": "这条内容已经不在了，或者是私密的。",
  "err_bad_url": "地址里缺少内容的编号。",
  "err_unsupported_platform": "不支持这个平台。",
  "err_no_media": "这条内容里没有可下载的文件。",
  "err_instagram_blocked": "Instagram 拒绝了请求。它对绝大多数内容屏蔽服务器地址，只有少数公开内容能通过。",
  "err_resolver_unavailable": "解析服务暂时没有回应。过一分钟再试。",
  "err_resolve_failed": "读不到这条内容。",
  "err_download_failed": "文件没能下载下来。它的链接可能已经过期，重新解析一次这条内容。",
  "err_cancelled": "已取消。",
  "err_missing_url": "没有收到链接。",
  "warn_youtube_video": "YouTube 在这里只提供信息和缩略图：要取视频流得解开一层不断变化的签名，浏览器免费做不到。",
  "warn_no_media": "这条内容里没找到文件。",
  "supportTitle": "老实说，哪些真的能用",
  "supportTiktok": "完整支持：HD 视频、无水印视频、带水印原片、MP3 音轨、封面、作者头像，以及图集里的每一张照片。",
  "supportTwitter": "完整支持：视频的全部码率、动图 GIF、原始分辨率照片和封面帧。",
  "supportYoutube": "部分支持：标题、频道和各种分辨率的缩略图。视频流本身拿不到，卡片上写了原因。",
  "supportInstagram": "尽力而为：Instagram 屏蔽来自服务器的请求，只有部分公开内容能解析出来。",
  "howTitle": "怎么用",
  "howSteps": [
    {
      "title": "粘贴链接",
      "text": "一条或多条，每行一条。SocialBolt 只标出每条链接属于哪个平台就停下：你不发话，它不会去要任何东西。"
    },
    {
      "title": "挑要带走的",
      "text": "这条内容的每个版本都列出来，带着体积。勾上想要的，其余的一律不下载。"
    },
    {
      "title": "下载，或者接着做",
      "text": "一个文件单独下来，多个打成 ZIP。也可以不保存，直接把结果送到另一个 oLoveTools 工具里。"
    }
  ],
  "features": [
    {
      "title": "无水印，也不二次压缩",
      "text": "TikTok 的视频取自原始轨道，不会再压一遍。需要的话，带水印的原片也照样给。"
    },
    {
      "title": "清晰度由你定",
      "text": "TikTok 有 HD 和标准两档，X 有它发布的全部码率，每一行都写着分辨率。"
    },
    {
      "title": "一次多条链接",
      "text": "整份清单粘进来即可。链接按解析服务允许的节奏逐条处理，失败的那条可以单独重试。"
    },
    {
      "title": "音频、封面和头像",
      "text": "声音的 MP3、完整分辨率的封面、作者的头像都是独立文件，不用你自己去裁。"
    },
    {
      "title": "你的链接只留在这里",
      "text": "地址只发往我们自己的函数：没有第三方 CORS 中转，没有追踪，回应之后什么都不留。"
    },
    {
      "title": "和其他工具串起来",
      "text": "视频送去 FrameSnap 或 GIFBolt，图片送去 CropSnap 或 MemeBolt，不必下载再上传一遍。"
    }
  ],
  "nextStepTitle": "接着做",
  "nextStepHint": "文件跟着你走，不用重新上传",
  "nextFrames": "抽取帧",
  "nextGif": "做成 GIF",
  "nextCrop": "裁剪",
  "nextCompress": "压缩",
  "nextCutout": "去掉背景",
  "nextWatermark": "加水印",
  "nextMeme": "做个梗图",
  "scrollTopLabel": "回到顶部",
  "seo_title": "SocialBolt | 下载无水印 TikTok 视频和 X 视频",
  "seo_description": "粘贴 TikTok 或 X 的链接，下载无水印视频、HD 版本、MP3 音轨、封面或轮播里的全部照片。不用注册，也不用安装。",
  "seoHeroTitle": "一个会说明自己边界的下载工具",
  "seoHeroText": "多数下载站号称支持所有平台，最后给你一个坏文件或一串跳转。SocialBolt 在自己的服务器函数里解析链接，列出这条内容真正包含的每个文件，并且直说免费的网络到哪儿为止。",
  "seoHeroList": [
    "无水印、HD 的 TikTok",
    "X 视频的全部码率",
    "音频、封面和头像分开",
    "批量队列，打包 ZIP"
  ],
  "seoBrowserSpeedTitle": "不经第三方中转",
  "seoBrowserSpeedText": "旧版本把你的链接丢给陌生人运营的公共 CORS 中转。现在请求只发到 oLoveTools 自己的函数，而文件本身在 CDN 允许时由你的浏览器直接取回。",
  "seoSecondaryTitle": "给之后还要剪这些素材的人",
  "seoUseCaseTitle": "给创作者和剪辑师",
  "seoUseCaseText": "换号之前备份自己的作品，为一次剪辑收集参考片段，扒下某个热门的声音，或者取一张完整分辨率的封面当缩略图。",
  "seoPrivacyTitle": "会存下什么：什么都不存",
  "seoPrivacyText": "链接只用来回应这一次请求，不写进任何数据库。下载的文件在你浏览器的内存里拼好，由你自己保存，从不停留在服务器上。",
  "seoKeywordsTitle": "相关搜索",
  "seoKeywords": [
    "下载 tiktok",
    "无水印 tiktok 下载",
    "tiktok 转 mp3",
    "下载 X 视频",
    "推特视频下载",
    "tiktok 图集下载",
    "youtube 封面下载",
    "社交媒体下载工具"
  ],
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "真的能去掉 TikTok 的水印吗？",
      "answer": "能。TikTok 自己就提供一份干净的轨道，你拿到的就是它；带水印的版本单独列一行，需要时再取。"
    },
    {
      "question": "为什么下载不了 YouTube 视频？",
      "answer": "因为在浏览器或小服务器上免费做不到：YouTube 的流用一层不断变化的签名保护，只有它自己的播放器才能解开。与其假装能做，SocialBolt 直接给你信息和缩略图。"
    },
    {
      "question": "Instagram 呢？",
      "answer": "Instagram 关掉了公开接口，并且拒绝来自服务器地址的请求，所以只有一部分公开内容解析得出来。解析不出来时，工具会直说，而不是一直转圈。"
    },
    {
      "question": "可以一次下载多条链接吗？",
      "answer": "可以。每行粘一条，它们会排进队列。选了不止一个文件时，会打包成一个 ZIP 一起下来。"
    },
    {
      "question": "下载这些视频合法吗？",
      "answer": "个人使用——备份自己的作品、给剪辑当参考——通常没问题。未经许可转发他人内容或用于商业用途则不然。这部分要你自己把握。"
    }
  ],
  "footerTagline": "给创作者的干净、诚实又快的工具。",
  "footerCredit": "oLoveTools 工具集的一部分"
};
