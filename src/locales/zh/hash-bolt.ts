export default {
  "title": "HashBolt",
  "badge": "校验和与文件完整性",
  "description": "对任意大小的文件或纯文本计算 MD5、SHA-1、SHA-256、SHA-512、SHA-3、BLAKE3 或 CRC-32，并与官方公布的校验和比对。文件在浏览器内分块读取，绝不上传。",
  "seo_title": "HashBolt | 免费在线 MD5、SHA-256、SHA-512 与 BLAKE3 校验和工具",
  "seo_description": "在浏览器里生成并校验文件哈希：MD5、SHA-1、SHA-256、SHA-384、SHA-512、SHA-3、BLAKE2b、BLAKE3、RIPEMD-160、CRC-32、xxHash 与 HMAC。支持数 GB 大文件、批量处理和 SHA256SUMS 校验，全程不上传。",
  "modeFile": "文件",
  "modeText": "文本",
  "modeCompare": "比对",
  "dropTitle": "把文件拖到这里",
  "dropHint": "任何类型、任何大小、想放多少都行。在你按下“开始计算”之前，什么都不会被读取。",
  "browseBtn": "选择文件",
  "folderBtn": "整个文件夹",
  "pasteHint": "或用 Ctrl+V 粘贴",
  "queueTitle": "队列（{count}）",
  "clearBtn": "清空",
  "removeBtn": "移除",
  "statusQueued": "等待中",
  "statusCancelled": "已停止",
  "staleNotice": "设置已更改",
  "pendingCount": "还有 {count} 个待计算",
  "computeBtn": "开始计算",
  "computeAgainBtn": "重新计算",
  "cancelBtn": "停止",
  "algoTitle": "算法",
  "algoNone": "未选择",
  "algoHint": "需要几种就勾几种：文件只读一遍，所有摘要都在这同一遍里算出来。",
  "groupChecksum": "校验和与老算法",
  "groupSha2": "SHA-2 系列",
  "groupModern": "现代算法",
  "brokenTag": "碰撞已可实际构造：查传输损坏够用，防篡改无效",
  "outputTitle": "输出",
  "formatHex": "十六进制",
  "formatBase64": "Base64",
  "formatBase64Url": "Base64URL",
  "uppercaseLabel": "大写",
  "groupedLabel": "分组显示",
  "hmacTitle": "HMAC（带密钥的哈希）",
  "hmacHint": "用共享密钥为内容签名：没有密钥的人拿到摘要也毫无用处。",
  "hmacPlaceholder": "密钥",
  "hmacSkipped": "{algos} 没有 HMAC 模式，已跳过。",
  "textLabel": "要计算的文本",
  "textPlaceholder": "随便输入或粘贴，摘要会随着输入实时更新。",
  "textHint": "对文本求哈希和对含有该文本的文件求哈希并不一样：末尾多一个换行，或者是 Windows 的 CRLF，结果就变了。",
  "normalizeEolLabel": "规范化 Windows 换行符（CRLF → LF）",
  "compareHint": "只比两个哈希，不需要文件。把官方公布的那串和你手上的那串粘进来即可，十六进制或 Base64、大小写都行。",
  "compareA": "哈希 A",
  "compareB": "哈希 B",
  "compareEqual": "完全相同。就算两边写法不一样，也是同一个摘要。",
  "compareDifferent": "不同。这两个描述的是不同的内容。",
  "compareInvalid": "其中一个既不是十六进制也不是 Base64 的哈希。",
  "resultsTitle": "摘要",
  "resultsEmpty": "先把文件放进队列，勾选需要的算法，再按“开始计算”。",
  "resultsEmptyText": "开始输入，摘要就会显示在这里。",
  "resultsEmptyCompare": "比对模式不做任何计算，只告诉你两个摘要是不是同一个值。",
  "copyBtn": "复制",
  "copyAllBtn": "全部复制",
  "downloadSumsBtn": "下载 SUMS 文件",
  "verifyTitle": "与校验和比对",
  "verifyPlaceholder": "粘贴一个哈希，或整份 SHA256SUMS 文件——每行会按文件名自动配对。",
  "verifyHint": "十六进制和 Base64 都支持，大小写不限。如果某个长度不属于你勾选的任何算法，会直接说明，而不是当成不匹配。",
  "verifySummary": "读取 {count} 条校验和 · 已验证 {ok} 条 · 不匹配 {bad} 条",
  "verifyMatch": "匹配——同一个 {algo} 摘要。",
  "verifyMismatch": "不匹配。这个文件不是该校验和所描述的那一个。",
  "verifyUnknownLength": "这个校验和的长度不属于你勾选的任何算法。请勾选正确的算法后重新计算。",
  "nextStepTitle": "接着做",
  "nextStepHint": "同一个文件跟着走，不用重新上传",
  "nextZip": "打包成 ZIP",
  "nextCompress": "压缩它",
  "nextFormat": "转换格式",
  "nextExif": "清除元数据",
  "nextCrop": "裁剪它",
  "nextPdf": "拆分或合并",
  "nextFrames": "取一帧画面",
  "nextAudio": "剪辑或转换",
  "howItWorksTitle": "工作原理",
  "step1Title": "把要检查的东西放进队列",
  "step1Text": "拖入文件、选中整个文件夹、粘贴一个，或切到文本标签页。此时还什么都没读。",
  "step2Title": "选择算法",
  "step2Text": "一个或十二个都行。它们共用对文件的同一次遍历，所以算三个摘要的代价比一个高不了多少。",
  "step3Title": "按下“开始计算”",
  "step3Text": "文件在 worker 里分块流过：进度条是真实的，20 GB 的镜像也永远不会整个进内存。",
  "step4Title": "和公布的值比对",
  "step4Text": "粘贴一个哈希或整份 SUMS 文件。比对看的是值本身，而不是它被写成什么样子。",
  "features": [
    {
      "title": "边流边算，不整个吞下",
      "text": "文件在 worker 里分块读取，内存占用始终平稳，进度条反映真正算过的字节数。几 GB 的 ISO 在这里只是日常。"
    },
    {
      "title": "读一遍，出十二种摘要",
      "text": "MD5、SHA-1、SHA-256/384/512、SHA3-256/512、BLAKE2b、BLAKE3、RIPEMD-160、CRC-32 和 xxHash64，全部由同一次遍历供给。"
    },
    {
      "title": "会说明理由的校验",
      "text": "粘贴一个哈希，或整份 SHA256SUMS 清单。比对跨十六进制与 Base64 按值进行；某个长度若不属于任何已勾选的算法，会明确指出，而不是笼统地报不匹配。"
    },
    {
      "title": "文件夹与批量",
      "text": "一次排进上百个文件，逐个计算，再导出与 coreutils 兼容的 SUMS 文件，放在你的下载链接旁边发布。"
    },
    {
      "title": "HMAC 与各种写法",
      "text": "带密钥的 HMAC 摘要，加上十六进制、Base64 和 Base64URL 输出、大写与分组显示。切换其中任何一项都是即时重绘，而不是重新读文件。"
    },
    {
      "title": "什么都不上传",
      "text": "引擎是嵌在页面里的 WebAssembly。没有 CDN、没有 API、没有上传：页面加载完后拔掉网线，它照样能用。"
    }
  ],
  "seoHeroTitle": "在信任一个下载之前，先验一验",
  "seoHeroText": "要判断刚下载的安装包是否与官方发布的逐字节一致，而不是被截断的传输或被掉包的镜像，校验和是唯一便宜的办法。HashBolt 在本地算出这枚指纹：文件分块流经 WebAssembly 引擎，大小不再是限制，你勾选的每种算法都由同一次读取供给。随后把公布的值粘进来——单独一串哈希、一份 SHA256SUMS 清单，或者 BSD 风格的一行——结果会告诉你到底是哪种算法对上了。",
  "seoHeroList": [
    "任意大小的文件",
    "一次遍历，十二种算法",
    "SHA256SUMS 校验",
    "加载后可离线使用"
  ],
  "seoBrowserSpeedTitle": "worker 里的 WebAssembly 引擎",
  "seoBrowserSpeedText": "哈希计算在主线程之外、以编译后的 WebAssembly 运行，比多数在线工具至今仍用于 MD5 的手写 JavaScript 快一个数量级。由于文件是以流的方式消费，内存峰值只相当于一个分块而非整个文件，读取 4 GB 压缩包时界面依然跟手。",
  "seoSecondaryTitle": "校验和能证明什么，不能证明什么",
  "seoUseCaseTitle": "下载、备份与重复文件",
  "seoUseCaseText": "把 Linux ISO 或安装包和官网上的哈希对一遍。确认拷到移动硬盘的文件是否完好到达。用摘要判断两个名字不同的文件是否其实一模一样，不必逐个打开。也可以生成一份 SUMS 文件随自己的发布一起提供，让别人做同样的检查。",
  "seoPrivacyTitle": "从不发送，也就无从泄露",
  "seoPrivacyText": "这个工具压根没有上传接口，计算过程也不涉及任何网络请求：WebAssembly 模块就嵌在页面里，断网照样工作。你的文件、你的文本，以及输入的任何 HMAC 密钥都只留在这个标签页里，关掉就没了。",
  "seoKeywordsTitle": "关键词",
  "seoKeywords": [
    "MD5 在线生成",
    "SHA-256 校验和",
    "校验文件哈希",
    "SHA256SUMS 校验工具",
    "BLAKE3 在线",
    "CRC-32 计算器",
    "HMAC 生成器",
    "文件完整性检查"
  ],
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "我的文件会被上传吗？",
      "answer": "不会。哈希引擎是嵌在页面里的 WebAssembly，运行在你浏览器的 worker 中。这里没有上传接口、没有 API 调用、也不会向 CDN 请求任何东西，所以断网之后工具照样能用。"
    },
    {
      "question": "能处理多大的文件？",
      "answer": "没有固定上限：文件以小分块的流方式读取，内存里始终只有一块，几 GB 的磁盘镜像属于常规操作。实际的瓶颈是你磁盘的读取速度，而速度显示上给出的正是这个数字。"
    },
    {
      "question": "怎么校验下载好的 ISO 或安装包？",
      "answer": "把文件放进队列，勾选官方使用的算法（绝大多数情况是 SHA-256），按下“开始计算”，再把他们公布的值粘进校验框。你也可以直接粘贴整份 SHA256SUMS 文件：每行会按文件名和你的文件自动配对。"
    },
    {
      "question": "为什么 MD5 旁边有警告？",
      "answer": "因为如今构造两个 MD5 摘要相同的不同文件成本很低，SHA-1 同理。用来发现传输损坏——下载页上的校验和通常就是这个用途——它们依然完全够用，但面对故意篡改文件的人，它们证明不了任何事。"
    },
    {
      "question": "我算出来的和网站上的对不上，怎么办？",
      "answer": "先确认比的是同一种算法：64 个字符的哈希可能是 SHA-256、SHA3-256、BLAKE2b 或 BLAKE3，本工具会告诉你是哪一种对上了。然后重新下载一次：真正的不一致多半来自中断的传输或有问题的镜像。如果换了新下载依然对不上，就不要运行这个文件。"
    },
    {
      "question": "为什么文本的哈希和同样内容文件的哈希不一样？",
      "answer": "因为文件里往往带着输入框没有的东西：末尾的换行、Windows 的 CRLF 换行符，或者 UTF-8 的 BOM 标记。本工具严格按你给的字节计算；当你需要对上 Linux 上生成的值时，可以打开把 CRLF 规范成 LF 的开关。"
    },
    {
      "question": "HMAC 是干什么用的？",
      "answer": "普通哈希能证明内容没有被意外改动，但任何人都能重新算一遍。HMAC 把一把密钥混进摘要里，因此只有持有密钥的人才能生成或验证这个值。API 签名和 Webhook 校验用的就是它。"
    }
  ],
  "footerTagline": "面向文件和文本的免费校验和生成与校验工具，完全在你的浏览器中运行。",
  "footerCredit": "oLoveTools 工具套件的一部分"
};
