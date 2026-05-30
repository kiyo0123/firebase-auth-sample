# Firebase Auth 学習メモ

このサンプルを題材に、**Firebase Authentication の仕組み**を理解するためのメモです。
コードを参照しながら「何が・どこで・なぜ起きているか」を追っていきます。
最後に手を動かす **Exercise（機能拡張課題）** を用意しています。

- 対象コード: `src/` 以下（React 版）と `vanilla/index.html`（Vanilla 版）
- 前提: React の `useState` / `useEffect` がなんとなく分かること

---

## この教材は 2 つの版があります（Vanilla → React の 2 段構え）

同じ機能を **2 通り**で実装しています。学習効果を最大化するため、まず Vanilla で
「Auth の素の仕組み」を掴み、次に React 版で「フレームワークに載せるとどうなるか」
を理解する流れがおすすめです。

| 版 | 場所 | 役割 | 動かし方 |
|---|---|---|---|
| **Vanilla 版** | `vanilla/index.html` | Auth の**仕組みそのもの**を最小コードで見る | `npx serve vanilla`（ビルド不要） |
| **React 版** | `src/` 以下 | Firebase Auth を**React で使う作法**を学ぶ | `npm run dev` |

- **Vanilla 版**は 1 ファイル・約 60 行。SDK の API とコードがほぼ 1:1 に対応していて、
  「状態が変わったら DOM を書き換える」が一直線に追えます。
- **React 版**は同じ Auth ロジックの上に React の作法（`useState`/`useEffect`/カスタム
  フック）が乗ります。この「乗っている部分」は Auth の本質とは別物 ——
  その切り分けは [後半の「React ならではの部分」](#react-ならではの部分auth-の本質と切り分ける) で解説します。

> まず `vanilla/index.html` を開いて全体を眺めてから本メモを読むと、
> 「どこまでが Firebase で、どこからが React か」がクリアになります。

---

## 0. 一番大事な考え方（これだけは覚える）

Firebase Auth を使うアプリは、結局この 1 文に集約されます。

> **「ログイン状態」はアプリが管理するのではなく、Firebase が管理する。**
> **アプリは `onAuthStateChanged` でそれを“購読”して、画面に反映するだけ。**

つまり、ログインボタンを押したら「画面を切り替える」コードを自分で書く…のではなく、

1. ログイン関数を呼ぶ（`signInWith...`）
2. → Firebase が内部の認証状態を更新する
3. → 登録しておいた `onAuthStateChanged` のコールバックが**自動で**呼ばれる
4. → そのコールバックが React の state を更新し、画面が切り替わる

この **「一方向の流れ」** が理解できれば、このサンプルの 9 割は分かったも同然です。

```
[ユーザー操作]  signInWithGoogle() を呼ぶ
       │
       ▼
[Firebase]      認証状態を「ログイン済み」に更新
       │
       ▼
[onAuthStateChanged]  コールバックが発火（user オブジェクトを受け取る）
       │
       ▼
[React state]   setUser(user) で状態更新
       │
       ▼
[画面]          App が <SignIn /> → <Profile /> に切り替わる
```

---

## 1. 全体のファイル構成と役割

```
src/
├── firebase.ts        ← Firebase 初期化。auth インスタンスを作って export
├── auth.ts            ← 認証の「操作」を関数化（ログイン/ログアウト等）
├── hooks/useAuth.ts   ← 認証の「状態」を React に橋渡し（★ 心臓部）
├── App.tsx            ← 状態を見て SignIn / Profile を出し分け
├── components/
│   ├── SignIn.tsx     ← 未ログイン時の UI（3 つのログイン方法）
│   └── Profile.tsx    ← ログイン後の UI（ユーザー情報 + ログアウト）
└── main.tsx           ← エントリポイント（React を起動するだけ）
```

ポイントは **「操作（auth.ts）」と「状態（useAuth.ts）」を分けている**こと。

- `auth.ts` = 「やる」係（ログインする・ログアウトする）
- `useAuth.ts` = 「見る」係（今ログインしてる？ 誰？）

---

## 2. コードを順に読む

### 2-1. `firebase.ts` — 初期化（アプリ全体で 1 回だけ）

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// config は .env から読み込む（リポジトリに含めない方針）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);   // ← これを各所で import して使い回す
```

- `initializeApp(config)` で「どの Firebase プロジェクトに繋ぐか」を確定。
- `getAuth(app)` が **Authentication の入口オブジェクト**。
- ここで作った `auth` を 1 つだけ export し、他のファイルはこれを import して使う
  （初期化は何度もしない）。
- config は `.env` から読み込み、`.gitignore` で除外しています（Vanilla 版は
  `vanilla/firebase-config.js` を使い、同様に除外）。

> **config は秘密情報？**
> `apiKey` 等は秘密鍵ではなく「どのプロジェクトか」を示す公開 ID なので、
> それ自体が漏れても致命的ではありません（不正アクセスは Authentication の
> 設定やセキュリティルールで防ぐ）。本サンプルでは念のためリポジトリには
> 含めず `.env` で管理しています。

### 2-2. `auth.ts` — 認証の「操作」をまとめる

各認証方法を、薄い関数に包んでいるだけです。

```ts
// Email / Password で新規作成
export function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}
// Email / Password でログイン
export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
// Google（ポップアップ）
export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}
// 匿名
export function signInAsGuest() {
  return signInAnonymously(auth);
}
// ログアウト
export function logout() {
  return signOut(auth);
}
```

注目ポイント:

- すべての関数が **第 1 引数に `auth`** を渡している（2-1 で作ったあの `auth`）。
- すべて **Promise を返す**（`async` 処理）。成功・失敗は呼び出し側で待つ。
- **ここには「画面を切り替える」コードが一切ない。** それは `onAuthStateChanged`
  の仕事だから（→ 0 章の流れ）。これが綺麗に分離されている点。

| 関数 | Firebase API | 内部で叩く REST |
|---|---|---|
| `signUpWithEmail` | `createUserWithEmailAndPassword` | `accounts:signUp` |
| `signInWithEmail` | `signInWithEmailAndPassword` | `accounts:signInWithPassword` |
| `signInWithGoogle` | `signInWithPopup` | OAuth フロー |
| `signInAsGuest` | `signInAnonymously` | `accounts:signUp`（メール無し）|

> 以前コンソールに出た `accounts:signUp 400` は、`signInAsGuest`（匿名）が
> プロジェクトで無効だったため。どの関数がどの REST を叩くか分かると、
> エラーの出どころが特定しやすくなります。

### 2-3. `hooks/useAuth.ts` — ★ 心臓部（状態の購読）

このサンプルで**一番大事なファイル**です。

```ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);   // ログイン中なら User、未ログインなら null
      setLoading(false);      // 最初の状態が確定した
    });
    return unsubscribe;       // クリーンアップで購読解除
  }, []);

  return { user, loading };
}
```

何をしている？

- `onAuthStateChanged(auth, callback)` は、**認証状態が変わるたびに `callback` を
  呼ぶ**リスナー登録。ログイン時・ログアウト時・ページ再読み込み時に発火する。
- その値を `setUser` で React の state に流し込む → 画面が反応する。
- `loading` は「最初の確認が終わったか」のフラグ。リロード直後は「ログイン済みか
  どうか」を Firebase が確認するまで一瞬かかるため、その間は読み込み中表示にする。
- `useEffect` の戻り値に `unsubscribe` を返している → コンポーネント破棄時に
  リスナーを解除（メモリリーク防止の定番パターン）。

> **なぜ `loading` が必要？**
> もし無いと、リロード直後の一瞬（確認中）は `user === null` なので、
> 「本当はログイン済みなのに一瞬ログイン画面がチラッと出る」現象が起きます。
> `loading` 中は何も判定しないことでこれを防いでいます。

### 2-4. `App.tsx` — 状態で画面を出し分け

```tsx
export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="container">
      <h1>Firebase Auth Sample</h1>
      {loading ? (
        <p>読み込み中…</p>
      ) : user ? (
        <Profile user={user} />   // ログイン中
      ) : (
        <SignIn />                // 未ログイン
      )}
    </div>
  );
}
```

たったこれだけ。**3 分岐（読み込み中 / ログイン中 / 未ログイン）** を
`useAuth()` の戻り値で切り替えるだけです。ログイン処理の詳細は一切知りません。

### 2-5. `SignIn.tsx` — 未ログイン時の UI

3 つの認証方法のボタン/フォームを並べたコンポーネント。肝は `run` 関数:

```tsx
async function run(action: () => Promise<unknown>) {
  setError(null);
  try {
    await action();
    // 成功しても「画面を切り替える」コードは書かない！
    // → onAuthStateChanged が自動で反応してくれる
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
  }
}
```

- 各ボタンは `run(signInWithGoogle)` のように**関数を渡すだけ**。共通の
  try/catch でエラーを拾い、画面下の `<p className="error">` に出す。
- 成功時に何もしないのが重要。**成功処理＝画面遷移は `onAuthStateChanged` 任せ。**

### 2-6. `Profile.tsx` — ログイン後の UI

`App` から渡された `user`（Firebase の `User` オブジェクト）の中身を表示し、
`logout()` ボタンを置くだけ。

```tsx
export default function Profile({ user }: { user: User }) {
  return (
    <div className="card">
      <dl>
        <dt>UID</dt>      <dd>{user.uid}</dd>
        <dt>メール</dt>    <dd>{user.email ?? '(なし)'}</dd>
        <dt>表示名</dt>    <dd>{user.displayName ?? '(なし)'}</dd>
        <dt>匿名</dt>      <dd>{user.isAnonymous ? 'はい' : 'いいえ'}</dd>
      </dl>
      <button onClick={() => logout()}>ログアウト</button>
    </div>
  );
}
```

`User` オブジェクトには他にも `photoURL`, `emailVerified`, `metadata`
（作成日時・最終ログイン）などが入っています（→ Exercise で使います）。

---

## React ならではの部分（Auth の本質と切り分ける）

ここが今回の肝のひとつです。React 版のコードには「Firebase Auth だから必要なもの」と
「React だから必要なもの」が混ざっています。これを切り分けられると、他の
フレームワーク（Vue, Svelte, 素の JS…）でも応用が効くようになります。

### 切り分け表

| 要素 | これは何のため？ | Vanilla 版では？ |
|---|---|---|
| `initializeApp` / `getAuth` | **Firebase 本質** | 同じく必要（`vanilla/index.html` にもある）|
| `signInWith...` / `signOut` | **Firebase 本質** | まったく同じ API を呼ぶ |
| `onAuthStateChanged` | **Firebase 本質**（状態リスナー）| まったく同じ。これが共通の核心 |
| `User` オブジェクトの中身 | **Firebase 本質** | 同じ |
| `useState(user)` | React 都合（状態を持って再描画させる）| **不要**。直接 DOM を書き換える |
| `useEffect(..., [])` | React 都合（マウント時に 1 回だけ登録）| **不要**。スクリプト実行時に 1 回登録するだけ |
| `return unsubscribe` | React 都合（アンマウント時に解除）| **不要**（ページ全体が消えるまで生きる）|
| `loading` フラグ | React 都合（初回描画のチラつき対策）| ほぼ**不要**（コールバックが来てから描くため）|
| カスタムフック `useAuth()` | React 都合（状態を部品化して共有）| **不要**（関数 1 個で完結）|

つまり **「状態リスナー（onAuthStateChanged）を UI にどうつなぐか」** が
フレームワークごとの差で、Auth の本体は完全に共通です。

### 同じ処理を見比べる

**onAuthStateChanged を UI に反映する部分**を、両版で並べてみます。

Vanilla 版（`vanilla/index.html`）— **コールバックの中で直接 DOM を更新**:

```js
onAuthStateChanged(auth, (user) => {
  if (user) {
    signedOut.hidden = true;
    signedIn.hidden = false;
    info.textContent = `UID: ${user.uid} ...`;
  } else {
    signedOut.hidden = false;
    signedIn.hidden = true;
  }
});
```

React 版（`src/hooks/useAuth.ts` + `App.tsx`）— **コールバックでは state を更新するだけ**:

```ts
// useAuth.ts: 「DOM を触る」代わりに「state を更新」する
onAuthStateChanged(auth, (currentUser) => {
  setUser(currentUser);   // ← ここが Vanilla の DOM 操作に当たる
  setLoading(false);
});
```
```tsx
// App.tsx: 実際の表示切り替えは React が state を見て自動でやる
{loading ? <p>読み込み中…</p> : user ? <Profile user={user} /> : <SignIn />}
```

**違いはここだけ**です:

- Vanilla: 「状態が変わった → **自分で** DOM を書き換える」
- React: 「状態が変わった → **state を更新するだけ**。描画は React が引き受ける」

React の `useState`/`useEffect`/`useAuth` は、この「state を更新すれば自動で再描画」
という仕組みを成立させるための“配管”です。Auth を理解する上では飾りなので、
**まず Vanilla で核を押さえ、その後で「React はこの配管を足しているだけ」と捉える**と
スッキリします。

### なぜわざわざ React 版も学ぶのか

実務のアプリはほぼフレームワーク上で動きます。そして **実際にハマるのは SDK 呼び出し
ではなく「状態の配り方」**のほうです:

- ユーザー情報をアプリの**あちこちの画面で共有**したい → カスタムフック `useAuth()`
  や Context にまとめる（部品化）。Vanilla のようにグローバル変数で持つと破綻しやすい。
- **リロード直後のチラつき**を防ぎたい → `loading` フラグ。
- コンポーネントが**消えるときにリスナーを解除**したい → `useEffect` の cleanup。

これらは「React で Auth を“ちゃんと”使う」ための定石です。Vanilla で本質を、
React で実戦の作法を —— という二段構えにしている理由がここにあります。

---

## 3. ログインの一連の流れ（シーケンス）

「Google でログイン」を押したときの流れを通しで見てみましょう。

```
1. ユーザー   : 「Google でログイン」クリック
2. SignIn.tsx : run(signInWithGoogle) を実行
3. auth.ts    : signInWithPopup(auth, provider) → ポップアップが開く
4. ユーザー   : Google アカウントを選択
5. Firebase   : 認証成功、内部状態を「ログイン済み」に更新
6. useAuth.ts : onAuthStateChanged のコールバックが発火（user を受け取る）
7. useAuth.ts : setUser(user) → React 再レンダリング
8. App.tsx    : user が truthy になり <Profile /> を表示
```

`2→3` でやっているのは「お願い」だけ。実際に画面が変わるのは `6→8`、つまり
**別の場所（リスナー）が反応した結果**である、という非同期の流れがキモです。

---

## 4. つまずきポイント早見表

| 症状 | 意味・対処 |
|---|---|
| `auth/operation-not-allowed`, `accounts:signUp 400` | その認証方法が Console で無効。Authentication > Sign-in method で有効化 |
| `auth/invalid-credential` | メール/パスワードが違う、またはユーザーが存在しない |
| `auth/email-already-in-use` | 新規登録で既存メールを使った |
| `auth/weak-password` | パスワードが 6 文字未満 |
| `Cross-Origin-Opener-Policy ... window.closed` | Google ポップアップの**無害な警告**。`vite.config.ts` の COOP ヘッダで抑制済み |
| リロードでログイン画面が一瞬チラつく | `loading` 判定を忘れている（このサンプルは対策済み）|

---

## 5. Exercise（機能拡張で手を動かす）

難易度順に並べています。**まずは自力で、詰まったらヒントとAPIを参照**してください。
各 Exercise は独立しているので、好きなものから挑戦できます。

### ⭐ Lv0. Vanilla 版で「発火タイミング」を観察する（まずこれ）

**課題**: `vanilla/index.html` を動かし、`onAuthStateChanged` がいつ呼ばれるかを
自分の目で確かめる。

- 触るファイル: `vanilla/index.html`
- 手順:
  1. `npx serve vanilla` で開く。
  2. `onAuthStateChanged` のコールバック先頭に
     `console.log('auth 状態変化:', user)` を 1 行足す。
  3. DevTools のコンソールを見ながら、**①ページ読み込み時 ②ログイン時
     ③ログアウト時 ④リロード時** にそれぞれログが出るのを確認する。
- 学び: 「ログイン操作」と「画面更新」が**別のタイミング**で起きていること、
  リロードしてもログイン状態が**復元**されること（＝状態は Firebase が持っている）
  を体感する。これが 0 章の「一方向の流れ」の実物です。

### ⭐ Lv1. プロフィールに項目を追加する

**課題**: ログイン後の画面に「アカウント作成日時」と「プロフィール画像」を表示する。

- 触るファイル: `src/components/Profile.tsx`
- ヒント: `user.metadata.creationTime`（作成日時の文字列）、`user.photoURL`
  （画像 URL。Google ログインなら入っている。無ければ `null`）。
- 画像は `{user.photoURL && <img src={user.photoURL} width={64} />}` のように。

<details>
<summary>解答例</summary>

```tsx
<dt>作成日時</dt>
<dd>{user.metadata.creationTime ?? '(不明)'}</dd>

{user.photoURL && (
  <>
    <dt>画像</dt>
    <dd><img src={user.photoURL} width={48} style={{ borderRadius: '50%' }} /></dd>
  </>
)}
```
</details>

### ⭐ Lv2. エラーメッセージを日本語にする

**課題**: 今は Firebase の英語メッセージがそのまま出る。`error.code` を見て
日本語に変換する。

- 触るファイル: `src/components/SignIn.tsx` の `run` 関数
- ヒント: Firebase のエラーは `FirebaseError` 型で `code`（例 `auth/invalid-credential`）
  を持つ。`import { FirebaseError } from 'firebase/app'` して判定。

<details>
<summary>解答例</summary>

```ts
import { FirebaseError } from 'firebase/app';

const messages: Record<string, string> = {
  'auth/invalid-credential': 'メールアドレスかパスワードが違います',
  'auth/email-already-in-use': 'このメールアドレスは既に登録済みです',
  'auth/weak-password': 'パスワードは6文字以上にしてください',
};

} catch (e) {
  if (e instanceof FirebaseError) {
    setError(messages[e.code] ?? e.message);
  } else {
    setError(String(e));
  }
}
```
</details>

### ⭐⭐ Lv3. パスワードリセット機能を追加する

**課題**: ログインフォームに「パスワードを忘れた方」リンクを足し、入力中のメール宛に
リセットメールを送る。

- 触るファイル: `src/auth.ts`（関数追加）+ `src/components/SignIn.tsx`（ボタン追加）
- ヒント: `sendPasswordResetEmail(auth, email)` を使う。`firebase/auth` から import。

<details>
<summary>解答例</summary>

```ts
// auth.ts
import { sendPasswordResetEmail } from 'firebase/auth';
export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}
```
```tsx
// SignIn.tsx（フォームの下あたり）
<button type="button" onClick={() => run(async () => {
  await resetPassword(email);
  alert('リセットメールを送りました');
})}>
  パスワードを忘れた方
</button>
```
</details>

### ⭐⭐ Lv4. 新規登録時に「表示名」を設定する

**課題**: メール新規登録のときに「名前」入力欄を足し、作成後にその名前を
`displayName` として保存する（今は Email 登録だと表示名が空）。

- 触るファイル: `src/auth.ts` + `src/components/SignIn.tsx`
- ヒント: 作成は Promise を返すので、その結果 `userCredential.user` に対して
  `updateProfile(user, { displayName })` を呼ぶ。

<details>
<summary>解答例</summary>

```ts
// auth.ts
import { updateProfile } from 'firebase/auth';
export async function signUpWithEmail(email: string, password: string, name: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  return cred;
}
```
SignIn 側で `name` の `useState` と入力欄（新規登録モードのときだけ表示）を追加。
</details>

### ⭐⭐ Lv5. ログイン中はボタンを無効化（多重送信防止）

**課題**: 処理中（Promise 解決待ち）はボタンを `disabled` にし、「処理中…」表示にする。

- 触るファイル: `src/components/SignIn.tsx`
- ヒント: `const [busy, setBusy] = useState(false)` を足し、`run` の中で
  `setBusy(true)` → `finally { setBusy(false) }`。各 `<button>` に `disabled={busy}`。

### ⭐⭐⭐ Lv6. 新しいプロバイダ（GitHub など）を追加する

**課題**: Google に加えて GitHub ログインを追加する。

- 触る場所: Firebase Console（GitHub 有効化 + OAuth アプリ登録）+ `src/auth.ts`
  + `src/components/SignIn.tsx`
- ヒント: コードは Google とほぼ同じ。`GithubAuthProvider` を使う。
  Console 側で GitHub の Client ID / Secret 登録が必要（GitHub の
  Developer settings で OAuth App を作る）。

<details>
<summary>解答例（コード部分）</summary>

```ts
// auth.ts
import { GithubAuthProvider } from 'firebase/auth';
export function signInWithGithub() {
  return signInWithPopup(auth, new GithubAuthProvider());
}
```
</details>

### ⭐⭐⭐ Lv7. ログイン状態の保存方法を変える（Persistence）

**課題**: デフォルトはブラウザを閉じてもログインが残る（`localStorage`）。これを
「タブを閉じたらログアウト」（`session`）に変えてみる。

- 触るファイル: `src/firebase.ts`
- ヒント: `setPersistence(auth, browserSessionPersistence)` を初期化後に呼ぶ。
  `inMemoryPersistence`（リロードで即ログアウト）も試すと挙動の違いが分かる。

<details>
<summary>解答例</summary>

```ts
import { setPersistence, browserSessionPersistence } from 'firebase/auth';
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);
```
</details>

### ⭐⭐⭐⭐ Lv8. 匿名アカウントを正式アカウントに「昇格」させる

**課題**: 匿名でログイン → そのまま Email/Google アカウントに紐付けて、UID を
維持したまま正式ユーザーにする（ゲスト→会員化の定番パターン）。

- 触る場所: `src/auth.ts` + UI
- ヒント: `linkWithPopup(auth.currentUser, new GoogleAuthProvider())` や
  `linkWithCredential` を使う。`auth.currentUser.isAnonymous` が true のときだけ
  「アカウントを作成して保存」ボタンを出すと自然。
- 学び: 別々にログインすると UID は変わるが、`link...` は **同じ UID を保ったまま**
  認証方法を追加できる、という違いを体感するのが目的。

---

## 6. もっと学ぶなら

- 公式: [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth/web/start?hl=ja)
- ベースにした Codelab: [ウェブで Firebase を使ってみる](https://firebase.google.com/codelabs/firebase-get-to-know-web?hl=ja#0)
- 次のステップ案: ログイン必須ページの保護（ルーティング）、Firestore と組み合わせて
  「ログインユーザーだけがデータを読み書きできる」セキュリティルールを書く、など。
