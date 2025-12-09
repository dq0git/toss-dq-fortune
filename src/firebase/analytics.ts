import { logEvent, setUserProperties, Analytics as FirebaseAnalytics } from 'firebase/analytics';
import { analytics } from './init';

// 환경 감지 (개발 모드인지 프로덕션인지)
const getEnvironment = (): 'development' | 'production' => {
  // Vite 개발 모드 감지
  if (import.meta.env.DEV) {
    return 'development';
  }
  // 프로덕션 모드
  return 'production';
};

// Firebase Analytics 초기화 시 환경 설정
export const initializeAnalytics = () => {
  try {
    if (analytics) {
      const environment = getEnvironment();
      // 사용자 속성으로 환경 설정
      setUserProperties(analytics, {
        environment: environment,
        app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      });
      console.log('📊 [Firebase Analytics] 환경 설정:', environment);
    }
  } catch (error) {
    console.error('Firebase Analytics 초기화 실패:', error);
  }
};

/**
 * AppsInToss Analytics.click()과 Firebase Analytics를 연동하는 함수
 */
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  try {
    if (analytics) {
      const environment = getEnvironment();
      logEvent(analytics, eventName, {
        ...params,
        environment: environment,
      });
    }
  } catch (error) {
    console.error('Firebase Analytics 이벤트 로깅 실패:', error);
  }
};

/**
 * AppsInToss Analytics.click() 이벤트를 Firebase Analytics로 전송
 * Realtime Analytics에서 쉽게 구분할 수 있도록 이벤트 이름에 환경 접두사 추가
 */
export const trackClickEvent = (data: {
  event_name: string;
  [key: string]: any;
}) => {
  try {
    if (analytics) {
      const environment = getEnvironment();
      // AppsInToss의 event_name을 Firebase의 이벤트 이름으로 사용
      const { event_name, ...params } = data;
      
      // Realtime Analytics에서 쉽게 구분하기 위해 이벤트 이름에 환경 접두사 추가
      const eventNameWithEnv = environment === 'development' 
        ? `[DEV] ${event_name}` 
        : event_name;
      
      logEvent(analytics, eventNameWithEnv, {
        ...params,
        environment: environment,
      });
    }
  } catch (error) {
    console.error('Firebase Analytics 클릭 이벤트 로깅 실패:', error);
  }
};

