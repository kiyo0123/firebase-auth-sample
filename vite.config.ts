import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Google ログイン (signInWithPopup) のとき、Firebase はポップアップが
    // 閉じたかを window.closed で監視します。最近のブラウザは既定の COOP で
    // この読み取りをブロックし「Cross-Origin-Opener-Policy ... window.closed」
    // という警告を出します（ログイン自体は成功する無害な警告）。
    // ポップアップへの参照を許可する same-origin-allow-popups を指定して抑制します。
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
});
