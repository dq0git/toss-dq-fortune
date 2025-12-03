import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';

// 전역 에러 핸들러 - 권한 관련 에러 무시
window.addEventListener('error', (event) => {
  // "권한목록을 가져오는데 실패했어요" 에러는 무시
  if (event.message && event.message.includes('권한목록을 가져오는데 실패')) {
    console.warn('⚠️ [전역에러핸들러] 권한목록 조회 실패 에러 무시:', event.message);
    event.preventDefault();
    return false;
  }
});

// Promise rejection 에러 핸들러
window.addEventListener('unhandledrejection', (event) => {
  // "권한목록을 가져오는데 실패했어요" 에러는 무시
  if (event.reason && typeof event.reason === 'string' && event.reason.includes('권한목록을 가져오는데 실패')) {
    console.warn('⚠️ [전역에러핸들러] 권한목록 조회 실패 Promise rejection 무시:', event.reason);
    event.preventDefault();
    return false;
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TDSMobileAITProvider>
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  </TDSMobileAITProvider>
)
