// Firebase の初期化はアプリ全体で 1 回だけ。
// ここで作った `auth` インスタンスを各所から import して使い回します。
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// 設定値は Firebase Console > プロジェクトの設定 > マイアプリ (Web) の
// 「SDK setup and configuration > Config」からコピーして、ここに貼り付けます。
// （Web の apiKey 等は秘密情報ではなく公開前提の識別子なので、コードに直接書いてOK）
// 自分の Firebase プロジェクトで試すときは、下の値を置き換えてください。
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};


const app = initializeApp(firebaseConfig);

// Firebase Authentication のエントリポイント。
export const auth = getAuth(app);
