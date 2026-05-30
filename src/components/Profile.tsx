// ログイン後の画面。User オブジェクトの中身を表示し、ログアウトできる。
import { type User } from 'firebase/auth';
import { logout } from '../auth';

export default function Profile({ user }: { user: User }) {
  return (
    <div className="card">
      <h2>ログイン中</h2>

      <dl className="info">
        <dt>UID</dt>
        <dd>{user.uid}</dd>

        <dt>メール</dt>
        <dd>{user.email ?? '(なし)'}</dd>

        <dt>表示名</dt>
        <dd>{user.displayName ?? '(なし)'}</dd>

        <dt>匿名ユーザー</dt>
        <dd>{user.isAnonymous ? 'はい' : 'いいえ'}</dd>
      </dl>

      <button className="primary" onClick={() => logout()}>
        ログアウト
      </button>
    </div>
  );
}
