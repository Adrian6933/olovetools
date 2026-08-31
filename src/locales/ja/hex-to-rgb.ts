export default {
  "title": "HEX から RGB",
  "badge": "色の変換",
  "seo_title": "HEX→RGB 変換ツール | RGB・HSL・HWB・OKLCH・CMYK、コントラスト検査とパレット付き",
  "seo_description": "HEX、キーワード、oklch()、color-mix() など任意の CSS 色を貼り付けると、RGB・HSL・HWB・OKLCH・OKLab・CMYK が返ります。階調と配色を組み立て、WCAG と APCA のコントラストを確認し、色覚特性をシミュレートし、パレットを書き出せます。すべてブラウザー内で動作します。",
  "seoHeroTitle": "カラー変換スタジオ",
  "seoHeroText": "任意の CSS 色を RGB・HSL・HWB・OKLCH・OKLab・CMYK に変換し、階調と配色を作り、コントラストを確認できます。すべてローカルで動きます。",
  "description": "HEX コード、CSS のキーワード、あるいは oklch() 関数まるごとを入力すれば、ほかの表記がすべて即座に返ります。そのまま階調を作り、コントラストを確かめ、色覚特性のある人にどう見えるかを確認して、パレットを持ち出せます。",
  "palette_title": "パレット",
  "palette_add": "枠を追加",
  "palette_remove": "この色を外す",
  "tooltip_undo": "元に戻す (Ctrl+Z)",
  "tooltip_redo": "やり直す (Ctrl+Shift+Z)",
  "button_reset": "リセット",
  "preview_hold": "押し続けると元の色と見比べられます",
  "preview_baseline": "元の色",
  "preview_complement": "補色 (Alt)",
  "label_input": "任意の CSS 色",
  "placeholder_input": "#FF6347, rebeccapurple, oklch(70% 0.15 30)…",
  "error_invalid": "色ではありません",
  "hint_native": "解釈しているのはブラウザー自身なので、キーワード・hwb()・lab()・lch()・oklch()・color-mix()・display-p3 がすべて使えます。",
  "hint_fallback": "3・4・6・8 桁の HEX と rgb()・hsl() は、ブラウザーの助けがなくても読み取れます。",
  "tooltip_picker": "システムのカラーピッカー",
  "tooltip_eyedropper": "画面のどこからでも色を採取 (E)",
  "tooltip_paste": "色のリストを貼り付け",
  "tooltip_image": "画像から色を採取",
  "tooltip_shortcuts": "キーボードショートカット (?)",
  "copy": "コピー",
  "copied": "コピーしました",
  "error_clipboard": "ブラウザーがクリップボードへのアクセスを拒否したため、何もコピーされていません。値を選択して手作業でコピーしてください。",
  "error_clipboard_read": "ブラウザーがクリップボードの読み取りを拒否しました。リストはテキスト欄に直接貼り付けてください。",
  "error_no_colors": "クリップボードに色が見つかりませんでした。",
  "cmyk_disclaimer": "ここでの CMYK は単純な算術変換であり、ICC による色分解ではありません。印刷用の CMYK は用紙・インキ・出力プロファイルに左右され、sRGB の値だけからは導けません。",
  "shortcuts": [
    {
      "keys": "1 – 8",
      "label": "パレットのその枠へ移動"
    },
    {
      "keys": "Ctrl+Z / Ctrl+Shift+Z",
      "label": "元に戻す・やり直す"
    },
    {
      "keys": "Alt",
      "label": "押し続けると補色を表示"
    },
    {
      "keys": "クリック",
      "label": "色見本を押し続けて元の色と見比べる"
    },
    {
      "keys": "右クリック",
      "label": "枠の色を補色に入れ替える"
    },
    {
      "keys": "C",
      "label": "HEX コードをコピー"
    },
    {
      "keys": "E",
      "label": "画面スポイトを開く"
    },
    {
      "keys": "?",
      "label": "この一覧の表示を切り替え"
    }
  ],
  "image_title": "画像から採取",
  "image_from": "{tool} から",
  "image_close": "画像を閉じる",
  "image_count": "{n} 色",
  "image_fewer": "色を減らす",
  "image_more": "色を増やす",
  "image_extract": "パレットを抽出",
  "image_extracting": "抽出中…",
  "image_hint": "任意のピクセルをクリックすると、その正確な色を取り込みます。スクロールでカーソル下のピクセルを拡大、ドラッグで移動します。",
  "image_error": "このファイルは画像として読み取れませんでした。",
  "image_error_pixels": "この画像には不透明なピクセルがありません。",
  "tuner_title": "微調整",
  "tuner_show_rgb": "RGB スライダー",
  "tuner_show_oklch": "OKLCH スライダー",
  "tuner_lightness": "明度",
  "tuner_chroma": "彩度 (クロマ)",
  "tuner_hue": "色相",
  "tuner_alpha": "不透明度",
  "tuner_gamut": "sRGB の外側です。収めるためにクロマを下げました。ΔE {n}。",
  "ramp_title": "明暗の階調",
  "ramp_to_palette": "パレットへ送る",
  "ramp_legend": "あなたの色から OKLCH で作った 11 段階。明度がすでに一致する段に固定して組み立てています。",
  "ramp_clipped": "{n} 段を sRGB の内側へ引き戻しました。",
  "harmony_title": "配色",
  "harmony_to_palette": "パレットへ送る",
  "harmony_complementary": "補色",
  "harmony_analogous": "類似色",
  "harmony_triadic": "トライアド",
  "harmony_split": "スプリット補色",
  "harmony_tetradic": "テトラード",
  "harmony_monochrome": "モノクローム",
  "mix_title": "混色",
  "mix_with": "と",
  "mix_hint": "OKLCH で色相の短い弧に沿って補間しています。行程の {n}% です。",
  "contrast_title": "コントラスト",
  "contrast_swap": "入れ替え",
  "contrast_sample_large": "24 ピクセルの大見出し",
  "contrast_sample_medium": "16 ピクセルの小見出し、セミボールド",
  "contrast_sample_body": "13 ピクセルの本文。この大きさこそが、その色の組み合わせが実際に使えるかを決めます。",
  "contrast_wcag": "WCAG 2.1",
  "contrast_apca": "APCA (WCAG 3 草案)",
  "contrast_apca_flip": "逆にして、背景を文字色として扱った場合: Lc {n}",
  "contrast_bg": "背景",
  "contrast_bg_custom": "任意の背景色",
  "wcag_aaa": "AAA · どの文字サイズでも合格",
  "wcag_aa": "AA · 本文サイズで合格",
  "wcag_aa_large": "AA · 大きな文字のみ、18pt または太字 14pt 以上",
  "wcag_fail": "文字に必要な最低値を下回ります",
  "apca_body": "本文とそれより小さい文字にも十分",
  "apca_large": "24 ピクセル以上の見出し向け",
  "apca_ui": "大きな UI 文字とアイコンのみ",
  "apca_none": "文字には使えません",
  "cvd_title": "色覚",
  "cvd_hint": "色覚の種類ごとに、任意の 2 色間の最小距離",
  "cvd_normal": "一般的な色覚",
  "cvd_protanopia": "1型色覚 · 赤錐体なし",
  "cvd_deuteranopia": "2型色覚 · 緑錐体なし",
  "cvd_tritanopia": "3型色覚 · 青錐体なし",
  "cvd_legend": "ΔE 0.05 を下回ると、その人にとって 2 つの色見本は事実上同じ色になり、見分けに頼ったパレットは成立しません。シミュレーションは Viénot・Brettel・Mollon (1999) に従い、リニア光で適用しています。",
  "nearest_title": "最も近い名前付きの色",
  "nearest_css": "CSS キーワード",
  "nearest_tw": "Tailwind トークン",
  "nearest_exact": "完全一致",
  "nearest_legend": "距離は OKLab での ΔE です。おおよそ 0.02 を超えると、多くの人が 2 つの見本を別の色として認識し始めます。行をクリックすると、その色そのものへ移動します。",
  "export_title": "パレットを書き出す",
  "export_count": "{n} 色",
  "export_png_hint": "各色に HEX コードを刷り込んだ色見本シートです。ダウンロードするか、そのまま別のツールへ送れます。",
  "export_download": "ダウンロード",
  "nextStepTitle": "続けて作業",
  "nextStepHint": "パレットはそのまま持ち越せます。ダウンロードも再アップロードも不要です",
  "nextCss": "この色でデザインする",
  "nextJson": "JSON として開く",
  "nextSvg": "色見本の SVG を最適化",
  "nextPng": "色見本シートを圧縮",
  "nextDiff": "2 つのパレットを比較",
  "howItWorksTitle": "使い方",
  "steps": [
    {
      "title": "色を持ち込む",
      "text": "任意の CSS 表記を入力するか、画面スポイトを使うか、パレットをまるごと貼り付けるか、画像を開いて狙ったピクセルをクリックします。"
    },
    {
      "title": "形を整える",
      "text": "黄色でも青でも同じように効く明度・クロマ・色相のスライダーに加え、階調・配色・混色が使えます。"
    },
    {
      "title": "確かめる",
      "text": "任意の背景に対する WCAG 2.1 と APCA、そして 2 つの色見本が 1 つに潰れたときに教えてくれる色覚シミュレーション。"
    },
    {
      "title": "持ち出す",
      "text": "表記を 1 つコピーするもよし、CSS・Tailwind・SCSS・JSON・SVG・色見本シートに書き出すもよし、次のツールへパレットを渡すもよし。"
    }
  ],
  "features": [
    {
      "title": "CSS の色表記をすべて",
      "text": "3・4・6・8 桁の HEX、キーワード、rgb()、hsl()、hwb()、lab()、lch()、oklab()、oklch()、color-mix()、display-p3。読み取るのはブラウザー自身のパーサーなので、取りこぼしがありません。"
    },
    {
      "title": "歩幅のそろった階調",
      "text": "OKLCH で生成した 11 段階なので、HSL の階調にありがちな不ぞろいな跳ねがなく、どの段も前の段と一定の見た目の距離を保ちます。"
    },
    {
      "title": "WCAG 2.1 と APCA",
      "text": "従来の比率に加えて、WCAG 3 草案の符号付き Lc 値を、白と黒だけでなく好きな背景に対して測れます。"
    },
    {
      "title": "色覚のチェック",
      "text": "1型・2型・3型色覚をリニア光でシミュレートし、任意の 2 色間の最小距離も示すので、パレットが破綻する瞬間がわかります。"
    },
    {
      "title": "スポイトと画像",
      "text": "ブラウザーが許す範囲で画面のどこからでも色を採取でき、画像を開いてカーソル下のピクセルを拡大し、その正確な値を取り込めます。"
    },
    {
      "title": "配色と混色",
      "text": "補色・類似色・トライアド・スプリット・テトラード・モノクロームの各組を OKLCH で回転させ、色相の短い弧に沿った知覚的な混色も行えます。"
    },
    {
      "title": "どこへでも書き出し",
      "text": "CSS カスタムプロパティ、Tailwind の @theme ブロック、SCSS 変数、JSON、SVG または PNG の色見本シート、GIMP のパレットファイル。"
    },
    {
      "title": "タブの外へは出ません",
      "text": "アップロードなし、API 呼び出しなし、アカウントなし。変換もコントラストの数値もパレットも、すべてあなたのブラウザーが計算します。"
    }
  ],
  "seoBrowserSpeedTitle": "即座に終わるローカル処理",
  "seoBrowserSpeedText": "変換はどれも 3 つの数値の算術なので、待つものも送るものもありません。入力の解釈はブラウザー自身の CSS エンジンに任せてあり、だからこそキーワードや color-mix()、広色域の表記が拒否されずに理解されます。知覚まわりの処理 — OKLCH の階調、色域マッピング、ΔE 距離、色覚シミュレーション — は数百回の浮動小数点演算にすぎず、大きな写真からパレットを抽出する場合でも、縮小したコピーに対する k-means の一巡で 1 秒をかなり下回って終わります。",
  "seoUseCaseTitle": "デザインシステムのために",
  "seoUseCaseText": "色の作業で厄介なのは、変換そのものであることはまれです。均等に進むスケールを作ること、2 色の組み合わせが読めると示すこと、そして結果をコードが期待する形で受け取ること — そこが本題です。このツールは手元の色に 11 段階の階調を固定し、どの段が sRGB へ引き戻され、どれだけ動いたかを示し、最も近い CSS キーワードと Tailwind トークンを実測の距離つきで名指しし、パレット全体をカスタムプロパティ、Tailwind のテーマブロック、SCSS、JSON、色見本シートとして書き出します。",
  "seoPrivacyTitle": "仕組みからしてプライベート",
  "seoPrivacyText": "このツールにサーバー側は存在しません。入力した色も、貼り付けたパレットも、開いた画像もタブの中にとどまります。画像は端末から出ないキャンバスへ展開され、タブを閉じればすべて消えます。外に出るのはあなたがアドレスバーに置いたものだけです。リンクを共有できるようにパレットはそこへ符号化されますが、セッションについてそれ以外は何も記録されません。",
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "どんな色の形式を貼り付けられますか？",
      "answer": "3・4・6・8 桁の HEX、CSS の 148 個のキーワード、rgb()、rgba()、hsl()、hsla()、hwb()、lab()、lch()、oklab()、oklch()、color-mix()、color(display-p3 …) です。入力はブラウザー自身の CSS パーサーを通るので、あなたのブラウザーがスタイルシートで受け付けるものはここでも通ります。そのパーサーがない環境でも、HEX と rgb()、hsl() は読み取れます。"
    },
    {
      "question": "なぜ HSL ではなく OKLCH を使うのですか？",
      "answer": "HSL では、同じ明度の値でも見た目の明るさが大きく違います。50% の黄色は 50% の青よりずっと明るく見えます。OKLCH は明度が目の感じ方と一致するように設計されており、だからこのツールの階調・配色・混色はすべてその空間で回転・補間しています。"
    },
    {
      "question": "ΔE の数値は何を意味しますか？",
      "answer": "OKLab における 2 色間の距離です。おおよそ 0.02 から、多くの人が 2 つの見本を本当に別の色として見はじめます。そのためこれはよい物差しになります。sRGB へ押し戻された階調の段がどれだけずれたか、最も近い Tailwind トークンが実際どれくらい近いか、パレットの 2 色が色覚シミュレーションを生き延びるか、いずれもこの数値でわかります。"
    },
    {
      "question": "このコントラスト検査は WCAG に準拠していますか？",
      "answer": "WCAG 2.1 の比率は仕様の定義どおりに、選んだ背景に対して計算しています。表示は単なる「合格」ではなく、本文と、より緩い大きな文字向けのしきい値を区別します。その隣にある APCA は WCAG 3 に向けて提案されている知覚的な指標で、実務では役立ちますが、まだ草案であり適合基準ではありません。"
    },
    {
      "question": "この CMYK は印刷にそのまま使えますか？",
      "answer": "いいえ。ブラウザーで動くツールの CMYK はどれも同じです。ここで得られるのは標準的な算術変換で、おおよその見当をつけたり、その 4 つの数値を求めるソフトに渡したりするには十分です。本当の色分解は用紙・インキ・ICC 出力プロファイルに依存するため、レイアウトソフトや画像ソフトで行う必要があります。"
    },
    {
      "question": "貼り付けた内容はどこかへ送信されますか？",
      "answer": "いいえ。サーバー側の処理はなく、色に関する解析もなく、変換のどの段階でもネットワーク要求は発生しません。画像はローカルでキャンバスに展開され、閉じれば破棄されます。パレットは共有やブックマークができるようページの URL に書き込まれます。色が残るのはそこだけで、あなたがリンクを送らない限り端末の外には出ません。"
    }
  ],
  "seoKeywordsTitle": "キーワード",
  "seoKeywords": [
    "hex から rgb",
    "カラー変換",
    "hex から hsl",
    "oklch 変換",
    "cmyk 変換",
    "wcag コントラスト検査",
    "apca コントラスト",
    "色覚シミュレーター",
    "tailwind カラー",
    "パレット生成",
    "オンラインツール",
    "無料"
  ],
  "footerTagline": "任意の CSS 色を RGB・HSL・HWB・OKLCH・OKLab・CMYK に変換し、階調と配色を作り、コントラストを確認できます。すべてローカルで動きます。",
  "footerCredit": "oLoveTools スイートの一部",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "コピーしました！",
  "contactForIdeas": "アイデアやコメントのお問い合わせ:"
};
