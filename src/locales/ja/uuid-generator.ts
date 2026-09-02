export default {
  "resetHint": "最初からやり直す",
  "title": "UUID ジェネレーター",
  "badge": "一意な識別子",
  "description": "UUID v1・v3・v4・v5・v6・v7 に加えて ULID、NanoID、MongoDB の ObjectId を生成します。まとめて、コードが求める形そのままで、ネットワーク通信は一切ありません。",
  "seo_title": "UUID ジェネレーター | v4・v7・v5・ULID・NanoID を一括生成",
  "seo_description": "無料のオンライン UUID ジェネレーター。v1・v3・v4・v5・v6・v7・nil・max に加え ULID、NanoID、ObjectId に対応。大量生成、出力書式の細かい指定、バイト単位のインスペクターをすべてブラウザー内で。",
  "groupUuid": "RFC 9562 の UUID",
  "groupOther": "その他の識別子",
  "kindHelp_v4": "ブラウザーの暗号論的乱数から 122 ビットのエントロピー。とにかく一意であればよいときの既定の選択肢です。",
  "kindHelp_v7": "48 ビットの Unix ミリ秒タイムスタンプに乱数が続き、さらにカウンターを持つため、同じミリ秒に作られた識別子でも順序が保たれます。データベースのキーには現在これが定番です。",
  "kindHelp_v1": "タイムスタンプとノード識別子。ここではマルチキャストビットを立てたランダムなノードを使うので、実際の MAC アドレスが漏れることはありません。",
  "kindHelp_v6": "v1 のフィールドを並べ替えてタイムスタンプを先頭にした版。生のバイト列のまま時系列に並びます。v1 にはできない性質です。",
  "kindHelp_v3": "名前空間と名前の MD5。同じ組み合わせからは常に同じ UUID が出ます。1 行に 1 つ名前を書けばまとめて作れます。",
  "kindHelp_v5": "名前空間と名前の SHA-1。v3 と同じく決定的で、ダイジェストがより強力です。1 行に 1 つの名前を。",
  "kindHelp_nil": "128 ビットすべてが 0。「値なし」を表す標準的な UUID です。",
  "kindHelp_max": "128 ビットすべてが 1。UUID 空間の上限で、番兵として使われます。",
  "kindHelp_ulid": "Crockford base32 の 26 文字。時刻 48 ビットと乱数 80 ビットで、辞書順に並び、大文字小文字を区別しません。",
  "kindHelp_nanoid": "URL に安全な 21 文字、エントロピーは約 126 ビット。UUID より短く、エスケープなしで URL に入れられます。",
  "kindHelp_objectid": "MongoDB がすべてのドキュメントに付ける 12 バイトの識別子。時刻 4 バイト、乱数 5 バイト、カウンター 3 バイトです。",
  "label_count": "個数",
  "hint_big_batch": "10 000 を超えるとスライダーは止まります。正確な数を入力してください。一覧の表示は 300 行までですが、コピーとダウンロードは常にバッチ全体が対象です。",
  "label_namespace": "名前空間",
  "label_names": "名前 — 1 行に 1 つ",
  "hint_deterministic": "同じ名前空間と同じ名前からは必ず同じ識別子が出ます。それこそが v3 と v5 の目的です。まとめて欲しいときは、名前をまとめて渡してください。",
  "button_generate": "生成",
  "button_working": "処理中…",
  "tooltip_undo": "前のバッチ (Ctrl+Z)",
  "tooltip_redo": "次のバッチ (Ctrl+Shift+Z)",
  "button_clear": "すべて消去",
  "error_invalid_namespace": "この名前空間は有効な UUID ではありません。",
  "error_clipboard": "ブラウザーがクリップボードへのアクセスを拒否しました。ダウンロードボタンをお使いください。",
  "error_generic": "生成中に問題が発生しました。もう少し小さいバッチでお試しください。",
  "error_unrecognised": "このツールが知っている識別子には見えません。",
  "stat_count": "生成数",
  "stat_time": "ミリ秒",
  "stat_rate": "毎秒",
  "stat_duplicates": "重複",
  "empty_state": "まだ何も生成されていません。種類を選び、個数を決めて「生成」を押してください。",
  "label_showing": "{total} 件中 {shown} 件を表示",
  "label_uuids_generated": "件の識別子",
  "tooltip_copy": "クリップボードにコピー",
  "button_copy_all": "すべてコピー",
  "button_copied_all": "コピーしました",
  "label_format": "出力の形",
  "placeholder_prefix": "接頭辞",
  "placeholder_suffix": "接尾辞",
  "label_inspect": "解析と手組み",
  "button_load_list": "ファイルから一覧を読み込む",
  "button_blank": "空の 16 バイトから始める",
  "placeholder_inspect": "UUID、ULID、ObjectId を貼り付け",
  "field_timestamp": "タイムスタンプ",
  "byte_version": "バイト 6 — バージョンのニブル",
  "byte_variant": "バイト 8 — バリアントのビット",
  "button_now": "現在時刻",
  "button_reroll": "末尾 8 バイトを振り直す",
  "button_revert": "元に戻す",
  "button_copy": "コピー",
  "button_use_crafted": "出力として使う",
  "imported_summary": "{from} から届いた一覧に識別子が {count} 件見つかりました。",
  "imported_unique": "ユニーク {n} 件",
  "imported_inspect": "最初の 1 件を解析",
  "nextStepTitle": "続けて作業する",
  "nextStepHint": "一覧はそのまま持ち越せます。ダウンロードも再アップロードも不要です",
  "nextDiff": "2 つのバッチを比較",
  "nextHash": "一覧のハッシュを取る",
  "nextJson": "JSON として開く",
  "nextRegex": "パターンを試す",
  "nextZip": "ZIP にまとめる",
  "howItWorksTitle": "使い方",
  "step1Title": "種類を選ぶ",
  "step1Text": "全 11 種類。定番の v4 から時系列に並ぶ v7、ULID、Mongo の ObjectId まで。",
  "step2Title": "バッチを決める",
  "step2Text": "個数と形。大文字小文字、ハイフン、囲み記号、接頭辞、書き出し形式。",
  "step3Title": "「生成」を押す",
  "step3Text": "押すまで何も動きません。バッチはワーカーで作られ、0.1 ミリ秒単位で計測されます。",
  "step4Title": "持ち出す",
  "step4Text": "コピー、txt・csv・json・SQL でのダウンロード、あるいは一覧を別のツールへ直接送れます。",
  "features": [
    {
      "title": "11 種類の識別子",
      "text": "UUID v1・v3・v4・v5・v6・v7・nil・max に加え、ULID、NanoID、MongoDB の ObjectId。"
    },
    {
      "title": "時系列で単調に並ぶ",
      "text": "v7・v6・ULID はカウンターを持つので、同じミリ秒に作られた識別子も生成順のまま並びます。"
    },
    {
      "title": "読み解くこともできる",
      "text": "識別子を貼り付ければ、バージョン、バリアント、時刻、ノード、生バイトが見え、ニブル単位で書き換えられます。"
    },
    {
      "title": "メインスレッドの外で",
      "text": "バッチは Web Worker で実行され、正確な所要時間とバッチ全体の重複チェックが付きます。"
    },
    {
      "title": "必要な形で書き出す",
      "text": "大文字小文字、ハイフン、波かっこ、urn:uuid:、引用符、接頭辞と接尾辞。txt・csv・json・SQL で出力。"
    },
    {
      "title": "タブの外には出ない",
      "text": "エントロピーは Web Crypto から。ネットワーク通信は一切なく、訪問のあいだに何も保存しません。"
    }
  ],
  "seoHeroTitle": "あらゆる識別子形式を、手元で生成",
  "seoHeroText": "多くのジェネレーターは v4 を出して終わりです。このツールは RFC 9562 の全ファミリー、実務でそれを置き換えたソート可能な形式、他のエコシステムで使われる識別子まで揃え、マイグレーションやシードファイル、テストフィクスチャーが求める形そのままで出力します。",
  "seoHeroList": [
    "11 種類の識別子",
    "最大 100 000 件のバッチ",
    "バイト単位のインスペクター",
    "ネットワーク通信ゼロ"
  ],
  "seoBrowserSpeedTitle": "構造からしてソート可能",
  "seoBrowserSpeedText": "ランダムな v4 キーは B-tree インデックス全体に書き込みを散らします。v7・v6・ULID は時刻を先頭に置くため、新しい行はインデックスの末尾にまとまります。さらにミリ秒ごとのカウンターにより、密なループの中でも順序が崩れません。",
  "seoSecondaryTitle": "識別子を作った「あと」の作業のために",
  "seoUseCaseTitle": "シードデータ、フィクスチャー、マイグレーション",
  "seoUseCaseText": "10 万件のキーを生成し、そのまま SQL の INSERT や JSON 配列として書き出し、ダウンロードフォルダーを経由せずに差分・ハッシュ・アーカイブの各ツールへ渡せます。",
  "seoPrivacyTitle": "ローカルで、しかも確認できる",
  "seoPrivacyText": "エントロピーはタブ内の Web Crypto API から取得します。API 呼び出しも CDN 取得も、別途の WebAssembly ダウンロードもありません。v3 と v5 のハッシュはページ自体に埋め込まれているため、ネットワークを切っても動作します。",
  "seoKeywordsTitle": "キーワード",
  "seoKeywords": [
    "uuid ジェネレーター",
    "ランダムな uuid v4",
    "時系列に並ぶ uuid v7",
    "名前ベースの uuid v5",
    "guid ジェネレーター",
    "ulid ジェネレーター",
    "短い nanoid",
    "uuid 一括生成",
    "uuid デコーダー"
  ],
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "どのバージョンを使えばよいですか。",
      "answer": "一意性だけが必要なら v4。主キーになるなら v7 で、先頭のタイムスタンプがインデックスへの書き込みをまとめてくれます。同じ入力から常に同じ識別子が要るなら v5 です。"
    },
    {
      "question": "v5 を 10 個頼むと全部同じになるのはなぜですか。",
      "answer": "それが v5 の定義だからです。名前空間 1 つと名前 1 つから識別子は 1 つ決まります。10 個違うものが欲しいなら、名前を 10 個、1 行に 1 つずつ渡してください。"
    },
    {
      "question": "v7 と ULID の違いは何ですか。",
      "answer": "どちらも 48 ビットのミリ秒タイムスタンプ＋乱数です。v7 は正真正銘の UUID で UUID 列に収まります。ULID は base32 の 26 文字で読みやすく大文字小文字を区別しませんが、UUID ではありません。"
    },
    {
      "question": "暗号論的に安全ですか。",
      "answer": "乱数は crypto.getRandomValues 由来で、ブラウザーが自身の鍵素材に使うのと同じ供給源です。ただし v1 と v7 は生成時刻を意図的に含むため、秘密の値にはなりません。"
    },
    {
      "question": "一度に何件まで作れますか。",
      "answer": "1 バッチあたり 100 000 件までです。画面の一覧は動作を軽く保つため先頭 300 行のみですが、コピー・ダウンロード・受け渡しボタンは常にバッチ全体を扱います。"
    },
    {
      "question": "サーバーに何か送信されますか。",
      "answer": "いいえ。生成も解析も書き出しもブラウザー内で完結し、使用中にページはいかなるリクエストも行いません。"
    }
  ],
  "footerTagline": "UUID v1〜v7、ULID、NanoID、ObjectId を、生成から解析、書き出しまですべてブラウザー内で。",
  "footerCredit": "oLoveTools スイートの一部",
  "emailCopied": "コピーしました！",
  "contactForIdeas": "ご意見・ご要望の連絡先:",
  "emailAddress": "adrian.contact.me.69@gmail.com"
};
