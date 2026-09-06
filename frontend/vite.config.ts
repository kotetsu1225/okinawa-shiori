import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 開発時は /api を backend(既定 :8088)へプロキシする。
// 本番ビルドでは VITE_API_BASE で API のオリジンを指定する(未指定なら同一オリジン)。
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://localhost:8088',
          changeOrigin: true,
        },
      },
    },
  };
});
