import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// 레포지토리 이름이 'my-react-app'이라면 '/my-react-app/'으로 설정
const repoName = 'toss-dq-fortune'; // 이 부분을 수정하세요!

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`,
  server: {
    port: 3000,
    open: true
  }
})
