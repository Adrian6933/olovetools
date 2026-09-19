export default {
  "tree_rows_one": "{0} 行",
  "tree_hits_one": "{0} 处匹配",
  "query_matches_one": "{0} 处匹配",
  "emailCopied": "已复制！",
  "contactForIdeas": "意见与建议联系方式：",
  "copyPath": "复制路径",
  "copyValue": "复制值",
  "copyBranch": "复制整个分支",
  "resetHint": "重新开始",
  "title": "JSONFlow",
  "description": "在浏览器里校验、浏览并转换 JSON：精确到行列的报错、面对超大文件依然流畅的可折叠树、JSONPath 查询，以及导出为 CSV、XML、YAML、JSON Schema 或 TypeScript。",

  // 操作
  "beautify": "格式化",
  "minify": "压缩",
  "sort_keys": "键排序",
  "sort_none": "原始顺序",
  "sort_asc": "键 A → Z",
  "sort_desc": "键 Z → A",
  "clear": "清空",
  "load_mock": "载入示例",
  "copy": "复制",
  "copied": "已复制！",
  "undo": "撤销",
  "redo": "重做",
  "close": "关闭",
  "shortcuts": "键盘快捷键",
  "open_file": "打开文件",
  "copy_source": "复制原文",
  "download_json": "下载 .json",
  "reset_view": "重置视图",
  "parse_btn": "解析",
  "repair_btn": "修复",
  "unescape_btn": "反转义",
  "jsonl_btn": "合并 JSON Lines",

  // 缩进
  "indentation": "缩进",
  "indent_2_spaces": "2 个空格",
  "indent_4_spaces": "4 个空格",
  "indent_tabs": "制表符",

  // 校验
  "status_valid": "JSON 有效",
  "status_invalid": "JSON 无效：",
  "status_empty": "还没有载入任何内容。",
  "status_checking": "正在主线程之外校验…",
  "error_at": "第 {0} 行，第 {1} 列",
  "jump_to_error": "跳过去",
  "warnings_title": "有 {0} 处值得留意",
  "empty_placeholder": "在此粘贴 JSON、拖入文件，或载入一个示例…",
  "drop_file_prompt": "拖入 .json、.jsonl、.csv 或 .tsv 文件",
  "editor_title": "原文",
  "fix_first": "修好左边的错误，各个面板就会填上内容。",
  "press_parse": "点击“解析”来构建这份文档的树。",

  // 解析器发现
  "issueSyntax": "语法错误",
  "issueDuplicateKey": "重复的键",
  "issuePrecision": "数字超出 JavaScript 能表示的范围",
  "issueDepth": "嵌套过深",
  "issueTrailingComma": "多余的逗号",
  "issueComment": "注释",
  "issueSingleQuote": "单引号字符串",
  "issueUnquotedKey": "未加引号的键",
  "issuePythonLiteral": "Python 字面量",
  "issueNonFinite": "不是 JSON 数字",
  "issueBom": "字节顺序标记",
  "issueEmpty": "空文档",

  // 标签与视图
  "tab_tree_viewer": "树",
  "tab_formatted_json": "代码",
  "tab_table": "表格",
  "tab_convert": "转换",
  "tab_schema": "类型",
  "tab_diff": "对比",

  // 树控件
  "search_placeholder": "按键或值筛选…",
  "scope_both": "全部",
  "scope_keys": "键",
  "scope_values": "值",
  "expand_all": "全部展开",
  "collapse_all": "全部折叠",
  "depth_label": "展开到层级",
  "depth_option": "第 {0} 层",
  "depth_all": "所有层级",
  "no_nodes": "在左侧粘贴或拖入 JSON 即可开始。",
  "no_matches": "没有内容符合这个搜索。",
  "tree_rows": "{0} 行",
  "tree_hits": "{0} 处匹配",
  "tree_mounted": "DOM 中 {0} 个",
  "tree_capped": "已达上限：折叠一层即可看到其余内容",
  "copy_path": "复制路径",
  "copy_value": "复制值",
  "locate": "在编辑器中定位",
  "stale_notice": "构建之后编辑器有改动。点击“解析”重新生成。",

  // 输出
  "output_size": "{0} 个字符",
  "preview_clipped": "预览到 {0} 个字符为止，复制和下载仍然是完整内容。",
  "copy_failed": "浏览器拒绝了剪贴板访问。",

  // 表格 / CSV
  "flatten_title": "扁平化",
  "array_json": "数组保留为 JSON",
  "array_expand": "每项一列",
  "array_join": "拼接",
  "separator_label": "路径分隔符",
  "table_summary": "{0} 行 × {1} 列。预览显示前 {2} 行。",
  "table_wrapped": "这份文档不是数组，因此只生成了一行。",
  "export_csv": "下载",
  "export_xml": "下载 XML",
  "import_csv": "CSV 或 TSV 转 JSON",
  "csv_placeholder": "把 CSV 或 TSV 粘贴到这里，转成 JSON…",
  "convert_csv_btn": "转换为 JSON",
  "csv_nest": "根据 a.b 形式的表头还原嵌套",
  "csv_nest_hint": "默认关闭是有意为之：first_name 这一列应当仍是 first_name，而不是变成 { first: { name } }。",

  // 转换 / 类型
  "xml_root": "根元素",
  "type_name": "名称",
  "schema_hint": "从所有记录推断，而不只看第一条：某些记录里缺失的字段会标为可选。",

  // 查询
  "query_placeholder": "$.users[?(@.age > 30)].name",
  "query_matches": "{0} 处匹配",
  "query_use": "作为当前文档",

  // 对比
  "diff_hint": "按路径比较而非按行：调换键的顺序不会算作改动。",
  "diff_placeholder": "把另一份 JSON 文档粘贴到这里…",
  "diff_run": "比较",
  "diff_identical": "两份文档在结构上完全一致。",
  "diff_added": "新增",
  "diff_removed": "删除",
  "diff_changed": "变更",
  "diff_type": "类型",

  // 运行栏 / 文件
  "manual_mode": "手动模式",
  "manual_on": "在你点击“解析”之前不会构建任何东西。",
  "manual_off": "小于 {0} 的文档边输入边构建；更大的会等你点“解析”。",
  "parked_hint": "刻意先不加载：把这么大的文件放进编辑器本身就是最费力的一步。",
  "parked_load": "仍然加载",
  "file_too_large": "这个文件太大，浏览器标签页打不开。",
  "file_failed": "无法读取这个文件。",

  // 统计
  "stat_bytes": "大小",
  "stat_lines": "行数",
  "stat_nodes": "节点数",
  "stat_depth": "深度",
  "stat_keys": "不重复键",
  "stat_time": "解析耗时",
  "stat_offthread": "Worker",

  // 提示
  "toast_csv_loaded": "已从 {1} 导入 {0} 行。",
  "toast_jsonl_loaded": "JSON Lines 已合并为一个数组。",
  "toast_needs_valid": "请先修好错误，目前还没有可构建的内容。",
  "toast_repaired": "已修复为严格 JSON。",
  "toast_unrepairable": "这份文档损坏太严重，无法自动修复。",
  "toast_unescaped": "已取出藏在字符串里的 JSON。",
  "toast_unescape_failed": "这不是带引号的 JSON 字符串。",

  // 快捷键
  "sc_undo": "撤销",
  "sc_redo": "重做",
  "sc_parse": "解析文档",
  "sc_beautify": "格式化",
  "sc_minify": "压缩",
  "sc_copy": "复制格式化后的输出",
  "sc_help": "本面板",

  // 传递
  "nextStepTitle": "继续处理",
  "nextStepHint": "文档跟着你走，无需下载再上传",
  "nextDiff": "拿去比较",
  "nextCodecard": "生成代码图片",
  "nextXml": "XML ⇄ JSON",
  "nextHash": "计算哈希",
  "nextMarkdown": "写成文档",

  // 示例
  "mock_user_profile": "用户资料",
  "mock_product_catalog": "商品目录",
  "mock_weather_data": "天气预报",
  "sample_broken": "损坏的配置（可修复）",
  "sample_bigint": "64 位标识符",

  // 工作原理
  "hero_badge": "工作台",
  "howItWorksTitle": "工作原理",
  "step1Title": "把 JSON 拿进来",
  "step1Text": "粘贴、拖入文件，或由另一个工具直接递过来。什么都不会上传，重活也不会在你开口之前启动。",
  "step2Title": "看结论",
  "step2Text": "要么有效，要么给出出错的确切行列，另外还有重复的键和 JavaScript 存不下的数字。",
  "step3Title": "翻一翻",
  "step3Text": "折叠树、按键或值筛选，或者对整份文档跑一条 JSONPath 表达式。",
  "step4Title": "带走它",
  "step4Text": "CSV、XML、YAML、JSON Lines、JSON Schema、TypeScript 或 Go 类型，也可以直接送去另一个工具。",

  "features": [
    {
      "title": "真正的解析器，不是 JSON.parse",
      "text": "报错会给出行、列，并在行号栏高亮那一行，而不是丢给你一个还得自己数的字符偏移量。"
    },
    {
      "title": "64 位标识符不会走样",
      "text": "长数字标识符会逐位原样写回。任何基于 JSON.parse 的格式化工具都会悄悄把它们四舍五入到最近的双精度值。"
    },
    {
      "title": "一键修复",
      "text": "注释、多余逗号、单引号、未加引号的键、Python 的 True/False/None，以及跑错地方的 BOM，都会变成严格 JSON。"
    },
    {
      "title": "JSONPath 查询",
      "text": "通配符、递归下降、切片，以及 [?(@.price > 10)] 这类过滤条件，全部手写解释：你输入的内容永远不会被执行。"
    },
    {
      "title": "从真实数据得出类型",
      "text": "JSON Schema、TypeScript 接口或 Go 结构体，都会通读所有记录后推断，因此偶尔缺席的字段会成为可选项。"
    },
    {
      "title": "诚实的扁平化",
      "text": "你决定路径分隔符，以及嵌套数组的去向。空对象会保留自己的列，而不是从导出结果里消失。"
    },
    {
      "title": "结构化对比",
      "text": "两份文档逐条路径比较，键的顺序不同不会被算成上千处改动。"
    },
    {
      "title": "大文件依然好用",
      "text": "校验搬进 Web Worker，树只挂载屏幕上看得见的行，撤销记录保存改动的字符而不是整份文档的副本。"
    }
  ],

  // SEO 与文案
  "seo_title": "JSONFlow | JSON 格式化、校验、查看与转换工具",
  "seo_description": "格式化、校验并浏览 JSON，报错精确到行列，面对大文件的树依然流畅。可转换为 CSV、XML、YAML 或 JSON Lines，生成 JSON Schema 与 TypeScript 类型，并运行 JSONPath 查询——全部在浏览器里完成。",
  "seoHeroTitle": "Format, explore and convert JSON safely.",
  "seoHeroText": "API 响应里带着令牌、客户资料和内部标识符。JSONFlow 不会把这些送到任何地方：解析器、树、查询和导出都在这个标签页内运行，所以把生产环境的响应粘进来，和在自己的编辑器里打开一样私密。",
  "seoHeroList": [
    "100% 本地，什么都不上传",
    "每个错误都给出确切行列",
    "CSV、XML、YAML、Schema 与 TypeScript"
  ],
  "seoBrowserSpeedTitle": "一切都在这个标签页里运行",
  "seoBrowserSpeedText": "解析器、可折叠树、JSONPath 引擎和每一种导出，都是在你设备上运行的普通 JavaScript。没有上传步骤，没有后端，也没有任何带着你数据的请求：页面加载完之后断网，工具照样能用。",
  "seoSecondaryTitle": "面向开发者的完整 JSON 工作台。",
  "seoKeywordsTitle": "关键词",
  "seoKeywords": [
    "JSON 格式化",
    "JSON 校验",
    "JSON 查看器",
    "JSON 转 CSV",
    "JSON 转 XML",
    "JSON 转 YAML",
    "CSV 转 JSON",
    "JSON 美化",
    "JSONPath",
    "JSON Schema 生成器",
    "JSON 转 TypeScript",
    "JSON 对比",
    "JSON 修复",
    "JSON Lines"
  ],
  "seoUseCaseTitle": "大家拿它做什么",
  "seoUseCaseText": "找出那一个把配置文件搞坏的逗号，把 API 响应变成表格，为没人写过文档的接口生成 TypeScript 接口，确认同一份数据的两个版本是否真有差别，以及打开那些 JSON 被包在带引号字符串里的日志。",
  "seoPrivacyTitle": "为什么本地在这里格外重要",
  "seoPrivacyText": "JSON 数据几乎从不是匿名的：里面有访问令牌、邮箱地址、订单号和内部接口地址。把它粘进托管在别处的格式化网站，等于把这一切交给别人的服务器。在这里它不会离开标签页，也就没有什么可记录、可缓存或可泄露的。",

  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "我的 JSON 会被发送到服务器吗？",
      "answer": "不会。解析、校验、树、查询和所有导出都在这个浏览器标签页内运行。页面加载完之后你可以断开网络，一切照常工作。"
    },
    {
      "question": "它实际能处理多大的文件？",
      "answer": "在一台普通笔记本上，一份 1.5 MB、包含 18 万个节点的文档解析耗时远低于十分之一秒，几十兆字节的文件也仍然打得开：校验搬进了 Web Worker，树只绘制屏幕上看得见的行。真正的上限是内存而不是工具：超过大约 100 MB 之后，用任何程序浏览器标签页都会吃力。凡是超过 2 MB 的文件都会拦在一个按钮后面而不是自动加载，所以大文件永远不会在送进来的瞬间把页面卡住。"
    },
    {
      "question": "为什么我的长标识符在别的工具里会变？",
      "answer": "JSON.parse 会把每个数字变成 64 位浮点数，而它无法精确表示大于 2^53 的整数——Twitter、Discord 或 Snowflake 的标识符会丢掉最后几位。JSONFlow 保留原文中的数字，并在数值进入这个区间时给出提醒。"
    },
    {
      "question": "我的文件里有注释和多余逗号，会有问题吗？",
      "answer": "不会。严格解析失败时会自动再跑一遍宽容解析，若能成功就会出现“修复”按钮。它能处理注释、多余逗号、单引号、未加引号的键、Python 的 True/False/None、NaN 和 Infinity，并把文档改写成严格 JSON。"
    },
    {
      "question": "JSON 转 CSV 的扁平化是怎么做的？",
      "answer": "最外层数组的每个元素变成一行，嵌套的键变成 user.address.city 这样带点的列名。分隔符由你选择，嵌套数组可以每项一列、保持 JSON 原样或拼接起来。反过来时表头按字面处理：除非你明确要求还原嵌套，first_name 这一列就一直是 first_name。"
    },
    {
      "question": "查询栏里可以写什么？",
      "answer": "JSONPath 的一个子集：$.users[0].name、用 [*] 的通配符、用 .. 的递归下降、[0:5] 这样的切片、负数下标，以及 [?(@.price > 10)] 或 [?(@.name =~ ^a)] 这类过滤条件。表达式由程序自己解释，绝不会当作代码执行。"
    }
  ],
  "footerTagline": "为设计师和开发者打造的快速、精致且私密的工具。",
  "footerCredit": "oLoveTools 工具集的一部分"
};
