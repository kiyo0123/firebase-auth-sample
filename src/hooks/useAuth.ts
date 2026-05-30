// 現在ログインしているユーザーを React の状態として購読するフック。
//
// Firebase Auth は onAuthStateChanged で「ログイン状態が変わるたび」に
// コールバックを呼んでくれます。これを React の state に橋渡しするのが役割。
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

export function useAuth() {
  // user: ログイン中なら User、未ログインなら null。
  const [user, setUser] = useState<User | null>(null);
  // loading: 最初の認証状態が確定するまで true（リロード直後など）。
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 購読開始。戻り値の関数を呼ぶと購読解除されるので、
    // cleanup としてそのまま返す。
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}
