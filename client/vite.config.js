import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Allow only the exact ngrok hostname you control for this temporary dev session.
  // Do not set allowedHosts: true; that disables Vite's host-header protection.
  const env = loadEnv(mode, process.cwd(), '');
  const ngrokHost = String(env.NGROK_HOST || '').trim().toLowerCase();

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT || 5173),
      ...(ngrokHost ? { allowedHosts: [ngrokHost] } : {}),
    },
  };
});
