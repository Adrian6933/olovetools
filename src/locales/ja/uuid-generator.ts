export default {
  "title": "UUID Generator",
  "seo_title": "UUID Generator | 無料のオンライン UUID v4 & v5 ジェネレーター",
  "seo_description": "Web Crypto API を使用してブラウザ内で 100% ローカルに、一度に最大 500 個のランダム UUID（v4）および名前付き UUID（v5）を一括生成します。無料のオンライン UUID ジェネレーター。",
  "seoHeroTitle": "UUID v4 & v5 一括ジェネレーター",
  "seoHeroText": "ブラウザのネイティブ Web Crypto API を使用し、最大 500 個のランダム UUID（バージョン 4）または名前付き UUID（ネームスペース付きバージョン 5）を即座に生成します。すべての生成はローカルで行われ、サーバー呼び出しやトラッキングはありません。",
  "label_version": "UUID バージョン",
  "option_v4": "v4（ランダム）",
  "option_v5": "v5（名前付き + SHA-1）",
  "label_count": "生成数",
  "label_namespace": "ネームスペース UUID",
  "label_name": "名前",
  "label_uuids_generated": "生成された UUID",
  "label_no_uuids": "まだ UUID が生成されていません。上の設定を調整してください。",
  "error_invalid_namespace": "無効なネームスペース UUID 形式です。標準の UUID 形式を使用してください: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "error_fix_namespace": "v5 UUID を生成するには、ネームスペース UUID を修正してください。",
  "button_regenerate": "再生成",
  "button_copied_all": "すべてコピーしました！",
  "button_download": ".txt をダウンロード",
  "button_reset": "リセット",
  "tooltip_copy": "クリップボードにコピー",
  "seoBrowserSpeedTitle": "Web Crypto API 搭載",
  "seoBrowserSpeedText": "UUID は v4 にはブラウザのネイティブ crypto.randomUUID() を、v5 には crypto.subtle.digest('SHA-1') を使用して生成され、サーバー処理なしでハードウェア速度の暗号品質を保証します。",
  "seoUseCaseTitle": "一括生成",
  "seoUseCaseText": "1 回のクリックで最大 500 個の UUID を生成します。データベースのシード、テストデータ生成、一意のセッション ID、複数の一意識別子が一度に必要なあらゆるシナリオに最適です。",
  "seoPrivacyTitle": "100% プライベート & セキュア",
  "seoPrivacyText": "データベース、トラッキング、ネットワークアップロードは一切ありません。すべての UUID 生成はブラウザの暗号サブシステム内で完全に行われます。データがデバイスから外に出ることはありません。",
  "seoKeywords": [
    "uuid ジェネレーター",
    "uuid v4",
    "uuid v5",
    "guid ジェネレーター",
    "ランダム uuid",
    "一括 uuid",
    "一意識別子"
  ],
  "faqTitle": "よくある質問",
  "faq": [
    {
      "question": "UUID v4 と v5 の違いは何ですか？",
      "answer": "UUID v4 は乱数を使用して生成され、各 UUID を一意で予測不可能にします。UUID v5 はネームスペース UUID と名前文字列を SHA-1 でハッシュ化して生成され、同じネームスペース+名前が常に同じ UUID を生成することを意味します。"
    },
    {
      "question": "複数の UUID を一度に生成できますか？",
      "answer": "はい。カウントスライダーを使用して 1 回のバッチで 1 から 500 までの UUID を生成できます。すべての UUID は即座に生成され、個別または一括でコピーできます。"
    },
    {
      "question": "これらの UUID は暗号学的に安全ですか？",
      "answer": "はい。バージョン 4 の UUID はブラウザのネイティブ crypto.randomUUID() 関数を使用し、暗号学的ランダム性を提供します。バージョン 5 の UUID は Web Crypto API の SHA-1 ダイジェスト関数を使用します。"
    }
  ],
  "footerTagline": "Web Crypto API 搭載の高速で安全な UUID v4 および v5 一括ジェネレーター — 100% ブラウザ内でローカルに動作。",
  "footerCredit": "oLoveTools スイートの一部",
  "emailAddress": "adrian.contact.me.69@gmail.com",
  "emailCopied": "コピーしました！",
  "contactForIdeas": "アイデアやコメントのお問い合わせ先:",
  "button_copy_all": "すべてコピー"
};
