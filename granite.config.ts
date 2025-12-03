import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'dq-fortune',
  brand: {
    displayName: '점술가', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: 'https://static.toss.im/appsintoss/4877/bd67c05f-a68d-453e-bd23-feb09b8ddf76.png', // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
    bridgeColorMode: 'basic',
  },
  web: {
    host: '192.168.1.253',
    
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [], // 권한은 런타임에 자동으로 처리됨 (필요시 추가)
  outdir: 'dist',
});
