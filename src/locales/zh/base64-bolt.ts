export default {
  "title": "Base64Bolt",
  "seo_title": "Base64Bolt | Base64 编码器、解码器与字节检查器",
  "seo_description": "把文本或任意文件编码为 Base64，把载荷解码还原成真正的文件，用十六进制查看字节，切换到 URL 安全字母表，去掉填充，并在 76 列处换行。免费，全部在你的浏览器里完成。",
  "seoHeroTitle": "Base64 Encoder, Decoder & Inspector",
  "badge": "Base64 工具箱",
  "description": "编码任意文件——不只是图片——使用对方真正需要的字母表、填充和行宽。解码一段载荷，就能看清它究竟是什么：从魔数读出的格式、开头字节的十六进制、gzip 之后的体积，以及它的 SHA-256。",
  "heroPoints": [
    "任意文件类型",
    "URL 安全字母表",
    "十六进制检查器"
  ],

  "tab_text": "文本",
  "tab_file": "文件转 Base64",
  "tab_decode": "Base64 转文件",

  "optionsTitle": "输出",
  "alphabetStandard": "A-Z a-z 0-9 + /",
  "alphabetUrl": "URL 安全 - _",
  "alphabetStandardHint": "RFC 4648 的标准字母表：最后两个值用 + 和 /。",
  "alphabetUrlHint": "URL 安全字母表：用 - 和 _ 代替 + 和 /，让载荷可以原样通过查询字符串、文件名或 JWT。",
  "padding": "填充 =",
  "paddingHint": "末尾的 = 把输出补齐到四个字符的倍数。去掉它是合法的，JWT 就是这么做的，但一些严格的解析器至今仍要求它。",
  "wrap": "换行",
  "wrapNone": "关",
  "crlfHint": "用 CRLF 而不是 LF 换行——这才是 MIME 和 PEM 真正规定的。",
  "charset": "字符集",
  "engineNative": "原生引擎",
  "engineFallback": "兼容引擎",
  "engineNativeHint": "浏览器自己完成字节转换，只用一次引擎层调用。",
  "engineFallbackHint": "你的浏览器没有原生 Base64 转换，因此载荷按 32 KB 分块处理。结果相同，稍慢一些。",

  "mode_encode": "编码",
  "mode_decode": "解码",
  "altHint": "按住 Alt 预览反向操作",
  "holdCompare": "按住可查看你的输入",
  "undo": "撤销",
  "redo": "重做",
  "loadSample": "载入示例",
  "button_clear": "全部清除",
  "cancel": "停止",
  "runBtn": "运行",
  "encodeBtn": "编码为 Base64",
  "decodeBtn": "解码",
  "downloadTxt": "下载为 .txt",
  "openTextFile": "打开 .txt / .b64",
  "copied": "已复制！",
  "copyFailed": "浏览器拦截了剪贴板访问",
  "tooltip_copy": "复制到剪贴板",
  "chars": "字符",

  "label_input": "纯文本",
  "label_base64_input": "Base64 字符串",
  "label_base64_output": "Base64",
  "label_decoded_output": "解码后的文本",
  "label_showing_input": "你的输入",
  "label_stage_file": "选择文件",
  "label_snippet": "可直接粘贴",
  "label_decoded": "得到的结果",
  "placeholder_encode": "输入或粘贴要编码的文本…",
  "placeholder_decode": "粘贴一段 Base64 字符串或 data: URL…",
  "placeholder_decode_file": "粘贴 Base64 载荷或完整的 data: URL…",
  "placeholder_output": "结果会显示在这里…",
  "placeholder_file_output": "准备好文件后按“编码”即可得到代码片段。",
  "placeholder_decoded": "粘贴一段载荷，看清它究竟是什么。",
  "previewTruncated": "仅显示前 {0} 个字符。复制和下载使用完整结果。",
  "bigInputHint": "这段输入很大，因此不会在每次按键时重新编码。准备好后按“运行”。",

  "file_drag": "把任意文件拖到这里，或点击选择",
  "file_formats": "任意文件类型——图片、字体、PDF、WASM。最大 {0}。",
  "willProduce": "将产生约 {0} 个字符",
  "nothingAutomatic": "还没有读取任何内容。选好选项后再按“编码”。",
  "optionsChanged": "自这次运行之后选项发生了变化。请再按一次“编码”。",

  "statBytes": "载荷",
  "statChars": "Base64",
  "statOverhead": "相对原始体积",
  "statGzip": "gzip 之后",
  "statFormat": "已识别",
  "statAlphabet": "字母表",
  "statRoundTrip": "往返",
  "statTime": "耗时",
  "roundTripOk": "可逆",
  "roundTripFail": "不可逆",

  "sha256Title": "原始字节的 SHA-256",
  "sha256TitleDecoded": "解码字节的 SHA-256",
  "sha256Hint": "在别处解码后拿它比对，就能证明传输途中什么都没丢。",
  "hexTitle": "开头字节",
  "hexEmpty": "还没有字节。",
  "hexTruncated": "显示 {1} 中的前 {0}。",
  "mimeOverrideTitle": "按此类型处理",
  "mimeMismatch": "data: URL 声称是 {0}，但字节表明是 {1}。",
  "noPreview": "这种格式无法在浏览器中预览。请下载，或发送到另一个工具。",

  "issuesTitle": "我们发现的问题",
  "issue_invalid-char": "位置 {1} 上的字符 {0} 不属于 Base64 字母表，已跳过。",
  "issue_whitespace-stripped": "解码前移除了 {0} 处换行或空格。",
  "issue_padding-added": "载荷缺少一个完整的四字符组，因此假定了 {0} 个填充字符。",
  "issue_non-canonical": "最后一个字符（{0}）带有会被丢弃的位。编码器不会产生这种结果，所以这段字符串很可能被截断或手工改动过。",
  "issue_mixed-alphabet": "输入混用了两套字母表（+ / 与 - _）。已按标准 Base64 解码。",
  "issue_data-url": "解码前移除了声明 {0} 的 data: URL 前缀。",
  "issue_lost_surrogate": "有 {0} 个未成对的代理项无法用 UTF-8 表示，已被替换。",

  "error_bad-length": "这段载荷比完整的四字符组多出一个字符。剩下的六位凑不成一个字节，末尾无法还原——字符串被截断了。",
  "error_undecodable": "这些字符不构成有效的 Base64。",
  "error_not-base64-data-url": "那个 data: URL 使用百分号编码，不是 Base64，这里没有可解码的内容。",
  "error_not-utf8": "Base64 本身有效，但它背后的字节不是 UTF-8 文本，而是二进制数据。用“Base64 转文件”标签看它是什么，或把字符集改成 Latin-1。",
  "error_too-large": "这段载荷太大，浏览器无法把它保存为单个字符串。",
  "error_crashed": "编码器在这个文件上失败了。",
  "error_no-input": "没有待编码的内容。",
  "errorTooBig": "该文件为 {0}；上限是 {1}。",

  "nextStepTitle": "继续处理",
  "nextStepHint": "结果随你走——无需下载，也无需重新上传",
  "nextCompress": "压缩它",
  "nextCrop": "裁剪它",
  "nextFavicon": "做成 favicon",
  "nextHash": "取它的哈希",
  "nextJson": "打开 JSON",
  "nextUrl": "做 URL 编码",
  "nextDiff": "比较两个版本",
  "nextCodecard": "变成图片",

  "howItWorksTitle": "工作方式",
  "step1Title": "把载荷带进来",
  "step1Text": "打字、粘贴、拖入任意类型的文件，或者让套件里的另一个工具直接交给它。拖入文件时还不会读取任何内容。",
  "step2Title": "决定输出的样子",
  "step2Text": "标准还是 URL 安全字母表、填充开还是关、在 64、76 还是 100 列换行、用 LF 还是 CRLF。真实解析器分歧最大的恰恰是这些。",
  "step3Title": "看看字节",
  "step3Text": "格式是从魔数读出来的，不是靠文件名猜的。你会得到十六进制转储、gzip 之后的体积、SHA-256 和一次可逆性检查。",
  "step4Title": "带走它",
  "step4Text": "复制原始字符串、data: URL、CSS 规则、img 标签、JSON 请求体或 PEM 块——或者把解码后的文件直接送进另一个工具。",

  "features": [
    {
      "title": "三个字节，四个字符",
      "text": "Base64 永远比它承载的字节多花 33%，工具会把两个数字连同 gzip 之后的体积一起给你：对接近文本的载荷，gzip 几乎全都补回来；对 PNG 则几乎补不回来。"
    },
    {
      "title": "URL 安全字母表",
      "text": "切换到 - 和 _，载荷就能毫无转义地通过查询字符串、文件名或 JWT。填充也可以去掉，这正是各种令牌格式所期待的。"
    },
    {
      "title": "十六进制检查器",
      "text": "看见真正的字节，每行十六个，旁边配可打印的 ASCII。魔数会高亮显示，被截断的文件立刻露馅。"
    },
    {
      "title": "它会告诉你哪里坏了",
      "text": "哪个字符不在字母表里、在第几位、填充是否缺失、最后一个字符是否带有会被丢弃的位。而不是干巴巴一句“无效的 Base64”。"
    },
    {
      "title": "格式从字节读出",
      "text": "PNG、JPEG、GIF、WebP、AVIF、HEIC、PDF、ZIP 及其中的 Office 格式、WOFF2、MP4、WASM、SQLite 等等，都按签名识别——所以下载下来的文件扩展名是对的。"
    },
    {
      "title": "大文件也不卡",
      "text": "文件在独立线程上按 3 MB 分块处理，进度条如实反映，停止按钮真的有用。转换 200 MB 载荷时标签页依然响应。"
    },
    {
      "title": "可测量，而不只是生成",
      "text": "每次运行都会给出 gzip 之后的体积和 SHA-256，都基于同一批字节计算。你可以据此判断内嵌是否胜过第二次请求，也可以据此证明往返没有损失。"
    },
    {
      "title": "可逆性检查",
      "text": "每次文本编码都会立即再解码一次并逐字节比对，所以一旦字母表和填充的组合会被对方拒绝，在你粘贴之前就会收到提示。"
    }
  ],

  "seoSecondaryTitle": "关注载荷，而不只是字符串",
  "seoHeroText": "多数 Base64 工具给你一段字符串就结束了。这一个保留字节：按签名识别格式，把开头一千字节以十六进制列出，测量载荷经过 gzip 后的真实成本，为它计算哈希以便你证明往返无损，并且精确指出是第几位的哪个字符毁了这段载荷，而不是笼统地怪整体。编码时它接受任何文件——字体、PDF、WebAssembly 模块——因为 Base64 从来就不只是图片的事。",
  "seoHeroList": [
    "标准与 URL 安全两套字母表",
    "填充可选，可在 64/76/100 列换行",
    "按魔数识别格式",
    "gzip 之后的体积与 SHA-256"
  ],
  "seoBrowserSpeedTitle": "没有任何东西离开你的浏览器",
  "seoBrowserSpeedText": "编码、解码、格式识别、十六进制转储、gzip 测量和 SHA-256，全部是运行在你自己标签页里的原生浏览器 API，体积大的还会放到独立线程上。没有上传、没有请求，也没有可记录的东西——这很重要，因为人们粘贴进 Base64 工具的，往往是私钥、会话令牌和内部文档。",
  "seoUseCaseTitle": "为没有标签的载荷而生",
  "seoUseCaseText": "从数据库某一列取出的 blob，任何地方都没记录它的 MIME 类型。一段解不开的 JWT，因为它用了 URL 安全字母表且没有填充。样式表里内嵌的 SVG，渲染出来是一张破图。一个声称 image/png 的 data: URL，字节却明显是 JPEG。一份在 64 列换行的证书，被严格的解析器拒收。Base64Bolt 全都读得懂，会告诉你字节到底是什么，并让你以正确扩展名的文件把结果带走。",
  "seoPrivacyTitle": "无需账号、没有限额、无需上传",
  "seoPrivacyText": "没有注册，没有每日配额，也没有把好用的一半藏在付费档里。你打开的文件在本地读取，绝不会被传输；关掉标签页，一切就被忘记。",
  "seoKeywordsTitle": "相关搜索",
  "seoKeywords": [
    "base64 编码",
    "base64 解码",
    "文件转 base64",
    "base64 转文件",
    "data url 转换器",
    "base64url 解码",
    "图片转 base64",
    "base64 转图片",
    "在线解码 base64",
    "base64 十六进制查看器"
  ],

  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "为什么我的 JWT 或令牌在别处解不开，在这里却可以？",
      "answer": "因为它用的是 URL 安全字母表——用连字符和下划线代替加号和斜杠——而且通常还去掉了填充。只认识标准字母表的解码器碰到第一个连字符就会报错。Base64Bolt 会判断输入用的是哪套字母表，补回缺失的填充，并把这两件事都告诉你。"
    },
    {
      "question": "Base64 会让我的文件变大吗？",
      "answer": "一定会，正好三分之一：每三个字节变成四个字符，再加最多两个填充字符。这是否真的让你付出代价取决于压缩，所以工具会把 gzip 之后的体积摆在原始体积旁边。内嵌一个小 SVG 通常划得来；内嵌一张大 JPEG 通常划不来，因为它本来就压缩过，而 Base64 抵消掉了一部分成果。"
    },
    {
      "question": "我可以编码图片以外的东西吗？",
      "answer": "可以，任何文件。给 @font-face 用的字体、做下载链接的 PDF、WebAssembly 模块、ZIP、音频片段。以前只限图片是没有道理的限制：Base64 并不在意这些字节代表什么。"
    },
    {
      "question": "“最后一个字符带有会被丢弃的位”是什么意思？",
      "answer": "每个 Base64 字符携带六位，但载荷的最后一组往往用不到那么多。QQ== 和 QR== 都会解码成同一个字节 0x41，因为 R 的最后四位被丢掉了。没有编码器会产生后一种形式，所以看到它就说明字符串被截断或手工改过——在你相信结果之前值得知道。"
    },
    {
      "question": "为什么解码时说字节不是 UTF-8？",
      "answer": "因为它们不是文本。Base64 承载的是字节，而大量载荷本身就是图片、压缩包或密钥。旧的做法是报“无效的 Base64”，那根本就是错的：Base64 一点问题也没有。切到“Base64 转文件”标签，工具就会识别格式并让你下载。"
    },
    {
      "question": "我该在 76 列处换行吗？",
      "answer": "只有当下游有东西需要它时才要。MIME 正文和 PEM 块按规范换行——PEM 在 64 列，MIME 在 76 列——而且有些邮件解析器会拒收单独的一长行。如果是样式表里的 data: URL 或 JSON 字段，就把换行关掉。"
    },
    {
      "question": "会有东西被发送到服务器吗？",
      "answer": "不会。每一步都是运行在你标签页里的原生浏览器 API，所以页面加载之后即使离线也照样能用。没有任何上传、远程缓存或日志。"
    }
  ],

  "footerTagline": "把任意文件编码为 Base64，也把任意载荷解码回来：URL 安全字母表、可选填充、十六进制检查器和按魔数识别格式，全部在你的浏览器里完成。",
  "footerCredit": "oLoveTools 套件的一部分",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "已复制！",
  "contactForIdeas": "有想法或意见请联系："
};
