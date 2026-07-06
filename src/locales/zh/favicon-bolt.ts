export default {
  "title": "FaviconBolt",
  "description": "通过图片文件或 Emoji 表情一键生成一整套符合现代标准的网站 Favicon 图标。全部在浏览器本地安全编译。",
  "btn_download_zip": "打包下载 Favicon 图标包 (.ZIP)",
  "label_mode_image": "图片文件",
  "label_mode_emoji": "Emoji 表情",
  "label_emoji_input": "输入 Emoji 表情",
  "label_image_file": "选择源图片",
  "label_bg_shape": "背景形状",
  "shape_none": "透明 / 无背景",
  "shape_circle": "正圆形",
  "shape_square": "正方形",
  "shape_squircle": "平滑角丸 (Squircle)",
  "label_bg_color": "背景颜色",
  "label_padding": "图标内边距 (Padding)",
  "label_border_width": "边框粗细",
  "label_border_color": "边框颜色",
  "label_font_family": "字体系列",
  "label_output_files": "生成的图标清单",
  "preview_title": "Favicon 效果预览",
  "preview_tab": "浏览器标签页",
  "preview_search": "Google 搜索结果展示",
  "preview_mobile": "手机主屏幕图标",
  "progress_generating": "正在本地生成并打包 Favicon 图标...",
  "seo_title": "FaviconBolt | 免费在线网站 Favicon 生成器与多尺寸 ICO 编译器",
  "seo_description": "本地一键转换图片或表情符号为多分辨率 ICO、Apple 触摸图标和 Android Web Manifest。安全，零上传，支持离线运行。",
  "seoHeroTitle": "瞬间生成高标准的 Favicon 和移动端 Web App 图标",
  "seoHeroText": "一次性准备好适用于现代浏览器、视网膜屏幕与智能手机主屏所需的所有图标规格。FaviconBolt 在浏览器内存中直接编译二进制 ICO 文件。",
  "seoHeroList": [
    "支持将 16x16, 32x32, 48x48 帧合并打包为单个多分辨率 .ico 二进制文件",
    "支持自定义图标背景颜色、平滑倒角半径、内边距，或使用系统表情",
    "自动生成 site.webmanifest 元配置文件，完美对接 Android 主屏 PWA 安装规范"
  ],
  "seoBrowserSpeedTitle": "离线二进制 ICO 图标编译器",
  "seoBrowserSpeedText": "在客户端通过 Javascript 直接按字节写入二进制文件头与帧目录偏移量，无需任何后端服务器 API，即可完美生成标准 multi-frame ICO 封装。",
  "seoUseCaseTitle": "满足开发者和设计师的规范化格式",
  "seoUseCaseText": "输出包括 apple-touch-icon.png、Android 桌面启动图标和经典的浏览器标签页图标，助您的网站快速适配上线。",
  "seoPrivacyTitle": "100% 绝对安全的本地图片运算",
  "seoPrivacyText": "您的品牌 Logo 及图形文件绝不会上传到任何服务器。所有图像处理和 ZIP 封包完全局限在您的浏览器标签页内本地进行。",
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "favicon.ico 文件的内部构造是怎样的？",
      "answer": "它将 16x16、32x32 和 48x48 三个不同尺寸的 PNG 图像按二进制数据流顺序封装在一起，专门供传统桌面浏览器识别显示。"
    },
    {
      "question": "生成的 site.webmanifest 文件有什么用？",
      "answer": "它为 Android 设备上的 Chrome 浏览器提供元配置信息，告知系统在用户“添加至主屏幕”时如何显示应用图标 (PWA)。"
    },
    {
      "question": "支持生成透明的 Favicon 图标吗？",
      "answer": "支持！将背景形状设为“透明 / 无背景”，并使用带透明通道的 PNG 或 SVG 图片文件作为源文件即可。"
    },
    {
      "question": "Emoji 表情图标是如何生成的？",
      "answer": "系统会在高分辨率 Canvas 画布上，利用用户指定的系统字体绘制出该 Emoji 表情，然后进行高清降采样平滑缩放。"
    }
  ],
  "footerTagline": "免费、安全、且完全运行在客户端本地的 Favicon 图标一键生成与 ICO 编译器。",
  "footerCredit": "oLoveTools 实用工具集成员"
};
