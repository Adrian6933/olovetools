export default {
  "title": "EXIF-Clear",
  "description": "画像ファイルからEXIF、GPS（位置情報）、およびその他のメタデータをインスペクトし、ブラウザ上でローカル削除します。プライバシーを保護します。",
  "btn_download_cleaned": "クリーンな画像をダウンロード",
  "btn_download_zip": "クリーンな画像をダウンロード (.ZIP)",
  "label_upload_box": "ここに画像をドラッグ＆ドロップするか、クリックして参照",
  "label_files_loaded": "読み込まれたファイル",
  "btn_clear_all": "すべてクリア",
  "label_options": "メタデータ削除レベル",
  "opt_full_strip": "フル削除 (推奨 - EXIF, GPS, XMP, コメントすべて)",
  "opt_gps_only": "GPS位置情報のみ削除",
  "opt_camera_only": "カメラ・デバイス情報のみ削除",
  "label_meta_details": "検出されたメタデータ",
  "meta_make": "カメラメーカー",
  "meta_model": "カメラ機種名",
  "meta_datetime": "撮影日時",
  "meta_gps": "GPS位置情報 (経度・緯度)",
  "meta_software": "編集ソフトウェア",
  "status_clean": "クリーン / メタデータなし",
  "status_has_meta": "メタデータ検出",
  "status_has_gps": "位置情報 (GPS) 検出",
  "no_files_loaded": "画像が読み込まれていません",
  "preview_title": "メタデータインスペクター",
  "progress_clearing": "画像のメタデータをクリーン中... {current} / {total}",
  "seo_title": "EXIF-Clear | 無料オンライン画像EXIF・GPS位置情報削除ツール",
  "seo_description": "画像（JPEG/PNG）からEXIFタグ、GPS位置情報、およびメタデータをローカルオンラインで削除。個人情報保護のために撮影地やカメラ情報を完全消去。",
  "seoHeroTitle": "GPS位置情報とカメラEXIFメタデータをオフライン消去",
  "seoHeroText": "写真を公開する前にプライバシーを保護。EXIF-Clearはブラウザのメモリ内だけで安全にメタデータヘッダーを読み取り、削除します。",
  "seoHeroList": [
    "撮影地GPS座標、カメラ機種、露出設定などを自動検出して表示",
    "EXIF、XMP、およびPhotoshopのIPTCメタデータを含む全セグメントを一括クリア",
    "100%クライアントサイド動作 - 外部サーバーへの画像アップロード一切なし"
  ],
  "seoBrowserSpeedTitle": "リアルタイムのバイナリヘッダフィルタリング",
  "seoBrowserSpeedText": "ArrayBufferを用いてファイルバイトデータを直接解析し、画像データの再圧縮を行わずにメタデータブロックだけを即座に削ぎ落とすため、画質は100%維持されます。",
  "seoUseCaseTitle": "写真家、ブロヤー、モバイルユーザーの必須ツール",
  "seoUseCaseText": "スマートフォンで撮影した写真には、高精度なGPS位置情報が含まれています。フリマ出品やSNS投稿、ブログ掲載の前にEXIFデータを削除しましょう。",
  "seoPrivacyTitle": "完全ローカルのサンドボックス実行",
  "seoPrivacyText": "元の画像が外部サーバーへ送信されることは決してありません。すべてのファイル操作は完全にブラウザのタブ内だけで完結します。",
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "なぜ写真からメタデータを削除する必要があるのですか？",
      "answer": "スマホで撮影した写真にはGPS位置情報、撮影日時、カメラデータが含まれており、共有した際に自宅の場所や行動範囲が他人に特定されるリスクがあります。"
    },
    {
      "question": "メタデータを削除すると画質は劣化しますか？",
      "answer": "いいえ！画像ファイル内のヘッダ部分（APP1/付帯情報）のみを変更し、圧縮されたピクセルデータ（SOS/IDAT）は触らないため、画質は元のままで劣化しません。"
    },
    {
      "question": "対応している画像フォーマットは何ですか？",
      "answer": "JPEG/JPG、PNG、WebP形式のファイルのメタデータ削除に完全オフラインで対応しています。"
    },
    {
      "question": "GPS情報はどのように解析されますか？",
      "answer": "ファイル先頭からAPP1セグメントをスキャンし、TIFFおよびEXIF/GPS構造ディレクトリを読み取って、緯度経度の値をマッピングします。"
    }
  ],
  "footerTagline": "無料、安全、ローカルで動作する画像メタデータクリーニングツール。",
  "footerCredit": "oLoveToolsスイートの一部"
};
