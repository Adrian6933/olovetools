export default {
  "resetHint": "最初からやり直す",
  "title": "CompressSnap",
  "badge": "画像圧縮",
  "description": "JPEG、PNG、WebP、AVIF、HEIC をブラウザ内で圧縮します。好きな画質でも、守らなければならないファイルサイズでも指定でき、その代償が数値で分かります。",
  "seo_title": "CompressSnap | 画像を目標サイズまで圧縮し、画質の劣化を実測 — 100%ブラウザ内",
  "seo_description": "JPEG、PNG、WebP、AVIF、HEIC、TIFF の画像を圧縮・リサイズ。キロバイト単位の上限に収め、PNG のパレットを削減し、フォーマットを変換し、ファイルごとに実測した SSIM の劣化を確認できます。メインスレッド外で動作し、アップロードは一切ありません。",
  "dropzonePrompt": "ここに画像をドロップ、またはクリックして選択",
  "dropzoneSubtitle": "JPEG、PNG、WebP、AVIF、GIF、BMP、TIFF、iPhone の HEIC に対応。極端に大きい画像はブラウザのキャンバスが扱える範囲に丸められます。",
  "rejectedFiles": "{n} 件は画像ではなかったため除外しました。",
  "compressBtn": "{n} 件を圧縮",
  "recompressBtn": "設定が変わりました — もう一度実行",
  "downloadBtn": "ダウンロード",
  "downloadAllBtn": "すべてダウンロード (ZIP)",
  "clearBtn": "すべて削除",
  "removeBtn": "削除",
  "closeBtn": "閉じる",
  "statusQueued": "待機中",
  "statusDecoding": "デコード中…",
  "statusCompressing": "圧縮中…",
  "statusSkipped": "こちらで縮められる以上にすでに小さい",
  "statusError": "失敗",
  "workerOn": "メインスレッド外",
  "workerOff": "メインスレッド",
  "workerHint": "エンコードの実行場所です。メインスレッド外なら一括処理中もページが反応し続けます。",
  "attemptsHint": "上限に収めるのに要したエンコード回数",
  "originalSize": "元のサイズ",
  "compressedSize": "圧縮後のサイズ",
  "savings": "削減率",
  "avgSsim": "平均SSIM",
  "presetLight": "軽め",
  "presetBalanced": "バランス",
  "presetWeb": "ウェブ向け",
  "presetStrong": "強め",
  "formatLabel": "出力形式",
  "formatOriginal": "そのまま",
  "avifUnsupported": "このブラウザは AVIF を書き出せないため、選択肢に出していません。",
  "qualityLabel": "画質",
  "qualityHint": "画質を下げるほどファイルは小さくなります。実測した劣化は結果ごとに表示されます。",
  "qualityFromBudget": "下のサイズ上限に収まるよう、画質を探索しています。",
  "pngColorsLabel": "PNG の色数",
  "pngColorsAll": "すべて",
  "ditherLabel": "グラデーションをディザリング",
  "pngNote": "PNG に画質設定はありません。どのエンコーダも無視します。小さくするのは色数の削減で、ベタ塗りのイラスト、スクリーンショット、ロゴでは違いが見えません。",
  "budgetLabel": "サイズ上限",
  "budgetToggle": "すべての画像を指定サイズ以下にする",
  "budgetHint": "収まるまで画質を二分探索します。",
  "budgetPngNote": "バイト上限には探索する画質が必要ですが、PNG にはありません。代わりにパレットを使ってください。",
  "resizeModeLabel": "リサイズモード",
  "resizeNone": "なし",
  "resizeLongEdge": "長辺",
  "resizeScale": "スケール",
  "resizeCustom": "カスタム",
  "longEdgeLabel": "長辺 (px)",
  "longEdgeHint": "拡大はしません。もっと小さい画像はそのままです。",
  "scaleLabel": "倍率",
  "widthLabel": "幅 (px)",
  "heightLabel": "高さ (px)",
  "keepAspectLabel": "縦横比を維持",
  "measureLabel": "画質の劣化を測る (SSIM)",
  "measureHint": "結果をデコードし直して比較します。1枚あたり少し時間がかかります。",
  "bandIdentical": "見分けがつかない",
  "bandExcellent": "非常に良い",
  "bandGood": "良い",
  "bandFair": "まずまず",
  "bandPoor": "劣化が見える",
  "compareBtn": "プレビューと比較",
  "originalLabel": "圧縮前",
  "compressedLabel": "圧縮後",
  "nextStepTitle": "続ける",
  "nextStepHint": "画像はそのまま次のツールへ。ダウンロードも再アップロードも不要",
  "nextCrop": "切り抜く",
  "nextWatermark": "透かしを入れる",
  "nextExif": "メタデータを確認",
  "nextZip": "ZIP にする",
  "howItWorksTitle": "使い方",
  "step1Title": "写真を入れる",
  "step1Text": "貼り付ける、選ぶ、ドラッグする。いずれも待ち行列に入るだけで、ボタンを押すまで一切エンコードしません。40枚のフォルダでもタブは固まりません。",
  "step2Title": "トレードオフを決める",
  "step2Text": "画質、超えてはならないキロバイト、フォーマット、長辺の上限。PNG には画質スライダーではなくパレットが出ます。",
  "step3Title": "走らせる",
  "step3Text": "エンコードはメインスレッド外で行われるので、まとめて処理している間もページは反応し続けます。",
  "step4Title": "ファイルを持ち帰る",
  "step4Text": "1枚ずつ、まとめて ZIP、あるいはダウンロードせずそのまま次のツールへ。",
  "features": [
    {
      "title": "メインスレッド外でエンコード",
      "text": "OffscreenCanvas を使う Web Worker が処理し、ビットマップはコピーではなく転送されます。スマホ写真の一括処理でタブが固まることはもうありません。"
    },
    {
      "title": "勘ではなくサイズで圧縮",
      "text": "キロバイトの上限を与えると、収まるまで画質を二分探索します。どの画質に落ち着いたか、何回試したかも表示されます。"
    },
    {
      "title": "劣化は数値",
      "text": "結果はデコードし直して SSIM で元と比較されます。「画質70」は感覚ではなく、得られたファイルサイズの隣に並ぶ 0.981 になります。"
    },
    {
      "title": "本当に小さくなる PNG",
      "text": "median cut によるパレット削減と任意のディザリング。PNG に用意された唯一のつまみで（画質引数はどのエンコーダも無視します）、スクリーンショットやロゴ、ベタ塗りで効きます。PNG で保存された写真は JPEG や WebP に変換したほうが小さくなり、本ツールは大きいファイルを返す代わりにそう伝えます。"
    },
    {
      "title": "実際に手元にあるフォーマット",
      "text": "iPhone の HEIC と TIFF は入力時に変換し、AVIF と WebP はブラウザが対応していれば出力時に使い、EXIF の回転を適用するので横倒しになりません。"
    },
    {
      "title": "タブの外には出ない",
      "text": "デコードもエンコードもパレットも計測も、すべてブラウザ内で動きます。API もアップロードもアカウントも不要です。"
    }
  ],
  "seoHeroTitle": "圧縮の代償まで教えてくれる画像圧縮ツール",
  "seoHeroText": "CompressSnap は JPEG、PNG、WebP、AVIF、GIF、BMP、TIFF、そして iPhone が生成する HEIC を読み込み、JPEG・PNG・WebP・AVIF として書き出します。収まる画質を探索してバイト上限を満たし、PNG は画質スライダーが効くふりをせずパレットを削って小さくし、結果を毎回元と比較するので、選んだトレードオフが目に見えます。",
  "seoHeroList": [
    "ユーザー登録不要",
    "複数画像をまとめて圧縮可能",
    "WebP、JPG、PNGへ相互変換"
  ],
  "seoBrowserSpeedTitle": "推測ではなく実測",
  "seoBrowserSpeedText": "圧縮したファイルは毎回デコードし直し、入力と比較します。数値は SSIM ——人が実際に気づく差に追随する指標——で、ファイルサイズのすぐ隣に並ぶため、両者を天秤にかけられます。",
  "seoSecondaryTitle": "画像を圧縮するメリットとは？",
  "seoUseCaseTitle": "厄介なケースこそ処理する",
  "seoUseCaseText": "iPhone から出たばかりの HEIC、回転が EXIF タグに入った縦位置の写真、JPEG を通すと逆に太るスクリーンショットの PNG、キャンバスに収まらない 4800万画素のフレーム——どれも普通に起きることで、それぞれ変換され、回転され、印を付けられ、あるいは上限で丸められます。黙って失敗することはありません。",
  "seoPrivacyTitle": "すべてブラウザの中で",
  "seoPrivacyText": "このページの裏に API はありません。デコーダも、エンコーダも、パレット削減も、画質計測も、すべてタブ内で動く JavaScript です。未公開のクライアント写真が端末から出ることはありません。",
  "seoKeywordsTitle": "キーワード",
  "seoKeywords": [
    "画像圧縮",
    "jpeg 圧縮 オンライン",
    "png 圧縮",
    "webp 変換",
    "avif 変換",
    "heic jpg 変換",
    "画像 200kb 圧縮",
    "画像サイズ 縮小",
    "一括画像圧縮",
    "画像 リサイズ オンライン",
    "png パレット削減",
    "画像品質 ssim"
  ],
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "データはサーバーに送信されますか？",
      "answer": "いいえ。デコード、エンコード、パレット削減、画質計測はすべてブラウザ内で動きます。ここで開いた画像がタブの外へ出ることはありません。"
    },
    {
      "question": "PNG を圧縮しても何も起きないのはなぜ？",
      "answer": "PNG が可逆で、どのエンコーダも画質引数を無視するからです。以前のように PNG で画質スライダーを見せるのは誤解を招きました。小さくするのは色数を減らすことなので、PNG にはパレットの操作を用意しています。スクリーンショット、ロゴ、ベタ塗りなら 64 色や 128 色に落としても見分けはつかず、ファイルが半分になることも珍しくありません。"
    },
    {
      "question": "特定のサイズまで圧縮できますか？",
      "answer": "できます。サイズ上限をオンにしてキロバイトで数値を入れると、収まるまで画質を二分探索します（最大8回）。結果ごとに、落ち着いた画質と要したエンコード回数が表示されます。"
    },
    {
      "question": "SSIM とは何で、なぜ気にすべきですか？",
      "answer": "構造的類似性——圧縮画像が元にどれだけ近いかを 0 から 1 で表した数値で、人の視覚に合わせた重み付けがされています。結果をデコードし直して画素ごとに比較して求めます。0.98 を超えるとほとんど誰も違いに気づかず、0.95 を下回るとノイズが見え始めます。「画質70で大丈夫か？」を画面で読める値に変えるものです。"
    },
    {
      "question": "iPhone の写真も受け付けますか？",
      "answer": "はい。HEIC と HEIF は入力時に変換し、TIFF も同様です。iPhone が EXIF タグに記録する回転も適用するので、縦位置の写真が横倒しで出ることはありません。以前のバージョンはファイル選択の時点で HEIC を弾いていました。"
    },
    {
      "question": "画像の1枚が変わらずに戻ってきたのはなぜ？",
      "answer": "圧縮すると逆に大きくなるからです。高画質の JPEG を通したスクリーンショットやベタ塗りのグラフィックでよく起こります。悪くなったファイルを渡す代わりに、印を付けて元のファイルを保持します。"
    },
    {
      "question": "EXIF データは削除されますか？",
      "answer": "はい。キャンバス経由の再エンコードで、GPS 座標やカメラ情報を含むメタデータのブロックはすべて失われます。視覚的に意味のある唯一の項目である回転タグだけは先に画素へ適用するので、画像は正しい向きのままです。"
    },
    {
      "question": "大量の一括処理でページは固まりますか？",
      "answer": "固まりません。エンコードは OffscreenCanvas を使う Web Worker で走り、画像データはコピーではなく転送されるため、キューが進む間もページは反応し続けます。同時に2枚ずつ処理するので、フル解像度のフレームを何枚もメモリに抱えずに済み、それでいて高速です。"
    }
  ],
  "footerTagline": "画像の圧縮・リサイズ・変換をブラウザ内で。画質の劣化は実測付き。",
  "footerCredit": "oLoveToolsスイートの一部",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "メールアドレスをコピーしました！",
  "contactForIdeas": "ご意見・お問い合わせ:",
  "presetsLabel": "クイックプリセット",
  "presetExtreme": "最大",
  "summaryTitle": "推定結果",
  "scaleHint": "画像の幅と高さを縮小します。",
  "followGlobalBtn": "全体設定に戻す",
  "statusDone": "完了",
  "individualSettings": "個別設定",
  "globalSettings": "一括設定",
  "originalFormat": "元の形式",
  "compareTitle": "圧縮前後の画質比較",
  "privacyPolicy": "プライバシーポリシー",
  "termsOfService": "利用規約",
  "cookiePolicy": "クッキーポリシー",
  "privacyContent": "私たちは個人情報の保護を重視しています。\n\n本サービスを円滑に提供するために必要な範囲でのみ情報を収集します。これには、ツールが正常に機能することを確認するためのブラウザやデバイスに関する技術情報が含まれます。\n\nお客様の画像を収集、追跡、または分析することは決してありません。すべての処理はブラウザ内でローカルに実行され、画像が端末から送信されることはありません。",
  "termsContent": "CompressSnapを利用することにより、以下の利用規約に同意したものとみなされます。\n\n1. 本ツールは「現状有姿」で提供され、いかなる保証も行いません。\n2. 本ツールの使用によって生じたデータの損失やトラブルについて、当方は一切の責任を負いません。\n3. 本ツールを使用して処理するコンテンツの責任は、ユーザー自身が負うものとします。\n4. 当方はいつでも本規約を変更する権利を留保します。",
  "cookiesContent": "当サイトは利便性向上のためにクッキーを使用しています。\n\n1. 必須クッキー: サイトの基本的な動作に不可欠なクッキーです。\n2. 設定クッキー: ユーザーの言語設定やクッキー同意状態を記録するために使用されます。\n\nブラウザの設定から、いつでもクッキーの管理や無効化を行うことができます。",
  "contact": "お問い合わせ"
};
