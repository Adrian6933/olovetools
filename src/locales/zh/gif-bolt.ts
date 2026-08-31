export default {
  "title": "GIFBolt",
  "description": "从视频里抽帧，或把一组图片排成序列，编辑时间轴，再用全局调色板和帧间压缩导出 GIF——全部在浏览器里完成。",
  "tab_video": "视频转 GIF",
  "tab_images": "多图合成 GIF",
  "label_upload_video": "上传视频",
  "label_upload_images": "上传图片",
  "label_duration": "帧延迟 (毫秒)",
  "label_fps": "帧率 (FPS)",
  "label_size": "GIF 宽度",
  "label_quality": "压缩画质",
  "label_trim": "裁剪时间范围",
  "label_start": "开始时间",
  "label_end": "结束时间",
  "btn_generate": "生成 GIF",
  "btn_generating": "正在合成 GIF...",
  "btn_download": "下载 GIF",
  "text_progress_extract": "正在提取视频帧...",
  "text_progress_compile": "正在合并压缩帧...",
  "history_title": "最近生成的 GIF",
  "no_history": "暂无生成历史。",
  "clear_history": "清除历史",
  "quality_high": "高清画质",
  "quality_medium": "中等画质",
  "quality_low": "低画质 (生成极快)",
  "drop_zone_video": "MP4、WebM、MOV、MKV、AVI，或 PNG、JPG、WebP、AVIF、GIF、BMP 和 HEIC 图片。",
  "drop_zone_images": "PNG、JPG、WebP、AVIF、GIF、BMP 和 HEIC。按你希望播放的顺序拖进来。",
  "seo_title": "GIFBolt | 免费在线视频转 GIF 与多图合成 GIF 工具",
  "seo_description": "在浏览器里把视频或图片序列转成 GIF 动图：可编辑时间轴、全局调色板、Floyd–Steinberg 抖动和帧间压缩。什么都不上传。",
  "seoHeroTitle": "在浏览器里，把视频或一堆图片变成 GIF",
  "seoHeroText": "从片段里抽帧，编辑时间轴，再用全局调色板、抖动和帧间压缩导出。什么都不上传。",
  "seoHeroList": [
    "编码之前，帧一直可以改",
    "整个循环共用一套调色板",
    "不上传，也不下载"
  ],
  "seoBrowserSpeedTitle": "一个真正的 GIF 编码器，不是画布导出",
  "seoBrowserSpeedText": "帧是从已解码的视频里直接读取的，采用高质量缩放，中途绝不经过 JPEG。调色板对整段动画做中位切分得出，像素用蛇形扫描的 Floyd–Steinberg 抖动映射，而一帧与前一帧相同的部分会写成透明并被继承。工作被拆给一组 web worker，所以页面依然跟手，进度条跟的是真实帧数。",
  "seoUseCaseTitle": "适合缺陷复现、演示和反应循环",
  "seoUseCaseText": "把一个 bug 录一次，剪到真正关键的那四秒。把设计走查变成能在 pull request 里自动播放的东西。或者排几张截图，手工定好每张停多久。在你按下编码之前，时间轴一直可以改。",
  "seoPrivacyTitle": "不上传，也不下载",
  "seoPrivacyText": "每一步都在这个标签页里跑：视频解码用的是浏览器自己的解码器，量化器和 LZW 压缩器是随页面一起送达的 JavaScript，结果是一个从不离开你机器的 Blob。没有可以发文件的服务器，也没有要从 CDN 拉的模型或编解码器。代价说清楚：一切都受限于你的内存，所以 4K 片段得先剪短、缩小才编得动。",
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "有文件大小限制吗？",
      "answer": "没有写死的限制，但有实实在在的限制：帧就放在这个标签页的内存里。480 像素宽、4 秒、12 fps 的 GIF 大约是 50 MB 的工作数据，几秒钟就能编完；4K 片段则会在编完之前先把标签页耗尽。把范围剪短、把工作尺寸调低——那些控件就是干这个用的。"
    },
    {
      "question": "为什么我的 GIF 还是这么大？",
      "answer": "GIF 是 1987 年的格式：256 色，没有运动补偿。先减宽度，再减帧率，最后减调色板。把「复用没有变化的像素」保持开启，通常比这三样加起来还管用：录屏文件的大部分体积会因此消失。"
    },
    {
      "question": "为什么帧率不是我选的那个数？",
      "answer": "GIF 把每个延时存成百分之一秒，所以只存在 100/n 形式的帧率。要 12 fps 实际上是每帧 8 个单位，也就是 12.5。面板上显示的是你真正会得到的帧率，而不是你要求的那个。"
    },
    {
      "question": "能吃哪些格式？",
      "answer": "浏览器能播的视频都行——MP4/H.264、WebM、MOV，很多时候还有 MKV；图片方面支持 PNG、JPG、WebP、AVIF、GIF、BMP 和 iPhone 的 HEIC。作为图片放进来的 GIF 动图，只会贡献它的第一帧。"
    },
    {
      "question": "有东西会被上传吗？",
      "answer": "不会。没有上传步骤，也没有任何外部请求：编码器随页面一起送到，在这个标签页的 web worker 里运行。"
    },
    {
      "question": "可以保留透明吗？",
      "answer": "可以，打开「保留透明」开关。GIF 只支持一种完全透明的颜色，所以柔和的边缘会变成硬边。它不能和像素复用同时使用，因为两者需要同一个透明槽位。"
    }
  ],
  "footerTagline": "免费、安全且高度可定制的客户端本地 GIF 创建工具。",
  "footerCredit": "oLoveTools 实用工具集成员",
  "badge": "视频与图片 → GIF",
  "dropTitle": "拖入一段视频或一组图片",
  "dropHintNothing": "拖入文件不会启动任何处理：设置由你选，按钮由你按。",
  "modeAuto": "抽取一段",
  "modeManual": "手动挑选帧",
  "manualHint": "拖动视频进度，只添加你要的那几帧。完全不会跑任何自动流程。",
  "btnCapture": "采集这一帧",
  "labelWorkingSize": "工作尺寸",
  "extractSummary": "{1}×{2}，共 {0} 帧。从这里开始，GIF 只能往小了调。",
  "btnExtract": "抽取帧",
  "btnExtractAgain": "重新抽取",
  "waitingHint": "设好范围再按按钮。在那之前什么都不会运行。",
  "btnPlay": "播放",
  "btnPause": "暂停",
  "btnPrevFrame": "上一帧",
  "btnNextFrame": "下一帧",
  "btnUndo": "撤销",
  "btnRedo": "重做",
  "frameSummary": "{0} 帧 · 实际 {1} fps",
  "btnSelectAll": "全选",
  "btnSelectNone": "取消选择",
  "btnDeleteSelected": "删除 {0} 帧",
  "btnKeepSelected": "只保留这些",
  "btnReverse": "倒序",
  "btnPingPong": "来回播放",
  "btnHalve": "隔帧丢弃",
  "btnAddImages": "添加图片",
  "btnResetDelays": "重置节奏",
  "delayHint": "GIF 用百分之一秒记录延时，所以数值会对齐到最接近的 10 毫秒，且不会低于 20。",
  "outputTitle": "输出",
  "qualityCustom": "自定义",
  "labelDiff": "复用没有变化的像素",
  "diffHint": "只写入两帧之间动过的部分。录屏场景下这是最大的一笔节省。",
  "showAdvanced": "细调参数",
  "hideAdvanced": "收起细节",
  "labelColors": "调色板大小",
  "labelDither": "抖动",
  "ditherHint": "用一点噪点换掉平铺调色板在渐变上留下的色带。",
  "labelDitherStrength": "抖动强度",
  "labelTolerance": "像素容差",
  "labelAlpha": "保留透明",
  "alphaHint": "把透明像素转成 GIF 的 1 位透明通道。不能和像素复用同时使用。",
  "labelBackground": "背景",
  "labelFit": "当比例对不上时",
  "fitContain": "留边放下",
  "fitCover": "填满并裁切",
  "fitStretch": "拉伸",
  "labelLoop": "一直循环",
  "loopHint": "关掉后播放固定次数，停在最后一帧。",
  "labelLoopCount": "播放次数",
  "btnCancel": "取消",
  "phaseRaster": "正在准备帧…",
  "phasePalette": "正在构建调色板…",
  "resultTitle": "结果",
  "statSize": "体积",
  "statFrames": "帧数",
  "statSizePx": "尺寸",
  "statColors": "颜色数",
  "statReuse": "复用像素",
  "statTime": "编码耗时",
  "statFps": "实际帧率",
  "statPerFrame": "每帧",
  "btnCopy": "复制",
  "dismissLabel": "关闭",
  "errorVideo": "这个浏览器解不了那段视频。试试 MP4（H.264）或 WebM。",
  "errorImages": "这些图片里至少有一张无法解码。",
  "errorExtract": "读不出帧。视频可能用了这个浏览器只支持一半的编解码器。",
  "errorEncode": "编码失败。试试减少帧数或缩小宽度。",
  "errorClipboard": "浏览器拦下了剪贴板。改成下载吧。",
  "errorTooManyFrames": "停在了 {0} 帧——再多下去，GIF 就不是合适的格式了。",
  "stageSource": "原始帧",
  "stageResult": "编码后的 GIF",
  "stageHint": "滚轮以光标为中心缩放，拖动可平移。",
  "stageHintCompare": "滚轮以光标为中心缩放，拖动可平移。按住 Alt 或右键，可以看到 GIF 下面的原图。",
  "zoomIn": "放大",
  "zoomOut": "缩小",
  "zoomReset": "重置视图",
  "stripHint": "在胶片条上拖动来选帧。按住 Alt 或用右键即可取消选择。",
  "shortcutsTitle": "快捷键",
  "shortcuts": [
    {
      "keys": "空格",
      "label": "播放 / 暂停"
    },
    {
      "keys": "← →",
      "label": "前后一帧"
    },
    {
      "keys": "Del",
      "label": "删除所选"
    },
    {
      "keys": "A / D",
      "label": "全选 / 全不选"
    },
    {
      "keys": "Ctrl+Z",
      "label": "撤销"
    },
    {
      "keys": "Enter",
      "label": "编码"
    }
  ],
  "nextStepTitle": "接着做",
  "nextStepHint": "把画面上的这一帧当作 PNG 传过去，不用重新上传",
  "nextCrop": "裁剪",
  "nextCompress": "压缩",
  "nextCutout": "抠掉背景",
  "nextWatermark": "加水印",
  "nextMeme": "做成表情包",
  "howItWorksTitle": "怎么用",
  "step1Title": "把文件丢进来",
  "step1Text": "一段视频，或者一堆图片。什么都不会上传，也不会自己跑起来。",
  "step2Title": "选好范围",
  "step2Text": "定好入点、出点和帧率再抽帧——或者一帧一帧手动挑。",
  "step3Title": "编辑时间轴",
  "step3Text": "删帧、倒序、让某一帧多停一会儿，再调颜色和抖动。",
  "step4Title": "编码并核对",
  "step4Text": "在预览上按住 Alt，把 GIF 和原图比一比，然后下载或直接送去下一个工具。",
  "features": [
    {
      "title": "整段共用一套调色板",
      "text": "颜色是对所有帧一次性做中位切分选出来的，循环播到一半也不会串色。"
    },
    {
      "title": "只写动过的地方",
      "text": "和上一帧相同的像素直接继承，不再重新编码。录屏文件里，这部分几乎就是全部。"
    },
    {
      "title": "消掉色带的抖动",
      "text": "蛇形扫描的 Floyd–Steinberg 误差扩散，强度可调，64 色下渐变也不脏。"
    },
    {
      "title": "可编辑的时间轴",
      "text": "删帧、倒序、做成回文、把某一帧拉长。撤销不花代价：存的是编号，不是位图。"
    },
    {
      "title": "把你的核心都用上",
      "text": "动画被拆给一组 web worker，标签页仍然能操作，进度条数的是真实帧数。"
    },
    {
      "title": "什么都不会离开这个标签页",
      "text": "解码器、调色板和压缩器都是跑在你机器上的 JavaScript。没有上传，也没有从 CDN 拉模型。"
    },
    {
      "title": "和整套工具串起来",
      "text": "把画面上的这一帧直接送去裁剪、压缩或抠图，不用先下载下来。"
    }
  ],
  "seoKeywordsTitle": "相关搜索",
  "seoKeywords": [
    "视频转 gif",
    "制作 gif",
    "图片转 gif",
    "mp4 转 gif",
    "压缩 gif",
    "gif 动图",
    "免费 gif 转换器",
    "gif 编辑器"
  ]
};
