export default {
  "title": "Lottie-Viewer",
  "description": "交互式浏览器端 Lottie 动画播放器、自定义编辑器与属性检测器，100% 本地化运行，支持矢量色彩提取与实时播放属性调整。",
  "drop_active": "拖放 Lottie JSON 文件至此以加载...",
  "drop_inactive": "拖放 Lottie JSON 文件到此处，或点击浏览文件",
  "label_lottie_file": "Lottie 文件",
  "label_timeline": "时间轴控制",
  "label_speed": "播放速度",
  "label_loop": "循环播放",
  "label_bg_color": "背景底色",
  "label_metadata": "动画属性检测器",
  "label_layers_colors": "图层颜色自定义",
  "label_export": "导出选项",
  "btn_download": "下载修改后的 JSON",
  "btn_copy_json": "复制 JSON 代码",
  "copied": "已复制！",
  "tooltip_copy": "复制到剪贴板",
  "meta_version": "版本",
  "meta_dimensions": "画布尺寸",
  "meta_framerate": "帧率 (fr)",
  "meta_duration": "时长 (秒)",
  "meta_total_frames": "总帧数",
  "meta_layers": "图层数",
  "status_playing": "播放中",
  "status_paused": "已暂停",
  "error_invalid_json": "解析失败：无效的 JSON 格式",
  "error_no_lottie": "解析失败：非有效的 Lottie 动画结构",
  "preset_spinner": "加载等待 Spinner",
  "preset_checkbox": "成功状态对勾",
  "preset_burst": "庆祝爆炸彩带",
  "seoHeroTitle": "100% 离线本地的浏览器端 Lottie 动画播放与编辑器",
  "seoHeroText": "在本地直接载入 Lottie JSON 动画、预览动作、修改矢量图层配色，并检测核心渲染帧率，保证隐私与极佳的效率。",
  "seoBrowserSpeedTitle": "即时本地渲染",
  "seoBrowserSpeedText": "基于客户端的 lottie-web 渲染器，零网络延迟，不上传文件即可查看原本帧率的高清动画动作。",
  "seoUseCaseTitle": "交互式矢量图层调色盘",
  "seoUseCaseText": "自动遍历 Lottie 数据树中所有的描边与填充色值，展示为可视化的取色器，方便直接微调并实时生效。",
  "seoPrivacyTitle": "零数据上传记录",
  "seoPrivacyText": "秉承安全与隐私至上设计。所有的动画逻辑、配色调试均在您本地浏览器内存中进行，数据绝对不会离线发送。",
  "faqTitle": "常见问题解答",
  "faq": [
    {
      "question": "使用本工具会上传我的 Lottie JSON 动画文件吗？",
      "answer": "绝对不会。Lottie-Viewer 100% 离线运行在客户端浏览器内存中。您的任何动画文件和配色修改均保存在您的本地。"
    },
    {
      "question": "图层调色盘是如何提取并修改颜色的？",
      "answer": "我们以递归算法查找 Lottie 数据结构里的矢量路径填充 (fill) 和描边 (stroke) 实色。修改对应取色器时将改写 JSON 并通知播放器重新绘制。"
    },
    {
      "question": "修改完成后该如何保存和导出？",
      "answer": "您可以直接点击“下载修改后的 JSON”来保存全新的 Lottie 配置文件，也可以点击“复制 JSON 代码”复制到剪贴板直接使用。"
    }
  ],
  "footerTagline": "私密、本地的浏览器端 Lottie 动画播放、颜色自定义和属性检测工具。",
  "footerCredit": "oLoveTools 套件的一部分"
};
