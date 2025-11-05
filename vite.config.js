import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// 레포지토리 이름이 'my-react-app'이라면 '/my-react-app/'으로 설정
const repoName = 'toss-dq-fortune'; // 이 부분을 수정하세요!

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    open: true
  },
  optimizeDeps: {
    exclude: ['@swc/core', '@swc/wasm', '@swc/core-darwin-arm64']
  },
  build: {
    rollupOptions: {
      external: id => id.includes('@swc/') || id.endsWith('.node')
    }
  }
})
