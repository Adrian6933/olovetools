export default {
  "title": "Hash-Bolt",
  "description": "テキストやファイルの暗号化ハッシュ（MD5、SHA-1, SHA-256, SHA-512）をブラウザ上で100%ローカルに計算します。",
  "input_text_tab": "テキスト入力",
  "input_file_tab": "ファイルハッシュ",
  "placeholder_text": "テキストを入力または貼り付けると、リアルタイムにハッシュが計算されます...",
  "label_algorithm": "ハッシュ関数",
  "label_expected_hash": "チェックサムと比較 (任意)",
  "match_success": "検証完了：ハッシュ値が一致しました！",
  "match_fail": "エラー：ハッシュ値が一致しません！",
  "match_placeholder": "整合性を検証するためのハッシュ値を貼り付け...",
  "file_drag_active": "ファイルをここにドロップ...",
  "file_drag_inactive": "ファイルをここにドラッグ＆ドロップ、またはクリックして選択",
  "file_size_warning": "大容量ファイルは、ブラウザのクラッシュを防ぐために分割して処理されます。",
  "file_processing": "ファイルの読み込みとハッシュ計算中...",
  "file_processing_speed": "速度",
  "file_processing_time": "処理時間",
  "format_uppercase": "大文字で出力",
  "format_base64": "Base64フォーマット",
  "copied": "コピーしました！",
  "tooltip_copy": "クリップボードにコピー",
  "seoHeroTitle": "高速オフライン暗号化ハッシュ・チェックサム生成ツール",
  "seoHeroText": "ファイルの整合性を検証し、安全なハッシュ値（MD5、SHA-1、SHA-256、SHA-384、SHA-512）をブラウザ内で完結して生成します。完全にオフラインで100%プライベート。",
  "seoBrowserSpeedTitle": "ローカルハッシュエンジン",
  "seoBrowserSpeedText": "すべての計算はブラウザのWeb Crypto APIを使用して実行されます。サーバーにデータを送信することなく、ハードウェア速度でハッシュ化が行われます。",
  "seoUseCaseTitle": "大容量ファイルのサポート",
  "seoUseCaseText": "大規模なインストーラーやメディアファイルをドラッグ＆ドロップ。分割ファイルリーダーがメモリを消費せずにチェックサムを算出します。",
  "seoPrivacyTitle": "100%のプライバシー保護",
  "seoPrivacyText": "データベースへの保存やネットワーク送信は一切行いません。入力されたテキストやファイルはローカルメモリ上にのみ存在し、タブを閉じると消去されます。",
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "ハッシュの検証でデータがアップロードされますか？",
      "answer": "いいえ。ハッシュ処理はすべてお使いのブラウザ上で100%ローカルに実行されます。データがサーバーに送信されることは絶対にありません。"
    },
    {
      "question": "ダウンロードしたインストーラーのハッシュを検証するには？",
      "answer": "ファイルをファイルハッシュパネルにアップロードし、配布元が提供するハッシュ値を比較入力欄に貼り付け、緑色に一致するか確認します。"
    },
    {
      "question": "なぜMD5には独自のエンジンが必要なのですか？",
      "answer": "安全性の理由から、モダンブラウザは標準Web Crypto APIからMD5を除外しています。レガシーチェックサムの検証用として、純粋なJSによるMD5エンジンを搭載しています。"
    }
  ],
  "footerTagline": "ファイルとテキストのための安全でローカルな暗号化チェックサム生成ツール。",
  "footerCredit": "oLoveToolsスイートの一部"
};
