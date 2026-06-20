export default {
  "title": "EXIF-Clear",
  "description": "在浏览器本地安全检查并擦除图片的 EXIF、GPS 坐标及各类元数据。全方位保护您的隐私安全。",
  "btn_download_cleaned": "下载已清除元数据的图片",
  "btn_download_zip": "打包下载 (.ZIP)",
  "label_upload_box": "将图片拖放到此处，或点击浏览文件",
  "label_files_loaded": "已加载的文件",
  "btn_clear_all": "清空列表",
  "label_options": "擦除安全等级",
  "opt_full_strip": "完全擦除 (推荐 - 移除 EXIF, GPS, XMP 与注释)",
  "opt_gps_only": "仅擦除 GPS 位置信息",
  "opt_camera_only": "仅擦除相机及拍摄设备参数",
  "label_meta_details": "元数据检测属性",
  "meta_make": "相机制造商",
  "meta_model": "相机型号",
  "meta_datetime": "拍摄时间",
  "meta_gps": "GPS 地理定位坐标",
  "meta_software": "编辑软件",
  "status_clean": "干净 / 无元数据",
  "status_has_meta": "已检测到元数据",
  "status_has_gps": "已检测到 GPS 定位",
  "no_files_loaded": "暂未加载任何图片",
  "preview_title": "元数据检测分析仪",
  "progress_clearing": "正在清除第 {current} / {total} 张图片的元数据...",
  "seo_title": "EXIF-Clear | 免费在线图片 EXIF 及 GPS 定位元数据清除工具",
  "seo_description": "本地安全清除图片中的 EXIF、GPS 地理坐标与拍摄参数。一键清除 JPEG/PNG 敏感信息，全面保护隐私。",
  "seoHeroTitle": "离线一键擦除照片中的 GPS 与 EXIF 敏感信息",
  "seoHeroText": "在分享或发布照片前，擦除所有潜在隐私风险。EXIF-Clear 完全在浏览器内存中完成二进制头清洗，零上传，更安全。",
  "seoHeroList": [
    "精准识别和显示照片中的 GPS 经纬度、相机型号、曝光和时间数据",
    "支持彻底清洗 EXIF、XMP 和 Photoshop 写入的 IPTC 等所有元数据块",
    "100% 局限于客户端计算——图片无需上传云端服务器"
  ],
  "seoBrowserSpeedTitle": "高清无损的二进制文件头过滤",
  "seoBrowserSpeedText": "直接在 ArrayBuffer 字节层面对文件结构进行解包过滤，跳过或丢弃 metadata 数据块，无需对像素进行二次压缩，确保 100% 无损画质还原。",
  "seoUseCaseTitle": "内容创作者、摄影师和手机用户的隐私防卫工具",
  "seoUseCaseText": "智能手机拍摄的照片中包含精确的地理坐标。在将二手商品图发布到交易平台、或发布摄影作品前，请务必使用本工具清除元数据。",
  "seoPrivacyTitle": "绝对离线的沙箱环境",
  "seoPrivacyText": "您的设计原图或私人照片绝不会上传至任何服务器。所有的解析和清洗行为均局限在您的浏览器标签页内本地进行。",
  "faqTitle": "常见问题",
  "faq": [
    {
      "question": "为什么要清除照片中的元数据？",
      "answer": "手机拍摄的照片会自动嵌入 GPS 位置、拍摄日期和设备序列号。在网络上直接分享此类原图可能会暴露您的住址或日常生活行踪。"
    },
    {
      "question": "清除元数据会影响图片画质吗？",
      "answer": "不会！我们只修改或丢弃文件中的头部元数据块 (APP1/ancillary)，压缩后的实际像素数据流 (SOS/IDAT) 完好无损，画质保持 100% 原版高清。"
    },
    {
      "question": "支持什么格式的图片？",
      "answer": "EXIF-Clear 支持以完全离线的方式清洗 JPEG/JPG、PNG 和 WebP 格式图片的元数据。"
    },
    {
      "question": "GPS 定位信息是如何被提取出来的？",
      "answer": "我们会扫描读取图片的 APP1 块，定位其中的 TIFF 字节结构。如果包含 GPS 信息子目录，将直接计算出实际的纬度和经度数值供您预览。"
    }
  ],
  "footerTagline": "免费、安全且完全运行在客户端本地的图片元数据清理工具。",
  "footerCredit": "oLoveTools 实用工具集成员"
};
