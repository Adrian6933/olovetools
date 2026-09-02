export default {
  "previewTitle": "整形済み HTML のプレビュー",
  "resetHint": "最初からやり直す",
  "title": "HTML Sanitizer",
  "seo_title": "HTML Sanitizer | 削除レポート付きの無料HTMLクリーナー",
  "seo_description": "本物の許可リストで HTML を洗浄。スクリプト、イベントハンドラ、javascript: URL、不要タグを除去し、何が消えたかを正確に確認して必要な分だけ戻せます。すべてブラウザ内で完結。",
  "seoHeroTitle": "HTML クリーナー & サニタイザー",
  "badge": "許可リスト式サニタイザー",
  "description": "HTML を貼り付け、ポリシーを選び、ボタンを押すだけ。洗浄済みのマークアップに加えて、捨てられたタグと属性の明細レポートが手に入ります。どの判断も、何も貼り直さずに取り消せます。",
  "heroPoints": [
    "押すまで何も実行されない",
    "削除は一件ずつ明細化",
    "ブラウザの外へ出ない"
  ],
  "label_input": "元の HTML",
  "label_policy": "洗浄ポリシー",
  "placeholder_input": "ここに HTML を貼り付けるか、.html ファイルをドロップするか、下のサンプルを読み込んでください。「サニタイズ」を押すまで何も実行されません。",
  "button_open_file": "ファイルを開く",
  "button_clear": "すべてクリア",
  "button_run": "サニタイズ",
  "button_working": "洗浄中…",
  "button_manual": "手動",
  "button_undo": "元に戻す",
  "button_redo": "やり直す",
  "button_copy": "コピー",
  "button_copied": "コピーしました！",
  "button_download": "ダウンロード",
  "button_reset": "リセット",
  "samples_title": "試す",
  "sample_messy": "雑な CMS 貼り付け",
  "sample_attack": "既知の XSS ペイロード",
  "preset_strict": "厳格",
  "preset_strict_hint": "テキストとリンクのみ。保存するつもりのものすべてに。",
  "preset_email": "メール向け",
  "preset_email_hint": "テーブルとインラインスタイルは残り、スクリプトは残りません。",
  "preset_content": "リッチコンテンツ",
  "preset_content_hint": "CMS の本文向け。メディア、テーブル、data-*、aria-*。",
  "preset_text": "プレーンテキスト",
  "preset_text_hint": "マークアップをすべて落とし、読む順序だけ保ちます。",
  "preset_custom_active": "カスタムポリシー — 手で編集済み。",
  "stale_hint": "ポリシーが変わりました — もう一度実行してください",
  "shortcut_hint": "Ctrl+Enter で実行 · Ctrl+Z でポリシー変更を取り消し",
  "tab_source": "洗浄済みソース",
  "tab_preview": "プレビュー",
  "tab_report": "削除分",
  "format_pretty": "整形",
  "format_min": "最小化",
  "format_raw": "解析そのまま",
  "compare_hold": "長押しで比較",
  "compare_showing": "元の内容",
  "output_empty": "すべて削除されました — このポリシーを通ったものはありません。",
  "copy_failed": "ブラウザがクリップボードへのアクセスを拒否しました。",
  "stat_size": "サイズ",
  "stat_elements": "要素",
  "stat_removed": "削除",
  "stat_dangerous": "実行可能",
  "stat_time": "時間",
  "policy_allowed_tags": "許可するタグ",
  "policy_allowed_attrs": "許可する属性",
  "policy_add_tag": "タグを追加…",
  "policy_add_attr": "属性を追加…",
  "policy_no_tags": "タグを一切許可しません — 出力はプレーンテキストになります",
  "policy_no_attrs": "属性は残しません",
  "policy_strip_tags": "中身ごと削除",
  "policy_strip_hint": "展開はしません。中身も一緒に消えます",
  "policy_no_strip": "中身ごと削除するものはありません",
  "policy_unknown": "許可されていないタグ",
  "policy_unwrap": "展開 — 中のテキストを残す",
  "policy_drop": "破棄 — 部分木ごと削除する",
  "policy_schemes": "受け入れる URL スキーム",
  "policy_schemes_hint": "href/src の中のそれ以外は破棄されます",
  "policy_data_note": "data:image はラスター形式のみ。SVG のデータ URL は常に不許可です。インライン SVG は直接開くと自前の <script> を実行するためです。",
  "policy_other": "属性とその他",
  "policy_keep_style": "style=\"…\" を残す",
  "policy_keep_class": "class=\"…\" を残す",
  "policy_keep_id": "id / name を残す",
  "policy_keep_comments": "コメントを残す",
  "policy_data_attrs": "data-* 属性を残す",
  "policy_aria_attrs": "aria-* と role を残す",
  "policy_svg_math": "<svg> と <math> を許可",
  "policy_harden_links": "rel=\"noopener noreferrer\" を付与",
  "policy_strip_target": "target=\"_blank\" を除去",
  "scheme_https_hint": "暗号化されたリンクと画像。",
  "scheme_http_hint": "平文の HTTP — 社内ページなら問題ないが、通信経路で読まれます。",
  "scheme_relative_hint": "スキームのないパスとアンカー: /page、#section、?q=1。",
  "scheme_mailto_hint": "メールのリンク。",
  "scheme_tel_hint": "電話、SMS、ワンタップ発信のリンク。",
  "scheme_ftp_hint": "旧来のファイル転送リンク。",
  "scheme_data_hint": "データ URL として埋め込んだ画像。ラスター形式のみ。",
  "report_empty": "削除はありませんでした — 入力はすでにポリシーに適合しています。",
  "report_dangerous": "{0} 件の削除はコードを実行し得たものです。",
  "report_on": "対象",
  "report_keep": "残す",
  "report_kept": "残した",
  "report_keep_it": "これを出力に残す",
  "report_remove_again": "もう一度削除する",
  "reason_tag-not-allowed": "許可リストにないタグ",
  "reason_tag-stripped": "中身ごと削除されたタグ",
  "reason_event-handler": "インラインのイベントハンドラ",
  "reason_attr-not-allowed": "許可リストにない属性",
  "reason_bad-scheme": "許可されていない URL スキーム",
  "reason_comment": "HTML コメント",
  "reason_inline-style": "インラインの style 属性",
  "reason_class-attr": "class 属性",
  "reason_id-attr": "id / name 属性",
  "nextStepTitle": "次へ",
  "nextStepHint": "洗浄済みの HTML はそのまま持ち運べます — 再アップロード不要",
  "nextDiff": "元の内容と比較",
  "nextCodecard": "コード画像を作る",
  "nextWordflow": "テキストを分析",
  "nextBase64": "Base64 に変換",
  "nextZip": "ZIP にまとめる",
  "howItWorksTitle": "使い方",
  "step1Title": "HTML を持ち込む",
  "step1Text": "貼り付ける、.html ファイルをドロップする、あるいは別のツールから移ってくる。そのまま置かれるだけで、ファイルを開いても洗浄は始まりません。",
  "step2Title": "ポリシーを選ぶ",
  "step2Text": "4 つのプリセットでよくある場面はカバーできます。手動パネルを開けば、タグ一覧・属性一覧・受け入れる URL スキームを自分で編集できます。",
  "step3Title": "実行する",
  "step3Text": "一度の走査で洗浄済みのツリーを組み立て、その途中ですべての判断を記録します。1 メガバイトのマークアップで数ミリ秒です。",
  "step4Title": "確認して覆す",
  "step4Text": "レポートには何がなぜ消えたかが並びます。ある行に納得できなければ「残す」を押すだけで、その一点だけ例外にして走査をやり直します。",
  "featuresTitle": "できること",
  "features": [
    {
      "title": "本物の許可リストポリシー",
      "text": "タグ、属性、URL スキームはそれぞれ独立した、あなたが操作できる一覧です。タグを塞いでも属性を放置するならサニタイズとは言えません。"
    },
    {
      "title": "明細化された削除レポート",
      "text": "捨てられた要素と属性が、件数・中身の見本・消えた理由とともにまとめて並びます。"
    },
    {
      "title": "どの判断も覆せる",
      "text": "行の「残す」を押すと、まさにその一点だけを許可してサニタイズをやり直します。元のテキストが書き換えられることはありません。"
    },
    {
      "title": "URL スキームを検査",
      "text": "href、src、formaction、srcset、xlink:href の javascript:、data:text/html、vbscript: を、空白や実体参照で隠した細工ごと捕まえます。"
    },
    {
      "title": "サンドボックス内プレビュー",
      "text": "結果は空の sandbox と no-referrer を指定した iframe に描かれるので、中身が実行・送信・遷移することはありません。"
    },
    {
      "title": "整形・最小化・そのまま",
      "text": "同じ洗浄済みツリーを 3 通りに書き出せます。<pre> の中の空白は、他が再インデントされても保たれます。"
    },
    {
      "title": "次のツールへ引き継ぐ",
      "text": "結果を DiffSnap、CodeCard、WordFlow、Base64Bolt、ZipFlow へ直接送れます。ダウンロードと再アップロードは不要です。"
    },
    {
      "title": "タブの外に出ない",
      "text": "サニタイザーはページに同梱された JavaScript ライブラリです。アップロードも API 呼び出しも CDN 取得も一切ありません。"
    }
  ],
  "seoSecondaryTitle": "仕事の中身を見せるサニタイザー",
  "seoHeroText": "オンラインの HTML クリーナーの多くは文字列だけを返し、信用してくれと言います。これは判断の記録を残します。どのタグが捨てられ、どの属性が外され、どの URL がスキーム検査に落ちたか。しかもそのどれもワンクリックで覆せます。洗浄結果は後からつぎはぎするのではなく、あなたのポリシーから作り直されるからです。",
  "seoHeroList": [
    "拒否リストではなく許可リスト",
    "タグだけでなく属性も検査",
    "削除ごとの件数と理由",
    "ポリシーの取り消しとやり直し"
  ],
  "seoUseCaseTitle": "必要になる場面",
  "seoUseCaseText": "リッチテキストエディタの出力を保存する前に洗浄する。CMS への貼り付けから Word や Google ドキュメントのゴミを取り除く。第三者のマークアップを描画前に安全にする。保存したページから読める本文を取り出す。これから信用しようとしているマークアップに実行され得るものが含まれていないか確かめる。既知のペイロード見本があるのは、想像ではなく答えを見てもらうためです。",
  "seoBrowserSpeedTitle": "DOMPurify の上に構築",
  "seoBrowserSpeedText": "解析とセキュリティ判断は、ブラウザ自身のセキュリティチームが引用するライブラリである DOMPurify に任せています。querySelectorAll を手書きで舐める処理ではありません。フック API 経由で使い、完成した文字列ではなく途中の DOM を受け取っています。削除レポートと項目ごとの例外が成立するのはそのためです。ミューテーション XSS、名前空間の取り違え、素朴なクリーナーが見落とす URL の細工にも対応します。",
  "seoPrivacyTitle": "100% プライベート & セキュア",
  "seoPrivacyText": "アップロードも API キーも、貼り付けた内容の追跡もありません。ライブラリはページに同梱されているので、CDN から取ってくるものもありません。HTML はタブのメモリに留まり、閉じれば消えます。",
  "seoKeywordsTitle": "別の呼び方",
  "seoKeywords": [
    "html サニタイザー",
    "html クリーナー",
    "html からスクリプトを削除",
    "html をオンラインで洗浄",
    "html サニタイズ",
    "タグ除去",
    "dompurify オンライン",
    "xss フィルタ",
    "html 許可リスト"
  ],
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "貼り付けても何も起きないのはなぜですか。",
      "answer": "意図した動作です。貼り付けやファイルを開く操作は HTML を読み込むだけで、サニタイザーは「サニタイズ」を押したときに動きます。こうすればツールの推測を眺めるのではなく先にポリシーを選べますし、大きな文書がキー入力のたびに解析されることもありません。"
    },
    {
      "question": "削除レポートで実際に何ができますか。",
      "answer": "どの行も取り消せる判断です。「残す」を押すとその一点だけを例外に加えて走査全体をやり直すので、<iframe> を戻しても onload 属性まで一緒に通ることはありません。入力テキストは書き換えないので、取り消しとやり直しは軽いままです。"
    },
    {
      "question": "タグを許可リストにするだけで出力は安全になりますか。",
      "answer": "なりません。タグしか見ないクリーナーの多くはそこで間違えます。どんな許可リストの <a> でも href=\"javascript:…\" を持てるため、ここでは属性と URL スキームを別に検査します。タグを塞ぎながら属性を放置するのはサニタイズではありません。"
    },
    {
      "question": "どの URL スキームが通りますか。",
      "answer": "あなたがチェックしたものだけです。それ以外は href、src、srcset、action、formaction、poster、cite、xlink:href から取り除かれます。タブ、改行、HTML 実体参照の裏に隠した値も含みます。data: はラスター画像に限定します。SVG のデータ URL は直接開くと自前のスクリプトを実行するため、常に不許可です。"
    },
    {
      "question": "ライブプレビューは安全ですか。",
      "answer": "はい。sandbox 属性を空文字列にした iframe で描画するため、スクリプト、フォーム、ポップアップ、遷移がすべて塞がれます。加えて no-referrer を指定しているので、残った画像がどのページから来たかを漏らすこともありません。"
    },
    {
      "question": "HTML はどこかに送信されますか。",
      "answer": "いいえ。サニタイザーはこのページに同梱された JavaScript で、あなたのタブの中で動きます。アップロードも API 呼び出しも CDN への要求もありません。ネットワークタブを開いて確認できます。"
    },
    {
      "question": "どのくらいの大きさの文書まで扱えますか。",
      "answer": "解析はおおむね線形なので、数メガバイトのマークアップでも普通のノート PC で 1 秒を大きく下回ります。実測時間は実行のたびに表示されます。出力欄の構文強調は 200 KB を超えると切れます。その大きさでは色付けの費用が見合わないからです。"
    }
  ],
  "footerTagline": "本物の許可リストポリシーと、反論できる削除レポートを備えた HTML サニタイザー。ブラウザ内で 100% ローカルに動作します。",
  "footerCredit": "oLoveTools スイートの一部",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "コピーしました！",
  "contactForIdeas": "アイデアやコメントのお問い合わせ先:"
};
