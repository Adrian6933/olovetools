export default {
  "title": "DiffSnap",
  "description": "在浏览器本地比较两个文本或代码文件，并以左右并排或单栏统一视图可视化对比差异。",
  "btn_compare": "进行文本对比",
  "btn_reset": "新对比",
  "btn_split": "分栏对比",
  "btn_unified": "单栏对比",
  "label_original": "原始文本 (A)",
  "label_modified": "修改后文本 (B)",
  "label_import": "导入文件",
  "label_sample_code": "载入代码示例",
  "label_sample_text": "载入文本示例",
  "stat_additions": "新增行数",
  "stat_deletions": "删除行数",
  "stat_lines_a": "文本 A 行数",
  "stat_lines_b": "文本 B 行数",
  "no_diff": "未检测到任何差异。两份文本完全一致！",
  "seo_title": "DiffSnap | 免费在线文本对比与代码差分 (Diff) 工具",
  "seo_description": "使用 DiffSnap 左右并排（Split）或合并单栏（Unified）比较两份文本或代码。100% 浏览器本地运行，极速安全，绝不上传数据。",
  "seoHeroTitle": "在本地极速生成并查看代码与文本差分",
  "seoHeroText": "直观检查文本新增、删除与变更痕迹。DiffSnap 完全在您的浏览器沙盒内存中完成运算，确保核心数据绝不泄露。",
  "seoHeroList": [
    "提供直观的分栏并排比对与经典的单栏合并视图无缝切换",
    "基于底色深度对比高亮展示差异行及其字符级细微变化",
    "100% 离线本地安全运算（输入的所有代码和文档绝不发送至服务器）"
  ],
  "seoBrowserSpeedTitle": "优化的 Myers 最长公共子序列 (LCS) 差分算法",
  "seoBrowserSpeedText": "直接在前端使用 JavaScript 分析行级别数组的 LCS 特征，彻底省去服务器排队时间与数据外泄风险，几乎在落笔瞬间渲染出对比细节。",
  "seoUseCaseTitle": "非常适合研发人员、文案编辑与翻译工作者",
  "seoUseCaseText": "快速审查代码版本改动、对照合同或文章草稿的修改点，或是复核多语种译文改版，无需安装任何专用软件即可上手。",
  "seoPrivacyTitle": "零文本留存、零云端存储，全面保护代码安全",
  "seoPrivacyText": "对比数据仅保存在您当前浏览器的物理内存中。当您关闭标签页时，数据即刻灰飞烟灭，让商业机密文件和代码享有绝对安全。",
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "可对比的文本字数有上限吗？",
      "answer": "没有硬性上限。但是当处理极长篇幅文件（如数百万字的代码库）时，由于需要在前端计算庞大的 LCS 状态矩阵，浏览器可能会出现短暂的卡顿。"
    },
    {
      "question": "我的文本或代码会被上传到云端吗？",
      "answer": "绝对不会。DiffSnap 是纯本地的前端工具，对比操作限制在您的终端沙盒内，我们没有任何数据库或服务器记录这些内容。"
    },
    {
      "question": "支持直接导入本地方案文件吗？",
      "answer": "是的！每个文本编辑框上方的“导入文件”按钮支持您从电脑直接加载 .js、.txt、.json、.py 等类型格式的文件。"
    },
    {
      "question": "对比结果有语言的高亮着色（Syntax Highlighting）吗？",
      "answer": "目前 DiffSnap 侧重于以等宽字体比对字符层面的删除与添加高亮。特定开发语言的关键字词着色正在规划开发中。"
    }
  ],
  "footerTagline": "免费、安全且完全运行在客户端本地的文本与代码 Diff 差分比对工具。",
  "footerCredit": "oLoveTools 实用工具集成员"
};
