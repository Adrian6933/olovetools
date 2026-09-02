export default {
  "resetHint": "重新开始",
  "title": "TTSBolt",
  "badge": "文字转语音",
  "description": "把稿子变成神经网络配音的 MP3，还附带与音频严丝合缝到毫秒的字幕。",
  "seo_title": "TTSBolt | 免费文字转语音，支持导出 MP3、WAV 和字幕",
  "seo_description": "用 300 多种神经网络语音朗读任意文字，下载 MP3 或 WAV，并导出由本次合成本身生成的 SRT 与 VTT 字幕。每段可用不同声音，免费且无需注册。",
  "engineNeural": "神经语音工作室",
  "engineDevice": "本机（离线）",
  "engineNeuralHint": "稿子会发送到我们自己的合成接口，带着每个词的时间点作为 MP3 返回，不会保存在任何地方。只有这个引擎支持下载。",
  "engineDeviceHint": "使用这台电脑里已装好的语音。数据不会走网络，但也无法保存：浏览器没有提供录制自身语音合成的任何途径。",
  "neuralUnavailable": "本次部署的合成接口没有响应，因此下载和字幕暂不可用。本机语音仍然可以用来收听。",
  "qualityHigh": "96 kbps",
  "qualitySmall": "48 kbps",
  "noDeviceVoices": "这台设备没有安装任何语音",
  "deviceVoiceHint": "本机语音在上方的工具条里选择。列表来自你的操作系统，所以每台机器都不一样。",
  "label_voice": "语音",
  "label_speed": "朗读速度",
  "label_pitch": "音调",
  "label_volume": "音量",
  "voiceCount": "{n} 种神经网络语音",
  "loadingVoices": "正在加载语音…",
  "voicePickerTitle": "选择语音",
  "voiceSearchPlaceholder": "按名称、语言或地区搜索…",
  "voiceAllLanguages": "全部语言",
  "voiceAnyGender": "不限",
  "voiceFemale": "女声",
  "voiceMale": "男声",
  "voiceNoResults": "没有符合该搜索条件的语音。",
  "voiceMultilingual": "多语种",
  "voicePreview": "试听",
  "scriptTitle": "文稿",
  "textarea_placeholder": "在这里输入或粘贴需要朗读的文字…",
  "scriptHint": "回车另起一段，Shift+回车在同一段里换行。每一段都可以单独指定语音，对话稿就是这样配出来的。",
  "chars": "字符",
  "words": "词",
  "undoBtn": "撤销",
  "redoBtn": "重做",
  "importBtn": "导入",
  "resetBtn": "重置",
  "closeLabel": "关闭",
  "blockInheritVoice": "默认语音",
  "blockPreview": "播放这一段",
  "blockAdd": "在下方新增一段",
  "blockRemove": "删除这一段",
  "blockResetOverride": "恢复默认值",
  "blockRendering": "正在合成…",
  "blockDone": "已合成",
  "blockError": "合成失败",
  "jumpToBlock": "跳到这一段",
  "btn_generate": "生成音频",
  "btn_rerender": "重新合成 {n} 段改动",
  "btn_rendering": "正在生成 {done}/{total} — 点击可停止",
  "btn_speak": "现在朗读",
  "btn_play": "收听",
  "btn_pause": "暂停",
  "btn_stop": "停止",
  "seekLabel": "调整播放位置",
  "rewindLabel": "后退 5 秒",
  "forwardLabel": "前进 5 秒",
  "longScriptHint": "一共 {n} 个字符，预计约 {r} 次合成请求，每段一次。",
  "resultTitle": "生成好的旁白",
  "cuesLabel": "条字幕",
  "staleWarning": "本次生成之后有 {n} 段被改动",
  "downloadMp3": "MP3",
  "downloadWav": "WAV",
  "downloadScript": "文稿",
  "history_title": "最近的文稿",
  "clear_history": "清空",
  "importedNotice": "已导入 {name}。目前还没有合成任何内容，准备好后点击「生成」。",
  "errorRead": "这个文件无法按文本读取。",
  "errorEmpty": "请先输入或粘贴一些文字。",
  "errorNoEngine": "神经网络引擎暂时不可用。本机语音仍然可以把文稿念出来。",
  "errorBlockTooLong": "有一段超过了 {n} 个字符。用回车把它拆成两段。",
  "errorOffline": "连不上合成接口。请检查网络后重试。",
  "errorBlockFailed": "第 {n} 段没能生成。再试一次，或者给它换个语音。",
  "errorDevice": "这个浏览器拒绝朗读该内容。换一个本机语音试试。",
  "errorPreview": "这个语音无法试听。",
  "nextStepTitle": "继续加工",
  "nextStepHint": "成果随你走，不用重新上传",
  "nextCaptions": "调整字幕时间",
  "nextTrim": "裁剪并调平",
  "nextZip": "打包音频",
  "howItWorksTitle": "工作原理",
  "step1Title": "把文稿拿进来",
  "step1Text": "手打、粘贴，或者拖进一个 .txt、.md、.srt 或 .vtt。每一段都会变成可编辑的区块。导入的那一刻不会合成任何东西。",
  "step2Title": "挑一个语音",
  "step2Text": "按语言、地区或性别在 300 多种神经网络语音里筛选，先听一句样例，再决定要不要把整篇稿子交给它。",
  "step3Title": "开始生成",
  "step3Text": "每段单独合成，引擎会报告每个词落在什么位置。波形和字幕都靠这份数据。",
  "step4Title": "带走成品",
  "step4Text": "MP3 和 WAV 就是你刚刚听到的那段音频，外加用同一份时间信息做出来的 SRT 与 VTT 字幕。",
  "features": [
    {
      "title": "像真人一样的声音",
      "text": "覆盖 140 个地区的 300 多种神经网络语音，其中的多语种语音在稿子切换语言时仍能保持同一副嗓音。"
    },
    {
      "title": "真正对得上的字幕",
      "text": "SRT 和 VTT 是用引擎针对这一次合成返回的逐词、逐句时间点拼出来的，而不是按阅读速度估算的。"
    },
    {
      "title": "一段一个声音",
      "text": "给每个区块单独指定语音，一次录完对话、访谈，或者角色众多的有声书。"
    },
    {
      "title": "语调由你掌控",
      "text": "速度、音调和音量既是整篇稿子的默认值，也能在某一句需要换个语气时逐块覆盖。"
    },
    {
      "title": "改稿不必从头来",
      "text": "改掉第七段的一个错字，重新合成的就只有第七段。已经做好的部分原封不动。"
    },
    {
      "title": "不联网也能用的引擎",
      "text": "本机引擎用你系统里已有的语音朗读文稿，一个请求都不发。仅供收听：浏览器不允许把它录下来。"
    }
  ],
  "seoHeroTitle": "把任意文字变成带字幕的朗读 MP3",
  "seoHeroText": "写好或粘贴你的稿子，从 300 多种神经网络语音里挑一个，就能把成品音频连同由同一次合成做出的 SRT、VTT 字幕一起带走。每段都能有自己的声音、速度和音调，改动一句只会重新合成那一句。",
  "seoHeroList": [
    "覆盖 140 个地区的 300 多种神经网络语音",
    "MP3 与 WAV 就是你听到的那一条",
    "SRT 与 VTT 采用引擎自己的时间点",
    "每一段都能换一个声音",
    "离线本机语音，随写随听",
    "无需注册、没有水印、没有每日上限"
  ],
  "seoSecondaryTitle": "一次合成，同时拿到旁白和字幕",
  "seoBrowserSpeedTitle": "音频到底在哪里生成，说明白",
  "seoBrowserSpeedText": "用本机引擎时，一切都发生在这个标签页里，用的是你系统里本来就有的语音。用神经网络引擎时，稿子会发到我们自己的接口，在那里合成后直接返回：中间没有第三方中转，不写入任何数据库，响应送出后也不留副本。这是唯一不在本地完成的环节，而恰恰是它让下载和字幕成为可能。",
  "seoUseCaseTitle": "配音、学习与发布都用得上",
  "seoUseCaseText": "给视频配上旁白，再把对应的字幕直接拖到时间轴上。把一篇长文变成通勤路上的音频。给课程配音，正文一个声音、例题换另一个。用耳朵校对自己写的东西，那些拼写检查抓不出的别扭句子会立刻现形。音频做好之后，字幕不用下载就能直接送进字幕工具。",
  "seoPrivacyTitle": "我们留下什么，不留什么",
  "seoPrivacyText": "你的文稿、历史记录和各项设置都只存在这个浏览器里，别无他处。神经网络引擎只会收到它需要念出来的那一段，回复之后什么都不留。没有账号，不分析你的文字，也不记录你让它读过什么。",
  "seoKeywordsTitle": "相关搜索",
  "seoKeywords": [
    "文字转语音",
    "免费 TTS",
    "文字转 MP3",
    "神经网络语音",
    "AI 配音",
    "生成字幕",
    "文字转 SRT",
    "朗读文章",
    "有声书配音",
    "语音合成"
  ],
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "音频能下载吗？和我听到的是同一份吗？",
      "answer": "能。MP3 就是引擎产出的原始数据流，逐段拼接、不做二次编码，因此和播放器刚刚放出来的完全一致。WAV 是同一段音频的未压缩版本，方便偏好这种格式的剪辑软件。"
    },
    {
      "question": "字幕真的和音频对得上吗？",
      "answer": "对得上，因为它不是猜的。合成过程中，引擎会报告每个词、每句话开始的确切时刻和持续时长。SRT 和 VTT 就是按这些数字生成的，所以即使改了朗读速度也依然吻合。"
    },
    {
      "question": "我的文字会离开浏览器吗？",
      "answer": "用本机语音时，永远不会。用神经网络语音时，只有要朗读的那一段会发到我们自己的接口，它返回音频后什么也不保留。这是实话：不下载几百兆的模型，神经网络语音塞不进一个浏览器标签页。"
    },
    {
      "question": "有长度限制吗？",
      "answer": "每段上限 3000 个字符，大约一页纸；更长的导入内容会自动按句子边界切分。整篇稿子没有上限，但稿子很长就意味着请求很多，耗时也会按比例增加。"
    },
    {
      "question": "同一篇稿子里能用好几个声音吗？",
      "answer": "可以，分段的意义正在于此。展开任意区块，给它单独设定语音、速度、音调或音量。你没有覆盖的项目会继续沿用整篇稿子的默认值。"
    },
    {
      "question": "改一个错字会把整篇重做一遍吗？",
      "answer": "不会。每一段都记得自己是用什么文字和什么设置生成的，所以编辑之后只有真正变动过的段落会重新发送。在长篇旁白上，这就是几秒钟和好几分钟的差别。"
    },
    {
      "question": "为什么本机语音在每台电脑上听起来都不一样？",
      "answer": "因为它们属于操作系统，而不属于我们：Windows、macOS、Android、iOS 和 ChromeOS 各自带着自己的一套。装上语言包就能给这份列表添新声音。神经网络语音则相反，在哪里听都一样。"
    }
  ],
  "footerTagline": "免费、私密又精准的文字转语音，字幕一并奉上。",
  "footerCredit": "oLoveTools 工具集的一员",
  "contactForIdeas": "有想法或发现问题？写信给我：",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "已复制！"
};
