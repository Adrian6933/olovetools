export default {
  "title": "AudioSnap",
  "badge": "录音机与音频剪辑",
  "description": "用麦克风录音，或打开一个音频文件，在波形上剪切、调平电平，导出无损 WAV 或压缩片段。一切都在这个标签页里完成。",
  "btn_record": "录音",
  "btn_pause_record": "暂停",
  "btn_resume_record": "继续",
  "btn_stop_record": "停止",
  "tabRecord": "录音",
  "tabFile": "打开文件",
  "recordTitle": "用麦克风录音",
  "recordHint": "麦克风只在录音时开启，音频不会离开这个标签页。",
  "levelLabel": "输入电平",
  "clipWarn": "输入已经顶到满刻度——离麦克风远一点，或者调低它的增益。",
  "captureTitle": "麦克风设置",
  "captureHint": "录音乐或环境声时把三项处理全部关掉；在嘈杂环境里录人声则保持开启。",
  "micLabel": "输入设备",
  "micDefault": "系统默认",
  "micEcho": "回声消除",
  "micNoise": "噪声抑制",
  "micAgc": "自动增益",
  "micChannels": "声道",
  "micMono": "单声道",
  "micStereo": "立体声",
  "micBitrate": "质量",
  "dropTitle": "拖入一个音频文件",
  "dropHint": "MP3、WAV、M4A、OGG、Opus、FLAC、WebM——以及视频里的音轨。",
  "browseBtn": "选择文件",
  "pendingHint": "还没有解码任何东西。准备好了再按按钮。",
  "loadBtn": "载入编辑器",
  "discardBtn": "丢弃",
  "decodingLabel": "正在读取音频…",
  "label_trim": "波形编辑器",
  "label_recording": "录音中",
  "label_paused": "已暂停",
  "label_start": "入点",
  "label_end": "出点",
  "label_duration": "选区",
  "outputLabel": "输出",
  "newSourceBtn": "重新开始",
  "undoBtn": "撤销",
  "redoBtn": "重做",
  "transportPlay": "播放 / 暂停（空格）",
  "transportStop": "停止",
  "transportLoop": "循环播放选区",
  "compareBtn": "按住：原声",
  "compareHint": "按住即可听未经处理的原声（按住 Alt 也一样）",
  "zoomLabel": "缩放",
  "zoomIn": "放大",
  "zoomOut": "缩小",
  "zoomFit": "整段",
  "zoomSelection": "适配选区",
  "zoomHint": "滚轮＝缩放 · Shift+滚轮＝平移 · 拖动＝选择",
  "setInBtn": "设入点 (I)",
  "setOutBtn": "设出点 (O)",
  "selectAll": "全选 (A)",
  "autoTrimBtn": "剪掉静音",
  "autoTrimNone": "没有找到明显有声的段落，选区保持原样。",
  "autoTrimDone": "已剪到 {d} 秒的有声内容。",
  "processTitle": "处理",
  "resetProcessing": "回到无处理",
  "gainLabel": "增益",
  "normalizeLabel": "把峰值归一化到",
  "dcLabel": "去除直流偏移",
  "fadeInLabel": "淡入",
  "fadeOutLabel": "淡出",
  "speedLabel": "速度",
  "channelsLabel": "声道",
  "channelSource": "保持",
  "rateLabel": "采样率",
  "rateSource": "保持",
  "statsTitle": "实测",
  "statPeak": "源峰值",
  "statRms": "源 RMS",
  "statOutPeak": "输出峰值",
  "statGain": "实际增益",
  "statSize": "预计大小",
  "statClipWarn": "输出会削波。调低增益，或者打开归一化。",
  "infoResampled": "解码时已重采样",
  "exportTitle": "导出",
  "formatLabel": "格式",
  "fmtWav16": "WAV · 16 位（带抖动）",
  "fmtWav24": "WAV · 24 位",
  "fmtWav32": "WAV · 32 位浮点",
  "fmtCompressed": "压缩 · Opus",
  "bitrateLabel": "比特率",
  "realtimeWarn": "浏览器没有离线音频编码器，所以这一项按实时速度进行：大约 {s} 秒。",
  "exportBtn": "渲染并下载",
  "exportingLabel": "渲染中",
  "downloadOriginalBtn": "下载未经改动的原始文件",
  "shortcutsTitle": "键盘",
  "shortcutPlay": "播放 / 暂停",
  "shortcutInOut": "在播放头处设入点 / 出点",
  "shortcutAll": "选中整段",
  "shortcutAlt": "按住即可听未经处理的原声",
  "shortcutZoom": "放大、缩小、整段、选区",
  "shortcutUndo": "撤销 / 重做",
  "history_title": "本次会话",
  "clear_history": "清空",
  "error_mic": "麦克风权限被拒绝，或设备不可用。",
  "errorDecode": "这个浏览器无法解码该音频。",
  "errorEncoder": "这个浏览器不能编码压缩音频，请改用 WAV。",
  "errorExport": "导出失败。试试更短的选区，或改用 WAV 格式。",
  "errorTooShort": "选区太短，无法导出。",
  "nextStepTitle": "接着做",
  "nextStepHint": "片段跟着你走，不用重新上传",
  "nextZip": "打包",
  "nextHash": "算校验值",
  "howItWorksTitle": "工作原理",
  "howItWorks": [
    {
      "title": "录音或打开文件",
      "text": "选好麦克风，判断浏览器的噪声抑制是帮忙还是帮倒忙，然后开始录。或者拖入 MP3、WAV、M4A、OGG、FLAC，甚至视频里的声音——在你开口之前，什么都不会被解码。"
    },
    {
      "title": "在波形上剪",
      "text": "拖动入点和出点标记，在波形上拖动来选择，滚动滚轮放大到某一个词。播放头、选区和缩放彼此独立。"
    },
    {
      "title": "调平并核对",
      "text": "归一化峰值、加淡入淡出、改速度、折成单声道。每一项设置都是一个数字，而不是音频的新副本，所以撤销永远能退回去，源文件也不会越改越差。"
    },
    {
      "title": "按需要导出",
      "text": "要拿到别处继续编辑就用带抖动的 16 位 WAV，想保留余量就用 24 位或 32 位浮点，文件必须小就选压缩的 Opus 片段。在你决定之前就能看到预计大小。"
    }
  ],
  "features": [
    {
      "title": "剪得准",
      "text": "剪切点是解码缓冲区里的秒数，而不是媒体元素的播放位置，所以导出的开头和结尾正好落在标记处，不会多出四分之一秒。"
    },
    {
      "title": "真正掌控麦克风",
      "text": "选择输入设备，逐项关掉回声消除、噪声抑制和自动增益，挑单声道还是立体声，并在开始前定好录音比特率。"
    },
    {
      "title": "非破坏性编辑",
      "text": "增益、归一化、淡入淡出、速度和声道改动都以一小段编辑描述的形式保存，导出时才一次性应用。撤销和重做几乎不占内存。"
    },
    {
      "title": "是测出来的，不是猜的",
      "text": "选区的峰值与 RMS（dBFS）、渲染真正会施加的增益、由此得到的峰值，以及输出削波前的提醒。"
    },
    {
      "title": "拿得出手的导出",
      "text": "16 位 WAV 写入时带 TPDF 抖动，安静的淡出也保持干净；24 位和 32 位浮点保留余量；采样率由你决定。"
    },
    {
      "title": "什么都不上传",
      "text": "解码、绘制、渲染和编码全在这个标签页里，由浏览器自带的音频引擎完成。没有服务器，不用账号，也不会从 CDN 拉取第三方库。"
    }
  ],
  "seo_title": "AudioSnap | 免费在线录音机与音频剪辑工具",
  "seo_description": "录下你的声音，或打开 MP3、WAV、M4A、OGG、FLAC，在可缩放的波形上剪辑、归一化，导出无损 WAV 或压缩片段。100% 在浏览器中完成，免费，无需注册。",
  "seoHeroTitle": "录音、剪切、导出，全程不上传",
  "seoHeroText": "AudioSnap 把麦克风录音机和波形剪辑器放在同一个页面。它用浏览器自带的音频引擎解码文件，画出可以放大的真实最小/最大包络，并在本地渲染最终成品——音频哪儿也不会去。",
  "seoHeroList": [
    "支持任意麦克风，各项处理开关都摆在明处",
    "可打开 MP3、WAV、M4A、OGG、Opus、FLAC 和视频音轨",
    "可缩放波形，入点出点标记可直接拖动",
    "归一化、淡入淡出、变速、折成单声道，全部可撤销",
    "16 位、24 位或 32 位浮点的无损 WAV，或压缩片段",
    "不上传任何东西，也不从 CDN 下载任何东西"
  ],
  "seoBrowserSpeedTitle": "解码一次，按需渲染",
  "seoBrowserSpeedText": "文件只解码一次成为原始采样，之后就不再被改动。裁剪、增益、淡入淡出、速度和声道改动都以数字形式保存，导出时用一次离线渲染统一应用。这就是撤销为什么是瞬时的，也是反复修改不会叠加音质损失的原因。",
  "seoSecondaryTitle": "录素材用它，之后的收尾也用它",
  "seoUseCaseTitle": "语音备忘、播客、配音与采样",
  "seoUseCaseText": "录一段语音备忘，把两头的空白剪掉。从一小时的采访里抠出干净的二十秒。配音进入视频剪辑之前先把电平调平。为电话系统把立体声录音折成单声道，或者把 48 kHz 的素材降到 16 kHz 喂给语音模型。波形可以放大到单个词，所以剪切点落在你想要的位置。",
  "seoPrivacyTitle": "私密，因为它根本无处可去",
  "seoPrivacyText": "按下录音时才请求麦克风权限，按下停止就立刻释放。录音、解码后的采样以及每一次导出，都只存在于这个标签页的内存里，直到你关掉它。没有上传接口，没有针对你音频的分析，也没有从第三方 CDN 取来的模型或编解码器。",
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "我可以剪已有的音频文件，还是只能剪录音？",
      "answer": "都可以。“打开文件”标签接受 MP3、WAV、M4A/AAC、OGG、Opus、FLAC 和 WebM，也接受视频里的音轨。拖入文件并不会立刻解码：它会一直等到你按下载入按钮，所以一段很长的录音绝不会在你不知情的时候把页面卡住。"
    },
    {
      "question": "录音时长有上限吗？",
      "answer": "工具本身没有上限，限制只来自设备内存：音频以原始采样形式保存，48 kHz 立体声大约每分钟 10 MB。在电脑上录很久没问题；在旧手机上，建议每次只录几分钟。"
    },
    {
      "question": "这些内容会被上传吗？",
      "answer": "不会。录音、解码、绘制、渲染和编码用的都是浏览器内置的 API。没有任何数据发往服务器，工作过程中也不会从 CDN 下载任何库、模型或编解码器。"
    },
    {
      "question": "导出该选哪种格式？",
      "answer": "16 位 WAV 是稳妥的默认选择，也是其他编辑软件预期的格式。如果还打算再处理这个文件，24 位和 32 位浮点能多留一点余量。压缩的 Opus 文件小得多，但浏览器没有离线音频编码器，所以要按实时速度重新编码——两分钟的片段大约需要两分钟。"
    },
    {
      "question": "“按住：原声”这个按钮有什么用？",
      "answer": "按住时它播放未经改动的原始音频——不裁剪、不加增益、不加淡入淡出——松开就回到你编辑后的版本。按住 Alt 效果相同。想判断归一化到底有没有帮上忙，这是唯一可靠的办法。"
    },
    {
      "question": "增益和归一化有什么区别？",
      "answer": "增益是你自己定的固定量，以分贝计。归一化会测量选区里最响的峰值，算出把它抬到你设定的上限所需的增益，这样在不同距离录下的两段素材最终电平一致。两者同时开启时，手动增益会叠加在归一化之后的电平上。"
    },
    {
      "question": "浏览器为什么要请求麦克风权限？",
      "answer": "采集音频始终需要你的明确同意，这个提示由浏览器自己处理。AudioSnap 只在你按下录音时才请求，一旦停止，麦克风指示灯就会熄灭。"
    }
  ],
  "seoKeywordsTitle": "相关搜索",
  "seoKeywords": [
    "在线录音机",
    "在线剪辑音频",
    "在线剪切 mp3",
    "浏览器音频编辑器",
    "免费在线录音",
    "不用上传的音频剪辑",
    "在线 wav 转换",
    "在线音频归一化",
    "浏览器里 mp3 转 wav",
    "免费无水印音频剪切"
  ],
  "footerTagline": "免费、私密、完全在浏览器里完成的录音与音频编辑。",
  "footerCredit": "oLoveTools 工具集的一员",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "已复制！"
};
