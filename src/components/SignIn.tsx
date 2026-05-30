// 未ログイン時の画面。3 つの認証方法を試せる。
//   1. Email / Password（新規作成 と ログインをタブで切り替え）
//   2. Google サインイン
//   3. 匿名認証
import { useState, type FormEvent } from 'react';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInAsGuest,
} from '../auth';

type Mode = 'signin' | 'signup';

export default function SignIn() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 認証処理を実行し、Firebase が投げるエラーを画面に出す共通ハンドラ。
  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      // 成功すると onAuthStateChanged が発火し、App が Profile に切り替わる。
    } catch (e) {
      // Firebase のエラーは e.code（例: auth/invalid-credential）に種類が入る。
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    run(() =>
      mode === 'signup'
        ? signUpWithEmail(email, password)
        : signInWithEmail(email, password),
    );
  }

  return (
    <div className="card">
      <div className="tabs">
        <button
          className={mode === 'signin' ? 'tab active' : 'tab'}
          onClick={() => setMode('signin')}
        >
          ログイン
        </button>
        <button
          className={mode === 'signup' ? 'tab active' : 'tab'}
          onClick={() => setMode('signup')}
        >
          新規登録
        </button>
      </div>

      <form onSubmit={handleEmailSubmit}>
        <label>
          メールアドレス
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          パスワード
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="primary" type="submit">
          {mode === 'signup' ? 'アカウント作成' : 'ログイン'}
        </button>
      </form>

      <div className="divider">または</div>

      <button className="secondary" onClick={() => run(signInWithGoogle)}>
        Google でログイン
      </button>
      <button className="secondary" onClick={() => run(signInAsGuest)}>
        匿名でログイン
      </button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
