// Firebase の初期化はアプリ全体で 1 回だけ。
// ここで作った `auth` インスタンスを各所から import して使い回します。
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// 設定値は .env から読み込む（vite-env.d.ts で型付け済み）。
// 値の入れ方は .env.example を参照。
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Firebase Authentication のエントリポイント。
export const auth = getAuth(app);
