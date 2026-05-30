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

## セットアップ

### 1. Firebase プロジェクトを用意

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** を開き、以下のプロバイダを有効化:
   - メール / パスワード
   - Google
   - 匿名
3. **プロジェクトの設定 > マイアプリ** で Web アプリを追加し、設定値を取得

### 2. 環境変数を設定

```bash
cp .env.example .env
```

`.env` に Firebase の設定値を貼り付けます。

### 3. 起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

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

## メモ: API キーについて

Firebase の Web API キーは公開前提の識別子で、漏れても即座に問題にはなりません
（アクセス制御は Authentication とセキュリティルールで行う）。それでも習慣として
`.env` は Git に含めない運用にしています。
