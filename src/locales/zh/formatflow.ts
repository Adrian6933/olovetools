export default {
  "resetHint": "重新开始",
  "languageName": "中文",
  "header": {
    "subtitle": "图片格式转换器"
  },
  "hero": {
    "badge": "全程在你的浏览器里运行",
    "title": "把图片转成你真正需要的格式，",
    "titleHighlight": "并看清它的代价",
    "subtitle": "一次拖进最多 50 张照片，选好格式、尺寸和体积，准备好了再转。什么都不会上传，不按按钮就什么都不会开始。",
    "trust1": "不上传，不注册",
    "trust2": "实测画质（SSIM）",
    "trust3": "一批 50 张"
  },
  "dropzone": {
    "title": "把图片拖到这里",
    "subtitle": "一次最多 {max} 张。也可以直接从剪贴板粘贴。",
    "waits": "文件只是在这里等着：只有你按下\"转换\"，转换才会开始。",
    "tooMany": "队列最多容纳 50 张图片，多出来的文件没有加入。",
    "unsupported": "EPS 和相机 RAW 无法在浏览器里解码，已经跳过。",
    "decodeFailed": "这个文件无法作为图片解码。",
    "full": "队列已满。移除一张才能再加一张。"
  },
  "stage": {
    "original": "原图",
    "converted": "转换后",
    "stale": "设置已更改",
    "zoomIn": "放大",
    "zoomOut": "缩小",
    "fit": "适应窗口",
    "splitLabel": "对比分隔线",
    "stageHint": "滚轮以指针为中心缩放，拖动可平移。按住空格、Alt 或右键即可查看原图。"
  },
  "controls": {
    "presetsTitle": "预设",
    "presets": {
      "web": "网页（WEBP，1920px）",
      "social": "社交（JPG，1440px）",
      "archive": "存档（PNG，原始尺寸）",
      "email": "邮件（小于 500 KB）"
    },
    "presetsHint": "预设只是把下面的选项填好。你也可以完全不理它，全部手动设置。",
    "outputFormat": "输出格式",
    "formatUnavailable": "你的浏览器无法写入这种格式",
    "formatUnavailableHint": "划掉的格式，是这个浏览器没有编码器的那些。我们实测而不是猜测，所以你绝不会拿到一个只改了后缀的 PNG。",
    "qualityTitle": "画质与体积",
    "quality": "画质",
    "qualityLossless": "这是无损格式，画质滑块在这里不起作用。",
    "targetSize": "控制在指定体积以内",
    "targetSizeHint": "用二分法寻找画质：最多编码 8 次，落在上限之下一点点。",
    "resizeTitle": "尺寸",
    "resizeModes": {
      "none": "保持",
      "scale": "比例",
      "longEdge": "长边",
      "dimensions": "精确"
    },
    "scale": "比例",
    "longEdgeHint": "最长的一边",
    "lockAspect": "保持宽高比",
    "fits": {
      "contain": "装入",
      "cover": "填满",
      "stretch": "拉伸"
    },
    "sharpen": "缩放后锐化",
    "sharpenHint": "只对亮度做USM锐化，边缘干脆而不会出现彩色光晕。",
    "transformTitle": "旋转与背景",
    "flipH": "水平翻转",
    "flipV": "垂直翻转",
    "background": "图片下方的背景色（不支持透明的格式）",
    "engineTitle": "引擎",
    "measureQuality": "测量画质",
    "measureQualityHint": "把结果重新解码回来跟原图比较（SSIM）。只花几毫秒。",
    "livePreview": "实时预览",
    "livePreviewHint": "默认关闭：开启后，每次改动都会重新转换当前选中的图片。",
    "undo": "撤销",
    "redo": "重做",
    "historyHint": "设置历史"
  },
  "editor": {
    "startOver": "重新开始",
    "shortcuts": "← → 切换，Enter 转换，Ctrl+Z 撤销",
    "queue": "队列",
    "addMore": "继续添加",
    "remove": "从队列移除",
    "perImage": "仅用于这张图片的设置",
    "perImageOn": "这张图片不跟随全局设置。",
    "perImageOff": "这张图片跟随全局设置。",
    "convert": "转换",
    "convertAll": "全部转换",
    "converting": "转换中",
    "reading": "读取中",
    "download": "下载",
    "downloadZip": "ZIP",
    "dimensions": "尺寸",
    "size": "体积",
    "vsOriginal": "相比原图",
    "quality": "画质",
    "attempts": "次",
    "ssimBands": {
      "identical": "看不出差别",
      "excellent": "非常好",
      "good": "良好",
      "fair": "凑近能看出",
      "poor": "明显变差"
    },
    "icoMultisize": ".ico 里装着 16、32、48、64、128 和 256 px 的版本；这里显示的是其中最大的那一个的尺寸。",
    "missedTarget": "即使降到最低画质也达不到体积上限。这已经是能做到的最小结果。",
    "notConverted": "尚未转换",
    "notConvertedHint": "文件已经载入，正在等待。调好你需要的设置，然后按\"转换\"。",
    "engineNote": "编码在 {n} 个后台 worker 中进行，所以页面永远不会卡住。每张图片只解码一次，之后的每次转换都复用它。",
    "dismiss": "关闭",
    "backToTop": "回到顶部"
  },
  "next": {
    "nextStepTitle": "继续处理",
    "nextStepHint": "结果随你带走，无需重新上传",
    "nextCompress": "压缩它",
    "nextCrop": "裁剪它",
    "nextExif": "清除元数据",
    "nextWatermark": "加水印",
    "nextCutout": "抠掉背景"
  },
  "how": {
    "title": "怎么用",
    "subtitle": "三步，没有一步会自己开始。",
    "steps": [
      {
        "title": "把文件拖进来",
        "text": "它们只解码一次，然后在队列里等着。不会被转换，也不会离开你的设备。"
      },
      {
        "title": "决定输出",
        "text": "格式、画质、尺寸、旋转、背景。或者一个预设就够了。"
      },
      {
        "title": "转换并对比",
        "text": "你会拿到体积、尺寸，还有一个 SSIM 分数，说明这次转换的代价。"
      }
    ]
  },
  "features": {
    "title": "它做到了，而普通转换器做不到的",
    "items": [
      {
        "title": "并行的后台 worker",
        "desc": "编码在主线程之外、分散到多个 worker 上进行，所以队列里有 50 张图时页面照样跟手。"
      },
      {
        "title": "格式是实测的，不是猜的",
        "desc": "启动时用真实的两像素编码测试每一个编码器。写不了 AVIF 的浏览器，根本不会给你这个选项。"
      },
      {
        "title": "看得见的画质",
        "desc": "相对原图的 SSIM 分数会告诉你压缩真正付出了什么，而不只是省下了多少。"
      },
      {
        "title": "目标体积",
        "desc": "你说\"小于 500 KB\"，画质就用二分法去找，最多 8 次编码，落在上限之下一点点。"
      },
      {
        "title": "什么都不上传",
        "desc": "解码、缩放、编码全都在你的浏览器里完成。没有服务器看得到你的照片，断网也能用。"
      },
      {
        "title": "批量处理，逐张例外",
        "desc": "一次最多 50 张，其中任何一张都可以带着自己的格式和尺寸单独走。"
      }
    ]
  },
  "formats": {
    "title": "各种格式，以及它们真正给你的东西",
    "subtitle": "输入：JPG、PNG、WEBP、AVIF、GIF、BMP、SVG、TIFF 和 HEIC。EPS 和相机 RAW 需要 PostScript 解释器和逐个机型的转换表，所以我们直接不接受，而不是悄悄还你一个 PNG。",
    "rows": [
      {
        "label": "WEBP",
        "desc": "如今网页上体积与画质平衡得最好的格式，支持透明。在所有要紧的地方都能用。"
      },
      {
        "label": "AVIF",
        "desc": "同等画质下更小，但只有部分浏览器能写。你的浏览器不行时，按钮就是禁用的。"
      },
      {
        "label": "JPG",
        "desc": "通用的照片格式。没有透明通道，所以垫在下面的背景色由你来选。"
      },
      {
        "label": "PNG",
        "desc": "无损且支持透明。画质滑块在这里毫无作用，所以它是灰的。"
      },
      {
        "label": "ICO",
        "desc": "真正的多尺寸图标：16、32、48、64、128 和 256 px 装在同一个文件里，居中裁成正方形。"
      },
      {
        "label": "PDF",
        "desc": "一页，尺寸贴合图片，里面是你选定画质的 JPEG。"
      },
      {
        "label": "TIFF",
        "desc": "用于印刷和存档的未压缩 RGBA。也可以作为输入。"
      },
      {
        "label": "SVG",
        "desc": "一层外壳：把位图嵌进 SVG 里。它不做矢量化——浏览器里的工具都做不到——但在只收 .svg 的地方很管用。"
      }
    ]
  },
  "app": {
    "footer": "一切都在你的浏览器里运行。",
    "contactFeedback": "联系我们以获取想法和反馈:",
    "copiedEmail": "已复制！"
  },
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "我的图片会被上传到什么地方吗？",
      "answer": "不会。解码、缩放和编码都在你的浏览器里，用 canvas 和 web worker 完成。没有任何东西发往服务器；页面加载完之后，断网也照样能用。"
    },
    {
      "question": "为什么有些格式被划掉了？",
      "answer": "因为你的浏览器没有对应的编码器。浏览器不会告诉你这件事：你要一个 GIF 或 HEIC，它会悄悄改个类型还你一个 PNG。启动时我们把两个像素编码成每一种格式，看看实际出来的是什么，所以只把真正可用的给你。"
    },
    {
      "question": "能转成 HEIC、EPS 或相机 RAW 吗？",
      "answer": "不能，而且它不再假装可以。没有浏览器能写 HEIC，EPS 需要 PostScript 解释器，RAW 则是每个机型各不相同的传感器格式。HEIC 和 TIFF 可以作为输入；EPS 和 RAW 文件会被明确拒绝，而不是变成一个挂错名字的 PNG 还给你。"
    },
    {
      "question": "结果旁边的 SSIM 数字是什么？",
      "answer": "它是转换后图片与原图的相似度分数，从 0 到 1。高于 0.98 时差别极难看出；低于 0.95，照片上就开始出现可见的瑕疵。有它是因为\"省了 68%\"只讲了故事里好听的那一半。"
    },
    {
      "question": "为什么我拖进文件后什么都没发生？",
      "answer": "这是有意为之。拖进文件只是解码并放进队列。转换——真正耗时的部分——要等你按下\"转换\"，好让你从容地把设置调好，而不是追着一个不断重来的预览跑。"
    },
    {
      "question": "缩放会损失细节吗？",
      "answer": "大幅缩小一定会，但损失多少取决于引擎。有的浏览器用 2×2 的核一次缩到位，把其余像素全部丢掉，边缘就会发毛。FormatFlow 在启动时会实测这一点——缩小一张测试图，跟精确平均值比对——只有在浏览器确实需要时，才改用反复减半的办法。若浏览器本来就滤得干净，多出来的几道只会耗时而不改变结果，于是跳过。之后你还可以再加一道锐化。"
    },
    {
      "question": "为什么手机照片不再转错方向了？",
      "answer": "因为图片是用 createImageBitmap 解码的，EXIF 方向在那一步就一次性应用好了。旧做法把文件塞进 <img> 元素，而有的浏览器会应用方向标签、有的不会，结果 canvas 拿到的是没旋转的那一张。"
    },
    {
      "question": "一次最多能转多少张？",
      "answer": "五十张。它们会在多个后台 worker 中同时编码；只要打开逐张设置，每一张都能带着自己的格式和尺寸。"
    }
  ],
  "seoKeywordsTitle": "关键词",
  "seoKeywords": [
    "图片转换器",
    "HEIC 转 JPG",
    "PNG 转 WEBP",
    "JPG 转 AVIF",
    "WEBP 转 PNG",
    "TIFF 转 JPG",
    "图片转 ICO",
    "favicon 生成器",
    "图片转 PDF",
    "批量图片转换",
    "在线调整图片尺寸",
    "把图片压到指定体积",
    "离线图片转换器",
    "免费图片转换器 无需上传"
  ],
  "footer_seo_title": "一个会告诉你它做了什么的转换器",
  "footer_seo_paragraph1": "FormatFlow 在你的浏览器里完成 JPG、PNG、WEBP、AVIF、ICO、PDF、TIFF 和 SVG 之间的图片转换。它能读取 iPhone 的 HEIC 和 TIFF 作为输入，按比例、按长边或按精确尺寸缩放，可旋转、翻转，为不支持透明的格式指定背景色，还能通过寻找合适的画质把文件控制在指定体积以内。",
  "footer_seo_paragraph2": "它不做的，是骗你。你的浏览器编码不了的格式会显示为禁用，而不是还你一个后缀不符的 PNG；EPS 和相机 RAW 直接拒收；每一个结果都附带它的体积、尺寸，以及一个说明画质代价的 SSIM 分数。什么都不上传：整条流水线都跑在你自己的机器上。",
  "seo_title": "FormatFlow | 画质可量化的图片转换器",
  "seo_description": "在浏览器里把图片转成 WEBP、AVIF、JPG、PNG、ICO、PDF、TIFF 或 SVG。一批 50 张、目标体积、真正的多尺寸 ICO、支持 HEIC 与 TIFF 输入，还有 SSIM 画质评分。什么都不上传。"
};
