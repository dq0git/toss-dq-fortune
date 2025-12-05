import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '../router.gen';
import { useSearchParams } from 'react-router-dom';
import { generateHapticFeedback, GoogleAdMob, Analytics } from '@apps-in-toss/web-framework';
import { trackClickEvent } from '../firebase/analytics';
import { Card } from '../types';
import { tarotAPI } from '../lib/supabase';
import cardsData from '../data/cards_graded.json';
import { Top, ListRow, Badge, Post, useToast, Button } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import TarotCardWithEffects from '../components/TarotCardWithEffects';

type GuardianType = 'love' | 'career' | 'money';

const typeMapping: Record<GuardianType, keyof typeof cardsData> = {
  love: 'love',
  career: 'success',
  money: 'wealth'
};

const TOPIC_LABEL_MAP: Record<GuardianType, string> = {
  love: '애정운',
  career: '성공운',
  money: '금전운',
};

interface Guardian {
  card: Card;
  meaning: string;
  description: string;
  powerLevel?: number; // 수호력 등급 (1-5)
}

const TarotTalisman = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [selectedTopic, setSelectedTopic] = useState<GuardianType | null>(null);
  const [guardianCard, setGuardianCard] = useState<Guardian | null>(null);
  const [hasUsedFreeToday, setHasUsedFreeToday] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [choices, setChoices] = useState<{current: Guardian, new: Guardian} | null>(null);
  const [revealed, setRevealed] = useState([false, false]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Guardian | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);
  const [modalDetails, setModalDetails] = useState<[boolean, boolean]>([false, false]);
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [allGuardianCards, setAllGuardianCards] = useState<Record<GuardianType, Guardian | null>>({
    love: null,
    career: null,
    money: null,
  });
  const [showAllCards, setShowAllCards] = useState(false);
  const [showDetailsAll, setShowDetailsAll] = useState<Record<GuardianType, boolean>>({
    love: false,
    career: false,
    money: false,
  });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalType, setDetailModalType] = useState<GuardianType | null>(null);
  
  // 광고 관련 상태
  const [interstitialAdCleanup, setInterstitialAdCleanup] = useState<(() => void) | null>(null);
  const [interstitialAdLoaded, setInterstitialAdLoaded] = useState(false);
  const [allAdsFailed, setAllAdsFailed] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false); // 광고 로드 중인지 추적

  // 광고 그룹 ID
  const INTERSTITIAL_AD_GROUP_ID = 'ait.live.28c5628c60dd4b31'; // 전면형 광고

  // 다음 광고를 미리 로드하는 함수 (광고 표시 완료 후 호출)
  const loadNextAd = () => {
    if (isLoadingAd) {
      console.log('⏳ [수호카드 광고 테스트] 이미 광고 로드 중입니다.');
      return;
    }

    // 광고 지원 여부 확인
    if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
      console.warn('⚠️ [수호카드 광고 테스트] GoogleAdMob이 지원되지 않는 환경입니다.');
      setAllAdsFailed(true);
      setIsLoadingAd(false);
      return;
    }

    setIsLoadingAd(true);
    setAllAdsFailed(false); // 재시도 시 실패 상태 초기화
    console.log('🔄 [수호카드 광고 테스트] 다음 전면형 광고 로드 시작');

    // 전면형 광고만 로드
    const interstitialCleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: {
        adGroupId: INTERSTITIAL_AD_GROUP_ID,
      },
      onEvent: (interstitialEvent) => {
        console.log('📢 [수호카드 광고 테스트] 다음 전면형 광고 이벤트:', interstitialEvent.type);
        switch (interstitialEvent.type) {
          case 'loaded':
            console.log('✅ [수호카드 광고 테스트] 다음 전면형 광고 로드 성공!');
            setInterstitialAdLoaded(true);
            setIsLoadingAd(false);
            setAllAdsFailed(false);
            break;
          case 'failedToLoad':
            console.error('❌ [수호카드 광고 테스트] 다음 전면형 광고 로드 실패:', interstitialEvent.data);
            setIsLoadingAd(false);
            // 실패해도 계속 시도 가능하도록 allAdsFailed는 설정하지 않음
            // 사용자가 다시 시도할 수 있도록 함
            break;
          default:
            console.log('ℹ️ [수호카드 광고 테스트] 다음 전면형 광고 기타 이벤트:', interstitialEvent.type);
        }
      },
      onError: (interstitialError) => {
        console.error('❌ [수호카드 광고 테스트] 다음 전면형 광고 불러오기 오류:', interstitialError);
        setIsLoadingAd(false);
        // 에러 발생해도 재시도 가능하도록 allAdsFailed는 설정하지 않음
      },
    });
    setInterstitialAdCleanup(() => interstitialCleanup);
  };

  // 모든 주제별 수호카드 불러오기
  const loadAllGuardianCards = useCallback(() => {
    const today = getDateString(new Date());
    const cards: Record<GuardianType, Guardian | null> = {
      love: null,
      career: null,
      money: null,
    };
    
    (['love', 'career', 'money'] as GuardianType[]).forEach((type) => {
      try {
        const saved = localStorage.getItem(`guardianCard_${type}`);
        if (saved) {
          const { card, date } = JSON.parse(saved);
          if (date === today) {
            cards[type] = card;
          } else {
            // 날짜가 다르면 오래된 데이터 삭제
            localStorage.removeItem(`guardianCard_${type}`);
            localStorage.removeItem(`guardianFreeDraw_${type}`);
          }
        }
      } catch (e) {
        console.error(`Failed to load guardian card for ${type}:`, e);
        // 파싱 에러 시 데이터 삭제
        localStorage.removeItem(`guardianCard_${type}`);
        localStorage.removeItem(`guardianFreeDraw_${type}`);
      }
    });
    
    setAllGuardianCards(cards);
    
    // 설정된 카드가 하나라도 있으면 전체 카드 화면 표시
    const hasAnyCard = Object.values(cards).some(card => card !== null);
    setShowAllCards(hasAnyCard);
  }, []);

  // 페이지 로드 시 광고 미리 로드 (전면형 광고만 사용)
  useEffect(() => {
    // 상태 초기화
    setInterstitialAdLoaded(false);
    setAllAdsFailed(false);
    setIsLoadingAd(true);

    console.log('🔮 [수호카드 광고 테스트] 페이지 로드 - 전면형 광고 로드 시작');
    
    // 광고 지원 여부 확인
    if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
      console.warn('⚠️ [수호카드 광고 테스트] GoogleAdMob이 지원되지 않는 환경입니다.');
      setAllAdsFailed(true);
      setIsLoadingAd(false);
      return;
    }

    console.log('✅ [수호카드 광고 테스트] GoogleAdMob 지원됨 - 전면형 광고 로드 시도');

    // 전면형 광고만 로드
    const interstitialCleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: {
        adGroupId: INTERSTITIAL_AD_GROUP_ID,
      },
      onEvent: (interstitialEvent) => {
        console.log('📢 [수호카드 광고 테스트] 전면형 광고 이벤트 발생:', interstitialEvent.type);
        switch (interstitialEvent.type) {
          case 'loaded':
            console.log('✅ [수호카드 광고 테스트] 전면형 광고 로드 성공!', interstitialEvent.data);
            setInterstitialAdLoaded(true);
            setIsLoadingAd(false);
            break;
          case 'failedToLoad':
            console.error('❌ [수호카드 광고 테스트] 전면형 광고 로드 실패:', interstitialEvent.data);
            console.error('❌ [수호카드 광고 테스트] 모든 광고 로드 실패');
            setAllAdsFailed(true);
            setIsLoadingAd(false);
            break;
          default:
            console.log('ℹ️ [수호카드 광고 테스트] 전면형 광고 기타 이벤트:', interstitialEvent.type, interstitialEvent.data);
        }
      },
      onError: (interstitialError) => {
        console.error('❌ [수호카드 광고 테스트] 전면형 광고 불러오기 오류:', interstitialError);
        setAllAdsFailed(true);
        setIsLoadingAd(false);
      },
    });

    setInterstitialAdCleanup(() => interstitialCleanup);
    console.log('🔄 [수호카드 광고 테스트] 전면형 광고 로드 함수 실행 완료');

    // 컴포넌트 언마운트 시 cleanup
    return () => {
      console.log('🧹 [수호카드 광고 테스트] 컴포넌트 언마운트 - 광고 cleanup 실행');
      if (interstitialAdCleanup) interstitialAdCleanup();
    };
  }, []);

  // URL 파라미터에서 주제 확인
  useEffect(() => {
    const topicParam = searchParams.get('topic') as GuardianType | null;
    if (topicParam && (topicParam === 'love' || topicParam === 'career' || topicParam === 'money')) {
      // 주제가 변경되면 이전 주제의 상태를 초기화
      if (selectedTopic !== topicParam) {
        setGuardianCard(null);
        setIsCardRevealed(false);
        setHasUsedFreeToday(false);
        setShowDetails(false);
      }
      setSelectedTopic(topicParam);
      setShowAllCards(false);
      loadSavedGuardianCard(topicParam);
      checkFreeDrawStatus(topicParam);
    } else {
      // 주제가 선택되지 않았으면 전체 카드 목록 로드
      loadAllGuardianCards();
    }
  }, [searchParams]);

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // 상세보기가 열려있으면 닫기 (현재 주제 화면으로 돌아감)
      if (showDetails) {
        setShowDetails(false);
        // 스크롤 위치를 복원하기 위해 약간의 지연 후 실행
        setTimeout(() => {
          window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
        }, 0);
        // 히스토리 상태 복원 (뒤로가기로 인한 상태 변경 방지)
        if (selectedTopic) {
          window.history.replaceState({ page: 'guardian-topic', topic: selectedTopic }, '', window.location.href);
        }
        return;
      }
      
      // 주제별 화면에서 뒤로가기: 전체 목록 화면으로 이동
      if (selectedTopic && !showDetails) {
        const params = new URLSearchParams();
        // navigate 전에 히스토리 상태 설정
        window.history.replaceState({ page: 'guardian-list' }, '', `/tarot-talisman?${params.toString()}`);
        navigate(`/tarot-talisman?${params.toString()}`, { replace: true });
        setSelectedTopic(null);
        setShowAllCards(true);
        loadAllGuardianCards();
        return;
      }
      
      // 전체 카드 목록 화면에서 뒤로가기: 메인 화면으로 이동
      if (showAllCards && !selectedTopic) {
        // 메인으로 이동 전에 히스토리 상태 설정
        window.history.replaceState({ page: 'main' }, '', '/');
        navigate('/', { replace: true });
        return;
      }
    };

    // 상세보기가 열려있거나 주제별 화면, 전체 목록 화면일 때 popstate 이벤트 리스너 추가
    if (showDetails || selectedTopic || (showAllCards && !selectedTopic)) {
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      if (showDetails || selectedTopic || (showAllCards && !selectedTopic)) {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, [showDetails, savedScrollPosition, showAllCards, selectedTopic, navigate, loadAllGuardianCards]);

  // 상세보기 상태 변경 시 히스토리 관리
  useEffect(() => {
    if (showDetails && selectedTopic) {
      // 상세보기가 열릴 때 현재 스크롤 위치 저장
      setSavedScrollPosition(window.scrollY);
      // 상세보기가 열릴 때 히스토리에 상태 추가 (뒤로가기로 닫을 수 있도록)
      window.history.pushState({ showDetails: true, page: 'guardian-detail', topic: selectedTopic }, '', window.location.href);
    } else if (!showDetails && selectedTopic) {
      // 상세보기가 닫힐 때 주제 화면 상태로 복원
      window.history.replaceState({ page: 'guardian-topic', topic: selectedTopic }, '', window.location.href);
    }
  }, [showDetails, selectedTopic]);

  // 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 문제 방지)
  const getDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 자정 초기화 체크 (날짜가 바뀌었는지 확인)
  const checkDateReset = () => {
    const today = getDateString(new Date());
    const lastCheck = localStorage.getItem('lastDateCheck');
    
    if (lastCheck !== today) {
      // 날짜가 바뀌었으므로 초기화
      localStorage.setItem('lastDateCheck', today);
      // 오래된 데이터는 자동으로 무시됨 (날짜 체크로)
    }
  };

  // 저장된 수호카드 불러오기
  const loadSavedGuardianCard = (type: GuardianType) => {
    try {
      checkDateReset(); // 자정 초기화 체크
      const saved = localStorage.getItem(`guardianCard_${type}`);
      if (saved) {
        const { card, date } = JSON.parse(saved);
        const today = getDateString(new Date());
        if (date === today) {
          setGuardianCard(card);
          setIsCardRevealed(true);
        } else {
          // 날짜가 다르면 저장된 데이터 삭제 (자정 초기화)
          localStorage.removeItem(`guardianCard_${type}`);
          localStorage.removeItem(`guardianFreeDraw_${type}`);
        }
      }
    } catch (e) {
      console.error('Failed to load saved guardian card:', e);
      // 파싱 에러 시 데이터 삭제
      localStorage.removeItem(`guardianCard_${type}`);
      localStorage.removeItem(`guardianFreeDraw_${type}`);
    }
  };

  // 무료 뽑기 사용 여부 확인
  const checkFreeDrawStatus = (type: GuardianType) => {
    try {
      checkDateReset(); // 자정 초기화 체크
      const lastUsed = localStorage.getItem(`guardianFreeDraw_${type}`);
      if (lastUsed) {
        const today = getDateString(new Date());
        if (lastUsed === today) {
          setHasUsedFreeToday(true);
        } else {
          // 날짜가 다르면 초기화
          localStorage.removeItem(`guardianFreeDraw_${type}`);
        }
      }
    } catch (e) {
      console.error('Failed to check free draw status:', e);
      localStorage.removeItem(`guardianFreeDraw_${type}`);
    }
  };

  const generateGuardian = async (type: GuardianType): Promise<Guardian | null> => {
    const cardCategory = typeMapping[type];
    const categoryCards = cardsData[cardCategory];
    if (categoryCards && categoryCards.length > 0) {
      const selectedCard = categoryCards[Math.floor(Math.random() * categoryCards.length)];
      const card: Card = {
        tarot_id: selectedCard.id,
        card_name_kr: selectedCard.name,
        direction: 'upright'
      };
      // cards_graded.json의 grade 값을 powerLevel로 사용 (1-5)
      const powerLevel = selectedCard.grade || 2;
      return { 
        card, 
        meaning: selectedCard.meaning, 
        description: selectedCard.description,
        powerLevel 
      };
    }
    // fallback, but since we have data, should not reach here
    const fallbackCard = await tarotAPI.getRandomCard();
    if (!fallbackCard) return null;
    return {
      card: fallbackCard,
      meaning: '카드 데이터를 불러올 수 없습니다.',
      description: '',
      powerLevel: 2
    };
  };

  // 주제 선택 핸들러
  const handleTopicSelect = (type: GuardianType) => {
    const event = {
      event_name: 'guardian_topic_selected',
      topic: type
    };
    Analytics.click(event);
    trackClickEvent(event);
    
    const params = new URLSearchParams();
    params.set('topic', type);
    // navigate를 사용하여 히스토리 스택에 명시적으로 추가
    // useEffect가 searchParams 변경을 감지하여 selectedTopic을 자동으로 설정함
    // 히스토리 상태도 함께 설정
    window.history.pushState({ page: 'guardian-topic', topic: type }, '', `/tarot-talisman?${params.toString()}`);
    navigate(`/tarot-talisman?${params.toString()}`, { replace: false });
    generateHapticFeedback({ type: "tickWeak" });
  };

  const handleBack = () => {
    if (showDetails) {
      // 상세보기에서 뒤로가기: 주제 화면으로 돌아감
      setShowDetails(false);
      setTimeout(() => {
        window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
      }, 0);
      return;
    }
    
    if (selectedTopic) {
      // 주제별 화면에서 뒤로가기: 전체 목록 화면으로 이동
      const params = new URLSearchParams();
      window.history.replaceState({ page: 'guardian-list' }, '', `/tarot-talisman?${params.toString()}`);
      navigate(`/tarot-talisman?${params.toString()}`, { replace: true });
      setSelectedTopic(null);
      setShowAllCards(true);
      loadAllGuardianCards();
    } else if (showAllCards) {
      // 전체 목록 화면에서 뒤로가기: 메인 화면으로 이동
      window.history.replaceState({ page: 'main' }, '', '/');
      navigate('/', { replace: true });
    } else {
      // 기본적으로 메인으로 이동
      window.history.replaceState({ page: 'main' }, '', '/');
      navigate('/', { replace: true });
    }
  };

  // 무료 뽑기 핸들러
  const handleFreeDraw = async () => {
    if (!selectedTopic || hasUsedFreeToday || isDrawing) return;
    
    const event = {
      event_name: 'guardian_free_draw',
      topic: selectedTopic
    };
    Analytics.click(event);
    trackClickEvent(event);
    
    setIsDrawing(true);
    setIsFlipping(true);
    
    // 카드 뒤집기 애니메이션을 위한 딜레이
    setTimeout(async () => {
      const guardian = await generateGuardian(selectedTopic);
      if (guardian) {
        setGuardianCard(guardian);
        setIsCardRevealed(true);
        setHasUsedFreeToday(true);
        
        // 로컬스토리지에 저장 (임시 저장, 아직 메인에 표시 안됨)
        const today = getDateString(new Date());
        localStorage.setItem(`guardianCard_${selectedTopic}`, JSON.stringify({
          card: guardian,
          date: today
        }));
        localStorage.setItem(`guardianFreeDraw_${selectedTopic}`, today);
        
        // 전체 카드 목록 새로고침
        loadAllGuardianCards();
        
        setIsFlipping(false);
        setIsDrawing(false);
      }
    }, 800); // 카드 뒤집기 애니메이션 시간
  };

  // 실제 카드 뽑기 함수 (광고 시청 완료 후 호출)
  const performDraw = async () => {
    if (!selectedTopic) return;
    
    setIsDrawing(true);
    setIsFlipping(true);
    
    // 카드 뒤집기 애니메이션을 위한 딜레이
    setTimeout(async () => {
      const newGuardian = await generateGuardian(selectedTopic);
      if (!newGuardian) {
        setIsDrawing(false);
        setIsFlipping(false);
        return;
      }
      
      // 카드가 없으면 바로 설정
      if (!guardianCard) {
        setGuardianCard(newGuardian);
        setIsCardRevealed(true);
        setIsFlipping(false);
        setIsDrawing(false);
        
        // 로컬스토리지에 저장
        const today = getDateString(new Date());
        localStorage.setItem(`guardianCard_${selectedTopic}`, JSON.stringify({
          card: newGuardian,
          date: today
        }));
        
        // 전체 카드 목록 새로고침
        loadAllGuardianCards();
        return;
      }
      
      // 기존 카드와 비교 모달 표시
      setUpdating(true);
      setChoices({ current: guardianCard, new: newGuardian });
      setRevealed([true, false]);
      setModalDetails([false, false]);
      setModalOpen(true);
      
      setIsFlipping(false);
      setIsDrawing(false);
    }, 800); // 카드 뒤집기 애니메이션 시간
  };

  // 광고 보고 재뽑기 핸들러
  const handleRenewWithAd = async () => {
    if (!selectedTopic || isDrawing) return;
    
    // 수호카드 다시뽑기 시도 추적
    const event = {
      event_name: 'guardian_card_renew_attempt',
      topic: selectedTopic,
      location: 'main_screen'
    };
    Analytics.click(event);
    trackClickEvent(event);
    
    // 광고 지원 여부 확인
    if (GoogleAdMob.showAppsInTossAdMob.isSupported() !== true) {
      toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
        icon: 'icon-warning-circle-red500',
        iconType: 'circle',
      });
      return;
    }

    // 광고가 로드 완료되지 않은 경우
    if (!interstitialAdLoaded) {
      
      // 광고 로드 실패 상태라면 재시도
      if (allAdsFailed) {
        console.log('🔄 [수호카드 광고 테스트] 광고 로드 실패 상태 - 재시도');
        setAllAdsFailed(false);
        setIsLoadingAd(true);
        loadNextAd();
        // 토스트 메시지 제거
        return;
      }
      
      // 아직 로드 중인 경우
      if (isLoadingAd) {
        // 토스트 메시지 제거
        return;
      }
      
      // 로드되지 않은 경우 재시도
      console.log('🔄 [수호카드 광고 테스트] 광고 미로드 상태 - 재시도');
      setIsLoadingAd(true);
      loadNextAd();
      // 토스트 메시지 제거
      return;
    }

    // 전면형 광고가 로드 완료되었는지 확인 (loaded 이벤트를 받았는지)
    if (interstitialAdLoaded) {
      console.log('📺 [수호카드 광고 테스트] 전면형 광고 표시 시도');
      // 광고 상태를 false로 리셋 (다음 광고를 위해)
      setInterstitialAdLoaded(false);
      
      GoogleAdMob.showAppsInTossAdMob({
        options: {
          adGroupId: INTERSTITIAL_AD_GROUP_ID,
        },
        onEvent: (event) => {
          console.log('📢 [수호카드 광고 테스트] 전면형 광고 표시 이벤트:', event.type);
          switch (event.type) {
            case 'dismissed':
              console.log('✅ [수호카드 광고 테스트] 전면형 광고 닫힘 - 카드 뽑기');
              const adDrawEvent = {
                event_name: 'guardian_ad_draw',
                topic: selectedTopic || 'unknown',
                location: 'main_screen'
              };
              Analytics.click(adDrawEvent);
              trackClickEvent(adDrawEvent);
              performDraw();
              // 광고 표시 완료 후 다음 광고 미리 로드
              loadNextAd();
              break;
            case 'failedToShow':
              console.error('❌ [수호카드 광고 테스트] 전면형 광고 표시 실패');
              toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
                icon: 'icon-warning-circle-red500',
                iconType: 'circle',
              });
              // 표시 실패해도 다음 광고 로드 시도
              loadNextAd();
              break;
            case 'show':
              console.log('📺 [수호카드 광고 테스트] 전면형 광고 컨텐츠 표시됨');
              break;
          }
        },
        onError: (error) => {
          console.error('❌ [수호카드 광고 테스트] 전면형 광고 표시 오류:', error);
          toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
            icon: 'icon-warning-circle-red500',
            iconType: 'circle',
          });
          // 오류 발생해도 다음 광고 로드 시도
          loadNextAd();
        },
      });
      return;
    }

    // 광고가 로드되지 않은 경우
    toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
      icon: 'icon-warning-circle-red500',
      iconType: 'circle',
    });
  };

  // 모달 내에서 실제 카드 뽑기 함수 (광고 시청 완료 후 호출)
  const performDrawFromModal = async () => {
    if (!selectedTopic || !choices || isDrawing) return;
    
    setIsDrawing(true);
    
    setTimeout(async () => {
      const newGuardian = await generateGuardian(selectedTopic);
      if (!newGuardian) {
        setIsDrawing(false);
        return;
      }
      
      // 현재 선택된 카드와 새로운 카드 비교
      setChoices({ current: choices.current, new: newGuardian });
      setRevealed([true, false]); // 기존 카드는 이미 공개된 상태, 새로운 카드는 뒤집기 전
      setModalDetails([false, false]);
      
      setIsDrawing(false);
    }, 500);
  };

  // 모달 내에서 광고 보고 다시 뽑기 핸들러
  const handleRenewWithAdFromModal = async () => {
    if (!selectedTopic || !choices || isDrawing) return;
    
    // 수호카드 다시뽑기 시도 추적 (모달 내)
    const modalEvent = {
      event_name: 'guardian_card_renew_attempt',
      topic: selectedTopic,
      location: 'modal'
    };
    Analytics.click(modalEvent);
    trackClickEvent(modalEvent);
    
    // 광고 지원 여부 확인
    if (GoogleAdMob.showAppsInTossAdMob.isSupported() !== true) {
      toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
        icon: 'icon-warning-circle-red500',
        iconType: 'circle',
      });
      return;
    }

    // 광고가 로드 완료되지 않은 경우
    if (!interstitialAdLoaded) {
      
      // 광고 로드 실패 상태라면 재시도
      if (allAdsFailed) {
        console.log('🔄 [수호카드 광고 테스트] 모달 내 광고 로드 실패 상태 - 재시도');
        setAllAdsFailed(false);
        setIsLoadingAd(true);
        loadNextAd();
        // 토스트 메시지 제거
        return;
      }
      
      // 아직 로드 중인 경우
      if (isLoadingAd) {
        // 토스트 메시지 제거
        return;
      }
      
      // 로드되지 않은 경우 재시도
      console.log('🔄 [수호카드 광고 테스트] 모달 내 광고 미로드 상태 - 재시도');
      setIsLoadingAd(true);
      loadNextAd();
      // 토스트 메시지 제거
      return;
    }

    // 전면형 광고가 로드 완료되었는지 확인 (loaded 이벤트를 받았는지)
    if (interstitialAdLoaded) {
      console.log('📺 [수호카드 광고 테스트] 모달 내 전면형 광고 표시 시도');
      // 광고 상태를 false로 리셋 (다음 광고를 위해)
      setInterstitialAdLoaded(false);
      
      GoogleAdMob.showAppsInTossAdMob({
        options: {
          adGroupId: INTERSTITIAL_AD_GROUP_ID,
        },
        onEvent: (event) => {
          console.log('📢 [수호카드 광고 테스트] 모달 내 전면형 광고 표시 이벤트:', event.type);
          switch (event.type) {
            case 'dismissed':
              console.log('✅ [수호카드 광고 테스트] 모달 내 전면형 광고 닫힘 - 카드 뽑기');
              const modalAdDrawEvent = {
                event_name: 'guardian_ad_draw',
                topic: selectedTopic || 'unknown',
                location: 'modal'
              };
              Analytics.click(modalAdDrawEvent);
              trackClickEvent(modalAdDrawEvent);
              performDrawFromModal();
              // 광고 표시 완료 후 다음 광고 미리 로드
              loadNextAd();
              break;
            case 'failedToShow':
              console.error('❌ [수호카드 광고 테스트] 모달 내 전면형 광고 표시 실패');
              toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
                icon: 'icon-warning-circle-red500',
                iconType: 'circle',
              });
              // 표시 실패해도 다음 광고 로드 시도
              loadNextAd();
              break;
            case 'show':
              console.log('📺 [수호카드 광고 테스트] 모달 내 전면형 광고 컨텐츠 표시됨');
              break;
          }
        },
        onError: (error) => {
          console.error('❌ [수호카드 광고 테스트] 모달 내 전면형 광고 표시 오류:', error);
          toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
            icon: 'icon-warning-circle-red500',
            iconType: 'circle',
          });
          // 오류 발생해도 다음 광고 로드 시도
          loadNextAd();
        },
      });
      return;
    }

    // 광고가 로드되지 않은 경우
    toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
      icon: 'icon-warning-circle-red500',
      iconType: 'circle',
    });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setUpdating(false);
    setChoices(null);
  };

  const handleSelectGuardian = (selected: Guardian) => {
    if (!updating) return;
    
    // 카드 선택 추적 (기존/신규 구분은 모달에서 확인)
    const isNewCard = choices?.new === selected;
    const selectEvent = {
      event_name: 'guardian_card_selected',
      topic: selectedTopic || 'unknown',
      card_type: isNewCard ? 'new' : 'current',
      card_id: selected.card.tarot_id,
      power_level: selected.powerLevel || 2
    };
    Analytics.click(selectEvent);
    trackClickEvent(selectEvent);
    
    setPendingSelection(selected);
    setConfirmMode(true);
  };

  const handleConfirmSelection = () => {
    if (pendingSelection && selectedTopic) {
      setGuardianCard(pendingSelection);
      
      // 로컬스토리지 업데이트
      const today = getDateString(new Date());
      localStorage.setItem(`guardianCard_${selectedTopic}`, JSON.stringify({
        card: pendingSelection,
        date: today
      }));
      
      setUpdating(false);
      setChoices(null);
      setConfirmMode(false);
      setPendingSelection(null);
      setModalOpen(false);
      
      // 상태 초기화
      setSelectedTopic(null);
      setIsCardRevealed(false);
      setShowDetails(false);
      
      // 전체 카드 목록 새로고침
      loadAllGuardianCards();
      
      // 전체 카드 목록 화면으로 이동 (URL 파라미터 제거)
      navigate('/tarot-talisman');
    }
  };

  // 메인 화면에 표시할 수호카드로 결정
  const handleSetAsMainGuardian = () => {
    if (!guardianCard || !selectedTopic) return;
    
    const today = getDateString(new Date());
    // 메인 화면 표시용 저장 (이 카드로 결정하기를 누른 카드만)
    localStorage.setItem('mainGuardianCard', JSON.stringify({
      type: selectedTopic,
      card: guardianCard,
      date: today
    }));
    
    // 전체 카드 목록 새로고침
    loadAllGuardianCards();
    
    // 전체 카드 목록 화면으로 이동
    const params = new URLSearchParams();
    navigate(`/tarot-talisman?${params.toString()}`);
  };

  const handleCancelSelection = () => {
    setConfirmMode(false);
    setPendingSelection(null);
  };

  const handleFlip = (index: number) => {
    setRevealed(prev => prev.map((r, i) => i === index ? true : r));
  };

  const getTypeName = (type: GuardianType) => {
    return TOPIC_LABEL_MAP[type];
  };

  const getTypeIcon = (type: GuardianType) => {
    const icons = { love: '💖', career: '⭐', money: '💰' };
    return icons[type];
  };

  // 수호력 별점 표시
  const renderPowerLevel = (level: number = 2) => {
    return (
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        alignItems: 'center',
        lineHeight: 1,
        margin: 0,
        padding: 0
      }}>
        {[...Array(5)].map((_, i) => (
          <span 
            key={i}
            style={{
              fontSize: i < level ? '18px' : '18px',
              color: i < level ? '#fbbf24' : '#e5e7eb',
              filter: i < level ? 'drop-shadow(0 1px 2px rgba(251, 191, 36, 0.3))' : 'none',
              display: 'inline-block',
              transition: 'all 0.2s ease',
              margin: 0,
              padding: 0,
              lineHeight: 1
            }}
          >
            {i < level ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  // 카드 이미지 경로 가져오기 (0~77번까지 모두 지원)
  const getCardImagePath = (cardId: number): string => {
    // 0~77 범위 내의 카드는 해당 번호의 이미지 사용
    const imageId = Math.max(0, Math.min(77, cardId));
    return new URL(`../assets/cards/${imageId}.webp`, import.meta.url).href;
  };

  // 카드 뒷면 이미지 경로 가져오기
  const getCardBackImagePath = (): string => {
    return new URL(`../assets/cards/back.webp`, import.meta.url).href;
  };


  // 전체 카드 목록 화면 (설정된 카드가 있을 때)
  if (showAllCards && !selectedTopic) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Top
          title={
            <Top.TitleParagraph size={22} color={adaptive.grey900}>
              내 수호카드 찾기
            </Top.TitleParagraph>
          }
          subtitleBottom={
            <Top.SubtitleParagraph color={adaptive.grey700}>
              수호카드를 찾고 운을 보완해요
            </Top.SubtitleParagraph>
          }
          lowerGap={0}
        />
        <div style={{ padding: '16px' }}>
          {(['love', 'career', 'money'] as GuardianType[]).map((type) => {
            const card = allGuardianCards[type];
            return (
              <div key={type} style={{ marginBottom: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: adaptive.grey900 }}>
                    {getTypeIcon(type)} {getTypeName(type)} 수호 카드
                  </h3>
                  {card ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleTopicSelect(type);
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>📖</span>
                      <span>상세보기</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTopicSelect(type)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>➕</span>
                      <span>설정</span>
                    </button>
                  )}
                </div>
                {card ? (
                  <div style={{
                    background: 'linear-gradient(165deg, rgba(255,255,255,0.32), rgba(255,255,255,0.08))',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 20px 40px -20px rgba(15,23,42,0.3)',
                    border: '1px solid rgba(148,163,184,0.16)'
                  }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{ width: '100px', flexShrink: 0 }}>
                        <img
                          src={getCardImagePath(card.card.tarot_id)}
                          alt={card.card.card_name_kr}
                          style={{
                            width: '100%',
                            height: '178px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            boxShadow: '0 10px 20px rgba(15,23,42,0.2)',
                            border: '2px solid rgba(0, 0, 0, 0.15)'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                            {card.card.card_name_kr}
                          </h4>
                          <div style={{ marginBottom: '6px' }}>
                            {renderPowerLevel(card.powerLevel)}
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: adaptive.grey700, lineHeight: 1.6, marginBottom: '8px', wordBreak: 'normal' }}>
                          {(() => {
                            const text = card.meaning || '';
                            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                            return sentences.map((sentence, i) => (
                              <div key={i} style={{
                                marginBottom: i < sentences.length - 1 ? '8px' : '0',
                                textAlign: 'left',
                                wordBreak: 'normal'
                              }}>
                                {sentence.trim()}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: adaptive.grey100,
                    borderRadius: '20px',
                    padding: '40px 20px',
                    textAlign: 'center',
                    border: '2px dashed ' + adaptive.grey300
                  }}>
                    <p style={{ fontSize: '14px', color: adaptive.grey600, marginBottom: '12px' }}>
                      아직 설정된 수호카드가 없어요
                    </p>
                    <button
                      onClick={() => handleTopicSelect(type)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      수호카드 뽑기
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ marginTop: '32px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: adaptive.grey200,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: adaptive.grey900,
                cursor: 'pointer'
              }}
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 주제 선택 화면 (설정된 카드가 없을 때)
  if (!selectedTopic) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Top
          title={
            <Top.TitleParagraph size={22} color={adaptive.grey900}>
              내 수호카드 찾기
            </Top.TitleParagraph>
          }
          subtitleBottom={
            <Top.SubtitleParagraph color={adaptive.grey700}>
              수호카드를 찾고 운을 보완해요
            </Top.SubtitleParagraph>
          }
          lowerGap={0}
        />
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: adaptive.grey600, fontSize: '14px', marginBottom: '16px' }}>
              먼저 궁금한 주제를 선택해주세요
            </p>
            {(['love', 'career', 'money'] as GuardianType[]).map((type) => (
              <ListRow
                key={type}
                left={
                  <ListRow.AssetIcon
                    variant="fill"
                    shape="circle-masking"
                    name={
                      type === 'love' ? 'icon-emoji-two-hearts' :
                      type === 'money' ? 'icon-money-bag-green' :
                      'icon-trophy'
                    }
                  />
                }
                contents={
                  <ListRow.Texts
                    type="1RowTypeA"
                    top={TOPIC_LABEL_MAP[type]}
                    topProps={{ color: adaptive.grey800, fontWeight: 'bold' }}
                  />
                }
                arrowType="right"
                onClick={() => handleTopicSelect(type)}
                verticalPadding="small"
                style={{ marginBottom: '8px' }}
              />
            ))}
          </div>
          <div style={{ marginTop: '32px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: adaptive.grey200,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: adaptive.grey900,
                cursor: 'pointer'
              }}
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 카드 결과 화면
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', position: 'relative' }}>
      <Top
        title={
          <Top.TitleParagraph size={22} color={adaptive.grey900}>
            내 수호카드 찾기
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph color={adaptive.grey700}>
            오늘의 {getTypeName(selectedTopic)} 수호카드
          </Top.SubtitleParagraph>
        }
        lowerGap={0}
      />
      <div style={{ padding: '16px' }}>
        {!isCardRevealed ? (
          // 카드 뽑기 전 화면
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: adaptive.grey900, marginBottom: '12px' }}>
                {hasUsedFreeToday ? '다른 카드를 뽑아보세요' : '오늘의 수호카드를 뽑아보세요'}
              </h3>
              <p style={{ fontSize: '14px', color: adaptive.grey600, lineHeight: 1.6 }}>
                {hasUsedFreeToday 
                  ? '광고를 보고 더 강력한 카드를 뽑을 수 있어요'
                  : '하루 1회 무료로 카드를 뽑을 수 있어요'}
              </p>
            </div>
            
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div
                onClick={hasUsedFreeToday ? handleRenewWithAd : handleFreeDraw}
                style={{
                  width: '220px',
                  height: '391px',
                  margin: '0 auto',
                  borderRadius: '22px',
                  background: isFlipping 
                    ? 'linear-gradient(145deg, #fbbf24, #f59e0b)'
                    : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDrawing ? 'wait' : 'pointer',
                  boxShadow: isFlipping 
                    ? '0 25px 60px rgba(251, 191, 36, 0.4)'
                    : '0 25px 45px rgba(15,23,42,0.25)',
                  position: 'relative',
                  transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.8s ease, background 0.3s ease, box-shadow 0.3s ease',
                  opacity: isDrawing ? 0.8 : 1,
                  overflow: 'hidden'
                }}
              >
                {isFlipping ? (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                  }}>
                    {/* 반짝이는 파티클 효과 */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.8)',
                          boxShadow: '0 0 12px rgba(255, 255, 255, 0.9)',
                          animation: `sparkle 2s ease-in-out infinite`,
                          animationDelay: `${i * 0.25}s`,
                          top: `${20 + (i % 4) * 30}%`,
                          left: `${20 + Math.floor(i / 4) * 60}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    ))}
                    {/* 메인 로딩 스피너 */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      border: '4px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '4px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      position: 'relative',
                      zIndex: 1
                    }} />
                    <style>{`
                      @keyframes sparkle {
                        0%, 100% {
                          opacity: 0;
                          transform: translate(-50%, -50%) scale(0);
                        }
                        50% {
                          opacity: 1;
                          transform: translate(-50%, -50%) scale(1);
                        }
                      }
                      @keyframes pulse {
                        0%, 100% {
                          opacity: 0.8;
                        }
                        50% {
                          opacity: 1;
                        }
                      }
                    `}</style>
                  </div>
                ) : (
                  <>
                    <img
                      src={getCardBackImagePath()}
                      alt="카드 뒷면"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '22px'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '22px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      zIndex: 1
                    }}>
                      {hasUsedFreeToday ? '📺 광고 보고 뽑기' : '✨ 무료로 뽑기'}
                    </div>
                  </>
                )}
              </div>
              
              {isDrawing && !isFlipping && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(255, 255, 255, 0.98)',
                  padding: '20px',
                  borderRadius: '20px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(15, 23, 42, 0.1)',
                    borderTop: '3px solid #f59e0b',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite'
                  }} />
                </div>
              )}
            </div>
            
            {hasUsedFreeToday && (
              <div style={{ marginTop: '32px', padding: '16px', background: adaptive.grey50, borderRadius: '12px' }}>
                <p style={{ fontSize: '13px', color: adaptive.grey600, lineHeight: 1.6 }}>
                  💡 광고를 시청하면 더 좋은 카드를 뽑을 수 있는 기회를 얻을 수 있어요
                </p>
              </div>
            )}
          </div>
        ) : guardianCard ? (
          // 카드 결과 화면
          <div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: '36px',
              marginBottom: '48px',
              width: '100%'
            }}>
              <div 
                style={{ 
                  textAlign: 'left',
                  width: '100%',
                  maxWidth: '380px',
                  background: 'linear-gradient(165deg, rgba(255,255,255,0.32), rgba(255,255,255,0.08))',
                  borderRadius: '28px',
                  boxShadow: '0 25px 60px -30px rgba(15,23,42,0.55)',
                  border: '1px solid rgba(148,163,184,0.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '22px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px'
                  }}
                >
                  <div 
                    className="guardian-card-container"
                    style={{
                      position: 'relative',
                      width: '220px',
                      height: '391px',
                      // padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TarotCardWithEffects
                      image={getCardImagePath(guardianCard.card.tarot_id)}
                      alt={guardianCard.card.card_name_kr}
                      style={{
                        width: '220px',
                        height: '391px',
                        borderRadius: '22px',
                        boxShadow: '0 25px 45px rgba(15,23,42,0.25)'
                      }}
                      enableTilt={true}
                      enableMobileTilt={true}
                      behindGlowEnabled={true}
                      onError={(e) => {
                        e.currentTarget.src = getCardImagePath(1);
                      }}
                    />
                  </div>

                  {/* 카드 설명 */}
                  <div style={{
                    width: '100%',
                    backgroundColor: '#fff',
                    borderRadius: '20px',
                    padding: '26px 24px',
                    boxShadow: '0 20px 45px rgba(15,23,42,0.15)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {/* 제목과 등급 영역 */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <Post.H3 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#111827',
                        margin: 0,
                        padding: 0
                      }}>
                        {guardianCard.card.card_name_kr}
                      </Post.H3>
                      <div style={{
                        margin: 0,
                        padding: 0,
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'flex-start'
                      }}>
                        {renderPowerLevel(guardianCard.powerLevel)}
                      </div>
                    </div>
                    
                    {/* 설명 텍스트 영역 */}
                    <div style={{
                      flex: 1,
                      marginBottom: '16px'
                    }}>
                      <div style={{ 
                        color: '#1d4ed8',
                        marginBottom: showDetails ? '12px' : '0',
                        fontWeight: 600,
                        lineHeight: 1.7,
                        wordBreak: 'normal'
                      }}>
                        {(() => {
                          const text = guardianCard.meaning || '';
                          const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                          return sentences.map((sentence, i) => (
                            <div key={i} style={{
                              marginBottom: i < sentences.length - 1 ? '12px' : '0',
                              textAlign: 'left',
                              wordBreak: 'normal'
                            }}>
                              {sentence.trim()}
                            </div>
                          ));
                        })()}
                      </div>
                      {guardianCard.description && showDetails && (
                        <div style={{
                          lineHeight: 1.8,
                          color: adaptive.grey800,
                          margin: 0,
                          wordBreak: 'normal'
                        }}>
                          {(() => {
                            const text = guardianCard.description || '';
                            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                            return sentences.map((sentence, i) => (
                              <div key={i} style={{
                                marginBottom: i < sentences.length - 1 ? '12px' : '0',
                                textAlign: 'left',
                                wordBreak: 'normal'
                              }}>
                                {sentence.trim()}
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {/* 상세보기 버튼 영역 (맨 아래) */}
                    {guardianCard.description && (
                      <div style={{
                        marginTop: 'auto',
                        paddingTop: '16px',
                        borderTop: `1px solid ${adaptive.grey200}`
                      }}>
                        <button
                          onClick={() => {
                            if (!showDetails) {
                              // 상세보기 열기: 현재 스크롤 위치 저장
                              const detailViewEvent = {
                                event_name: 'guardian_detail_viewed',
                                topic: selectedTopic || 'unknown'
                              };
                              Analytics.click(detailViewEvent);
                              trackClickEvent(detailViewEvent);
                              setSavedScrollPosition(window.scrollY);
                              setShowDetails(true);
                              // 약간의 딜레이 후 스크롤 (레이아웃 변경 후)
                              setTimeout(() => {
                                window.scrollTo({ top: window.scrollY, behavior: 'smooth' });
                              }, 100);
                            } else {
                              // 상세보기 닫기
                              setShowDetails(false);
                              // 스크롤 위치 복원
                              setTimeout(() => {
                                window.scrollTo({ top: savedScrollPosition, behavior: 'smooth' });
                              }, 100);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: adaptive.grey100,
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '13px',
                            color: adaptive.grey700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            fontWeight: 500
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = adaptive.grey200;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = adaptive.grey100;
                          }}
                        >
                          <span>{showDetails ? '▲' : '▼'}</span>
                          <span>{showDetails ? '간단히 보기' : '상세 보기'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px', 
              alignItems: 'center',
              marginBottom: '100px',
              width: '100%'
            }}>
              <button
                onClick={handleRenewWithAd}
                disabled={isDrawing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  width: '100%',
                  maxWidth: '320px',
                  backgroundColor: isDrawing ? adaptive.grey300 : '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  cursor: isDrawing ? 'wait' : 'pointer',
                  transition: 'background-color 0.2s',
                  opacity: isDrawing ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isDrawing) {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDrawing) {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                <span>📺 한 번 더 카드 뽑기 (짧은 광고)</span>
              </button>
              <button
                onClick={() => {
                  // 전체 목록 화면으로 이동 (히스토리 기록 없이 replace)
                  const params = new URLSearchParams();
                  navigate(`/tarot-talisman?${params.toString()}`, { replace: true });
                  setSelectedTopic(null);
                  setShowAllCards(true);
                  loadAllGuardianCards();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  width: '100%',
                  maxWidth: '320px',
                  backgroundColor: adaptive.grey200,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: adaptive.grey900,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = adaptive.grey300;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = adaptive.grey200;
                }}
              >
                <span>🔍 다른 수호카드 확인하기</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {modalOpen && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.6)', 
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={handleCloseModal}
        >
          <div 
            style={{ 
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              backgroundColor: '#f5f5f5',
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div style={{
              padding: '24px 24px 16px 24px',
              backgroundColor: '#fff',
              borderBottom: `1px solid ${adaptive.grey200}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <div style={{ flex: 1 }}>
                  <Post.H2 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: adaptive.grey900,
                    marginBottom: '4px'
                  }}>
                    수호카드를 선택하세요
                  </Post.H2>
                </div>
                <button
                  onClick={handleCloseModal}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: adaptive.grey100,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: adaptive.grey700,
                    flexShrink: 0,
                    marginLeft: '16px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = adaptive.grey200;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = adaptive.grey100;
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '24px',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}>
              {confirmMode && pendingSelection ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  textAlign: 'center'
                }}>
                  <Post.H3 style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: adaptive.grey900,
                    marginBottom: '32px'
                  }}>
                    "{pendingSelection.card.card_name_kr}" 카드를 선택할까요?
                  </Post.H3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleConfirmSelection}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#3b82f6';
                      }}
                    >
                      예
                    </button>
                    <button
                      onClick={handleCancelSelection}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: adaptive.grey200,
                        color: adaptive.grey900,
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = adaptive.grey300;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = adaptive.grey200;
                      }}
                    >
                      아니오
                    </button>
                  </div>
                </div>
              ) : choices && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* 비교 헤더 */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      flex: '1 1 0',
                      minWidth: '120px',
                      textAlign: 'center',
                      padding: '10px 12px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '10px',
                      border: '2px solid rgba(59, 130, 246, 0.4)'
                    }}>
                      <Post.Paragraph style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#3b82f6',
                        margin: 0
                      }}>
                        기존 카드
                      </Post.Paragraph>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      color: adaptive.grey400,
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      VS
                    </div>
                    <div style={{
                      flex: '1 1 0',
                      minWidth: '120px',
                      textAlign: 'center',
                      padding: '10px 12px',
                      backgroundColor: '#ecfdf5',
                      borderRadius: '10px',
                      border: '2px solid rgba(16, 185, 129, 0.4)'
                    }}>
                      <Post.Paragraph style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#10b981',
                        margin: 0
                      }}>
                        새로운 카드
                      </Post.Paragraph>
                    </div>
                  </div>

                  {/* 카드 비교 레이아웃 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '16px'
                  }}>
                    {[{ guardian: choices.current, label: '기존 카드', isCurrent: true }, { guardian: choices.new, label: '새로운 카드 발견!', isCurrent: false }].map((option, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'linear-gradient(165deg, rgba(255,255,255,0.32), rgba(255,255,255,0.08))',
                          borderRadius: '20px',
                          padding: '20px',
                          boxShadow: '0 20px 40px -20px rgba(15,23,42,0.3)',
                          border: `2px solid ${index === 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          position: 'relative',
                          touchAction: 'pan-y' // 수직 스크롤 허용
                        }}
                      >
                        {/* 라벨 */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: index === 0 ? '#3b82f6' : '#10b981'
                          }}>
                            {option.label}
                          </span>
                          {option.isCurrent && (
                            <Badge size="small" color="blue" variant="weak">
                              현재 사용중
                            </Badge>
                          )}
                        </div>

                        {/* 카드 이미지 */}
                        <div
                          className="guardian-card-container"
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '9/16',
                            cursor: 'default',
                            perspective: '1000px',
                            margin: '0 auto',
                            padding: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none', // 텍스트 선택 방지
                            pointerEvents: 'none' // 카드 컨테이너 전체 터치 이벤트 차단 (스크롤 허용)
                          }}
                        >
                          {/* 카드 뒤집기 버튼 (뒷면일 때만 표시) */}
                          {!revealed[index] && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleFlip(index);
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation();
                              }}
                              onTouchEnd={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleFlip(index);
                              }}
                              style={{
                                position: 'absolute',
                                inset: '12px',
                                background: 'transparent',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                zIndex: 100,
                                pointerEvents: 'auto',
                                touchAction: 'manipulation' // 더블탭 줌 방지
                              }}
                            />
                          )}
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              height: '100%',
                              transformStyle: 'preserve-3d',
                              transition: 'transform 0.6s ease',
                              transform: revealed[index] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                              pointerEvents: 'none' // 카드 회전 컨테이너는 터치 이벤트 차단 (스크롤 허용)
                            }}
                          >
                            {/* 카드 뒷면 */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 25px rgba(15,23,42,0.3)',
                                pointerEvents: 'none' // 카드 뒷면 터치 이벤트 차단
                              }}
                            >
                              <img
                                src={getCardBackImagePath()}
                                alt="카드 뒷면"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  pointerEvents: 'none'
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                bottom: '16px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'rgba(15, 23, 42, 0.85)',
                                color: '#fff',
                                padding: '7px 18px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                textAlign: 'center',
                                pointerEvents: 'none'
                              }}>
                                탭하여 공개
                              </div>
                            </div>
                            {/* 카드 앞면 */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: '-12px',
                                backfaceVisibility: 'hidden',
                                WebkitBackfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                borderRadius: '16px',
                                overflow: 'visible',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none' // 터치 이벤트 차단하여 스크롤 가능하게
                              }}
                            >
                              <TarotCardWithEffects
                                image={getCardImagePath(option.guardian.card.tarot_id)}
                                alt={option.guardian.card.card_name_kr}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  borderRadius: '16px',
                                  boxShadow: '0 10px 25px rgba(15,23,42,0.3)',
                                  pointerEvents: 'none' // 터치 이벤트 차단
                                }}
                                enableTilt={false}
                                enableMobileTilt={false}
                                behindGlowEnabled={true}
                                touchAction="pan-y" // 스크롤 허용
                                onError={(e) => {
                                  e.currentTarget.src = getCardImagePath(1);
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* 카드 정보 */}
                        {revealed[index] && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1
                          }}>
                            {/* 제목과 등급 영역 */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              marginBottom: '16px'
                            }}>
                              <Post.H3 style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#111827',
                                margin: 0,
                                padding: 0
                              }}>
                                {option.guardian.card.card_name_kr}
                              </Post.H3>
                              <div style={{
                                margin: 0,
                                padding: 0,
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start'
                              }}>
                                {renderPowerLevel(option.guardian.powerLevel)}
                              </div>
                            </div>
                            
                            {/* 설명 텍스트 영역 */}
                            <div style={{
                              flex: 1,
                              marginBottom: '16px'
                            }}>
                              <div style={{ 
                                color: '#1d4ed8',
                                marginBottom: modalDetails[index] ? '12px' : '0',
                                fontWeight: 600,
                                lineHeight: 1.7,
                                wordBreak: 'normal'
                              }}>
                                {(() => {
                                  const text = option.guardian.meaning || '';
                                  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                                  return sentences.map((sentence, i) => (
                                    <div key={i} style={{
                                      marginBottom: i < sentences.length - 1 ? '12px' : '0',
                                      textAlign: 'left',
                                      wordBreak: 'normal'
                                    }}>
                                      {sentence.trim()}
                                    </div>
                                  ));
                                })()}
                              </div>
                              {option.guardian.description && modalDetails[index] && (
                                <div style={{
                                  lineHeight: 1.8,
                                  color: adaptive.grey800,
                                  margin: 0,
                                  wordBreak: 'normal'
                                }}>
                                  {(() => {
                                    const text = option.guardian.description || '';
                                    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                                    return sentences.map((sentence, i) => (
                                      <div key={i} style={{
                                        marginBottom: i < sentences.length - 1 ? '12px' : '0',
                                        textAlign: 'left',
                                        wordBreak: 'normal'
                                      }}>
                                        {sentence.trim()}
                                      </div>
                                    ));
                                  })()}
                                </div>
                              )}
                            </div>
                            
                            {/* 버튼 영역 (맨 아래) */}
                            <div style={{
                              marginTop: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              paddingTop: '16px'
                            }}>
                              {/* 상세보기 버튼 */}
                              {option.guardian.description && (
                                <div style={{
                                  paddingBottom: '8px',
                                  borderBottom: `1px solid ${adaptive.grey200}`
                                }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalDetails(prev => [prev[0], prev[1]].map((d, i) => i === index ? !d : d) as [boolean, boolean]);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '10px 16px',
                                      backgroundColor: adaptive.grey100,
                                      border: 'none',
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      color: adaptive.grey700,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '6px',
                                      transition: 'all 0.2s ease',
                                      fontWeight: 500
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = adaptive.grey200;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = adaptive.grey100;
                                    }}
                                  >
                                    <span>{modalDetails[index] ? '▲' : '▼'}</span>
                                    <span>{modalDetails[index] ? '간단히 보기' : '상세 보기'}</span>
                                  </button>
                                </div>
                              )}
                              {/* 새로운 카드인 경우에만 광고 보고 다시 뽑기 버튼 표시 */}
                              {index === 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRenewWithAdFromModal();
                                  }}
                                  disabled={isDrawing}
                                  style={{
                                    padding: '10px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    backgroundColor: isDrawing ? adaptive.grey300 : '#f59e0b',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: isDrawing ? 'wait' : 'pointer',
                                    transition: 'all 0.2s',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    boxShadow: isDrawing ? 'none' : '0 2px 6px rgba(245, 158, 11, 0.3)',
                                    opacity: isDrawing ? 0.6 : 1
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isDrawing) {
                                      e.currentTarget.style.backgroundColor = '#d97706';
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                      e.currentTarget.style.boxShadow = '0 4px 10px rgba(245, 158, 11, 0.4)';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isDrawing) {
                                      e.currentTarget.style.backgroundColor = '#f59e0b';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(245, 158, 11, 0.3)';
                                    }
                                  }}
                                >
                                  <span style={{ fontSize: '16px' }}>📺</span>
                                  <span>{isDrawing ? '뽑는 중...' : '광고 보고 다시 뽑기'}</span>
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectGuardian(option.guardian);
                                }}
                                style={{
                                  padding: '12px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  backgroundColor: index === 0 ? adaptive.grey300 : '#10b981',
                                  color: index === 0 ? adaptive.grey900 : '#fff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  width: '100%',
                                  boxShadow: index === 0 ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                  if (index === 0) {
                                    e.currentTarget.style.backgroundColor = adaptive.grey400;
                                  } else {
                                    e.currentTarget.style.backgroundColor = '#059669';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (index === 0) {
                                    e.currentTarget.style.backgroundColor = adaptive.grey300;
                                  } else {
                                    e.currentTarget.style.backgroundColor = '#10b981';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                                  }
                                }}
                              >
                                {index === 0 ? '현재 카드 유지' : '✨ 이 카드로 변경'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotTalisman;
