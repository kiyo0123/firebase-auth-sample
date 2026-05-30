// Firebase Auth SDK の薄いラッパー。
// 「どの関数がどの認証方法に対応するか」をここに集約しておくと、
// UI 側（コンポーネント）は呼ぶだけで済み、見通しが良くなります。
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';

// --- Email / Password ---

// 新規アカウント作成。
export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// 既存アカウントでログイン。
export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// --- Google (OAuth) ---

// ポップアップで Google アカウントを使ってログイン。
export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

// --- 匿名認証 ---

// アカウント不要の一時ユーザーを作成。
export function signInAsGuest() {
  return signInAnonymously(auth);
}

// --- 共通 ---

// ログアウト。
export function logout() {
  return signOut(auth);
}
