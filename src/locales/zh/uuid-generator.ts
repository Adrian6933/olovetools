export default {
  "title": "UUID Generator",
  "seo_title": "UUID Generator | 免费在线 UUID v4 和 v5 生成器",
  "seo_description": "使用 Web Crypto API 在浏览器中 100% 本地批量生成随机 UUID（v4）和命名 UUID（v5），一次最多 500 个。免费在线 UUID 生成器。",
  "seoHeroTitle": "UUID v4 和 v5 批量生成器",
  "seoHeroText": "使用浏览器原生 Web Crypto API 即时生成最多 500 个随机 UUID（版本 4）或命名 UUID（带命名空间的版本 5）。所有生成均在本地进行 — 无服务器调用，无追踪。",
  "label_version": "UUID 版本",
  "option_v4": "v4（随机）",
  "option_v5": "v5（命名 + SHA-1）",
  "label_count": "数量",
  "label_namespace": "命名空间 UUID",
  "label_name": "名称",
  "label_uuids_generated": "已生成的 UUID",
  "label_no_uuids": "尚未生成 UUID。请调整上方设置。",
  "error_invalid_namespace": "命名空间 UUID 格式无效。请使用标准 UUID 格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "error_fix_namespace": "请修正命名空间 UUID 以生成 v5 UUID。",
  "button_regenerate": "重新生成",
  "button_copied_all": "已全部复制！",
  "button_download": "下载 .txt",
  "button_reset": "重置",
  "tooltip_copy": "复制到剪贴板",
  "seoBrowserSpeedTitle": "由 Web Crypto API 驱动",
  "seoBrowserSpeedText": "UUID 通过浏览器的原生 crypto.randomUUID()（用于 v4）和 crypto.subtle.digest('SHA-1')（用于 v5）生成，以硬件速度确保加密质量，无需服务器处理。",
  "seoUseCaseTitle": "批量生成",
  "seoUseCaseText": "一键生成最多 500 个 UUID。非常适合数据库播种、测试数据生成、唯一会话 ID 或任何需要多个唯一标识符的场景。",
  "seoPrivacyTitle": "100% 隐私与安全",
  "seoPrivacyText": "无数据库、追踪或网络上传。所有 UUID 生成完全在浏览器的加密子系统中进行。您的数据永远不会离开您的设备。",
  "seoKeywords": [
    "uuid 生成器",
    "uuid v4",
    "uuid v5",
    "guid 生成器",
    "随机 uuid",
    "批量 uuid",
    "唯一标识符"
  ],
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "UUID v4 和 v5 有什么区别？",
      "answer": "UUID v4 使用随机数生成，使每个 UUID 唯一且不可预测。UUID v5 通过使用 SHA-1 对命名空间 UUID 和名称字符串进行哈希来生成，这意味着相同的命名空间+名称始终产生相同的 UUID。"
    },
    {
      "question": "我可以一次生成多个 UUID 吗？",
      "answer": "可以。使用数量滑块在单批中生成 1 到 500 个 UUID。所有 UUID 即时生成，可单独或一次性复制。"
    },
    {
      "question": "这些 UUID 加密安全吗？",
      "answer": "是的。版本 4 的 UUID 使用浏览器原生 crypto.randomUUID() 函数，提供加密随机性。版本 5 的 UUID 使用 Web Crypto API 的 SHA-1 摘要函数。"
    }
  ],
  "footerTagline": "由 Web Crypto API 驱动的快速、安全的 UUID v4 和 v5 批量生成器 — 100% 在您的浏览器中本地运行。",
  "footerCredit": "oLoveTools 套件的一部分",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "已复制！",
  "contactForIdeas": "联系以提交想法和评论：",
  "button_copy_all": "复制全部"
};
