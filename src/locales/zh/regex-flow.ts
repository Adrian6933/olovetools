export default {
  "title": "Regex-Flow",
  "description": "交互式浏览器端正则表达式构建与测试工具，100% 本地化运行，提供实时匹配高亮、语法解析 breakdown 和文本替换预览。",
  "regex_placeholder": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
  "text_placeholder": "在此输入您的测试文本。例如：hello@olovetools.com 或者 support@example.org。",
  "replace_placeholder": "替换文本 (例如 masked_$0 或 $1)",
  "label_regex": "正则表达式",
  "label_flags": "修饰符 (Flags)",
  "label_test_text": "测试文本",
  "label_replacement": "替换内容",
  "label_result": "替换结果",
  "label_explanation": "正则表达式解析",
  "label_cheat_sheet": "快速语法速查表",
  "label_presets": "常用模板 presets",
  "status_valid": "格式正确的正则表达式",
  "status_invalid": "格式错误的正则表达式",
  "no_matches": "未找到匹配项",
  "matches_found": "找到 {count} 处匹配",
  "match_item": "匹配项 {index}",
  "group_item": "捕获组 {index}",
  "copied": "已复制！",
  "tooltip_copy": "复制到剪贴板",
  "seoHeroTitle": "100% 离线本地的浏览器端正则表达式测试与构建工具",
  "seoHeroText": "在本地编写、测试并调试正则表达式。支持实时匹配高亮、替换预览及语法结构详细拆解。完全基于内存安全运行。",
  "seoBrowserSpeedTitle": "即时客户端解析",
  "seoBrowserSpeedText": "在您输入的同时，使用浏览器原生 JavaScript RegExp 引擎在本地实时运行评估，无需服务器开销，秒级响应。",
  "seoUseCaseTitle": "交互式语法 breakdown",
  "seoUseCaseText": "通过结构化、步进式的语法拆解面板，看懂复杂的表达式，深入理解定位符、量词、分组以及字符组。",
  "seoPrivacyTitle": "100% 隐私安全保证",
  "seoPrivacyText": "隐私安全至上。您的正则表达式、修饰符、测试文本以及替换文本完全在您的浏览器本地进行处理，绝不上传至任何服务器。",
  "faqTitle": "常见问题解答",
  "faq": [
    {
      "question": "使用 Regex-Flow 测试敏感数据是否安全？",
      "answer": "非常安全。Regex-Flow 100% 运行于客户端浏览器，数据不会发送给任何服务器。您的正则表达式和文本是完全私密的。"
    },
    {
      "question": "本工具使用的是哪种正则表达式引擎？",
      "answer": "使用的是您当前浏览器自带的原生 JavaScript RegExp 引擎。注意，如后行断言 (?<=...) 等部分高级特性取决于浏览器的具体版本。"
    },
    {
      "question": "支持哪些修饰符 (Flags)？",
      "answer": "支持标准的 JS 修饰符：g (全局匹配)、i (忽略大小写)、m (多行模式)、s (允许 . 匹配换行符)、u (启用 Unicode 匹配) 以及 y (粘性匹配 sticky)。"
    }
  ],
  "footerTagline": "私密、本地的浏览器端正则表达式构建和测试工具。",
  "footerCredit": "oLoveTools 套件的一部分"
};
