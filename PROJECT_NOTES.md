# FNJ コーポレートサイト リニューアル提案 — プロジェクトメモ

## 公開URL

| ページ | URL |
|--------|-----|
| 提案書 | https://kaleidoscopic-boba-6aaa79.netlify.app/fnj-proposal.html |
| ヒアリングシート | https://kaleidoscopic-boba-6aaa79.netlify.app/fnj-hearing.html |
| Netlifyダッシュボード | https://app.netlify.com/projects/kaleidoscopic-boba-6aaa79 |

## パスワード

| 用途 | パスワード |
|------|-----------|
| 全ページ共通（クライアント・テラ両方） | `fnj2026` |

※ 以前あった管理者パスワード（`tera_admin`）と管理者ビューは削除済み。

---

## GitHubリポジトリ

- **URL**: https://github.com/horii-kentaro/fnj-corporate-proposal
- **ブランチ**: `master`
- **デプロイ**: GitHub push → Netlify 自動デプロイ（CI/CD）

---

## ファイル構成

```
orporate_site#1/
├── netlify.toml                          # Netlify設定（publish先 + Edge Function）
├── netlify/
│   └── edge-functions/
│       └── auth.js                       # パスワード認証（Deno Edge Function）
└── documentation/
    └── reports/
        ├── fnj-proposal.html             # 提案書（タブ2枚: 提案書 / デモ）
        └── fnj-hearing.html              # ヒアリングシート（Firebase連携）
```

---

## Firebase（Firestore）

- **プロジェクト名**: fnj-hearing
- **コンソール**: https://console.firebase.google.com/project/fnj-hearing
- **保存先コレクション**: `hearings`
- **固定ドキュメントID**: `fnj-main`（上書き保存方式）
- **APIキー（現在有効）**: `AIzaSyDtDu4r15kBnGpyA5IsdDzaZR2Ep46Fio0`
  - HTTP リファラー制限: `*.netlify.app/*` のみ許可済み
- **セキュリティルール**: テストモード（30日間有効、期限切れ注意）

---

## ヒアリングシートの仕様

- クライアント様・テラ担当者 **同じURL・同じパスワード** でアクセス
- ページを開くと **前回保存したデータを自動復元**（loadSavedData → populateForm）
- 「💾 回答を保存する」ボタンで Firestore に上書き保存
- 保存後: フォームはそのまま表示、上部に **最終保存日時バー**、下部に **トースト通知**（3秒）

### ヒアリングシートのセクション構成（9区画）

1. 基本情報（氏名・部署・メール・電話）
2. 現行サイトの課題（チェックボックス + 自由記述）
3. ターゲット・重視するユーザー層（ラジオ + チェック）
4. リニューアル目標（チェックボックス + 最重要目標）
5. デザインイメージ（ラジオ + ブランドカラー + 参考URL）
6. 機能要件マトリクス（必須 / あれば良い / 不要）
7. SEO・集客（チェック + キーワード + 広告サポート）
8. スケジュール・予算（公開時期 + 予算感）
9. その他（懸念・質問 / 差別化ポイント）

---

## 提案書の内容

- 表紙・課題分析・リニューアル方針
- サイトマップツリー・ガントチャート
- 費用表（¥6,800,000）・チーム紹介・アフターサポート
- デモページタブ: FNJサイトのモックアップ（ヒーロー/サービス/実績/ニュース/CTA/フッター）

---

## auth.js の仕組み（Netlify Edge Function）

- `/*` すべてのリクエストをインターセプト
- Cookieなし → パスワード入力画面を表示
- パスワード正解 → Cookie（`fnj_client_auth`、24時間）をセットしてリダイレクト
- ルートURL (`/`) → `/fnj-proposal.html` に自動リダイレクト

---

## これまでの主な作業履歴

1. `fnj-proposal.html` 作成（提案書 + デモモックアップ）
2. GitHub リポジトリ作成・push
3. Netlify デプロイ + Edge Function によるパスワード保護
4. `fnj-hearing.html` 作成（Firebase Firestore連携ヒアリングシート）
5. Firebase APIキー漏洩対応（HTTPリファラー制限 + キーローテーション）
6. ヒアリングシート改修：管理者ビュー削除 / 永続保存モードに変更

---

## 次回再開時の注意点

- **Firestoreテストモードの期限** を確認すること（30日間、期限切れ後は読み書き不可）
  - 延長: Firebase Console → Firestore → ルール → 期限を延長
- デプロイは `git push origin master` で自動反映される
