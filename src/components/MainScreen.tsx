import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react'
import { useNavigate, useLocation } from '../router.gen.ts';
import { generateHapticFeedback, Analytics, graniteEvent, closeView } from '@apps-in-toss/web-framework';
import { ListRow, Button, Top, Asset, Badge } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import './MainScreen.css';

// 전역 변수로 리스너 관리
let globalBackEventUnsubscribe: (() => void) | null = null;

const MainScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [guardianCard, setGuardianCard] = useState<{
    type: string;
    card: { card: { card_name_kr: string; tarot_id: number }; powerLevel?: number };
  } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const showExitConfirmRef = useRef(false);
  const isMainScreenRef = useRef(true);
  const handleBackActionRef = useRef<() => boolean | void>();
  const setShowExitConfirmRef = useRef<((value: boolean) => void) | null>(null);
  const navigateRef = useRef<((path: string, options?: { replace?: boolean }) => void) | null>(null);
  const locationRef = useRef(location);

  // showExitConfirm 상태와 ref 동기화
  useEffect(() => {
    showExitConfirmRef.current = showExitConfirm;
  }, [showExitConfirm]);

  // setShowExitConfirm, navigate, location을 ref에 저장
  useEffect(() => {
    setShowExitConfirmRef.current = setShowExitConfirm;
    navigateRef.current = navigate;
    locationRef.current = location;
  }, [navigate, location]);

  // 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 문제 방지)
  const getDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 공통 뒤로가기 핸들러 - 네비게이션바와 안드로이드 뒤로가기 모두 동일하게 처리
  const handleBackAction = useCallback(() => {
    console.log('🔙 [handleBackAction] 함수 호출됨');
    console.log('🔙 [handleBackAction] location.pathname:', location.pathname);
    console.log('🔙 [handleBackAction] window.location.pathname:', window.location.pathname);
    
    // 메인 화면이 아니면 무시 (안전장치)
    // location.pathname과 window.location.pathname 모두 체크
    const isMainPage = location.pathname === '/' || window.location.pathname === '/';
    console.log('🔙 [handleBackAction] isMainPage:', isMainPage);
    
    if (!isMainPage) {
      console.log('🔙 [handleBackAction] 메인 화면이 아님, false 반환');
      return false;
    }
    
    // 이미 확인 다이얼로그가 열려있으면 무시
    if (showExitConfirmRef.current) {
      console.log('🔙 [handleBackAction] 확인 다이얼로그가 이미 열려있음, true 반환');
      return true; // 기본 동작 방지
    }
    
    // 히스토리 상태를 즉시 메인으로 강제 고정 (이전 히스토리 항목으로 이동 방지)
    try {
      console.log('🔙 [handleBackAction] 히스토리 초기화 시작');
      window.history.replaceState({ page: 'main', timestamp: Date.now(), preventBack: true }, '', '/');
      navigate('/', { replace: true });
      console.log('🔙 [handleBackAction] 히스토리 초기화 완료');
    } catch (error) {
      console.error('🔙 [handleBackAction] 히스토리 초기화 오류:', error);
    }
    
    // 확인 다이얼로그 표시
    console.log('🔙 [handleBackAction] 종료 확인 다이얼로그 표시 시작');
    setShowExitConfirm(true);
    console.log('🔙 [handleBackAction] 종료 확인 다이얼로그 표시 완료 (setShowExitConfirm(true) 호출됨)');
    console.log('🔙 [handleBackAction] true 반환하여 앱 종료 방지');
    
    // 기본 동작 방지 - 항상 true 반환하여 앱 종료를 막음
    return true;
  }, [location.pathname, navigate]);

  // handleBackAction ref 동기화
  useEffect(() => {
    handleBackActionRef.current = handleBackAction;
  }, [handleBackAction]);

  // 뒤로가기 이벤트 감지 - 컴포넌트 마운트 시 즉시 등록
  // 앱인토스 라이브러리 1.5.1 최신 버전에 맞춰 개선
  useLayoutEffect(() => {
    console.log('🔙 [메인화면] 뒤로가기 이벤트 리스너 등록 시작');
    
    // 기존 리스너가 있으면 제거
    if (globalBackEventUnsubscribe) {
      console.log('🔙 [메인화면] 기존 리스너 제거');
      globalBackEventUnsubscribe();
      globalBackEventUnsubscribe = null;
    }
    
    // backEvent 리스너 등록 - 앱인토스 라이브러리 1.5.1 최신 버전
    const unsubscription = graniteEvent.addEventListener('backEvent', {
      onEvent: () => {
        console.log('========================================');
        console.log('🔙 [메인화면] 뒤로가기 이벤트 발생!');
        console.log('🔙 [메인화면] 발생 시간:', new Date().toISOString());
        console.log('🔙 [메인화면] 현재 window.location.pathname:', window.location.pathname);
        console.log('========================================');
        
        // 메인 화면이 아니면 무시
        if (window.location.pathname !== '/') {
          console.log('🔙 [메인화면] 메인 화면이 아님, false 반환');
          return false;
        }
        
        console.log('🔙 [메인화면] 메인 화면 확인됨, handleBackAction 호출');
        
        // handleBackAction을 직접 호출 (ref를 통해 최신 함수 사용)
        if (handleBackActionRef.current) {
          const result = handleBackActionRef.current();
          console.log('🔙 [메인화면] handleBackAction 결과:', result);
          console.log('========================================');
          return result;
        }
        
        // handleBackAction이 아직 준비되지 않았을 때 기본 처리
        console.log('🔙 [메인화면] handleBackActionRef가 없음, 기본 처리');
        
        // 이미 확인 다이얼로그가 열려있으면 무시
        if (showExitConfirmRef.current) {
          console.log('🔙 [메인화면] 확인 다이얼로그가 이미 열려있음, true 반환');
          return true;
        }
        
        // 히스토리 초기화
        try {
          window.history.replaceState({ page: 'main', timestamp: Date.now(), preventBack: true }, '', '/');
          if (navigateRef.current) {
            navigateRef.current('/', { replace: true });
          }
        } catch (error) {
          console.error('🔙 [메인화면] 히스토리 초기화 오류:', error);
        }
        
        // 확인 다이얼로그 표시
        console.log('🔙 [메인화면] 종료 확인 다이얼로그 표시');
        if (setShowExitConfirmRef.current) {
          setShowExitConfirmRef.current(true);
          console.log('🔙 [메인화면] setShowExitConfirm(true) 호출 완료');
        } else {
          console.error('🔙 [메인화면] setShowExitConfirmRef.current가 null입니다!');
        }
        
        console.log('🔙 [메인화면] true 반환하여 앱 종료 방지');
        console.log('========================================');
        
        // 반드시 true를 반환하여 앱 종료를 막음
        return true;
      },
      onError: (error) => {
        console.error('❌ [메인화면] 뒤로가기 이벤트 처리 오류:', error);
      },
    });
    
    // 전역 변수에 저장
    globalBackEventUnsubscribe = unsubscription;
    
    console.log('🔙 [메인화면] backEvent 리스너 등록 완료');
    
    return () => {
      console.log('🧹 [메인화면] backEvent 리스너 제거');
      if (globalBackEventUnsubscribe) {
        globalBackEventUnsubscribe();
        globalBackEventUnsubscribe = null;
      }
    };
  }, []); // 의존성 없이 마운트 시 한 번만 등록

  // 메인 화면에 돌아올 때마다 히스토리 리셋 및 이벤트 재등록
  useEffect(() => {
    // 메인 화면에 있을 때만 처리
    if (location.pathname !== '/') {
      isMainScreenRef.current = false;
      return;
    }
    
    isMainScreenRef.current = true;
    console.log('🏠 [메인화면] 메인 화면 진입/재진입 - 히스토리 완전 초기화');
    
    // backEvent 리스너는 첫 번째 useEffect에서 이미 등록되어 있음
    // 여기서는 히스토리 초기화만 수행
    
    // 즉시 히스토리 초기화 (다른 작업보다 먼저 실행)
    // 1단계: 브라우저 히스토리를 메인으로 완전히 초기화
    window.history.replaceState({ page: 'main', index: 0, timestamp: Date.now(), preventBack: true }, '', '/');
    
    // 2단계: React Router의 히스토리도 replace로 초기화
    navigate('/', { replace: true });
    
    // 메인화면 진입 시 히스토리 완전히 초기화 (추가 보강)
    const resetHistoryCompletely = () => {
      try {
        // 메인 화면에 있는지 다시 확인 (다른 페이지로 이동 중일 수 있음)
        if (location.pathname !== '/') {
          return;
        }
        
        // 브라우저 히스토리를 메인으로 완전히 초기화
        window.history.replaceState({ page: 'main', index: 0, timestamp: Date.now(), preventBack: true }, '', '/');
        
        // React Router의 히스토리도 replace로 초기화
        navigate('/', { replace: true });
      } catch (error) {
        console.error('🏠 [메인화면] 히스토리 초기화 중 오류:', error);
      }
    };
    
    // 추가로 한 번 더 확실히 초기화 (비동기 처리)
    setTimeout(() => {
      resetHistoryCompletely();
      console.log('🏠 [메인화면] 히스토리 완전 초기화 완료');
    }, 0);
    
    // 짧은 지연 후 한 번 더 확인하여 확실히 초기화
    setTimeout(() => {
      resetHistoryCompletely();
    }, 50);
    
    console.log('🏠 [메인화면] 히스토리 초기화 프로세스 시작');
    
    // 추가적으로 브라우저 뒤로가기 완전 차단 (메인 화면에서는 뒤로가기 시 확인 다이얼로그 표시)
    const handlePopState = (e: PopStateEvent) => {
      console.log('🔙 [메인화면] popstate 이벤트 발생', e, '현재 pathname:', location.pathname, 'state:', e.state);
      
      // 메인 화면이 아니면 무시
      if (!isMainScreenRef.current || location.pathname !== '/') {
        console.log('🔙 [메인화면] popstate 무시 - 메인 화면이 아님');
        return;
      }
      
      // 메인 화면에서는 뒤로가기를 완전히 막음
      // 이전 히스토리 상태가 있으면 무시하고 메인 화면으로 고정
      const currentState = window.history.state;
      console.log('🔙 [메인화면] 현재 히스토리 상태:', currentState);
      
      // 히스토리 상태가 메인이 아니거나, popstate가 발생한 경우
      // 즉시 히스토리를 메인 화면으로 되돌리고 확인 다이얼로그 표시
      
      // 1. 즉시 히스토리를 메인으로 push (뒤로가기 취소)
      window.history.pushState({ page: 'main', timestamp: Date.now(), preventBack: true }, '', '/');
      
      // 2. 짧은 지연 후 replace로 확실히 고정
      setTimeout(() => {
        window.history.replaceState({ page: 'main', timestamp: Date.now(), preventBack: true }, '', '/');
        navigate('/', { replace: true });
        console.log('🔙 [메인화면] 히스토리 강제 리셋 완료');
      }, 0);
      
      // 3. 확인 다이얼로그 표시
      handleBackAction();
    };
    
    // popstate 이벤트 리스너 추가 (capture phase에서도 처리)
    window.addEventListener('popstate', handlePopState, true);
    
    // 추가 안전장치: 히스토리 모니터링 및 자동 리셋
    // 주기적으로 히스토리를 확인하고 메인 화면에서 벗어나려 하면 리셋
    // 단, 의도적인 페이지 이동은 허용해야 하므로 pathname 체크는 제거
    const historyMonitor = setInterval(() => {
      // 메인 화면이 아니면 모니터링 중지
      if (location.pathname !== '/') {
        return;
      }
      
      // 히스토리 상태가 메인이 아니면 리셋 (단, pathname은 체크하지 않음 - 의도적인 이동 허용)
      const currentState = window.history.state;
      if (currentState && currentState.page && currentState.page !== 'main' && currentState.page !== null) {
        console.log('🔙 [메인화면] 히스토리 상태 이상 감지, 자동 리셋:', currentState);
        // 메인 화면에 있는지 다시 확인
        if (location.pathname === '/') {
          window.history.replaceState({ page: 'main', timestamp: Date.now(), preventBack: true }, '', '/');
          navigate('/', { replace: true });
        }
      }
    }, 300); // 300ms마다 체크

    // 자정 초기화 체크
    const checkDateReset = () => {
      const today = getDateString(new Date());
      const lastCheck = localStorage.getItem('lastDateCheck');
      
      if (lastCheck !== today) {
        localStorage.setItem('lastDateCheck', today);
        // 오래된 메인 수호카드 삭제
        localStorage.removeItem('mainGuardianCard');
      }
    };

    // 저장된 수호카드 불러오기 (메인 화면에 표시할 카드만)
    // "이 카드로 결정하기"를 누른 카드만 표시됨
    try {
      checkDateReset();
      const saved = localStorage.getItem('mainGuardianCard');
      if (saved) {
        const data = JSON.parse(saved);
        const today = getDateString(new Date());
        if (data.date === today) {
          setGuardianCard(data);
        } else {
          // 날짜가 다르면 삭제
          localStorage.removeItem('mainGuardianCard');
        }
      }
    } catch (e) {
      console.error('Failed to load guardian card:', e);
      localStorage.removeItem('mainGuardianCard');
    }

    // cleanup: 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      console.log('🧹 [메인화면] cleanup - 이벤트 리스너 제거');
      window.removeEventListener('popstate', handlePopState, true);
      clearInterval(historyMonitor);
    };
  }, [location.pathname, navigate, handleBackAction]); // location.pathname이 변경될 때마다 재실행

  // 메인 화면에서 다른 화면으로 의도치 않은 이동 차단
  useEffect(() => {
    // 메인 화면에서 뒤로가기로 인해 다른 화면으로 이동하려 할 때 차단
    // 단, 의도적인 페이지 이동은 허용해야 함
    if (isMainScreenRef.current && location.pathname === '/') {
      // 메인 화면에 있을 때는 히스토리 상태를 계속 확인하고 리셋
      const checkAndReset = () => {
        // 메인 화면에 있는지 다시 확인 (다른 페이지로 이동 중일 수 있음)
        if (location.pathname !== '/') {
          return;
        }
        
        // 히스토리 상태 확인
        const currentState = window.history.state;
        if (currentState && currentState.page && currentState.page !== 'main' && currentState.page !== null) {
          console.log('🔙 [메인화면] 히스토리 상태 이상, 리셋:', currentState);
          // 메인 화면에 있는지 다시 확인
          if (location.pathname === '/') {
            window.history.replaceState({ page: 'main', timestamp: Date.now(), preventBack: true }, '', '/');
            navigate('/', { replace: true });
          }
        }
      };
      
      // 즉시 체크
      checkAndReset();
      
      // 주기적으로 체크 (빠른 반응)
      const interval = setInterval(checkAndReset, 100);
      
      return () => clearInterval(interval);
    }
  }, [location.pathname, navigate]);

  const getTypeName = (type: string) => {
    const names: Record<string, string> = { love: '애정운', career: '성공운', money: '금전운' };
    return names[type] || '';
  };

  const renderPowerLevel = (level: number = 2) => {
    return '⭐'.repeat(level) + '☆'.repeat(5 - level);
  };

  const handleExitConfirm = () => {
    setShowExitConfirm(false);
    closeView();
  };

  const handleExitCancel = () => {
    setShowExitConfirm(false);
    // 취소 시에도 히스토리를 메인으로 확실히 고정
    window.history.replaceState({ page: 'main', timestamp: Date.now(), preventBack: true }, '', '/');
    navigate('/', { replace: true });
  };

  return (
    <div className="main-screen">
      <div className="main-container">


        <header className="main-header">
           <Top
            title={
              <Top.TitleParagraph size={22} color={adaptive.grey900} style={{ textAlign: 'left' }}>
                타로카드로 운세를 풀어 드려요.
              </Top.TitleParagraph>
            }
            upper={
            <Top.UpperAssetContent
              content={
                <Asset.Icon
                  frameShape={Asset.frameShape.CleanW60}
                  name="icon-crystal-ball"
                  aria-hidden={true}
                />
              }
            />
          }
          />
        </header>

        <div className="main-options">
          <ListRow
            // left="🔮"
            left={<ListRow.AssetIcon variant="fill" shape="circle-masking" name="icon-u1FA84" />}
            contents={<ListRow.Texts type="2RowTypeA" top="주제별 운세와 조언 받기" topProps={{ color: adaptive.grey800, fontWeight: `bold` }} bottom="궁금한 주제의 운세와 조언을 받아요" bottomProps={{ color: adaptive.grey600 }}/>}
            arrowType="right"
            onClick={() => {
              Analytics.click({
                event_name: 'main_topic_click'
              });
              navigate('/topic-selection');
              generateHapticFeedback({ type: "tickWeak" });
            }}
            verticalPadding="small"
          />

          <ListRow
            // left="✨"
            left={<ListRow.AssetIcon variant="fill" shape="circle-masking" name="icon-graph-line-up" />}
            contents={<ListRow.Texts type="2RowTypeA" top="오늘의 운세흐름 보기" topProps={{ color: adaptive.grey800, fontWeight: `bold` }} bottom="하루의 전반적인 흐름을 확인해요" bottomProps={{ color: adaptive.grey600 }}/>} 
            arrowType="right"
            onClick={() => {
              Analytics.click({
                event_name: 'main_daily_card_click'
              });
              navigate('/daily-card');
            }}
            verticalPadding="small"
          />

          <ListRow
            // left="🛡️"
            left={<ListRow.AssetIcon variant="fill" shape="circle-masking" name="icon-shield-blue" />}
            contents={
              <ListRow.Texts 
                type="2RowTypeA" 
                top="나의 수호카드 찾기" 
                topProps={{ color: adaptive.grey800, fontWeight: `bold` }} 
                bottom={
                  guardianCard 
                    ? `오늘의 ${getTypeName(guardianCard.type)} 수호카드: ${guardianCard.card.card.card_name_kr} ${renderPowerLevel(guardianCard.card.powerLevel)}`
                    : "수호카드를 찾고 운을 보완해요"
                }
                bottomProps={{ color: adaptive.grey600 }}
              />
            } 
            arrowType="right"
            onClick={() => {
              Analytics.click({
                event_name: 'main_guardian_card_click'
              });
              navigate('/tarot-talisman');
            }}
            verticalPadding="small"
          />
        </div>
      </div>

      {showExitConfirm && (
        <div className="exit-confirm-overlay" onClick={handleExitCancel}>
          <div className="exit-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exit-confirm-title">점술가를 종료할까요?</div>
            <div className="exit-confirm-content">
            좋은 기운만 가져가세요.
            </div>
            <div className="exit-confirm-buttons">
              <button className="exit-confirm-button cancel" onClick={handleExitCancel}>
                취소
              </button>
              <button className="exit-confirm-button confirm" onClick={handleExitConfirm}>
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainScreen
