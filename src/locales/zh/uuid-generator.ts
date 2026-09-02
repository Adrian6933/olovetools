export default {
  "resetHint": "重新开始",
  "title": "UUID 生成器",
  "badge": "唯一标识符",
  "description": "生成 UUID v1、v3、v4、v5、v6 与 v7，以及 ULID、NanoID 和 MongoDB ObjectId——批量生成，输出格式与你的代码要求完全一致，且没有任何网络请求。",
  "seo_title": "UUID 生成器 | 批量生成 v4、v7、v5、ULID 与 NanoID",
  "seo_description": "免费在线 UUID 生成器：支持 v1、v3、v4、v5、v6、v7、nil 与 max，另有 ULID、NanoID 和 ObjectId。大批量生成、可自定义输出格式、逐字节检查器，全部在浏览器中完成。",
  "groupUuid": "RFC 9562 的 UUID",
  "groupOther": "其他标识符",
  "kindHelp_v4": "来自浏览器加密随机源的 122 位熵。只要求唯一时的默认选择。",
  "kindHelp_v7": "48 位 Unix 毫秒时间戳后跟随机位，并带有计数器，因此同一毫秒内生成的标识符仍能正确排序。如今数据库主键的首选。",
  "kindHelp_v1": "时间戳加节点标识。本工具使用置了多播位的随机节点，因此绝不会暴露你真实的 MAC 地址。",
  "kindHelp_v6": "把 v1 的字段重新排列，让时间戳排在最前。可直接按原始字节按时间排序，这是 v1 做不到的。",
  "kindHelp_v3": "命名空间与名称的 MD5。同一组合永远得到同一个 UUID——每行写一个名称即可批量生成。",
  "kindHelp_v5": "命名空间与名称的 SHA-1。与 v3 一样确定，但摘要更强。每行一个名称。",
  "kindHelp_nil": "128 位全为 0：表示“无值”的标准 UUID。",
  "kindHelp_max": "128 位全为 1：UUID 空间的上界，常用作哨兵值。",
  "kindHelp_ulid": "Crockford base32 的 26 个字符：48 位时间加 80 位随机，可按字典序排序且不区分大小写。",
  "kindHelp_nanoid": "21 个 URL 安全字符，约 126 位熵。比 UUID 更短，无需转义即可放进网址。",
  "kindHelp_objectid": "MongoDB 为每个文档附加的 12 字节标识符：4 字节时间、5 字节随机、3 字节计数器。",
  "label_count": "数量",
  "hint_big_batch": "超过 10 000 后滑块到头，请直接输入准确数字。预览始终只显示 300 行，但复制和下载覆盖整批数据。",
  "label_namespace": "命名空间",
  "label_names": "名称——每行一个",
  "hint_deterministic": "相同的命名空间与名称永远得到相同的标识符——这正是 v3 和 v5 存在的意义。想要一批，就给它一批名称。",
  "button_generate": "生成",
  "button_working": "处理中…",
  "tooltip_undo": "上一批 (Ctrl+Z)",
  "tooltip_redo": "下一批 (Ctrl+Shift+Z)",
  "button_clear": "全部清空",
  "error_invalid_namespace": "该命名空间不是有效的 UUID。",
  "error_clipboard": "浏览器拒绝了剪贴板访问，请改用下载按钮。",
  "error_generic": "生成过程中出错，请尝试更小的批量。",
  "error_unrecognised": "这看起来不像本工具认识的标识符。",
  "stat_count": "已生成",
  "stat_time": "毫秒",
  "stat_rate": "每秒",
  "stat_duplicates": "重复",
  "empty_state": "还没有生成任何内容。选择类型、设定数量，然后点击“生成”。",
  "label_showing": "显示 {total} 条中的 {shown} 条",
  "label_uuids_generated": "个标识符",
  "tooltip_copy": "复制到剪贴板",
  "button_copy_all": "全部复制",
  "button_copied_all": "已复制",
  "label_format": "输出形态",
  "placeholder_prefix": "前缀",
  "placeholder_suffix": "后缀",
  "label_inspect": "解析与手工构造",
  "button_load_list": "从文件载入列表",
  "button_blank": "从 16 个空字节开始",
  "placeholder_inspect": "粘贴任意 UUID、ULID 或 ObjectId",
  "field_timestamp": "时间戳",
  "byte_version": "第 6 字节 — 版本半字节",
  "byte_variant": "第 8 字节 — 变体位",
  "button_now": "此刻",
  "button_reroll": "重掷末尾 8 个字节",
  "button_revert": "还原",
  "button_copy": "复制",
  "button_use_crafted": "用作输出",
  "imported_summary": "在来自 {from} 的列表中找到 {count} 个标识符。",
  "imported_unique": "{n} 个不重复",
  "imported_inspect": "解析第一个",
  "nextStepTitle": "继续处理",
  "nextStepHint": "列表随你同行——无需下载，也无需重新上传",
  "nextDiff": "比较两批",
  "nextHash": "计算校验值",
  "nextJson": "以 JSON 打开",
  "nextRegex": "测试正则",
  "nextZip": "打包为 ZIP",
  "howItWorksTitle": "工作原理",
  "step1Title": "挑一种类型",
  "step1Text": "共十一种，从常见的 v4 到按时间排序的 v7、ULID 或 Mongo 的 ObjectId。",
  "step2Title": "设定这一批",
  "step2Text": "要多少个，以及什么形态：大小写、连字符、包裹符号、前缀和导出格式。",
  "step3Title": "点击生成",
  "step3Text": "在此之前什么都不会运行。批量在 Worker 中构建，并精确计时到零点一毫秒。",
  "step4Title": "带走结果",
  "step4Text": "复制、下载为 txt、csv、json 或 SQL，也可以把列表直接送往另一个工具。",
  "features": [
    {
      "title": "十一种标识符",
      "text": "UUID v1、v3、v4、v5、v6、v7、nil 与 max，另有 ULID、NanoID 和 MongoDB ObjectId。"
    },
    {
      "title": "按时间排序且单调",
      "text": "v7、v6 和 ULID 内置计数器，同一毫秒内生成的标识符仍保持创建顺序。"
    },
    {
      "title": "还能反向读取",
      "text": "粘贴任意标识符即可看到版本、变体、时间戳、节点与原始字节，并可只改动一个半字节。"
    },
    {
      "title": "不占用主线程",
      "text": "批量在 Web Worker 中运行，附带精确耗时以及针对整批数据的重复检测。"
    },
    {
      "title": "想要什么格式都行",
      "text": "大小写、连字符、花括号、urn:uuid:、引号、前缀与后缀，可导出为 txt、csv、json 或 SQL。"
    },
    {
      "title": "数据不出标签页",
      "text": "熵取自 Web Crypto，没有任何网络调用，两次访问之间也不保存任何内容。"
    }
  ],
  "seoHeroTitle": "所有标识符格式，都在本地生成",
  "seoHeroText": "大多数生成器给你一个 v4 就结束了。这里覆盖 RFC 9562 的完整家族、在实践中取代它的可排序格式，以及其他生态系统所用的标识符，输出形态与你的迁移脚本、种子文件或测试夹具所需完全一致。",
  "seoHeroList": [
    "11 种标识符",
    "单批最多 100 000 个",
    "逐字节检查器",
    "零网络请求"
  ],
  "seoBrowserSpeedTitle": "天生可排序",
  "seoBrowserSpeedText": "随机的 v4 主键会把写入分散到整棵 B-tree 索引。v7、v6 和 ULID 把时间放在最前，新行会落在索引末尾而不是遍地开花；本工具还在每一毫秒内维护计数器，即使在紧凑循环中顺序也不会乱。",
  "seoSecondaryTitle": "为标识符之后的工作而设计",
  "seoUseCaseTitle": "种子数据、测试夹具与迁移",
  "seoUseCaseText": "生成十万个主键，直接导出为 SQL INSERT 或 JSON 数组，再把列表交给比较、哈希或压缩工具，全程不经过下载文件夹。",
  "seoPrivacyTitle": "本地运行，且可验证",
  "seoPrivacyText": "熵来自标签页内的 Web Crypto API。没有 API 调用，没有 CDN 拉取，也没有额外下载的 WebAssembly：v3 与 v5 所用的哈希就嵌在页面里，因此断网也能照常使用。",
  "seoKeywordsTitle": "关键词",
  "seoKeywords": [
    "uuid 生成器",
    "随机 uuid v4",
    "按时间排序的 uuid v7",
    "基于名称的 uuid v5",
    "guid 生成器",
    "ulid 生成器",
    "短小的 nanoid",
    "批量 uuid",
    "uuid 解析器"
  ],
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "该选哪个 UUID 版本？",
      "answer": "只要唯一性就用 v4。标识符要当主键就用 v7，因为开头的时间戳能让索引写入集中在一处。同样的输入必须得到同样的标识符时用 v5。"
    },
    {
      "question": "为什么要十个 v5 却得到十个一样的？",
      "answer": "因为这正是 v5 的含义：一个命名空间加一个名称只对应一个标识符。想要十个不同的，就给它十个不同的名称，每行一个。"
    },
    {
      "question": "v7 和 ULID 有什么区别？",
      "answer": "两者都是 48 位毫秒时间戳加随机位。v7 是真正的 UUID，能直接放进 UUID 列；ULID 是 26 个 base32 字符，更短且不区分大小写，但它不是 UUID。"
    },
    {
      "question": "这些标识符在密码学上安全吗？",
      "answer": "随机性来自 crypto.getRandomValues，与浏览器生成自身密钥材料使用的是同一来源。但请注意，v1 和 v7 会有意暴露创建时间，因此它们并不是秘密。"
    },
    {
      "question": "一次最多能生成多少个？",
      "answer": "每批最多 100 000 个。为保持页面流畅，屏幕列表只显示前 300 行；复制、下载以及传递按钮始终作用于完整批次。"
    },
    {
      "question": "会有数据发送到服务器吗？",
      "answer": "不会。生成、解析和导出都在你的浏览器中完成，使用期间页面不会发出任何请求。"
    }
  ],
  "footerTagline": "UUID v1 到 v7、ULID、NanoID 和 ObjectId——生成、解析与导出全部在你的浏览器中完成。",
  "footerCredit": "oLoveTools 套件的一部分",
  "emailCopied": "已复制！",
  "contactForIdeas": "想法与建议请联系：",
  "emailAddress": "adrian.contact.me.69@gmail.com"
};
