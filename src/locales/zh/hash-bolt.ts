export default {
  "title": "HashBolt",
  "description": "在您的浏览器中 100% 本地计算文本和文件的加密哈希（MD5、SHA-1、SHA-256、SHA-512）。",
  "input_text_tab": "文本输入",
  "input_file_tab": "文件哈希",
  "placeholder_text": "在此输入或粘贴您的文本，以实时计算其哈希值...",
  "label_algorithm": "哈希算法",
  "label_expected_hash": "与预期校验和对比 (可选)",
  "match_success": "校验成功：哈希值完全一致！",
  "match_fail": "错误：哈希值不一致！",
  "match_placeholder": "粘贴预期的哈希值以进行完整性校验...",
  "file_drag_active": "拖放文件到此处...",
  "file_drag_inactive": "拖放文件到此处，或点击选择文件",
  "file_size_warning": "大文件将进行分块读取与哈希计算，以防止浏览器崩溃。",
  "file_processing": "读取文件并计算哈希中...",
  "file_processing_speed": "速度",
  "file_processing_time": "耗时",
  "format_uppercase": "大写输出",
  "format_base64": "Base64 格式",
  "copied": "已复制！",
  "tooltip_copy": "复制到剪贴板",
  "seoHeroTitle": "快速离线加密校验和及哈希生成器",
  "seoHeroText": "校验文件完整性，在浏览器内直接生成安全的加密哈希（MD5、SHA-1、SHA-256、SHA-384、SHA-512）。完全本地沙箱化，100% 私密安全。",
  "seoBrowserSpeedTitle": "本地哈希计算引擎",
  "seoBrowserSpeedText": "所有计算均在浏览器内使用原生的 Web Crypto API 执行。无需上传到服务器，哈希计算速度达硬件级响应。",
  "seoUseCaseTitle": "支持超大文件",
  "seoUseCaseText": "拖放大型安装包或媒体文件。分块文件读取机制可在内存中顺畅计算校验和，不会耗尽网页内存。",
  "seoPrivacyTitle": "100% 隐私安全保障",
  "seoPrivacyText": "无数据库、无追踪、无网络上传。您的文本和二进制文件仅保存在浏览器临时内存中，关闭标签页即刻消失。",
  "faqTitle": "常见问题解答",
  "faq": [
    {
      "question": "我的文件或数据会被上传吗？",
      "answer": "绝对不会。哈希计算 100% 在您本地浏览器中进行。文件和文本输入绝不会发送到任何服务器。"
    },
    {
      "question": "如何验证下载软件的完整性？",
      "answer": "在文件哈希面板上传该软件，复制官方提供的校验码到比对框中，查看指示条是否变为绿色即可。"
    },
    {
      "question": "为什么 MD5 需要使用自定义计算引擎？",
      "answer": "现代浏览器由于安全性考虑已在 Web Crypto API 中剔除 MD5。我们提供高性能纯 JS 的 MD5 引擎以用于传统校验用途。"
    }
  ],
  "footerTagline": "安全、本地的文本及文件加密校验和生成器。",
  "footerCredit": "oLoveTools 套件的一部分",
  "seo_title": "HashBolt | 免费在线MD5、SHA-1、SHA-256哈希生成器",
  "seo_description": "在您的浏览器中 100% 本地计算文本和文件的加密哈希（MD5、SHA-1、SHA-256、SHA-512）。"
};
