export default {
  "resetHint": "最初からやり直す",
  "title": "GIFBolt",
  "description": "動画からフレームを取り出したり静止画を並べたりして、タイムラインを編集し、共通パレットとフレーム間圧縮で GIF に書き出します。すべてブラウザー内で完結します。",
  "tab_video": "動画からGIF",
  "tab_images": "画像からGIF",
  "label_upload_video": "動画をアップロード",
  "label_upload_images": "画像をアップロード",
  "label_duration": "フレーム遅延 (ms)",
  "label_fps": "フレームレート (FPS)",
  "label_size": "GIF幅",
  "label_quality": "圧縮品質",
  "label_trim": "トリミング範囲",
  "label_start": "開始時間",
  "label_end": "終了時間",
  "btn_generate": "GIFを生成",
  "btn_generating": "GIFをコンパイル中...",
  "btn_download": "GIFをダウンロード",
  "text_progress_extract": "フレームを抽出中...",
  "text_progress_compile": "フレームを結合中...",
  "history_title": "最近のGIF履歴",
  "no_history": "GIF履歴はまだありません。",
  "clear_history": "履歴をクリア",
  "quality_high": "高画質",
  "quality_medium": "標準画質",
  "quality_low": "低画質 (高速)",
  "drop_zone_video": "MP4、WebM、MOV、MKV、AVI、あるいは PNG・JPG・WebP・AVIF・GIF・BMP・HEIC の静止画。",
  "drop_zone_images": "PNG、JPG、WebP、AVIF、GIF、BMP、HEIC。再生したい順にドロップしてください。",
  "seo_title": "GIFBolt | 無料オンライン動画・画像GIF変換ツール",
  "seo_description": "動画や連番画像をブラウザー内で GIF アニメに変換します。編集できるタイムライン、共通パレット、フロイド–スタインバーグ・ディザリング、フレーム間圧縮。何もアップロードしません。",
  "seoHeroTitle": "動画や画像の束を、ブラウザーの中だけで GIF にする",
  "seoHeroText": "クリップからフレームを取り出し、タイムラインを整え、共通パレット・ディザリング・フレーム間圧縮で書き出します。何もアップロードされません。",
  "seoHeroList": [
    "書き出すまでフレームは編集できます",
    "ループ全体で 1 つのパレット",
    "アップロードもダウンロードもありません"
  ],
  "seoBrowserSpeedTitle": "キャンバスの吐き出しではなく、本物の GIF エンコーダー",
  "seoBrowserSpeedText": "フレームはデコード済みの動画から高品質な縮小で直接読み取られ、途中で JPEG を挟むことはありません。パレットはアニメーション全体に対するメディアンカットで作られ、画素は蛇行走査のフロイド–スタインバーグ・ディザリングで割り当てられ、前のフレームと共通する部分は透明として書かれて引き継がれます。処理は複数のウェブワーカーに分散するので、ページは反応を保ち、進捗バーは実際のフレームを追いかけます。",
  "seoUseCaseTitle": "バグ報告、デモ、リアクションのループに",
  "seoUseCaseText": "不具合を一度録って、意味のある 4 秒に切り詰める。デザインの操作をプルリクエストの中で勝手に再生されるものに変える。あるいはスクリーンショットを数枚並べて、間合いを手で決める。書き出しを押すまで、タイムラインはいつでも編集できます。",
  "seoPrivacyTitle": "アップロードもダウンロードもありません",
  "seoPrivacyText": "すべての工程がこのタブで動きます。動画デコーダーはブラウザー自身のもの、量子化器と LZW 圧縮器はページと一緒に届く JavaScript、そして結果はあなたの端末から出ない Blob です。ファイルを送るサーバーも、CDN から取ってくるモデルやコーデックもありません。代償は正直なところ、すべてが搭載メモリーに縛られることです。4K のクリップは、切り詰めて縮めてからでないと書き出せません。",
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "ファイルサイズの上限はありますか？",
      "answer": "決まった上限はありませんが、現実的な上限はあります。フレームはタブのメモリー上に置かれるからです。幅 480 ピクセル・4 秒・12 fps の GIF なら作業データはおよそ 50 MB で、数秒で書き出せます。4K のクリップは終わるずっと前にタブを使い切ります。範囲を詰め、作業サイズを下げてください。あの設定はそのためにあります。"
    },
    {
      "question": "GIF がまだ大きいのはなぜですか？",
      "answer": "GIF は 1987 年の形式で、色は 256 色、動き補償もありません。まず幅、次にフレームレート、最後にパレットの順で削ってください。「変化のない画素を使い回す」を有効なままにしておくほうが、たいていその 3 つより効きます。画面録画ならファイルの大半が消えます。"
    },
    {
      "question": "指定したフレームレートと違うのはなぜですか？",
      "answer": "GIF は待ち時間を 100 分の 1 秒単位で持つので、存在するのは 100/n の形のレートだけです。12 fps を指定すると実際には 1 フレーム 8 単位、つまり 12.5 fps になります。パネルには要求値ではなく、実際に得られるレートを表示しています。"
    },
    {
      "question": "どんな形式を読み込めますか？",
      "answer": "ブラウザーが再生できる動画なら何でも（MP4/H.264、WebM、MOV、多くの場合 MKV）。静止画は PNG、JPG、WebP、AVIF、GIF、BMP、iPhone の HEIC に対応します。静止画として入れた GIF アニメは最初の 1 枚だけが使われます。"
    },
    {
      "question": "どこかにアップロードされますか？",
      "answer": "いいえ。アップロードの工程も外部への通信もありません。エンコーダーはページと一緒に届き、このタブのウェブワーカーの中で動きます。"
    },
    {
      "question": "透明部分は残せますか？",
      "answer": "「透明を保つ」スイッチで残せます。GIF が扱える完全透明色はちょうど 1 色なので、半透明のふちは硬い縁になります。画素の使い回しとは併用できません。どちらも同じ透明の枠を必要とするためです。"
    }
  ],
  "footerTagline": "無料、プライベート、カスタマイズ可能なクライアントサイドGIF作成ツール。",
  "footerCredit": "oLoveToolsスイートの一部",
  "badge": "動画・静止画 → GIF",
  "dropTitle": "動画または画像をまとめてドロップ",
  "dropHintNothing": "ファイルを置いただけでは何も始まりません。設定を選んでボタンを押すのはあなたです。",
  "modeAuto": "範囲を切り出す",
  "modeManual": "手作業でフレームを選ぶ",
  "manualHint": "動画を送りながら、必要なフレームだけを追加します。自動処理は一切走りません。",
  "btnCapture": "このフレームを取り込む",
  "labelWorkingSize": "作業サイズ",
  "extractSummary": "{1}×{2} で {0} フレーム。ここから GIF は縮小しかできません。",
  "btnExtract": "フレームを取り出す",
  "btnExtractAgain": "もう一度取り出す",
  "waitingHint": "範囲を決めてボタンを押してください。それまでは何も動きません。",
  "btnPlay": "再生",
  "btnPause": "一時停止",
  "btnPrevFrame": "前のフレーム",
  "btnNextFrame": "次のフレーム",
  "btnUndo": "元に戻す",
  "btnRedo": "やり直す",
  "frameSummary": "{0} フレーム・実測 {1} fps",
  "btnSelectAll": "すべて選択",
  "btnSelectNone": "選択を解除",
  "btnDeleteSelected": "{0} 件を削除",
  "btnKeepSelected": "これだけ残す",
  "btnReverse": "逆再生にする",
  "btnPingPong": "往復再生",
  "btnHalve": "1 枚おきに間引く",
  "btnAddImages": "静止画を追加",
  "btnResetDelays": "タイミングを戻す",
  "delayHint": "GIF は待ち時間を 100 分の 1 秒単位で持つため、値は 10 ミリ秒刻みに丸められ、20 を下回ることはありません。",
  "outputTitle": "出力",
  "qualityCustom": "カスタム",
  "labelDiff": "変化のない画素を使い回す",
  "diffHint": "フレーム間で動いた部分だけを書き込みます。画面録画では最も効く節約です。",
  "showAdvanced": "細かく調整する",
  "hideAdvanced": "詳細を隠す",
  "labelColors": "パレットの色数",
  "labelDither": "ディザリング",
  "ditherHint": "わずかなノイズと引き換えに、平坦なパレットがグラデーションに残す縞を消します。",
  "labelDitherStrength": "ディザの強さ",
  "labelTolerance": "画素の許容差",
  "labelAlpha": "透明を保つ",
  "alphaHint": "透明な画素を GIF の 1 ビットアルファに移します。画素の使い回しとは併用できません。",
  "labelBackground": "背景",
  "labelFit": "縦横比が合わないとき",
  "fitContain": "余白をつけて収める",
  "fitCover": "埋めて切り取る",
  "fitStretch": "引き伸ばす",
  "labelLoop": "無限に繰り返す",
  "loopHint": "オフにすると決めた回数だけ再生し、最後のフレームで止まります。",
  "labelLoopCount": "再生回数",
  "btnCancel": "中止",
  "phaseRaster": "フレームを準備中…",
  "phasePalette": "パレットを作成中…",
  "resultTitle": "結果",
  "statSize": "容量",
  "statFrames": "フレーム数",
  "statSizePx": "寸法",
  "statColors": "色数",
  "statReuse": "使い回した画素",
  "statTime": "書き出し時間",
  "statFps": "実測フレームレート",
  "statPerFrame": "1 フレームあたり",
  "btnCopy": "コピー",
  "dismissLabel": "閉じる",
  "errorVideo": "このブラウザーではその動画を読み込めません。MP4（H.264）か WebM をお試しください。",
  "errorImages": "画像のうち少なくとも 1 枚を読み込めませんでした。",
  "errorExtract": "フレームを読み取れませんでした。このブラウザーが中途半端にしか対応していないコーデックかもしれません。",
  "errorEncode": "書き出しに失敗しました。フレーム数を減らすか、幅を小さくしてお試しください。",
  "errorClipboard": "ブラウザーがクリップボードを拒否しました。代わりにダウンロードしてください。",
  "errorTooManyFrames": "{0} フレームで打ち切りました。これ以上は GIF に向く形式ではありません。",
  "stageSource": "元のフレーム",
  "stageResult": "書き出した GIF",
  "stageHint": "ホイールでカーソル位置に拡大、ドラッグで移動します。",
  "stageHintCompare": "ホイールでカーソル位置に拡大、ドラッグで移動します。Alt か右ボタンを押している間は GIF の下の元画像が見えます。",
  "zoomIn": "拡大",
  "zoomOut": "縮小",
  "zoomReset": "表示を戻す",
  "stripHint": "フィルム上をドラッグしてフレームを選びます。Alt か右ボタンで選択を外せます。",
  "shortcutsTitle": "ショートカット",
  "shortcuts": [
    {
      "keys": "Space",
      "label": "再生 / 一時停止"
    },
    {
      "keys": "← →",
      "label": "1 フレーム送る"
    },
    {
      "keys": "Del",
      "label": "選択を削除"
    },
    {
      "keys": "A / D",
      "label": "すべて / 選択なし"
    },
    {
      "keys": "Ctrl+Z",
      "label": "元に戻す"
    },
    {
      "keys": "Enter",
      "label": "書き出す"
    }
  ],
  "nextStepTitle": "この続きは",
  "nextStepHint": "表示中のフレームを PNG で渡します。アップロードし直す必要はありません",
  "nextCrop": "切り抜く",
  "nextCompress": "圧縮する",
  "nextCutout": "背景を消す",
  "nextWatermark": "透かしを入れる",
  "nextMeme": "ミームにする",
  "howItWorksTitle": "使い方",
  "step1Title": "ファイルを置く",
  "step1Text": "動画でも静止画の束でも構いません。何もアップロードされず、勝手に始まることもありません。",
  "step2Title": "範囲を決める",
  "step2Text": "開始点・終了点とフレームレートを決めて取り出すか、1 枚ずつ手で拾い上げます。",
  "step3Title": "タイムラインを編集する",
  "step3Text": "フレームを削り、順序を逆にし、1 枚だけ長く見せ、色とディザを詰めます。",
  "step4Title": "書き出して確かめる",
  "step4Text": "プレビュー上で Alt を押したまま GIF と元画像を見比べ、そのままダウンロードするか次の道具へ送ります。",
  "features": [
    {
      "title": "クリップ全体で 1 つのパレット",
      "text": "全フレームをまとめてメディアンカットで色を決めるので、ループの途中で色味がずれません。"
    },
    {
      "title": "動いた部分しか書き込まない",
      "text": "前のフレームと同じ画素は書き直さずに引き継ぎます。画面録画ではそこがファイルの大半です。"
    },
    {
      "title": "縞を消すディザリング",
      "text": "蛇行走査のフロイド–スタインバーグ拡散を強さ付きで搭載。64 色でもグラデーションが荒れません。"
    },
    {
      "title": "編集できるタイムライン",
      "text": "フレームの削除、逆順、往復、1 枚だけ長く。取り消しは無料です。保存するのは識別子であってビットマップではありません。"
    },
    {
      "title": "コアを使い切って書き出す",
      "text": "アニメーションを複数のウェブワーカーに分けるので、タブは操作でき、進捗バーは実際のフレーム数を示します。"
    },
    {
      "title": "タブの外へは何も出ない",
      "text": "デコーダーもパレットも圧縮器も、あなたの端末で動く JavaScript です。アップロードも CDN からのモデル取得もありません。"
    },
    {
      "title": "他の道具と地続き",
      "text": "表示中のフレームを、ダウンロードせずにそのまま切り抜き・圧縮・背景除去へ渡せます。"
    }
  ],
  "seoKeywordsTitle": "関連する検索",
  "seoKeywords": [
    "動画を gif に",
    "gif 作成",
    "画像を gif に",
    "mp4 を gif に",
    "gif 圧縮",
    "gif アニメ",
    "無料 gif 変換",
    "gif 編集"
  ]
};
