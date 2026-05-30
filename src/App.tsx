// 認証状態によって表示を切り替えるだけのトップレベル。
//   - 読み込み中  -> ローディング表示
//   - 未ログイン  -> SignIn（ログイン用フォーム）
//   - ログイン中  -> Profile（ユーザー情報 + ログアウト）
import { useAuth } from './hooks/useAuth';
import SignIn from './components/SignIn';
import Profile from './components/Profile';

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="container">
      <h1>Firebase Auth Sample</h1>
      {loading ? (
        <p className="muted">読み込み中…</p>
      ) : user ? (
        <Profile user={user} />
      ) : (
        <SignIn />
      )}
    </div>
  );
}
