import { logEvent, Analytics as FirebaseAnalytics } from 'firebase/analytics';
import { analytics } from './init';

/**
 * AppsInToss Analytics.click()과 Firebase Analytics를 연동하는 함수
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  try {
    if (analytics) {
      logEvent(analytics, eventName, params || {});
    }
  } catch (error) {
    console.error('Firebase Analytics 이벤트 로깅 실패:', error);
  }
};

/**
 * AppsInToss Analytics.click() 이벤트를 Firebase Analytics로 전송
 */
export const trackClickEvent = (data: {
  event_name: string;
  [key: string]: any;
}) => {
  try {
    if (analytics) {
      // AppsInToss의 event_name을 Firebase의 이벤트 이름으로 사용
      const { event_name, ...params } = data;
      logEvent(analytics, event_name, params);
    }
  } catch (error) {
    console.error('Firebase Analytics 클릭 이벤트 로깅 실패:', error);
  }
};

