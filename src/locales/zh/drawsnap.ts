export default {
  "title": "DrawSnap",
  "badge": "画板与描摹器",
  "description": "一块支持压感笔迹的画板，具备真正的矢量导出，并配有把任意图片变成可编辑线条的描摹器。全部在你的浏览器里运行。",
  "btn_clear": "清空画板",
  "btn_undo": "撤销",
  "btn_redo": "重做",
  "btn_copy": "复制",
  "btn_download_png": "下载 PNG",
  "btn_download_svg": "下载 SVG",
  "label_tools": "绘图工具",
  "label_brush_size": "粗细",
  "label_color": "颜色",
  "label_opacity": "不透明度",
  "label_shapes": "形状",
  "label_fill": "填充形状",
  "label_grid": "网格背景",
  "label_paper": "纸张",
  "tool_select": "选择",
  "tool_pencil": "铅笔",
  "tool_marker": "马克笔",
  "tool_eraser": "橡皮",
  "tool_line": "直线",
  "tool_arrow": "箭头",
  "tool_rect": "矩形",
  "tool_circle": "椭圆",
  "tool_triangle": "三角形",
  "tool_text": "文字",
  "patternDots": "圆点",
  "patternGrid": "方格",
  "patternLines": "横线",
  "patternNone": "空白",
  "eraserMode": "橡皮模式",
  "eraserPixel": "墨迹",
  "eraserObject": "整条笔画",
  "importBtn": "添加图片",
  "zoomIn": "放大",
  "zoomOut": "缩小",
  "zoomFit": "适应屏幕",
  "shapeCount": "图形：{n}",
  "selectionCount": "已选：{n}",
  "duplicate": "复制一份",
  "bringFront": "移到最前",
  "deleteSelected": "删除",
  "clearSelection": "取消选择",
  "textPlaceholder": "输入…",
  "emptyHint": "可以直接开画，也可以拖入一张图片来描摹。",
  "compareOn": "仅显示图片",
  "panHint": "空格键平移",
  "altHint": "Alt = 擦除",
  "exportBgBoard": "画板背景",
  "exportBgTransparent": "透明",
  "exportBgLight": "白色",
  "exportGrid": "包含网格",
  "exportedPng": "PNG 已按 {w} × {h} 导出",
  "exportedSvg": "SVG 已导出 · {n} 个矢量图形",
  "copied": "已复制到剪贴板",
  "copyFailed": "浏览器阻止了剪贴板访问，请改用 PNG 按钮。",
  "restoreFound": "此浏览器中保存了一块含 {n} 个图形的画板。",
  "restoreBtn": "恢复它",
  "restoreDismiss": "从空白开始",
  "errorUnsupported": "该文件无法作为图片解析。",
  "scrollTopLabel": "回到顶部",
  "shortcutsTitle": "键盘快捷键",
  "shortcuts": [
    {
      "keys": "V / P / B / E",
      "label": "选择 · 铅笔 · 马克笔 · 橡皮"
    },
    {
      "keys": "L / A / R / O / G / T",
      "label": "直线 · 箭头 · 矩形 · 椭圆 · 三角形 · 文字"
    },
    {
      "keys": "Alt / 右键拖动",
      "label": "不换工具直接擦除"
    },
    {
      "keys": "空格 + 拖动",
      "label": "平移画板"
    },
    {
      "keys": "Ctrl + 滚轮",
      "label": "在光标处缩放"
    },
    {
      "keys": "Shift",
      "label": "正方形、正圆和 45° 直线"
    },
    {
      "keys": "H（按住）",
      "label": "隐藏自己的笔画只看图片"
    },
    {
      "keys": "[ / ]",
      "label": "笔刷粗细"
    },
    {
      "keys": "Ctrl+Z / Ctrl+Shift+Z",
      "label": "撤销 · 重做"
    },
    {
      "keys": "Ctrl+D / Del",
      "label": "复制 · 删除所选"
    },
    {
      "keys": "Ctrl+0",
      "label": "让画板适应屏幕"
    },
    {
      "keys": "Ctrl+V",
      "label": "粘贴图片"
    }
  ],
  "importedFrom": "由 {tool} 传来 —— 画板上还没有添加任何内容。",
  "importWaiting": "还没有执行任何操作。请选择它以什么方式落到画板上。",
  "discard": "丢弃",
  "traceTitle": "描摹成可编辑的笔画",
  "traceLow": "粗略",
  "traceMedium": "均衡",
  "traceHigh": "精细",
  "traceSampleColor": "从照片取色",
  "traceKeepPhoto": "把照片留在下层",
  "traceHint": "轮廓会变成普通的铅笔笔画：每条线都能单独移动、改色、擦掉或撤销。",
  "traceBtn": "描摹成笔画",
  "traceRunning": "正在描摹…",
  "traceDone": "{ms} 毫秒生成 {n} 条可编辑笔画{thread}",
  "traceWorker": "独立线程",
  "traceFailed": "描摹失败。你仍然可以放置图片并在上面手绘。",
  "placeBtn": "只是放上去",
  "placeHint": "原样放到画板上，由你自己在上面画。",
  "nextStepTitle": "继续处理",
  "nextStepHint": "作品随你走，无需重新上传",
  "nextCompress": "压缩它",
  "nextCrop": "裁剪它",
  "nextFormat": "转换格式",
  "nextWatermark": "加水印",
  "nextMeme": "做成表情包",
  "howItWorksTitle": "使用方式",
  "step1Title": "先挑好纸张",
  "step1Text": "圆点、方格、横线或空白，配深色、浅色或透明画板，尺寸随你选。",
  "step2Title": "拖入一张图片——也可以跳过",
  "step2Text": "拖拽、粘贴，或从其他工具接收图片。你不开口，什么都不会运行。",
  "step3Title": "把它描摹成笔画",
  "step3Text": "轮廓变成铅笔笔画，可以逐条移动、改色和撤销。",
  "step4Title": "手动绘制与修正",
  "step4Text": "压感笔刷，Alt 擦除，Shift 约束角度，光标处直接缩放。",
  "step5Title": "导出或接着处理",
  "step5Text": "最高 4× 的 PNG、真正的矢量 SVG，或把画板直接送进下一个工具。",
  "features": [
    {
      "title": "跟着手感走的墨迹",
      "text": "数位笔的压力（用鼠标时则是运笔速度）决定每条线的粗细，浏览器合并保留的中间采样点让快速笔画依然圆润而不生硬。"
    },
    {
      "title": "一路矢量到文件",
      "text": "下载的 SVG 就是你画出的几何图形，橡皮也以真正的蒙版形式保留，因此在 Figma 或 Illustrator 中都能干净打开。"
    },
    {
      "title": "把照片变成笔画",
      "text": "本地描摹器从任意图片中提取形状，交还给你的是可编辑的线条，而不是压平的位图。"
    },
    {
      "title": "编辑的是对象，不是像素",
      "text": "画板上已有的任何内容，随时都能选择、移动、缩放、复制、调整层级和改色。"
    },
    {
      "title": "与整套工具串联",
      "text": "把画板送去压缩、裁剪、转换格式或加水印，全程不用下载再上传。"
    },
    {
      "title": "什么都不会离开标签页",
      "text": "无需账号，不上传，也没有服务器。画板保存在你自己的浏览器里，只有你要求时才恢复。"
    }
  ],
  "seo_title": "DrawSnap | 免费在线画板、白板与照片描摹工具",
  "seo_description": "用压感笔迹在线绘图，把任意照片描摹成可编辑的矢量笔画，并导出最高 4× 的 PNG 或真正的 SVG。免费、私密，完全在浏览器端完成。",
  "seoHeroTitle": "在浏览器里完成绘制、描摹与导出",
  "seoHeroText": "一块完整的画板，具备压感笔迹、对象级编辑、缩放与平移、自动保存，以及能把任意图片转成可编辑笔画的描摹器。DrawSnap 100% 在你的浏览器标签页内本地运行。",
  "seoHeroList": [
    "铅笔、马克笔和两种橡皮，笔画随压力与速度变化",
    "形状、箭头和文字，支持 Shift 约束与对象选择",
    "1×、2× 或 4× 的 PNG，背景可选透明、深色或白色",
    "真正的矢量 SVG：擦除是蒙版，而不是被覆盖涂抹的线",
    "把照片描摹成可编辑笔画，只有按下按钮才会运行",
    "自动保存在你的浏览器里 —— 从不上传任何内容"
  ],
  "seoBrowserSpeedTitle": "为真正绘画而生的画布管线",
  "seoBrowserSpeedText": "笔画以几何数据的形式保存在一份有自身尺寸的文档中，而不是屏幕像素，所以调整窗口大小永远不会裁掉你的作品，导出分辨率也变成你主动的选择，而不是容器碰巧量到的数值。已确认的画面存放在缓存图层上，因此新增一笔的开销不会随画板上已有图形数量增长；纸张与墨迹分开绘制，这正是橡皮只擦墨迹、不会在网格上戳出窟窿的原因。",
  "seoSecondaryTitle": "从一张照片到可以编辑的线条",
  "seoUseCaseTitle": "适合教师、设计师和快速头脑风暴",
  "seoUseCaseText": "画个线框图、给截图加注释、讲解一道公式，或者丢进一张照片，让描摹器把它变成线稿，再由你手动整理。因为描摹器返回的是轮廓本身而不是压平的图像，之后每条线依然可以选择、移动和改色。",
  "seoPrivacyTitle": "无账号、无追踪，100% 客户端",
  "seoPrivacyText": "你绘制或导入的任何内容都不会被上传：画板、描摹器和导出器全部在浏览器标签页内运行，描摹器使用的是你本机的独立线程，而非远程服务。作品保存在此浏览器的本地存储中，关闭标签页不再意味着丢失；清空画板时，那份副本也会一并删除。",
  "seoKeywordsTitle": "相关搜索",
  "seoKeywords": [
    "在线画板",
    "免费数字白板",
    "在浏览器里画画",
    "照片转线稿",
    "图片描摹成 SVG",
    "矢量草图工具",
    "透明背景 PNG 绘图",
    "在线草图与批注"
  ],
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "我可以导入图片并在上面画吗？",
      "answer": "可以。把文件拖到画板上、用 Ctrl+V 粘贴，或者从其他 oLoveTools 工具传过来。图片会停在一个等待面板里：你决定是直接放置还是描摹，在你按下按钮之前，画板上不会添加任何东西。"
    },
    {
      "question": "“描摹成笔画”到底做了什么？",
      "answer": "它读取图片的亮度，在多个层级上追踪轮廓，再把每条轮廓简化成一条普通的铅笔笔画。结果是可编辑的线稿：每条线都能移动、改色、变细或删除，整次描摹也能一步撤销。运算在你本机的独立线程上进行，不会上传任何内容。"
    },
    {
      "question": "SVG 是真正的矢量文件吗？",
      "answer": "是的。笔画导出为填充的轮廓路径，形状导出为原生的 rect、ellipse、line 和 polygon 元素，文字就是文字。被擦除的区域使用 SVG 蒙版，因此空洞是真正的空洞，在透明背景下依然是空洞，而不是用画板颜色盖上去的。"
    },
    {
      "question": "可以导出透明背景的 PNG 吗？",
      "answer": "可以。导出栏允许你独立于绘制时的显示，选择画板背景、透明或白色，也可以不带网格。此外还能按画板尺寸的 1×、2× 或 4× 导出：一块 1920 × 1080 的画板可以输出成 7680 × 4320 的图片。"
    },
    {
      "question": "关闭标签页会怎样？",
      "answer": "每次改动后不久，画板都会自动保存到此浏览器的本地存储。再次打开时，DrawSnap 会告诉你存在一份保存的画板，并让你选择恢复或从空白开始，绝不会悄悄覆盖你正在做的东西。清空画板时，保存的副本也会被删除。"
    },
    {
      "question": "支持数位板或 iPad 的触控笔吗？",
      "answer": "支持。DrawSnap 监听指针事件，所以触控笔会报告真实压力，笔画随之变细变粗。使用鼠标或手指时，粗细改为跟随运笔速度，同样有接近手绘的感觉。"
    },
    {
      "question": "两种橡皮有什么区别？",
      "answer": "墨迹橡皮像真橡皮一样擦掉经过的部分，并以蒙版形式导出。整笔橡皮会删掉你碰到的整条线，整理描摹结果时更快。按住 Alt，或用鼠标右键拖动，可以在不切换工具的情况下临时擦除。"
    },
    {
      "question": "可以导入哪些图片格式？",
      "answer": "JPG、PNG、WebP、AVIF、GIF 和 SVG，以及 iPhone 生成的 HEIC 与 HEIF 文件，后者会在进入画板之前先在浏览器里完成转换。"
    }
  ],
  "footerTagline": "免费、私密、纯客户端的画板，支持照片描摹与真正的矢量导出。",
  "footerCredit": "oLoveTools 工具套件的一部分"
};
