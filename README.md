# firebase-auth-sample

Firebase Authentication を学ぶための、シンプルな最小サンプルです。
**Vite + TypeScript + React** で作られています。

3 つの認証方法を試せます:

- メール / パスワード（新規登録・ログイン）
- Google サインイン
- 匿名認証

FirebaseUI のようなドロップインUIは使わず、`firebase/auth` SDK を直接呼ぶ
シンプルな自前フォームにしています。「認証で実際に何が起きているか」が
コードから追えることを優先しました。

> このサンプルは Firebase 公式 Codelab
> [「ウェブで Firebase を使ってみる」](https://firebase.google.com/codelabs/firebase-get-to-know-web?hl=ja#0)
> をベースに、認証部分だけを抜き出して Vite + TypeScript + React で作り直したものです。
> （元の Codelab は Firestore を使ったゲストブック/出欠アプリです）

> 📖 **コードの仕組みを学びたい方へ**: [`docs/LEARNING.md`](docs/LEARNING.md) に、
> コードを参照しながらの解説と、手を動かす **Exercise（機能拡張課題・8問）** を用意しています。

## 必要なもの

- Node.js 18 以上（`node -v` で確認）
- Google アカウント（Firebase Console 用）

---

## セットアップ手順

### 1. Firebase プロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. **「プロジェクトを追加」** をクリックし、好きな名前で作成
   （Google アナリティクスは有効・無効どちらでも可）

### 2. 認証プロバイダを有効化

左メニューの **「構築 > Authentication」** を開き、**「始める」** をクリック。
**「Sign-in method」** タブで以下の 3 つを有効にします。

| プロバイダ | 手順 |
|---|---|
| **メール / パスワード** | 選択して「有効にする」を ON →保存（※「メールリンク」は OFF のままでOK） |
| **Google** | 選択して「有効にする」を ON → **プロジェクトのサポートメール** を選択 → 保存 |
| **匿名** | 選択して「有効にする」を ON →保存 |

> `localhost` は最初から「承認済みドメイン」に入っているので、ローカル開発では追加設定は不要です。

### 3. Web アプリを登録して config を取得

1. 左上の **歯車アイコン > 「プロジェクトの設定」** を開く
2. 「マイアプリ」セクションで **`</>`（ウェブ）** アイコンをクリック
3. アプリのニックネームを入力して「アプリを登録」
   （「Firebase Hosting」のチェックは不要）
4. **「SDK setup and configuration」で「Config」** を選ぶと、`firebaseConfig`
   オブジェクトが表示されます。これをコピーします。

```js
// こういう値が表示されます
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef...",
};
```

### 4. config をコードに貼り付ける

`src/firebase.ts` を開き、`firebaseConfig` をステップ3でコピーした値で
**まるごと置き換えます**。

```ts
// src/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef...",
};
```

> Firebase の Web 用 `apiKey` 等は秘密情報ではなく公開前提の識別子なので、
> このようにコードへ直接書いて問題ありません（アクセス制御は Authentication
> とセキュリティルールで行います）。`.env` は使いません。

### 5. 起動

```bash
npm install
npm run dev
```

ターミナルに表示される URL（通常 **http://localhost:5173** ）をブラウザで開きます。

> `firebase.ts` を編集したら、dev サーバーが動いていれば自動で再読み込みされます。

---

## 動作確認

- **メール/パスワード**: 「新規登録」タブで適当なメール（例 `test@example.com`）と
  6文字以上のパスワードを入れて作成 → ログイン状態の画面に切り替わります。
  作成済みのユーザーは Firebase Console の Authentication > Users に表示されます。
- **Google**: 「Google でログイン」→ ポップアップでアカウントを選択。
- **匿名**: 「匿名でログイン」→ アカウント不要で即ログイン（`isAnonymous: true` になります）。

ログイン後は UID・メール・表示名などが表示され、「ログアウト」で戻れます。

---

## デプロイ（Firebase Hosting）

ビルドした静的ファイルを Firebase Hosting に公開します。
※ デプロイには **自分の Firebase プロジェクト**が必要です（他人の共有プロジェクトには
デプロイできません）。`src/firebase.ts` の config も自分のプロジェクトのものにしておきます。

### 1. Firebase CLI を用意

```bash
npm install -g firebase-tools   # 初回のみ
firebase login                  # ブラウザで Google ログイン
```

### 2. プロジェクトを紐付ける

```bash
firebase use <your-project-id>   # 例: firebase use my-auth-sample-1234
```

> `<your-project-id>` は Console の「プロジェクトの設定」やアプリの config の
> `projectId` の値です。このコマンドでローカルに `.firebaserc` が作られ、
> 「どのプロジェクトにデプロイするか」が決まります（CLI 操作の宛先＝`.firebaserc`）。

### 3. デプロイ

```bash
firebase deploy
```

`firebase.json` の `predeploy` に `npm run build` を入れてあるので、**deploy 時に
自動でビルド**され、`dist/` の内容が公開されます。完了すると
`https://<your-project-id>.web.app` の URL が表示されます。

> **Google ログインについて**: デプロイ後の `*.web.app` /
> `*.firebaseapp.com` ドメインは自動で「承認済みドメイン」に追加されるので、
> 公開サイトでもそのまま Google ログインが動きます。独自ドメインを使う場合のみ
> Authentication > Settings > 承認済みドメイン に手動追加が必要です。

### 設定ファイルについて

リポジトリの `firebase.json` がデプロイ設定です。

```json
{
  "hosting": {
    "public": "dist",              // ビルド成果物のフォルダ
    "rewrites": [{ "source": "**", "destination": "/index.html" }],  // SPA 用
    "predeploy": ["npm run build"] // deploy 前に自動ビルド
  }
}
```

`.firebaserc`（プロジェクト紐付け）はローカル固有なので Git には含めていません
（各自 `firebase use` で設定）。

## ディレクトリ構成

```
src/
├── firebase.ts            Firebase の初期化（auth インスタンスを export）
├── auth.ts                各認証方法を関数にまとめた薄いラッパー
├── hooks/
│   └── useAuth.ts         ログイン状態を購読する React フック
├── components/
│   ├── SignIn.tsx         未ログイン時のフォーム（3 つの認証方法）
│   └── Profile.tsx        ログイン後のユーザー情報表示
├── App.tsx                認証状態で SignIn / Profile を出し分け
└── main.tsx               エントリポイント
```

## 学習のポイント

- `onAuthStateChanged`（`useAuth.ts`）が認証状態の単一の真実の源（source of truth）。
  ログイン・ログアウトはこのリスナー経由で UI に反映される。
- 各サインイン関数（`auth.ts`）は Promise を返す。成功時に画面を切り替える処理は
  書かず、`onAuthStateChanged` に任せているのがポイント。
- Firebase のエラーは `error.code`（例: `auth/invalid-credential`）で種類を判別できる。

## うまくいかないとき

| 症状 | 原因と対処 |
|---|---|
| `auth/configuration-not-found` や `auth/operation-not-allowed` | Console でそのプロバイダを有効化していない。ステップ2を確認。 |
| `auth/invalid-api-key` / 起動直後に真っ白 | `src/firebase.ts` の `firebaseConfig` の値が空・誤り。値を確認。 |
| Google ログインのポップアップが出ない | ブラウザのポップアップブロックを解除。 |
| `auth/unauthorized-domain` | Authentication > Settings > 承認済みドメイン に `localhost` があるか確認。 |

## メモ: API キーをコードに書いて大丈夫？

大丈夫です。Firebase の Web API キーは公開前提の識別子で、秘密情報ではありません
（漏れても即座に問題にはならず、アクセス制御は Authentication とセキュリティ
ルールで行う）。そのため本サンプルでは `src/firebase.ts` に直接書いています。

なお、`firebase use` などの CLI でアプリ側の config を自動注入できるわけでは
ありません。CLI（`.firebaserc`）が結びつけるのは「CLI 操作の宛先プロジェクト」で、
ブラウザで動く SDK が使う `firebaseConfig` とは別レイヤーです。config を
コードに書かない唯一の方法は Firebase Hosting の自動注入
（`import '/__/firebase/init.js'`）ですが、これは Hosting 前提なので本サンプルでは使いません。
