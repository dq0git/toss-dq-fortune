import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait';
import { graniteEvent, Analytics } from '@apps-in-toss/web-framework';
// Initialize Firebase Analytics
import './firebase/init';
import { initializeAnalytics, trackClickEvent } from './firebase/analytics';

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

// Firebase Analytics 초기화 (환경 설정 포함)
initializeAnalytics();

// 네비게이션바 공유 버튼 이벤트 추적
graniteEvent.addEventListener('shareEvent', {
  onEvent: (data) => {
    console.log('📤 [네비게이션바] 공유 버튼 클릭:', data);
    // Firebase Analytics로 공유 이벤트 추적
    trackClickEvent({
      event_name: 'navigation_share_clicked',
      share_data: data || {}
    });
  },
  onError: (error) => {
    console.error('❌ [네비게이션바] 공유 이벤트 오류:', error);
  },
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
