export default {
  "tree_rows_one": "{0} 行",
  "tree_hits_one": "一致 {0} 件",
  "query_matches_one": "一致 {0} 件",
  "emailCopied": "コピーしました！",
  "contactForIdeas": "ご意見・ご要望の連絡先:",
  "copyPath": "パスをコピー",
  "copyValue": "値をコピー",
  "copyBranch": "ブランチ全体をコピー",
  "resetHint": "最初からやり直す",
  "title": "JSONFlow",
  "description": "ブラウザだけで JSON を検証・閲覧・変換。エラー位置を正確に示し、巨大なファイルでも軽い折りたたみツリー、JSONPath クエリ、CSV・XML・YAML・JSON Schema・TypeScript への書き出しに対応します。",

  // 操作
  "beautify": "整形",
  "minify": "圧縮",
  "sort_keys": "キーを並べ替え",
  "sort_none": "元の順序",
  "sort_asc": "キー A → Z",
  "sort_desc": "キー Z → A",
  "clear": "クリア",
  "load_mock": "サンプルを読み込む",
  "copy": "コピー",
  "copied": "コピーしました",
  "undo": "元に戻す",
  "redo": "やり直す",
  "close": "閉じる",
  "shortcuts": "キーボードショートカット",
  "open_file": "ファイルを開く",
  "copy_source": "入力をコピー",
  "download_json": ".json をダウンロード",
  "reset_view": "表示をリセット",
  "parse_btn": "解析",
  "repair_btn": "修復",
  "unescape_btn": "エスケープ解除",
  "jsonl_btn": "JSON Lines を結合",

  // インデント
  "indentation": "インデント",
  "indent_2_spaces": "スペース2つ",
  "indent_4_spaces": "スペース4つ",
  "indent_tabs": "タブ",

  // 検証
  "status_valid": "正しい JSON です",
  "status_invalid": "JSON が不正です: ",
  "status_empty": "まだ何も読み込まれていません。",
  "status_checking": "メインスレッド外で検証中…",
  "error_at": "{0} 行 {1} 列",
  "jump_to_error": "そこへ移動",
  "warnings_title": "知っておきたい点が {0} 件",
  "empty_placeholder": "ここに JSON を貼り付けるか、ファイルをドロップするか、サンプルを読み込んでください…",
  "drop_file_prompt": ".json / .jsonl / .csv / .tsv ファイルをドロップ",
  "editor_title": "入力",
  "fix_first": "左側のエラーを直すと、各パネルが埋まります。",
  "press_parse": "この文書のツリーを作るには「解析」を押してください。",

  // 解析結果
  "issueSyntax": "構文エラー",
  "issueDuplicateKey": "キーの重複",
  "issuePrecision": "JavaScript には大きすぎる数値",
  "issueDepth": "入れ子が深すぎます",
  "issueTrailingComma": "余分なカンマ",
  "issueComment": "コメント",
  "issueSingleQuote": "シングルクォートの文字列",
  "issueUnquotedKey": "引用符のないキー",
  "issuePythonLiteral": "Python のリテラル",
  "issueNonFinite": "JSON の数値ではありません",
  "issueBom": "バイトオーダーマーク",
  "issueEmpty": "空の文書",

  // タブと表示
  "tab_tree_viewer": "ツリー",
  "tab_formatted_json": "コード",
  "tab_table": "テーブル",
  "tab_convert": "変換",
  "tab_schema": "型",
  "tab_diff": "差分",

  // ツリー操作
  "search_placeholder": "キーまたは値で絞り込む…",
  "scope_both": "すべて",
  "scope_keys": "キー",
  "scope_values": "値",
  "expand_all": "すべて展開",
  "collapse_all": "すべて折りたたむ",
  "depth_label": "この深さまで開く",
  "depth_option": "深さ {0}",
  "depth_all": "すべての階層",
  "no_nodes": "左側に JSON を貼り付けるかドロップして始めてください。",
  "no_matches": "その条件に一致するものはありません。",
  "tree_rows": "{0} 行",
  "tree_hits": "一致 {0} 件",
  "tree_mounted": "DOM 上に {0}",
  "tree_capped": "上限に達しました。1階層たたむと残りが見えます",
  "copy_path": "パスをコピー",
  "copy_value": "値をコピー",
  "locate": "エディタで表示",
  "stale_notice": "作成後にエディタが変更されました。「解析」を押して更新してください。",

  // 出力
  "output_size": "{0} 文字",
  "preview_clipped": "プレビューは {0} 文字で止まります。コピーとダウンロードでは全文が得られます。",
  "copy_failed": "ブラウザがクリップボードへのアクセスを拒否しました。",

  // テーブル / CSV
  "flatten_title": "平坦化",
  "array_json": "配列は JSON のまま",
  "array_expand": "要素ごとに1列",
  "array_join": "連結",
  "separator_label": "パスの区切り",
  "table_summary": "{0} 行 × {1} 列。プレビューは先頭 {2} 行です。",
  "table_wrapped": "文書が配列ではないため、1行にまとめました。",
  "export_csv": "ダウンロード",
  "export_xml": "XML をダウンロード",
  "import_csv": "CSV / TSV から JSON へ",
  "csv_placeholder": "JSON に変換したい CSV または TSV をここに貼り付け…",
  "convert_csv_btn": "JSON に変換",
  "csv_nest": "a.b 形式の見出しから入れ子を復元する",
  "csv_nest_hint": "既定でオフなのは意図的です。first_name という列は first_name のままであるべきで、{ first: { name } } になってはいけません。",

  // 変換 / 型
  "xml_root": "ルート要素",
  "type_name": "名前",
  "schema_hint": "最初の1件ではなく全レコードから推論します。一部に欠けているフィールドは任意項目になります。",

  // クエリ
  "query_placeholder": "$.users[?(@.age > 30)].name",
  "query_matches": "一致 {0} 件",
  "query_use": "これを文書にする",

  // 差分
  "diff_hint": "行ではなくパスで比較するため、キーの並び替えは変更として現れません。",
  "diff_placeholder": "もう一方の JSON 文書をここに貼り付け…",
  "diff_run": "比較",
  "diff_identical": "2つの文書は構造的に同一です。",
  "diff_added": "追加",
  "diff_removed": "削除",
  "diff_changed": "変更",
  "diff_type": "型",

  // 実行バー / ファイル
  "manual_mode": "手動モード",
  "manual_on": "「解析」を押すまで何も作られません。",
  "manual_off": "{0} 未満の文書は入力しながら構築され、それより大きいものは「解析」を待ちます。",
  "parked_hint": "意図的に保留しています。このサイズのファイルをエディタに読み込むこと自体が重い処理です。",
  "parked_load": "それでも読み込む",
  "file_too_large": "このファイルはブラウザのタブで開くには大きすぎます。",
  "file_failed": "このファイルは読み取れませんでした。",

  // 統計
  "stat_bytes": "サイズ",
  "stat_lines": "行数",
  "stat_nodes": "ノード数",
  "stat_depth": "深さ",
  "stat_keys": "キーの種類",
  "stat_time": "解析時間",
  "stat_offthread": "ワーカー",

  // 通知
  "toast_csv_loaded": "{1} から {0} 行を読み込みました。",
  "toast_jsonl_loaded": "JSON Lines を1つの配列に結合しました。",
  "toast_needs_valid": "先にエラーを直してください。まだ作るものがありません。",
  "toast_repaired": "厳密な JSON に修復しました。",
  "toast_unrepairable": "この文書は自動修復するには壊れすぎています。",
  "toast_unescaped": "文字列の中に隠れていた JSON を取り出しました。",
  "toast_unescape_failed": "これは引用符で囲まれた JSON 文字列ではありません。",

  // ショートカット
  "sc_undo": "元に戻す",
  "sc_redo": "やり直す",
  "sc_parse": "文書を解析する",
  "sc_beautify": "整形する",
  "sc_minify": "圧縮する",
  "sc_copy": "整形後の出力をコピー",
  "sc_help": "このパネル",

  // 連携
  "nextStepTitle": "続けて使う",
  "nextStepHint": "文書はそのまま持ち運ばれます。ダウンロードも再アップロードも不要です",
  "nextDiff": "比較する",
  "nextCodecard": "コード画像にする",
  "nextXml": "XML ⇄ JSON",
  "nextHash": "ハッシュを取る",
  "nextMarkdown": "文章にまとめる",

  // サンプル
  "mock_user_profile": "ユーザープロフィール",
  "mock_product_catalog": "商品カタログ",
  "mock_weather_data": "天気予報",
  "sample_broken": "壊れた設定ファイル（修復可能）",
  "sample_bigint": "64ビットの ID",

  // 使い方
  "hero_badge": "作業台",
  "howItWorksTitle": "使い方",
  "step1Title": "JSON を持ち込む",
  "step1Text": "貼り付けても、ファイルをドロップしても、別のツールから受け取ってもかまいません。アップロードは一切なく、重い処理はあなたが求めるまで動きません。",
  "step2Title": "判定を読む",
  "step2Text": "正しいか、あるいは壊れている正確な行と列か。加えてキーの重複と、JavaScript が保持できない数値も示します。",
  "step3Title": "中を見る",
  "step3Text": "ツリーを折りたたみ、キーや値で絞り込み、文書全体に JSONPath 式を走らせられます。",
  "step4Title": "持ち出す",
  "step4Text": "CSV、XML、YAML、JSON Lines、JSON Schema、TypeScript や Go の型。あるいは別のツールへ直接送れます。",

  "features": [
    {
      "title": "JSON.parse ではなく本物のパーサー",
      "text": "エラーには行・列と行番号欄のハイライトが付きます。自分で数えるしかない文字位置ではありません。"
    },
    {
      "title": "64ビットの ID が壊れない",
      "text": "長い数値 ID は1桁ずつそのまま書き戻されます。JSON.parse に頼る整形ツールは、それを黙って最も近い倍精度値に丸めてしまいます。"
    },
    {
      "title": "ワンクリック修復",
      "text": "コメント、余分なカンマ、シングルクォート、引用符のないキー、Python の True/False/None、迷い込んだ BOM が厳密な JSON になります。"
    },
    {
      "title": "JSONPath クエリ",
      "text": "ワイルドカード、再帰下降、スライス、[?(@.price > 10)] のようなフィルタ。すべて手作業で解釈しており、入力した内容が実行されることはありません。"
    },
    {
      "title": "実データからの型",
      "text": "JSON Schema、TypeScript のインターフェース、Go の構造体を全レコードから推論するので、たまにしか無いフィールドは任意項目になります。"
    },
    {
      "title": "正直な平坦化",
      "text": "パスの区切りと、入れ子の配列の扱いを選べます。空のオブジェクトも列を保ち、書き出しから消えたりしません。"
    },
    {
      "title": "構造の差分",
      "text": "2つの文書をパス単位で比較するので、キーの順序が違うだけで千件の変更に化けることがありません。"
    },
    {
      "title": "大きなファイルでも使える",
      "text": "検証は Web Worker に移り、ツリーは画面に見える行だけを描画し、履歴は文書の複製ではなく変わった文字だけを保存します。"
    }
  ],

  // SEO とテキスト
  "seo_title": "JSONFlow | JSON フォーマッター・バリデーター・ビューア・コンバーター",
  "seo_description": "エラー位置を正確に示し、大きなファイルでも軽いツリーで JSON を整形・検証・閲覧できます。CSV・XML・YAML・JSON Lines への変換、JSON Schema と TypeScript 型の生成、JSONPath クエリまで、すべてブラウザ内で完結します。",
  "seoHeroTitle": "Format, explore and convert JSON safely.",
  "seoHeroText": "API のレスポンスにはトークンや顧客情報、内部 ID が含まれます。JSONFlow はそれをどこにも送りません。パーサーもツリーもクエリも書き出しもこのタブの中で動くので、本番のレスポンスを貼り付けても、自分のエディタで開くのと同じくらい安全です。",
  "seoHeroList": [
    "100% ローカル。アップロードなし",
    "すべてのエラーに正確な行と列",
    "CSV・XML・YAML・Schema・TypeScript"
  ],
  "seoBrowserSpeedTitle": "すべてこのタブの中で動きます",
  "seoBrowserSpeedText": "パーサー、折りたたみツリー、JSONPath エンジン、各種書き出しは、あなたの端末で動く普通の JavaScript です。アップロード手順もサーバーも、データを運ぶ通信もありません。ページを読み込んだ後に接続を切っても、ツールはそのまま動き続けます。",
  "seoSecondaryTitle": "開発者のための、JSON 作業台のすべて。",
  "seoKeywordsTitle": "キーワード",
  "seoKeywords": [
    "JSON フォーマッター",
    "JSON バリデーター",
    "JSON ビューア",
    "JSON から CSV",
    "JSON から XML",
    "JSON から YAML",
    "CSV から JSON",
    "JSON 整形",
    "JSONPath",
    "JSON Schema 生成",
    "JSON から TypeScript",
    "JSON 差分",
    "JSON 修復",
    "JSON Lines"
  ],
  "seoUseCaseTitle": "どんなときに使うか",
  "seoUseCaseText": "設定ファイルを壊している1つのカンマを見つける、API のレスポンスを表計算に落とす、誰も文書化していないエンドポイントの TypeScript インターフェースを作る、同じペイロードの2つの版が本当に違うのか確かめる、JSON が引用符付き文字列に包まれて届いたログを開く。",
  "seoPrivacyTitle": "ここでローカルが効く理由",
  "seoPrivacyText": "JSON のペイロードが匿名であることはほとんどありません。アクセストークン、メールアドレス、注文番号、内部エンドポイントが入っています。それをホスト型の整形ツールに貼り付けるのは、他人のサーバーに丸ごと渡すことです。ここではタブの外に出ないので、記録も、キャッシュも、漏洩もありません。",

  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "貼り付けた JSON はサーバーへ送られますか？",
      "answer": "いいえ。解析、検証、ツリー、クエリ、すべての書き出しはこのブラウザタブの中で実行されます。ページを読み込んだ後にネットワークを切っても、すべてそのまま動きます。"
    },
    {
      "question": "実際にどれくらいの大きさのファイルまで扱えますか？",
      "answer": "普通のノートパソコンなら、18万ノードを含む 1.5 MB の文書が 0.1 秒をかなり下回る時間で解析され、数十メガバイトのファイルも開けます。検証は Web Worker に移り、ツリーは画面に見える行だけを描くためです。実際の限界はツールではなくメモリで、100 MB を超えたあたりからはどのソフトを使ってもブラウザのタブは苦しくなります。2 MB を超えるものは自動で読み込まず必ずボタンの後ろで止めるので、大きなファイルが届いた瞬間にページが固まることはありません。"
    },
    {
      "question": "他の整形ツールだと長い ID が変わってしまうのはなぜですか？",
      "answer": "JSON.parse はすべての数値を64ビット浮動小数点にするため、2^53 を超える整数を正確に表せません。Twitter や Discord、Snowflake の ID は末尾の桁が失われます。JSONFlow は元のテキストの桁をそのまま保持し、その範囲に入る数値があれば警告します。"
    },
    {
      "question": "ファイルにコメントや余分なカンマがあります。問題になりますか？",
      "answer": "いいえ。厳密な解析に失敗すると自動的に寛容な解析が走り、成功すれば「修復」ボタンが現れます。コメント、余分なカンマ、シングルクォート、引用符のないキー、Python の True/False/None、NaN、Infinity に対応し、文書を厳密な JSON に書き直します。"
    },
    {
      "question": "JSON から CSV への平坦化はどう動きますか？",
      "answer": "最上位の配列の各要素が1行になり、入れ子のキーは user.address.city のようなドット区切りの列になります。区切り文字と、入れ子の配列を要素ごとに1列にするか、JSON のまま残すか、連結するかを選べます。逆方向では見出しを文字どおりに扱うので、first_name という列は、入れ子を明示的に指示しない限り first_name のままです。"
    },
    {
      "question": "クエリ欄には何を書けますか？",
      "answer": "JSONPath の一部です。$.users[0].name、[*] のワイルドカード、.. による再帰下降、[0:5] のようなスライス、負のインデックス、[?(@.price > 10)] や [?(@.name =~ ^a)] のようなフィルタが使えます。式は手作業で解釈され、コードとして評価されることはありません。"
    }
  ],
  "footerTagline": "デザイナーと開発者のための、速くて上質でプライベートなツール群。",
  "footerCredit": "oLoveTools スイートの一部"
};
