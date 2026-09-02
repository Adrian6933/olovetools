export default {
  "resetHint": "重新开始",
  "title": "CompressSnap",
  "badge": "图片压缩",
  "description": "在浏览器里压缩 JPEG、PNG、WebP、AVIF 和 HEIC —— 按你选的画质，或按你必须达到的体积 —— 并且看清代价是多少。",
  "seo_title": "CompressSnap | 把图片压到目标体积，并实测画质损失 — 100% 在浏览器内",
  "seo_description": "压缩并缩放 JPEG、PNG、WebP、AVIF、HEIC 和 TIFF 图片。卡住以 KB 计的体积上限、削减 PNG 调色板、在格式之间转换，并查看每个文件实测的 SSIM 画质损失。跑在主线程之外，什么都不上传。",
  "dropzonePrompt": "把图片拖到这里，或点击选择",
  "dropzoneSubtitle": "支持 JPEG、PNG、WebP、AVIF、GIF、BMP、TIFF 和 iPhone 的 HEIC。超大图会被限制到浏览器画布装得下的范围。",
  "rejectedFiles": "有 {n} 个文件不是图片，已被略过。",
  "compressBtn": "压缩 {n} 张",
  "recompressBtn": "设置变了 —— 重新跑一遍",
  "downloadBtn": "下载",
  "downloadAllBtn": "下载全部 (ZIP)",
  "clearBtn": "清除全部",
  "removeBtn": "移除",
  "closeBtn": "关闭",
  "statusQueued": "排队中",
  "statusDecoding": "解码中…",
  "statusCompressing": "压缩中…",
  "statusSkipped": "本来就比我们能压出来的还小",
  "statusError": "失败",
  "workerOn": "主线程之外",
  "workerOff": "主线程",
  "workerHint": "编码在哪里跑。放在主线程之外，批量处理时页面依然能响应。",
  "attemptsHint": "为了卡进上限所需的编码次数",
  "originalSize": "原始大小",
  "compressedSize": "压缩后大小",
  "savings": "已节省",
  "avgSsim": "平均 SSIM",
  "presetLight": "轻度",
  "presetBalanced": "均衡",
  "presetWeb": "给网页用",
  "presetStrong": "强力",
  "formatLabel": "输出格式",
  "formatOriginal": "保持",
  "avifUnsupported": "这个浏览器写不了 AVIF，所以不提供。",
  "qualityLabel": "质量",
  "qualityHint": "画质越低，文件越小。实测的损失会显示在每个结果上。",
  "qualityFromBudget": "正在搜索画质，以便卡进下面的体积上限。",
  "pngColorsLabel": "PNG 颜色数",
  "pngColorsAll": "全部",
  "ditherLabel": "给渐变加抖动",
  "pngNote": "PNG 没有画质设置 —— 所有编码器都会忽略它。让它变小的是削减调色板，而在纯色插画、截图和标志上这根本看不出来。",
  "budgetLabel": "体积上限",
  "budgetToggle": "把每张图都压到设定体积以下",
  "budgetHint": "用二分法搜索画质，直到装得下。",
  "budgetPngNote": "字节上限需要一个可搜索的画质，而 PNG 没有。请改用调色板。",
  "resizeModeLabel": "调整尺寸",
  "resizeNone": "无",
  "resizeLongEdge": "长边",
  "resizeScale": "比例",
  "resizeCustom": "自定义",
  "longEdgeLabel": "最长边 (px)",
  "longEdgeHint": "从不放大 —— 更小的图会原样保留。",
  "scaleLabel": "比例",
  "widthLabel": "宽度 (px)",
  "heightLabel": "高度 (px)",
  "keepAspectLabel": "保持宽高比",
  "measureLabel": "测量画质损失 (SSIM)",
  "measureHint": "把结果解码回来做比较。每张图会多花一点时间。",
  "bandIdentical": "看不出差别",
  "bandExcellent": "极好",
  "bandGood": "良好",
  "bandFair": "尚可",
  "bandPoor": "损失可见",
  "compareBtn": "预览与对比",
  "originalLabel": "压缩前",
  "compressedLabel": "压缩后",
  "nextStepTitle": "继续",
  "nextStepHint": "图片跟着你走 —— 不用下载，也不用重新上传",
  "nextCrop": "裁剪",
  "nextWatermark": "加水印",
  "nextExif": "查看元数据",
  "nextZip": "打包成 zip",
  "howItWorksTitle": "怎么用",
  "step1Title": "把照片放进来",
  "step1Text": "粘贴、选择或拖拽。它们只是排进队列 —— 你不按按钮就不会编码，所以四十张的文件夹不会卡住标签页。",
  "step2Title": "选好取舍",
  "step2Text": "一个画质、一个不能超过的 KB 数、一个格式、一个长边上限。PNG 得到的是调色板，而不是画质滑块。",
  "step3Title": "让它跑",
  "step3Text": "编码在主线程之外进行，所以队列推进时页面照样能响应。",
  "step4Title": "把文件带走",
  "step4Text": "一张张下载、打包成 ZIP，或者不下载直接送进下一个工具。",
  "features": [
    {
      "title": "在主线程之外编码",
      "text": "由带 OffscreenCanvas 的 Web Worker 干活，位图是转移而不是复制，所以一批手机照片不会再冻住它所在的标签页。"
    },
    {
      "title": "压到体积，而不是靠猜",
      "text": "给它一个 KB 上限，它就用二分法搜索画质直到文件装得下，然后告诉你最终定在哪个画质、试了几次。"
    },
    {
      "title": "损失是个数字",
      "text": "每个结果都会被解码回来，用 SSIM 与源图比较，于是「画质 70」不再是感觉，而是文件体积旁边的 0.981。"
    },
    {
      "title": "真的会瘦的 PNG",
      "text": "median-cut 调色板削减，可选抖动。这是 PNG 唯一的旋钮（画质参数会被任何编码器忽略），在截图、标志和纯色图形上确实有效。存成 PNG 的照片更适合转成 JPEG 或 WebP，工具会这么告诉你，而不是丢回一个更大的文件。"
    },
    {
      "title": "你手上真有的那些格式",
      "text": "iPhone 的 HEIC 和 TIFF 在输入时转换，AVIF 和 WebP 在浏览器支持时用于输出，EXIF 里的旋转会被应用，免得图片躺着出来。"
    },
    {
      "title": "什么都不出这个标签页",
      "text": "解码、编码、调色板和测量全在你的浏览器里运行。没有 API，不用上传，不用账号。"
    }
  ],
  "seoHeroTitle": "会告诉你压缩代价的图片压缩工具",
  "seoHeroText": "CompressSnap 能读 JPEG、PNG、WebP、AVIF、GIF、BMP、TIFF 以及 iPhone 产出的 HEIC，并写回 JPEG、PNG、WebP 和 AVIF。它通过搜索合适的画质来满足字节上限，靠削减调色板让 PNG 变小 —— 而不是假装画质滑块在那里起作用 —— 并把每个结果与源图对比，让你做出的取舍看得见。",
  "seoHeroList": [
    "无需注册账号",
    "可同时压缩多张图片",
    "转换为 WebP、JPG 或 PNG 格式"
  ],
  "seoBrowserSpeedTitle": "实测，不是估计",
  "seoBrowserSpeedText": "每个压缩后的文件都会被重新解码，与输入做比较。这个数字是 SSIM —— 追踪人们真正察觉到的差异的那把尺子 —— 它就摆在文件体积旁边，好让两者互相权衡。",
  "seoSecondaryTitle": "为什么要压缩图片？",
  "seoUseCaseTitle": "那些难缠的情况，都处理了",
  "seoUseCaseText": "刚从 iPhone 里出来的 HEIC、旋转信息藏在 EXIF 标签里的竖拍照片、过一遍 JPEG 反而变大的 PNG 截图、装不进画布的 4800 万像素画面 —— 这些都是常态，每一种都会被转换、旋转、标记或限制，而不是悄悄失败。",
  "seoPrivacyTitle": "完全在你的浏览器里",
  "seoPrivacyText": "这个页面背后没有任何 API。解码器、编码器、调色板削减和画质测量都是跑在你标签页里的 JavaScript，所以尚未发布的客户照片不会离开你的电脑。",
  "seoKeywordsTitle": "关键词",
  "seoKeywords": [
    "图片压缩",
    "在线压缩 jpeg",
    "压缩 png",
    "转换为 webp",
    "转换为 avif",
    "heic 转 jpg",
    "图片压缩到 200kb",
    "缩小图片体积",
    "批量图片压缩",
    "在线调整图片尺寸",
    "png 调色板削减",
    "图片质量 ssim"
  ],
  "faqTitle": "常见问题解答",
  "faq": [
    {
      "question": "我的数据会发到服务器吗？",
      "answer": "不会。解码、编码、调色板削减和画质测量都在你的浏览器里运行。在这里打开的图片不会离开这个标签页。"
    },
    {
      "question": "为什么压缩 PNG 没反应？",
      "answer": "因为 PNG 是无损的，所有编码器都会忽略画质参数 —— 像以前那样给 PNG 显示画质滑块是有误导性的。让它变小的是减少颜色数，所以 PNG 得到的是调色板控制。在截图、标志和纯色插画上，降到 64 或 128 色看不出来，而且常常能把文件减半。"
    },
    {
      "question": "能压到指定体积吗？",
      "answer": "能。打开体积上限，填一个 KB 数，编码器就会用二分法搜索画质直到文件装得下，最多八次尝试。每个结果都会显示最终的画质和用了几次编码。"
    },
    {
      "question": "SSIM 是什么，我为什么要在意？",
      "answer": "结构相似性：一个 0 到 1 的数字，表示压缩后的图片和原图有多接近，权重按人眼的方式来分配。它是把结果解码回来逐像素比较得出的。高于 0.98 几乎没人看得出差别；低于 0.95 瑕疵就开始显现。它把「画质 70 看着还行吗？」变成屏幕上能读到的东西。"
    },
    {
      "question": "它接受我 iPhone 拍的照片吗？",
      "answer": "接受。HEIC 和 HEIF 在输入时转换，TIFF 也一样，而且 iPhone 存在 EXIF 标签里的旋转会被应用，竖拍照片不会躺着出来。旧版在文件选择器那一步就把 HEIC 拒之门外了。"
    },
    {
      "question": "为什么有一张图原样返回了？",
      "answer": "因为压缩会让它变大。这在高画质 JPEG 处理过的截图和纯色图形上最常见。与其给你一个更差的文件，工具会标记出来并保留原图。"
    },
    {
      "question": "EXIF 数据会被移除吗？",
      "answer": "会 —— 通过画布重新编码会丢掉所有元数据块，包括 GPS 坐标和相机信息。唯一在视觉上有意义的那一项，也就是方向标签，会先应用到像素上，让图片保持正确朝向。"
    },
    {
      "question": "大批量会卡住页面吗？",
      "answer": "不会。编码跑在带 OffscreenCanvas 的 Web Worker 里，图像数据是转移而不是复制，所以队列推进时页面照样能响应。一次编码两张，既快又不用同时把好几张全分辨率画面留在内存里。"
    }
  ],
  "footerTagline": "在浏览器里压缩、缩放和转换图片，画质损失有实测数据。",
  "footerCredit": "oLoveTools 工具集的一部分",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "邮箱已复制到剪贴板！",
  "contactForIdeas": "联系与反馈：",
  "presetsLabel": "快速预设",
  "presetExtreme": "极限",
  "summaryTitle": "预计结果",
  "scaleHint": "缩小图片的宽度和高度。",
  "followGlobalBtn": "使用全局设置",
  "statusDone": "成功",
  "individualSettings": "单图设置",
  "globalSettings": "全局设置",
  "originalFormat": "原始格式",
  "compareTitle": "压缩前后画质对比",
  "privacyPolicy": "隐私政策",
  "termsOfService": "服务条款",
  "cookiePolicy": "Cookie 政策",
  "privacyContent": "您的隐私对我们至关重要。\n\n我们仅收集提供服务所必需的信息。这包括有关您的浏览器和设备的常规技术数据，以确保工具能够正常运行。\n\n我们绝不会存储、跟踪或分析您的图像。所有处理工作均在您的浏览器中本地完成，确保您的数据永远不会离开您的设备。",
  "termsContent": "使用 CompressSnap 即表示您同意以下条款。\n\n1. 本工具按“原样”提供，不提供任何形式的担保。\n2. 我们对因使用本工具而导致的任何数据丢失或问题概不负责。\n3. 您对使用本工具处理的内容承担全部责任。\n4. 我们保留随时修改这些条款的权利。",
  "cookiesContent": "我们使用 Cookie 来提升您的体验。\n\n1. 必要 Cookie：网站基本功能运行所必需。\n2. 偏好 Cookie：用于记住您的语言选择和 Cookie 同意状态。\n\n您随时可以通过浏览器设置管理或禁用 Cookie。",
  "contact": "联系我们"
};
