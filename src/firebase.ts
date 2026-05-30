// Firebase の初期化はアプリ全体で 1 回だけ。
// ここで作った `auth` インスタンスを各所から import して使い回します。
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// 設定値は .env から読み込みます（config をリポジトリにコミットしない運用）。
// .env.example をコピーして .env を作り、Firebase Console の値を入れてください。
// （Web の apiKey 等は秘密情報ではありませんが、リポジトリには含めない方針です）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Firebase Authentication のエントリポイント。
export const auth = getAuth(app);
