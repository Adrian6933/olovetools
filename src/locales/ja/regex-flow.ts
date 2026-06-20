export default {
  "title": "Regex-Flow",
  "description": "リアルタイムハイライト、構文説明、テキスト置換機能を搭載した、ブラウザ上で100%ローカルに動作するインタラクティブな正規表現チェッカー＆ビルダー。",
  "regex_placeholder": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
  "text_placeholder": "ここにテストするテキストを入力します。例：hello@olovetools.com や support@example.org",
  "replace_placeholder": "置換後のテキスト（例：masked_$0 や $1）",
  "label_regex": "正規表現",
  "label_flags": "フラグ (Flags)",
  "label_test_text": "テストテキスト",
  "label_replacement": "置換テキスト",
  "label_result": "置換結果",
  "label_explanation": "パターンの詳細説明",
  "label_cheat_sheet": "クイックチートシート",
  "label_presets": "プリセットパターン",
  "status_valid": "有効な正規表現",
  "status_invalid": "無効な正規表現",
  "no_matches": "一致する文字列は見つかりませんでした",
  "matches_found": "{count} 件の一致が見つかりました",
  "match_item": "マッチ {index}",
  "group_item": "グループ {index}",
  "copied": "コピーしました！",
  "tooltip_copy": "クリップボードにコピー",
  "seoHeroTitle": "100%ローカル動作のブラウザ型正規表現チェッカー＆作成ツール",
  "seoHeroText": "リアルタイムの一致ハイライト、置換プレビュー、完全な構文ブレイクダウンにより、正規表現の作成、テスト、デバッグを行えます。ブラウザ内メモリでのみ処理されます。",
  "seoBrowserSpeedTitle": "即時のクライアント側評価",
  "seoBrowserSpeedText": "入力と同時に、ブラウザのネイティブJavaScript RegExpエンジンを使ってローカルで即時にパターンを評価します。サーバー通信はありません。",
  "seoUseCaseTitle": "インタラクティブな構文解説",
  "seoUseCaseText": "アンカー、量指定子、グループ、文字クラスなどを細かく分解し、ステップバイステップで正規表現の構造をわかりやすく説明します。",
  "seoPrivacyTitle": "100%安全かつプライベート",
  "seoPrivacyText": "プライバシーは第一です。正規表現、フラグ、テスト用テキスト、置換文字列はすべてブラウザ内でローカルに処理され、送信されることはありません。",
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "Regex-Flowで機密性のあるテキストや正規表現をテストしても安全ですか？",
      "answer": "はい。Regex-Flowは完全にクライアント側で実行されるため、データがサーバーに送信されることはありません。安心してご利用ください。"
    },
    {
      "question": "どの正規表現エンジンが使用されていますか？",
      "answer": "ブラウザに組み込まれているJavaScriptのRegExpエンジンを使用しています。後方参照（lookbehind assertions）などの対応はブラウザに依存します。"
    },
    {
      "question": "サポートされているフラグは何ですか？",
      "answer": "標準のJSフラグに対応しています：g（グローバルマッチ）、i（大文字・小文字を区別しない）、m（複数行マッチ）、s（ドットに改行を含める）、u（Unicode）、y（スティッキー）。"
    }
  ],
  "footerTagline": "ブラウザで動くプライベートなローカル正規表現作成・テストツール。",
  "footerCredit": "oLoveToolsスイートの一部"
};
