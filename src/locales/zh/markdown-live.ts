export default {
  "title": "MarkdownLive",
  "description": "左边写 Markdown，右边看着文档自己成形——嵌套列表、任务清单、表格、脚注和高亮代码，全部在你自己的标签页里解析。",
  "badge": "Markdown，在你的标签页里渲染",
  "placeholder": "# 欢迎使用 MarkdownLive\n\n在左边输入，文档会在右边自己成形。任何内容都不会被上传。\n\n## 它能理解的一切\n\n文字可以是 **粗体**、*斜体*、~~删除线~~、==高亮== 或 `行内代码`,而像 [oLoveTools](https://olovetools.com) 这样的链接会在新标签页打开。像 https://olovetools.com 这样的裸地址也会自动变成链接。\n\n### 带真正语法配色的代码\n\n```js\nfunction greet(name) {\n  return `你好,${name}!`;\n}\n\ngreet('世界');\n```\n\n### 可以嵌套的列表\n\n- 一个条目\n  - 一个嵌套条目\n    - 再嵌一层\n- [x] 已完成的任务\n- [ ] 还没做的任务\n\n1. 编号条目\n2. 会自己数数\n\n### 引用与表格\n\n> 引用里可以放 **任何东西**,包括 `代码`。\n>\n> > 甚至另一段引用。\n\n| 功能 | 在哪里运行 | 状态 |\n| :--- | :---: | ---: |\n| 解析 | 你的浏览器 | 完成 |\n| 主题 | 你的浏览器 | 5 |\n| 导出 | 你的浏览器 | MD · HTML · PDF |\n\n细节写在脚注里。[^1]\n\n[^1]: 脚注会汇总到文档末尾,并带一个链接回到你写下它的位置。\n",
  "editorPlaceholder": "在这里写 Markdown…",
  "editorLabel": "Markdown 源码",
  "previewEmpty": "渲染后的文档会显示在这里。",
  "tocEmpty": "还没有标题。加一行以 # 开头的文字,它就会出现在这里。",
  "htmlHint": "不带任何框架类名的语义化 HTML——可以直接粘进 CMS。",
  "resetTitle": "开始一份新文档",
  "openFile": "打开文件",
  "pasteText": "粘贴",
  "startFrom": "从模板开始",
  "tplBlank": "空白文档",
  "tplSample": "语法示例",
  "clear": "清空",
  "pastedName": "粘贴的文本",
  "fromTool": "来自 {tool}",
  "stagedHint": "还没有加载任何内容——请决定现有文字该怎么处理。",
  "stagedReplace": "替换编辑器内容",
  "stagedAppend": "追加到末尾",
  "stagedDiscard": "丢弃",
  "dismiss": "关闭",
  "style_label": "主题",
  "style_default": "默认石板",
  "style_github": "GitHub 浅色",
  "style_clean": "素净手记",
  "style_retro": "复古打字机",
  "style_cyberpunk": "赛博朋克霓虹",
  "pane_editor": "编辑器",
  "pane_split": "分栏",
  "pane_preview": "预览",
  "preview_mode": "预览",
  "html_mode": "HTML",
  "toc_mode": "大纲",
  "syncScroll": "同步滚动",
  "rendering": "正在渲染…",
  "frontMatter": "Front matter",
  "tooltip_h1": "一级标题",
  "tooltip_h2": "二级标题",
  "tooltip_bold": "粗体",
  "tooltip_italic": "斜体",
  "tooltip_strike": "删除线",
  "tooltip_mark": "高亮",
  "tooltip_link": "链接",
  "tooltip_image": "图片",
  "tooltip_code": "行内代码",
  "tooltip_codeblock": "代码块",
  "tooltip_ul": "无序列表",
  "tooltip_ol": "有序列表",
  "tooltip_task": "任务清单",
  "tooltip_quote": "引用",
  "tooltip_table": "表格",
  "tooltip_hr": "分隔线",
  "tooltip_undo": "撤销",
  "tooltip_redo": "重做",
  "tooltip_indent": "增加缩进",
  "sample_bold": "粗体文字",
  "sample_italic": "斜体文字",
  "sample_strike": "删除线文字",
  "sample_mark": "高亮文字",
  "sample_link": "链接文字",
  "sample_image": "图片说明",
  "sample_code": "代码",
  "sample_codeblock": "const answer = 42;",
  "sample_col1": "列",
  "sample_col2": "值",
  "sample_cell": "行",
  "words": "词",
  "characters": "字符",
  "minRead": "分钟阅读",
  "headings": "标题",
  "tasksDone": "任务",
  "historySize": "{steps} 步可撤销 · {bytes}",
  "btn_copy_md": "复制 MD",
  "btn_copy_rich": "带格式复制",
  "btn_copy_rich_hint": "粘进文档或邮件时保留排版",
  "btn_copy_html": "复制 HTML",
  "btn_download_md": "下载 MD",
  "btn_download_html": "下载 HTML",
  "btn_download_pdf": "导出 PDF",
  "copied": "已复制!",
  "noticeCleared": "编辑器已清空。按 Ctrl+Z 可以把文字找回来。",
  "errorTooBig": "这个文件超过 {size},放不进一个浏览器标签页。",
  "errorRead": "这个文件读不出来。",
  "errorClipboard": "浏览器不允许读取剪贴板。请直接粘贴到编辑器里。",
  "errorClipboardWrite": "这个浏览器不提供剪贴板功能。",
  "errorExport": "这次导出没能完成。",
  "nextStepTitle": "接着做",
  "nextStepHint": "文档跟着你走——不用重新上传",
  "nextWordflow": "检查文字",
  "nextDiff": "比较两份草稿",
  "nextTts": "朗读出来",
  "nextCodecard": "做成图片",
  "nextHash": "计算哈希",
  "templates": [
    {
      "name": "项目 README",
      "body": "# 项目名称\n\n一句话说明它做什么、给谁用。\n\n## 安装\n\n```bash\nnpm install project-name\n```\n\n## 用法\n\n```js\nimport { thing } from 'project-name';\n\nthing({ fast: true });\n```\n\n## 选项\n\n| 选项 | 类型 | 默认值 | 作用 |\n| :--- | :--- | :--- | :--- |\n| `fast` | 布尔值 | `false` | 跳过慢路径 |\n\n## 参与贡献\n\n- [ ] Fork 这个仓库\n- [ ] 提一个 pull request\n\n## 许可证\n\nMIT\n"
    },
    {
      "name": "会议记录",
      "body": "# 会议 — 主题\n\n**日期:** \n**出席:** \n\n## 议程\n\n1. 第一项\n2. 第二项\n\n## 决定\n\n> 写下真正定下来的事,而不是讨论过的事。\n\n## 待办\n\n- [ ] 谁做什么,什么时候之前\n- [ ] 第二项待办\n\n## 暂缓\n\n有意留到以后再说的事。\n"
    },
    {
      "name": "更新日志",
      "body": "# 更新日志\n\n本项目所有值得记录的变更,最新的在前。\n\n## [1.1.0]\n\n### 新增\n\n- 新东西\n\n### 修复\n\n- 之前坏掉的东西\n\n### 移除\n\n- ~~没人用的东西~~\n\n## [1.0.0]\n\n首个公开版本。\n"
    },
    {
      "name": "博客文章",
      "body": "---\ntitle: 标题\ndate: 2026-01-01\ntags: [markdown, 写作]\n---\n\n# 标题\n\n开头一段,说清读者能从这里得到什么。\n\n## 第一个想法\n\n正文,附上一个指向 [相关内容](https://example.com) 的链接和一段引用:\n\n> 一句值得引用的话。\n\n## 第二个想法\n\n![图片说明](https://example.com/image.png)\n\n## 要点\n\n- 第一个要点\n- 第二个要点\n"
    }
  ],
  "heroPoints": [
    "GitHub 风格 Markdown,认真解析",
    "嵌套列表、任务、脚注、表格",
    "代码块的语法配色",
    "导出为 MD、独立 HTML 或 PDF"
  ],
  "step1Title": "输入、粘贴或打开文件",
  "step1Text": "可以直接在编辑器里打字,从剪贴板粘贴,把 .md 文件拖到工作区,或者从某个模板开始。送进来的文件会先在托盘里等着,直到你说清它是替换现有文字还是追加在后面。",
  "step2Title": "边打字边看它渲染",
  "step2Text": "文档在主线程之外解析,预览跟得上光标。滚动一侧,另一侧也跟着动,所以你正在改的地方永远就是你正在看的地方。",
  "step3Title": "挑一个外观",
  "step3Text": "五套预览主题,从朴素的 GitHub 页面到打字机纸张。主题不只是屏幕上的装饰:它会一起进到导出的 HTML 文件里,也会出现在打印出来的页面上。",
  "step4Title": "带着它走",
  "step4Text": "下载 Markdown、一份独立的 HTML 文件,或者一份不带本页任何附属界面的 PDF。也可以把文档直接送到另一个 oLoveTools 工具,不必经过下载文件夹。",
  "features": [
    {
      "title": "真正的解析器,而不是一堆正则",
      "text": "文档先变成语法树,然后才变成 HTML。所以嵌套列表保住了嵌套,句子里一根落单的竖线不会被当成表格,snake_case 这样的名字也不会平白冒出一串斜体。"
    },
    {
      "title": "带语法配色的代码块",
      "text": "围栏代码块支持二十多种语言的高亮,从 JavaScript、Python 到 SQL、YAML 和 Dockerfile。只有当文档里真的出现代码时,才会去取语法定义。"
    },
    {
      "title": "跟得上的预览",
      "text": "解析跑在 Web Worker 里,所以面对一份很长的 README,光标也不会卡顿。如果 Worker 被禁用,同一份代码就在原地运行,预览照样出得来。"
    },
    {
      "title": "导出后依然在的主题",
      "text": "石板、GitHub 浅色、素净手记、复古打字机和赛博朋克霓虹。屏幕上用的那份样式表,就是写进导出文件里的那一份,所以下载到的东西跟你看到的一样。"
    },
    {
      "title": "真的能用的导出",
      "text": "复制不带框架类名的语义化 HTML,复制可用于邮件的带格式文本,下载一份独立页面,或者打印一份只有文档本身的 PDF——没有页眉、没有工具栏、没有广告。"
    },
    {
      "title": "由你的标题生成的大纲",
      "text": "每个标题都会得到一个稳定的锚点,并出现在可点击的大纲里,所以一份很长的规范在写的过程中就能来回跳转。"
    },
    {
      "title": "存改动而不是存副本的撤销",
      "text": "历史只保留变化过的字符,所以在长文档上撤销几百步花的是几十 KB 而不是几十 MB。草稿还会保存在本地,下次来还在。"
    },
    {
      "title": "和整套工具串起来",
      "text": "把写好的文档送到 WordFlow 检查文字,送到 DiffSnap 比较两份草稿,或者送到 TTS-Bolt 听一遍——不用下载,也不用重新上传。"
    }
  ],
  "seoHeroTitle": "免费在线 Markdown 编辑器,带实时预览",
  "seoHeroText": "MarkdownLive 是一个左右分栏的 Markdown 编辑器,边打字边渲染。它支持人们真正会写的 GitHub 风格语法:嵌套列表和任务清单、可设对齐的表格、脚注、删除线、高亮、自动链接、下划线式标题、front matter,以及带语法配色的围栏代码块。编辑器本身也会搭把手:回车会接着写列表,Tab 增加缩进,用键盘就能给选中的文字加粗或变斜体,粘贴一个网址会直接把它变成包住选中文字的链接。",
  "seoBrowserSpeedTitle": "一切都发生在你的标签页里",
  "seoBrowserSpeedText": "没有上传步骤,也不需要账号。解析器、语法高亮、主题和所有导出都是在你浏览器里跑的 JavaScript,所以拔掉网线这个工具照样能用。草稿会保存在这个浏览器的本地存储里,刷新不会丢;清掉浏览器数据就能删除它——它从来没有被送到别处,也就没有别处的副本需要清理。",
  "seoHeroList": [
    "不上传、不注册、没有服务器",
    "页面加载完之后离线也能用",
    "草稿保存在本地,下次还在",
    "我们这边没有东西需要删除"
  ],
  "seoSecondaryTitle": "为那些要走出编辑器的文档而做",
  "seoUseCaseTitle": "README、文档、笔记和文章",
  "seoUseCaseText": "写一份带选项表格和代码示例的项目 README,用能看出哪些还没做完的任务清单记会议纪要,写一份更新日志,或者在交给静态站点生成器之前先把带 front matter 的博客文章排好。大纲面板把长文档变成可以跳着看的东西,字数统计和阅读时间估算则告诉你一篇文章够不够长。",
  "seoPrivacyTitle": "从构造上就是私密的",
  "seoPrivacyText": "还没发布的草稿、内部文档和客户笔记,正是那种不该贴到别人服务器上的文字。在这里它无处可去:文档从不离开你输入它的那个页面。",
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "支持哪些 Markdown 语法?",
      "answer": "GitHub 风格的那一套:ATX(#)和下划线两种形式的标题,粗体、斜体、删除线、高亮、行内代码、围栏代码块和缩进代码块,可嵌套的引用,可嵌套的有序与无序列表,任务清单,可按列设对齐的表格,图片、链接、裸网址、脚注、水平分隔线、强制换行、反斜杠转义,以及会被排除在渲染结果之外的 YAML front matter。"
    },
    {
      "question": "我的文档会被上传或存到服务器上吗?",
      "answer": "不会。解析、渲染、高亮和所有导出都在你的浏览器里进行,文档的任何部分都不会被传出去。唯一比标签页活得久的副本,是存在这个浏览器本地存储里的草稿,好让刷新不丢工作;清掉浏览器数据它就没了。"
    },
    {
      "question": "「导出 PDF」是怎么工作的?",
      "answer": "它会按你选的主题做一份干净的文档副本,并且只把这一份交给浏览器的打印对话框,你在那里选「另存为 PDF」。页面的页眉、工具栏、广告位和页脚都不在打印范围内——你拿到的是白纸上的文档,分页也不会落在代码块和表格中间。"
    },
    {
      "question": "「复制 HTML」和「带格式复制」有什么区别?",
      "answer": "「复制 HTML」把标记以纯文本形式放进剪贴板:不带框架类名的语义化标签,可以直接粘进 CMS、模板或邮件编辑器。「带格式复制」把文档以富文本形式放进剪贴板,所以粘到文字处理软件、文档或邮件客户端里时,标题、粗体和列表都会保留,而不是显示一堆尖括号。"
    },
    {
      "question": "可以打开我已有的 Markdown 文件吗?",
      "answer": "可以——用「打开文件」,或者把它拖到工作区上。不会有东西背着你被加载:文件会先等着,由你决定它是替换编辑器内容还是追加到已有的文字后面。从其他 oLoveTools 工具送过来的文档也是一样。"
    },
    {
      "question": "有哪些键盘快捷键?",
      "answer": "Ctrl+B 粗体,Ctrl+I 斜体,Ctrl+E 行内代码,Ctrl+K 给选中的文字加链接,Ctrl+Z 和 Ctrl+Y 撤销和重做。Tab 和 Shift+Tab 增减选中行的缩进,回车会接着写列表、编号或引用——在空条目上按回车会结束列表,而不是再添一个空项。"
    },
    {
      "question": "能处理多大的文档?",
      "answer": "最大接受 8 MB 的文件,远超任何手写文档的体量。解析在 Web Worker 中进行,长文件下编辑器依然跟手;撤销历史只保存变化过的字符,而不是每一步都留一份文档副本。"
    }
  ],
  "seoKeywordsTitle": "相关搜索",
  "seoKeywords": [
    "markdown 编辑器",
    "markdown 预览",
    "markdown 转 html",
    "markdown 转 pdf",
    "在线 markdown 编辑器",
    "github 风格 markdown",
    "readme 编辑器",
    "markdown 表格生成",
    "markdown 实时预览",
    "免费 markdown 编辑器"
  ],
  "footerTagline": "一个免费、私密、完全本地的 Markdown 编辑器,带实时预览。",
  "footerCredit": "oLoveTools 实用工具集成员",
  "seo_title": "MarkdownLive | 免费在线 Markdown 编辑器,带实时预览",
  "seo_description": "写 Markdown,边打边看渲染结果。支持嵌套列表、表格、脚注、任务清单和语法高亮代码。可导出 MD、HTML 或 PDF。免费且完全本地。"
};
