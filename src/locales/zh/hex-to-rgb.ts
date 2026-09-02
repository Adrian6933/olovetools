export default {
  "resetHint": "重新开始",
  "title": "HEX 转 RGB",
  "badge": "颜色转换",
  "seo_title": "HEX 转 RGB 转换器 | RGB、HSL、HWB、OKLCH 与 CMYK，含对比度检查与调色板",
  "seo_description": "粘贴任意 CSS 颜色——十六进制、关键字、oklch()、color-mix()——即可得到 RGB、HSL、HWB、OKLCH、OKLab 与 CMYK。生成明暗阶梯与配色，检查 WCAG 与 APCA 对比度，模拟色盲视觉，并导出调色板。一切都在浏览器里完成。",
  "seoHeroTitle": "颜色转换工作室",
  "seoHeroText": "把任意 CSS 颜色转成 RGB、HSL、HWB、OKLCH、OKLab 和 CMYK，生成阶梯与配色，检查对比度——全部在本地完成。",
  "description": "输入一个十六进制码、一个 CSS 关键字，或者一整条 oklch() 函数，其余所有写法都会立刻出现。接着生成明暗阶梯、检查对比度、看看色盲用户眼中的效果，然后把整套调色板带走。",
  "palette_title": "调色板",
  "palette_add": "添加一格",
  "palette_remove": "移除这个颜色",
  "tooltip_undo": "撤销 (Ctrl+Z)",
  "tooltip_redo": "重做 (Ctrl+Shift+Z)",
  "button_reset": "重置",
  "preview_hold": "按住可与起始颜色对比",
  "preview_baseline": "起始颜色",
  "preview_complement": "补色 (Alt)",
  "label_input": "任意 CSS 颜色",
  "placeholder_input": "#FF6347, rebeccapurple, oklch(70% 0.15 30)…",
  "error_invalid": "这不是颜色",
  "hint_native": "解析由浏览器本身完成，所以关键字、hwb()、lab()、lch()、oklch()、color-mix() 和 display-p3 都能用。",
  "hint_fallback": "3、4、6 或 8 位的十六进制以及 rgb()、hsl()，不依赖浏览器也能读懂。",
  "tooltip_picker": "系统取色器",
  "tooltip_eyedropper": "从屏幕上任意位置取色 (E)",
  "tooltip_paste": "粘贴一列颜色",
  "tooltip_image": "从图片中取色",
  "tooltip_shortcuts": "键盘快捷键 (?)",
  "copy": "复制",
  "copied": "已复制",
  "error_clipboard": "浏览器拒绝访问剪贴板，因此什么都没复制。请选中数值手动复制。",
  "error_clipboard_read": "浏览器拒绝读取剪贴板。请把列表直接粘贴到文本框里。",
  "error_no_colors": "剪贴板里没有找到任何颜色。",
  "cmyk_disclaimer": "这里的 CMYK 只是简单的算术换算，并非 ICC 分色。可付印的 CMYK 取决于纸张、油墨和输出特性文件，无法仅凭一个 sRGB 数值推导出来。",
  "shortcuts": [
    {
      "keys": "1 – 8",
      "label": "跳到调色板的该格"
    },
    {
      "keys": "Ctrl+Z / Ctrl+Shift+Z",
      "label": "撤销与重做"
    },
    {
      "keys": "Alt",
      "label": "按住可预览补色"
    },
    {
      "keys": "单击",
      "label": "在色块上按住，与起始颜色对比"
    },
    {
      "keys": "右键单击",
      "label": "把一格换成它的补色"
    },
    {
      "keys": "C",
      "label": "复制十六进制码"
    },
    {
      "keys": "E",
      "label": "打开屏幕取色器"
    },
    {
      "keys": "?",
      "label": "显示或隐藏这份列表"
    }
  ],
  "image_title": "从图片取色",
  "image_from": "来自 {tool}",
  "image_close": "关闭图片",
  "image_count": "{n} 种颜色",
  "image_fewer": "减少颜色",
  "image_more": "增加颜色",
  "image_extract": "提取调色板",
  "image_extracting": "正在提取…",
  "image_hint": "点击任意像素即可取得它的准确颜色。滚轮以光标下的像素为中心缩放，拖动可平移。",
  "image_error": "这个文件无法作为图片解码。",
  "image_error_pixels": "这张图片里找不到不透明的像素。",
  "tuner_title": "微调",
  "tuner_show_rgb": "RGB 滑块",
  "tuner_show_oklch": "OKLCH 滑块",
  "tuner_lightness": "明度",
  "tuner_chroma": "彩度",
  "tuner_hue": "色相",
  "tuner_alpha": "不透明度",
  "tuner_gamut": "超出 sRGB——已降低彩度以放得下，ΔE {n}。",
  "ramp_title": "明暗阶梯",
  "ramp_to_palette": "发送到调色板",
  "ramp_legend": "以你的颜色在 OKLCH 中生成的十一级阶梯，锚定在明度已经吻合的那一级上。",
  "ramp_clipped": "有 {n} 级被拉回到 sRGB 之内。",
  "harmony_title": "配色",
  "harmony_to_palette": "发送到调色板",
  "harmony_complementary": "互补色",
  "harmony_analogous": "邻近色",
  "harmony_triadic": "三分色",
  "harmony_split": "分裂互补色",
  "harmony_tetradic": "四分色",
  "harmony_monochrome": "单色",
  "mix_title": "混合",
  "mix_with": "与",
  "mix_hint": "在 OKLCH 中沿色相短弧插值——已走完 {n}%。",
  "contrast_title": "对比度",
  "contrast_swap": "互换",
  "contrast_sample_large": "24 像素的大标题",
  "contrast_sample_medium": "16 像素的小标题，半粗体",
  "contrast_sample_body": "13 像素的正文。正是这个字号决定一对颜色到底能不能用。",
  "contrast_wcag": "WCAG 2.1",
  "contrast_apca": "APCA（WCAG 3 草案）",
  "contrast_apca_flip": "反过来，把背景当作文字颜色：Lc {n}",
  "contrast_bg": "背景",
  "contrast_bg_custom": "自定义背景色",
  "wcag_aaa": "AAA · 任何字号都通过",
  "wcag_aa": "AA · 正文字号通过",
  "wcag_aa_large": "AA · 仅限大字，18pt 或 14pt 粗体以上",
  "wcag_fail": "低于文字所需的最低值",
  "apca_body": "足够用于正文及更小的字",
  "apca_large": "24 像素以上的标题",
  "apca_ui": "仅限大号界面文字与图标",
  "apca_none": "不适合用作文字",
  "cvd_title": "色觉",
  "cvd_hint": "按色觉类型给出任意两个色块之间的最小距离",
  "cvd_normal": "常见色觉",
  "cvd_protanopia": "红色盲 · 缺少红视锥",
  "cvd_deuteranopia": "绿色盲 · 缺少绿视锥",
  "cvd_tritanopia": "蓝色盲 · 缺少蓝视锥",
  "cvd_legend": "低于 ΔE 0.05 时，两个色块对这类观看者而言就是同一种颜色，依赖区分它们的调色板会失效。模拟依照 Viénot、Brettel 与 Mollon（1999）的方法，在线性光下计算。",
  "nearest_title": "最接近的具名颜色",
  "nearest_css": "CSS 关键字",
  "nearest_tw": "Tailwind 令牌",
  "nearest_exact": "完全一致",
  "nearest_legend": "距离是 OKLab 中的 ΔE，大约到 0.02 时多数人开始把两个色块看成不同的颜色。点击某一行即可跳到那个确切的颜色。",
  "export_title": "导出调色板",
  "export_count": "{n} 种颜色",
  "export_png_hint": "一张色卡，每个颜色上都印着它的十六进制码。可以下载，也可以直接发送给别的工具。",
  "export_download": "下载",
  "nextStepTitle": "继续",
  "nextStepHint": "调色板跟着你走——不用下载，也不用重新上传",
  "nextCss": "用这些颜色做设计",
  "nextJson": "以 JSON 打开",
  "nextSvg": "优化色卡 SVG",
  "nextPng": "压缩这张色卡",
  "nextDiff": "比较两套调色板",
  "howItWorksTitle": "工作方式",
  "steps": [
    {
      "title": "带一个颜色进来",
      "text": "输入任意 CSS 写法，使用屏幕取色器，粘贴一整套调色板，或者打开一张图片点击你要的那个像素。"
    },
    {
      "title": "把它捏成形",
      "text": "明度、彩度和色相滑块在黄色上和在蓝色上表现一致，另有阶梯、配色与混合。"
    },
    {
      "title": "检查一遍",
      "text": "在任意背景上给出 WCAG 2.1 与 APCA，还有色盲模拟，会在两个色块并成一个时提醒你。"
    },
    {
      "title": "带着走",
      "text": "复制单个写法，导出 CSS、Tailwind、SCSS、JSON、SVG 或色卡，也可以把调色板直接交给下一个工具。"
    }
  ],
  "features": [
    {
      "title": "所有 CSS 颜色写法",
      "text": "3、4、6 或 8 位十六进制、关键字、rgb()、hsl()、hwb()、lab()、lch()、oklab()、oklch()、color-mix() 和 display-p3。读取交给浏览器自己的解析器，所以不会有遗漏。"
    },
    {
      "title": "步幅均匀的阶梯",
      "text": "十一级都在 OKLCH 中生成，每一级与上一级保持一致的视觉距离，不会出现 HSL 阶梯那种忽大忽小的跳跃。"
    },
    {
      "title": "WCAG 2.1 与 APCA",
      "text": "经典比值，加上 WCAG 3 草案里带符号的 Lc 值，都在你选定的背景上测量，而不只是白底和黑底。"
    },
    {
      "title": "色盲检查",
      "text": "在线性光下模拟红色盲、绿色盲和蓝色盲，并给出任意两个色块之间的最小距离，让你知道调色板什么时候会垮掉。"
    },
    {
      "title": "取色器与图片",
      "text": "在浏览器允许的地方从屏幕任意位置取色，或者打开图片，放大到光标下的像素，取走它的准确数值。"
    },
    {
      "title": "配色与混合",
      "text": "互补、邻近、三分、分裂、四分和单色各组都在 OKLCH 中旋转得出，另有沿色相短弧的感知混合。"
    },
    {
      "title": "导出到任何地方",
      "text": "CSS 自定义属性、Tailwind 的 @theme 区块、SCSS 变量、JSON、SVG 或 PNG 色卡，以及 GIMP 调色板文件。"
    },
    {
      "title": "什么都不会离开标签页",
      "text": "不上传、不调用接口、不需要账号。每一次换算、每一个对比度数字、每一套调色板，都由你自己的浏览器算出来。"
    }
  ],
  "seoBrowserSpeedTitle": "即时的本地处理",
  "seoBrowserSpeedText": "每次换算不过是对三个数字做算术，没有什么要等，也没有什么要送出去。读取你输入的内容交给了浏览器自带的 CSS 引擎，所以关键字、color-mix() 和广色域写法会被读懂而不是被拒绝。涉及感知的部分——OKLCH 阶梯、色域映射、ΔE 距离、色盲模拟——只是几百次浮点运算，就连从一张大照片里提取调色板，也只是对缩小副本跑一遍 k-means，用时远不到一秒。",
  "seoUseCaseTitle": "为设计系统而做",
  "seoUseCaseText": "颜色工作里最麻烦的部分很少是换算本身：难的是做出一条步幅均匀的色阶，证明一对颜色确实读得清，以及把结果交成代码期待的形状。这个工具会把十一级阶梯锚定在你手上已有的颜色上，告诉你哪些级被拉回了 sRGB、偏移了多少，用实测距离指出最接近的 CSS 关键字和 Tailwind 令牌，并把整套调色板导出为自定义属性、Tailwind 主题区块、SCSS、JSON 或色卡。",
  "seoPrivacyTitle": "从构造上就是私密的",
  "seoPrivacyText": "这个工具没有服务端。你输入的颜色、粘贴的调色板和打开的图片都留在标签页里：图片被解码进一块从不离开你机器的画布，关掉标签页一切随即消失。会往外走的只有你自己放进地址栏的东西——调色板被编码在那里，方便你分享链接，除此之外这次会话不会被记录任何内容。",
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "我可以粘贴哪些颜色格式？",
      "answer": "3、4、6 或 8 位十六进制、CSS 的 148 个关键字、rgb()、rgba()、hsl()、hsla()、hwb()、lab()、lch()、oklab()、oklch()、color-mix() 以及 color(display-p3 …)。输入会经过浏览器自己的 CSS 解析器，所以凡是你的浏览器在样式表里接受的写法，这里都能用。即使没有这个解析器，工具仍然读得懂十六进制、rgb() 和 hsl()。"
    },
    {
      "question": "为什么这个工具更偏爱 OKLCH 而不是 HSL？",
      "answer": "在 HSL 里，明度数值相同的两个颜色看起来亮度可能天差地别——50% 的黄色比 50% 的蓝色亮得多。OKLCH 的设计让它的明度与眼睛的感受一致，所以这里的阶梯、配色和混合都在这个空间里旋转和插值。"
    },
    {
      "question": "ΔE 这个数字是什么意思？",
      "answer": "它是两个颜色在 OKLab 中的距离。大约到 0.02，多数人就开始把两个色块看成真正不同的颜色，因此它是个好用的尺子：它告诉你某一级阶梯在被压回 sRGB 时偏移了多少、最接近的 Tailwind 令牌到底有多接近，以及调色板里的两个颜色能否熬过色盲模拟。"
    },
    {
      "question": "这个对比度检查符合 WCAG 吗？",
      "answer": "WCAG 2.1 的比值完全按规范定义计算，针对你选定的背景，并且标签会区分正文与更宽松的大字阈值，而不是只给一个笼统的“通过”。旁边是 APCA，它是为 WCAG 3 提出的感知度量：实践中很有用，但仍是草案，并非符合性标准。"
    },
    {
      "question": "输出的 CMYK 能直接付印吗？",
      "answer": "不能，任何浏览器工具给出的都不能。你拿到的是标准的算术换算，用来大致估计，或者喂给需要这四个数字的软件是够用的。真正的分色取决于纸张、油墨和 ICC 输出特性文件，所以必须在排版或图像软件里完成。"
    },
    {
      "question": "我粘贴的内容会被上传吗？",
      "answer": "不会。这里没有服务端，不对你的颜色做任何统计，换算过程中的任何一步都不会发起网络请求。图片在本地解码进画布，关掉就丢弃。调色板会写进页面网址，方便你分享或加书签——那是你的颜色唯一存放的地方，而且除非你自己把链接发出去，它就一直留在你的机器上。"
    }
  ],
  "seoKeywordsTitle": "关键词",
  "seoKeywords": [
    "hex 转 rgb",
    "颜色转换器",
    "hex 转 hsl",
    "oklch 转换器",
    "cmyk 转换器",
    "wcag 对比度检查",
    "apca 对比度",
    "色盲模拟器",
    "tailwind 颜色",
    "调色板生成器",
    "在线工具",
    "免费"
  ],
  "footerTagline": "把任意 CSS 颜色转成 RGB、HSL、HWB、OKLCH、OKLab 和 CMYK，生成阶梯与配色，检查对比度——全部在本地完成。",
  "footerCredit": "oLoveTools 套件的一部分",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "已复制！",
  "contactForIdeas": "联系以获取想法和评论:"
};
