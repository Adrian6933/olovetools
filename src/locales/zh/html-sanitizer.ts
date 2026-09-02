export default {
  "previewTitle": "清理后 HTML 的预览",
  "resetHint": "重新开始",
  "title": "HTML Sanitizer",
  "seo_title": "HTML Sanitizer | 免费在线 HTML 清理工具，附移除报告",
  "seo_description": "用真正的白名单策略清理 HTML：移除脚本、事件处理器、javascript: 链接和多余标签，并准确看到移除了什么、把需要的放回来。全部在浏览器内完成。",
  "seoHeroTitle": "HTML 清理器和净化器",
  "badge": "白名单净化器",
  "description": "粘贴 HTML，选择策略，按下按钮。你会得到清理后的标记，外加每一个被丢弃的标签和属性的明细报告——任何一条判定都可以推翻，无需重新粘贴。",
  "heroPoints": [
    "不按按钮就什么都不跑",
    "每一项移除都逐条列出",
    "绝不离开你的浏览器"
  ],
  "label_input": "原始 HTML 输入",
  "label_policy": "清理策略",
  "placeholder_input": "在此粘贴 HTML、拖入 .html 文件，或加载下面的示例。在你按下「净化」之前不会执行任何操作。",
  "button_open_file": "打开文件",
  "button_clear": "全部清除",
  "button_run": "净化",
  "button_working": "清理中…",
  "button_manual": "手动",
  "button_undo": "撤销",
  "button_redo": "重做",
  "button_copy": "复制",
  "button_copied": "已复制！",
  "button_download": "下载",
  "button_reset": "重置",
  "samples_title": "试一试",
  "sample_messy": "杂乱的 CMS 粘贴",
  "sample_attack": "已知 XSS 载荷",
  "preset_strict": "严格",
  "preset_strict_hint": "只留文本和链接。适合一切你打算存起来的内容。",
  "preset_email": "邮件适用",
  "preset_email_hint": "表格和内联样式保留，脚本不保留。",
  "preset_content": "富文本内容",
  "preset_content_hint": "CMS 正文：媒体、表格、data-* 和 aria-*。",
  "preset_text": "纯文本",
  "preset_text_hint": "丢掉所有标记，保留阅读顺序。",
  "preset_custom_active": "自定义策略——手工编辑过。",
  "stale_hint": "策略已更改——请重新运行",
  "shortcut_hint": "Ctrl+Enter 运行 · Ctrl+Z 撤销一次策略更改",
  "tab_source": "清理后源码",
  "tab_preview": "预览",
  "tab_report": "已移除",
  "format_pretty": "格式化",
  "format_min": "压缩",
  "format_raw": "解析原样",
  "compare_hold": "按住对比",
  "compare_showing": "原文",
  "output_empty": "全部被移除——没有任何内容通过这条策略。",
  "copy_failed": "你的浏览器阻止了剪贴板访问。",
  "stat_size": "大小",
  "stat_elements": "元素",
  "stat_removed": "已移除",
  "stat_dangerous": "可执行",
  "stat_time": "耗时",
  "policy_allowed_tags": "允许的标签",
  "policy_allowed_attrs": "允许的属性",
  "policy_add_tag": "添加标签…",
  "policy_add_attr": "添加属性…",
  "policy_no_tags": "不允许任何标签——输出将是纯文本",
  "policy_no_attrs": "不保留任何属性",
  "policy_strip_tags": "连同内容一起删除",
  "policy_strip_hint": "绝不解包：里面的内容也一并删掉",
  "policy_no_strip": "没有任何标签会被连同内容删除",
  "policy_unknown": "不被允许的标签",
  "policy_unwrap": "解包——保留里面的文本",
  "policy_drop": "丢弃——删除整棵子树",
  "policy_schemes": "接受的 URL 方案",
  "policy_schemes_hint": "href/src 中的其他方案一律丢弃",
  "policy_data_note": "data:image 只接受位图格式。SVG 数据 URL 永不允许：内联 SVG 被直接打开时会执行它自己的 <script>。",
  "policy_other": "属性与其他",
  "policy_keep_style": "保留 style=\"…\"",
  "policy_keep_class": "保留 class=\"…\"",
  "policy_keep_id": "保留 id / name",
  "policy_keep_comments": "保留注释",
  "policy_data_attrs": "保留 data-* 属性",
  "policy_aria_attrs": "保留 aria-* 和 role",
  "policy_svg_math": "允许 <svg> 和 <math>",
  "policy_harden_links": "添加 rel=\"noopener noreferrer\"",
  "policy_strip_target": "移除 target=\"_blank\"",
  "scheme_https_hint": "加密的链接和图片。",
  "scheme_http_hint": "明文 HTTP——内部页面尚可，在网络上会被看到。",
  "scheme_relative_hint": "不带方案的路径和锚点：/page、#section、?q=1。",
  "scheme_mailto_hint": "邮件链接。",
  "scheme_tel_hint": "电话、短信和一键拨号链接。",
  "scheme_ftp_hint": "旧式文件传输链接。",
  "scheme_data_hint": "以数据 URL 内嵌的图片。仅限位图格式。",
  "report_empty": "没有移除任何东西——输入本来就符合策略。",
  "report_dangerous": "有 {0} 处移除本来可能执行代码。",
  "report_on": "位于",
  "report_keep": "保留",
  "report_kept": "已保留",
  "report_keep_it": "在输出中保留这一项",
  "report_remove_again": "重新移除",
  "reason_tag-not-allowed": "标签不在白名单内",
  "reason_tag-stripped": "标签连同内容一并删除",
  "reason_event-handler": "内联事件处理器",
  "reason_attr-not-allowed": "属性不在白名单内",
  "reason_bad-scheme": "URL 方案不被允许",
  "reason_comment": "HTML 注释",
  "reason_inline-style": "内联 style 属性",
  "reason_class-attr": "class 属性",
  "reason_id-attr": "id / name 属性",
  "nextStepTitle": "继续",
  "nextStepHint": "清理后的 HTML 随你走——无需重新上传",
  "nextDiff": "与原文对比",
  "nextCodecard": "生成代码图片",
  "nextWordflow": "分析文本",
  "nextBase64": "编码为 Base64",
  "nextZip": "打包为 ZIP",
  "howItWorksTitle": "工作方式",
  "step1Title": "把 HTML 拿进来",
  "step1Text": "粘贴它、拖入 .html 文件，或者从另一个工具带过来。它就待在那里：打开文件从不会启动清理。",
  "step2Title": "选择策略",
  "step2Text": "四个预设覆盖常见场景。打开手动面板，你可以亲自编辑标签清单、属性清单和接受的 URL 方案。",
  "step3Title": "运行",
  "step3Text": "一趟处理就构建出清理后的树，并沿途记录每一个判定。一兆字节的标记只需几毫秒。",
  "step4Title": "复核并推翻",
  "step4Text": "报告列出什么被移除、为什么。若不认同某一行，按下「保留」：处理会带着这一个例外重新跑一遍。",
  "featuresTitle": "它能做什么",
  "features": [
    {
      "title": "真正的白名单策略",
      "text": "标签、属性和 URL 方案是三份由你掌控的独立清单。挡住标签却不管它的属性，算不上净化。"
    },
    {
      "title": "逐条列出的移除报告",
      "text": "每个被丢弃的元素和属性都按次数分组，附上内容样本和被移除的原因。"
    },
    {
      "title": "推翻任何一条判定",
      "text": "在某行按下「保留」，净化就会重跑一遍并恰好放行那一项。你的原文永远不会被改写。"
    },
    {
      "title": "URL 方案逐个检查",
      "text": "href、src、formaction、srcset、xlink:href 中的 javascript:、data:text/html 和 vbscript: 都会被抓出来，包括用空白和实体做的伪装。"
    },
    {
      "title": "沙箱预览",
      "text": "结果渲染在 sandbox 为空且带 no-referrer 的 iframe 中，因此里面的内容无法执行、提交或跳转。"
    },
    {
      "title": "格式化、压缩或原样",
      "text": "同一棵清理后的树可以用三种方式重新输出。<pre> 内部的空白即使其余部分重新缩进也会保留。"
    },
    {
      "title": "交接给下一个工具",
      "text": "把结果直接送到 DiffSnap、CodeCard、WordFlow、Base64Bolt 或 ZipFlow，不必先下载再上传。"
    },
    {
      "title": "什么都不离开标签页",
      "text": "净化器是与页面一起打包的 JavaScript 库。全程没有上传、没有 API 调用，也没有 CDN 请求。"
    }
  ],
  "seoSecondaryTitle": "一个把过程摊开给你看的净化器",
  "seoHeroText": "多数在线 HTML 清理工具丢给你一串字符串，然后指望你相信它。这个保留了判定日志：哪个标签被丢弃、哪个属性被剥掉、哪个 URL 没通过方案检查——而且每一条都能一键推翻，因为清理后的输出是根据你的策略重新生成的，而不是事后打补丁。",
  "seoHeroList": [
    "白名单，而非黑名单",
    "检查属性，不只是标签",
    "每次移除都有次数和原因",
    "策略层面的撤销与重做"
  ],
  "seoUseCaseTitle": "什么时候需要它",
  "seoUseCaseText": "把富文本编辑器产出的内容在入库前清干净。把 Word 和 Google 文档的垃圾从 CMS 粘贴里剔掉。让第三方标记在渲染前变得安全。从保存下来的网页里抽出可读正文。检查你即将信任的标记里有没有能执行的东西——已知载荷的示例就在那里，让你看到答案而不是猜测答案。",
  "seoBrowserSpeedTitle": "构建在 DOMPurify 之上",
  "seoBrowserSpeedText": "解析和安全判定来自 DOMPurify——浏览器自家安全团队都会引用的那个库——而不是手写的一遍 querySelectorAll 扫描。这里通过它的 hook API 使用，并且要的是中间态 DOM 而非成品字符串，正是这一点让移除报告和逐项例外成为可能。它能应对变异型 XSS、命名空间混淆，以及朴素清理器会漏掉的各种 URL 花招。",
  "seoPrivacyTitle": "100% 隐私与安全",
  "seoPrivacyText": "没有上传，没有 API 密钥，也不会追踪你粘贴了什么。库与页面一起打包，所以也不会从 CDN 拉取任何东西。你的 HTML 留在标签页的内存里，关掉就消失。",
  "seoKeywordsTitle": "也叫作",
  "seoKeywords": [
    "html 净化器",
    "html 清理工具",
    "从 html 移除脚本",
    "在线清理 html",
    "html 消毒",
    "去除标签",
    "dompurify 在线",
    "xss 过滤器",
    "html 白名单"
  ],
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "为什么粘贴之后什么都没发生？",
      "answer": "这是刻意设计。粘贴或打开文件只是把 HTML 装进来；净化在你按下「净化」时才运行。这样你会先挑好策略，而不是看工具替你猜，而且大文档不会在每次敲键时都被解析一遍。"
    },
    {
      "question": "移除报告到底让我能做什么？",
      "answer": "每一行都是一个可以反悔的判定。按下「保留」会加入这一个例外并把整趟处理重跑一遍——所以把 <iframe> 放回来，并不会连它的 onload 属性一起放行。你的输入文本永远不会被重写，这也是撤销和重做始终很轻的原因。"
    },
    {
      "question": "只把标签列入白名单，输出就安全了吗？",
      "answer": "不安全，而这正是多数只看标签的清理工具犯的错。任何白名单里的 <a> 仍可能带着 href=\"javascript:…\"，所以这里的属性和 URL 方案是分开检查的。挡住标签却放任它的属性，算不上净化。"
    },
    {
      "question": "哪些 URL 方案能通过？",
      "answer": "只有你勾选的那些。其余一律从 href、src、srcset、action、formaction、poster、cite 和 xlink:href 中剔除，包括藏在制表符、换行或 HTML 实体后面的值。data: 仅限位图：SVG 数据 URL 被直接打开时会执行自己的脚本，因此永远不允许。"
    },
    {
      "question": "实时预览安全吗？",
      "answer": "安全。它渲染在 sandbox 属性为空字符串的 iframe 中，脚本、表单、弹窗和跳转全部被阻止，另外还有 no-referrer 策略，让任何幸存的图片都无法泄露你是从哪个页面来的。"
    },
    {
      "question": "我的 HTML 会被发送到哪里吗？",
      "answer": "不会。净化器是与本页一起打包的 JavaScript，在你的标签页里运行。没有上传、没有 API 调用、也没有 CDN 请求——你可以开着网络面板自己核对。"
    },
    {
      "question": "它能处理多大的文档？",
      "answer": "解析大致是线性的，因此几兆字节的标记在普通笔记本上远远用不到一秒；每次运行后都会显示实测耗时。输出面板的语法高亮在超过 200 KB 时会关闭，因为到那个体量，着色的代价超过了它带来的好处。"
    }
  ],
  "footerTagline": "一个带有真正白名单策略、并且移除报告可供你质疑的 HTML 净化器——在你的浏览器里 100% 本地运行。",
  "footerCredit": "oLoveTools 套件的一部分",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "已复制！",
  "contactForIdeas": "联系以提交想法和评论："
};
