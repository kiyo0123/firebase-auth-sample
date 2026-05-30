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

### 3. Web アプリを登録して設定値を取得

1. 左上の **歯車アイコン > 「プロジェクトの設定」** を開く
2. 「マイアプリ」セクションで **`</>`（ウェブ）** アイコンをクリック
3. アプリのニックネームを入力して「アプリを登録」
   （「Firebase Hosting」のチェックは不要）
4. 表示される `firebaseConfig` の値を控える（次のステップで使います）

```js
// 例：こういう値が表示されます
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  appId: "1:1234567890:web:abcdef...",
  // ...他の値もありますが、このサンプルでは上記4つだけ使います
};
```

### 4. 環境変数ファイルを作成

```bash
cp .env.example .env
```

`.env` を開き、ステップ3で取得した値を貼り付けます。
（`firebaseConfig` のキーと `.env` の変数の対応）

| firebaseConfig | .env の変数 |
|---|---|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

```dotenv
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef...
```

### 5. 起動

```bash
npm install
npm run dev
```

ターミナルに表示される URL（通常 **http://localhost:5173** ）をブラウザで開きます。

> `.env` を編集したら dev サーバーを再起動してください（Vite は起動時に読み込むため）。

---

## 動作確認

- **メール/パスワード**: 「新規登録」タブで適当なメール（例 `test@example.com`）と
  6文字以上のパスワードを入れて作成 → ログイン状態の画面に切り替わります。
  作成済みのユーザーは Firebase Console の Authentication > Users に表示されます。
- **Google**: 「Google でログイン」→ ポップアップでアカウントを選択。
- **匿名**: 「匿名でログイン」→ アカウント不要で即ログイン（`isAnonymous: true` になります）。

ログイン後は UID・メール・表示名などが表示され、「ログアウト」で戻れます。

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
| `auth/invalid-api-key` / 起動直後に真っ白 | `.env` の値が空・誤り。値を直したら **dev サーバーを再起動**。 |
| Google ログインのポップアップが出ない | ブラウザのポップアップブロックを解除。 |
| `auth/unauthorized-domain` | Authentication > Settings > 承認済みドメイン に `localhost` があるか確認。 |

## メモ: API キーについて

Firebase の Web API キーは公開前提の識別子で、漏れても即座に問題にはなりません
（アクセス制御は Authentication とセキュリティルールで行う）。それでも習慣として
`.env` は Git に含めない運用にしています。
