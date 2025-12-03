import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Post, Top, FixedBottomCTA, useToast } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { RotateCcw } from 'lucide-react';
import { CardBack, CardConfig } from '../components/tarot_card_ex';
import TarotCardWithEffects from '../components/TarotCardWithEffects';
import cardTTData from '../data/card_tt.json';
import { tarotAPI, TarotReading } from '../lib/supabase';
import { GoogleAdMob, Analytics } from '@apps-in-toss/web-framework';

type CardTTData = {
  id: number;
  name: string;
  eng_name: string;
  timeline: {
    past: string;
    present: string;
    future: string;
  };
  advice: string;
  caution?: string;
  oneLineSummary: string;
  keywords: string[];
};

type CardTTJson = {
  love: CardTTData[];
  success: CardTTData[];
  wealth: CardTTData[];
};

const TOPIC_KEY_MAP: Record<string, keyof CardTTJson> = {
  love: 'love',
  success: 'success',
  career: 'success',
  money: 'wealth',
  wealth: 'wealth',
};

const TOPIC_LABEL_MAP: Record<string, string> = {
  love: '애정운',
  success: '성공운',
  money: '금전운',
  wealth: '금전운',
};

const TarotResultPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [backDesign, setBackDesign] = useState<CardConfig | null>(null);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const [cardDataMap, setCardDataMap] = useState<Map<number, CardTTData>>(new Map());
  const [adviceCard, setAdviceCard] = useState<{ cardId: number; cardData: TarotReading | null; adviceText: string } | null>(null);
  const [adviceCardFlipped, setAdviceCardFlipped] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  const [allCardsCache, setAllCardsCache] = useState<TarotReading[] | null>(null);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [glareAnimation, setGlareAnimation] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [rewardedAdCleanup, setRewardedAdCleanup] = useState<(() => void) | null>(null);
  const [interstitialAdCleanup, setInterstitialAdCleanup] = useState<(() => void) | null>(null);
  const [rewardedAdLoaded, setRewardedAdLoaded] = useState(false);
  const [interstitialAdLoaded, setInterstitialAdLoaded] = useState(false);
  const [allAdsFailed, setAllAdsFailed] = useState(false);

  const spreadPositions = ['과거', '현재', '미래'];

  // 광고 그룹 ID
  const INTERSTITIAL_AD_GROUP_ID = 'ait.live.28c5628c60dd4b31'; // 전면형 광고
  const REWARDED_AD_GROUP_ID = 'ait.live.a18c442d23fa474b'; // 리워드 광고 (조언 카드용)

  // 카드 이미지 경로 가져오기 (0~77번까지 모두 지원)
  const getCardImagePath = (cardId: number): string => {
    // 0~77 범위 내의 카드는 해당 번호의 이미지 사용
    const imageId = Math.max(0, Math.min(77, cardId));
    return new URL(`../assets/cards/${imageId}.webp`, import.meta.url).href;
  };

  // card_tt.json에서 카드 데이터 가져오기
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    setTopic(topicParam);

    if (topicParam) {
      const cardTTJson = cardTTData as CardTTJson;
      const mappedKey = TOPIC_KEY_MAP[topicParam] ?? (topicParam as keyof CardTTJson);

      if (mappedKey && cardTTJson[mappedKey]) {
        const topicCards = cardTTJson[mappedKey];
        const map = new Map<number, CardTTData>();
        topicCards.forEach(card => {
          map.set(card.id, card);
        });
        setCardDataMap(map);
        console.log('Loaded card data for topic:', mappedKey, map);
      } else {
        console.warn('Topic not found in card_tt.json:', topicParam);
      }
    }
  }, [searchParams]);

  // 모든 카드 미리 로드 (페이지 로드 시)
  useEffect(() => {
    const loadAllCards = async () => {
      if (!allCardsCache) {
        const cards = await tarotAPI.getAllCards();
        setAllCardsCache(cards);
      }
    };
    loadAllCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 페이지 로드 시 한 번만 실행

  // GlareHover 자동 애니메이션 (호버하지 않을 때만)
  useEffect(() => {
    if (!showAdvice && !isHovering) {
      const interval = setInterval(() => {
        setGlareAnimation(prev => (prev + 1) % 100);
      }, 50); // 50ms마다 업데이트

      return () => clearInterval(interval);
    }
  }, [showAdvice, isHovering]);

  // 페이지 로드 시 즉시 광고 미리 로드 시작 (카드 뒤집기와 동시에 진행)
  useEffect(() => {
    // 상태 초기화
    setRewardedAdLoaded(false);
    setInterstitialAdLoaded(false);
    setAllAdsFailed(false);

    console.log('🔮 [광고 테스트] 결과 페이지 로드 - 광고 로드 시작 (카드 뒤집기와 동시 진행)');
    console.log('📝 [광고 테스트] 전면형 광고 ID:', INTERSTITIAL_AD_GROUP_ID);
    console.log('📝 [광고 테스트] 리워드 광고 ID:', REWARDED_AD_GROUP_ID);
    
    // 광고 지원 여부 확인
    if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
      console.warn('⚠️ [광고 테스트] GoogleAdMob이 지원되지 않는 환경입니다.');
      setAllAdsFailed(true);
      return;
    }

    console.log('✅ [광고 테스트] GoogleAdMob 지원됨 - 리워드 광고 로드 시도');

    // 1단계: 리워드 광고 로드 시도
    const rewardedCleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: {
        adGroupId: REWARDED_AD_GROUP_ID,
      },
      onEvent: (event) => {
        console.log('📢 [광고 테스트] 리워드 광고 이벤트 발생:', event.type);
        switch (event.type) {
          case 'loaded':
            console.log('✅ [광고 테스트] 리워드 광고 로드 성공!', event.data);
            setRewardedAdLoaded(true);
            break;
          case 'failedToLoad':
            console.error('❌ [광고 테스트] 리워드 광고 로드 실패:', event.data);
            console.log('🔄 [광고 테스트] 전면형 광고 로드 시도');
            
            // 리워드 실패 시 전면형 광고 로드 시도
            const interstitialCleanup = GoogleAdMob.loadAppsInTossAdMob({
              options: {
                adGroupId: INTERSTITIAL_AD_GROUP_ID,
              },
              onEvent: (interstitialEvent) => {
                console.log('📢 [광고 테스트] 전면형 광고 이벤트 발생:', interstitialEvent.type);
                switch (interstitialEvent.type) {
                  case 'loaded':
                    console.log('✅ [광고 테스트] 전면형 광고 로드 성공!', interstitialEvent.data);
                    setInterstitialAdLoaded(true);
                    break;
                  case 'failedToLoad':
                    console.error('❌ [광고 테스트] 전면형 광고 로드 실패:', interstitialEvent.data);
                    console.error('❌ [광고 테스트] 모든 광고 로드 실패');
                    setAllAdsFailed(true);
                    break;
                  default:
                    console.log('ℹ️ [광고 테스트] 전면형 광고 기타 이벤트:', interstitialEvent.type, interstitialEvent.data);
                }
              },
              onError: (interstitialError) => {
                console.error('❌ [광고 테스트] 전면형 광고 불러오기 오류:', interstitialError);
                setAllAdsFailed(true);
              },
            });
            setInterstitialAdCleanup(() => interstitialCleanup);
            break;
          default:
            console.log('ℹ️ [광고 테스트] 리워드 광고 기타 이벤트:', event.type, event.data);
        }
      },
      onError: (error) => {
        console.error('❌ [광고 테스트] 리워드 광고 불러오기 오류:', error);
        console.log('🔄 [광고 테스트] 전면형 광고 로드 시도');
        
        // 리워드 오류 시 전면형 광고 로드 시도
        const interstitialCleanup = GoogleAdMob.loadAppsInTossAdMob({
          options: {
            adGroupId: INTERSTITIAL_AD_GROUP_ID,
          },
          onEvent: (interstitialEvent) => {
            console.log('📢 [광고 테스트] 전면형 광고 이벤트 발생:', interstitialEvent.type);
            switch (interstitialEvent.type) {
              case 'loaded':
                console.log('✅ [광고 테스트] 전면형 광고 로드 성공!', interstitialEvent.data);
                setInterstitialAdLoaded(true);
                break;
              case 'failedToLoad':
                console.error('❌ [광고 테스트] 전면형 광고 로드 실패:', interstitialEvent.data);
                console.error('❌ [광고 테스트] 모든 광고 로드 실패');
                setAllAdsFailed(true);
                break;
              default:
                console.log('ℹ️ [광고 테스트] 전면형 광고 기타 이벤트:', interstitialEvent.type, interstitialEvent.data);
            }
          },
          onError: (interstitialError) => {
            console.error('❌ [광고 테스트] 전면형 광고 불러오기 오류:', interstitialError);
            setAllAdsFailed(true);
          },
        });
        setInterstitialAdCleanup(() => interstitialCleanup);
      },
    });

    setRewardedAdCleanup(() => rewardedCleanup);
    console.log('🔄 [광고 테스트] 리워드 광고 로드 함수 실행 완료');

    // 컴포넌트 언마운트 시 cleanup
    return () => {
      console.log('🧹 [광고 테스트] 컴포넌트 언마운트 - 광고 cleanup 실행');
      rewardedCleanup();
      if (interstitialAdCleanup) interstitialAdCleanup();
    };
  }, []); // 페이지 로드 시 한 번만 실행

  // 카드가 모두 뒤집혔을 때 광고 로드 상태 확인 (더 이상 로드하지 않음, 이미 로드 중)
  useEffect(() => {
    if (flippedCards.length === 3) {
      console.log('🔮 [광고 테스트] 카드 3장 모두 뒤집힘 - 광고 로드 상태 확인');
      if (rewardedAdLoaded) {
        console.log('✅ [광고 테스트] 리워드 광고 이미 로드 완료');
      } else if (interstitialAdLoaded) {
        console.log('✅ [광고 테스트] 전면형 광고 이미 로드 완료');
      } else if (allAdsFailed) {
        console.warn('⚠️ [광고 테스트] 광고 로드 실패 상태');
      } else {
        console.log('⏳ [광고 테스트] 광고 로드 진행 중...');
      }
    }
  }, [flippedCards.length, rewardedAdLoaded, interstitialAdLoaded, allAdsFailed]);

  // 카드가 모두 뒤집혔을 때 광고 로드
  useEffect(() => {
    if (flippedCards.length === 3) {
      // 상태 초기화
      setRewardedAdLoaded(false);
      setInterstitialAdLoaded(false);
      setAllAdsFailed(false);

      console.log('🔮 [광고 테스트] 카드 3장 모두 뒤집힘 - 광고 로드 시작');
      console.log('📝 [광고 테스트] 전면형 광고 ID:', INTERSTITIAL_AD_GROUP_ID);
      console.log('📝 [광고 테스트] 리워드 광고 ID:', REWARDED_AD_GROUP_ID);
      
      // 광고 지원 여부 확인
      if (GoogleAdMob.loadAppsInTossAdMob.isSupported() !== true) {
        console.warn('⚠️ [광고 테스트] GoogleAdMob이 지원되지 않는 환경입니다.');
        setAllAdsFailed(true);
        toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
          icon: 'icon-warning-circle-red500',
          iconType: 'circle',
        });
        return;
      }

      console.log('✅ [광고 테스트] GoogleAdMob 지원됨 - 리워드 광고 로드 시도');
      // toast.openToast('조언 카드 광고를 준비하고 있어요', {
      //   icon: 'icon-loading',
      //   iconType: 'circle',
      // });

      // 1단계: 리워드 광고 로드 시도
      const rewardedCleanup = GoogleAdMob.loadAppsInTossAdMob({
        options: {
          adGroupId: REWARDED_AD_GROUP_ID,
        },
        onEvent: (event) => {
          console.log('📢 [광고 테스트] 리워드 광고 이벤트 발생:', event.type);
          switch (event.type) {
            case 'loaded':
              console.log('✅ [광고 테스트] 리워드 광고 로드 성공!', event.data);
              setRewardedAdLoaded(true);
              // toast.openToast('조언 카드 광고 준비 완료!', {
              //   icon: 'icon-check',
              //   iconType: 'circle',
              // });
              break;
            case 'failedToLoad':
              console.error('❌ [광고 테스트] 리워드 광고 로드 실패:', event.data);
              console.log('🔄 [광고 테스트] 전면형 광고 로드 시도');
              
              // 리워드 실패 시 전면형 광고 로드 시도
              const interstitialCleanup = GoogleAdMob.loadAppsInTossAdMob({
                options: {
                  adGroupId: INTERSTITIAL_AD_GROUP_ID,
                },
                onEvent: (interstitialEvent) => {
                  console.log('📢 [광고 테스트] 전면형 광고 이벤트 발생:', interstitialEvent.type);
                  switch (interstitialEvent.type) {
                    case 'loaded':
                      console.log('✅ [광고 테스트] 전면형 광고 로드 성공!', interstitialEvent.data);
                      setInterstitialAdLoaded(true);
                      // toast.openToast('조언 카드 광고 준비 완료!', {
                      //   icon: 'icon-check',
                      //   iconType: 'circle',
                      // });
                      break;
                    case 'failedToLoad':
                      console.error('❌ [광고 테스트] 전면형 광고 로드 실패:', interstitialEvent.data);
                      console.error('❌ [광고 테스트] 모든 광고 로드 실패');
                      setAllAdsFailed(true);
                      break;
                    default:
                      console.log('ℹ️ [광고 테스트] 전면형 광고 기타 이벤트:', interstitialEvent.type, interstitialEvent.data);
                  }
                },
                onError: (interstitialError) => {
                  console.error('❌ [광고 테스트] 전면형 광고 불러오기 오류:', interstitialError);
                  setAllAdsFailed(true);
                },
              });
              setInterstitialAdCleanup(() => interstitialCleanup);
              break;
            default:
              console.log('ℹ️ [광고 테스트] 리워드 광고 기타 이벤트:', event.type, event.data);
          }
        },
        onError: (error) => {
          console.error('❌ [광고 테스트] 리워드 광고 불러오기 오류:', error);
          console.log('🔄 [광고 테스트] 전면형 광고 로드 시도');
          
          // 리워드 오류 시 전면형 광고 로드 시도
          const interstitialCleanup = GoogleAdMob.loadAppsInTossAdMob({
            options: {
              adGroupId: INTERSTITIAL_AD_GROUP_ID,
            },
            onEvent: (interstitialEvent) => {
              console.log('📢 [광고 테스트] 전면형 광고 이벤트 발생:', interstitialEvent.type);
              switch (interstitialEvent.type) {
                case 'loaded':
                  console.log('✅ [광고 테스트] 전면형 광고 로드 성공!', interstitialEvent.data);
                  setInterstitialAdLoaded(true);
                  // toast.openToast('조언 카드 광고 준비 완료!', {
                  //   icon: 'icon-check',
                  //   iconType: 'circle',
                  // });
                  break;
                case 'failedToLoad':
                  console.error('❌ [광고 테스트] 전면형 광고 로드 실패:', interstitialEvent.data);
                  console.error('❌ [광고 테스트] 모든 광고 로드 실패');
                  setAllAdsFailed(true);
                  break;
                default:
                  console.log('ℹ️ [광고 테스트] 전면형 광고 기타 이벤트:', interstitialEvent.type, interstitialEvent.data);
              }
            },
            onError: (interstitialError) => {
              console.error('❌ [광고 테스트] 전면형 광고 불러오기 오류:', interstitialError);
              setAllAdsFailed(true);
            },
          });
          setInterstitialAdCleanup(() => interstitialCleanup);
        },
      });

      setRewardedAdCleanup(() => rewardedCleanup);
      console.log('🔄 [광고 테스트] 리워드 광고 로드 함수 실행 완료');

      // 컴포넌트 언마운트 시 cleanup
      return () => {
        console.log('🧹 [광고 테스트] 컴포넌트 언마운트 - 광고 cleanup 실행');
        rewardedCleanup();
        // interstitialCleanup은 리워드 실패 시에만 설정되므로 조건부로 확인
        // cleanup 함수는 클로저로 저장되므로 직접 호출
      };
    } else {
      // 카드가 모두 뒤집히지 않았을 때는 기존 cleanup 실행
      setRewardedAdCleanup((prev) => {
        if (prev) {
          console.log('🔄 [광고 테스트] 카드가 모두 뒤집히지 않음 - 기존 광고 cleanup');
          prev();
        }
        return null;
      });
      setInterstitialAdCleanup((prev) => {
        if (prev) {
          prev();
        }
        return null;
      });
      setRewardedAdLoaded(false);
      setInterstitialAdLoaded(false);
      setAllAdsFailed(false);
    }
  }, [flippedCards.length, toast]);

  // 조언 카드를 실제로 표시하는 함수
  const showAdviceCard = async () => {
    if (!topic) return;

    // 캐시된 카드가 없으면 먼저 로드
    let allCards = allCardsCache;
    if (!allCards) {
      allCards = await tarotAPI.getAllCards();
      setAllCardsCache(allCards);
    }
    
    // 이미 선택된 카드 제외
    const availableCards = allCards.filter(card => !selectedCards.includes(card.tarot_id));
    
    if (availableCards.length > 0) {
      // 랜덤으로 조언 카드 선택
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      const selectedAdviceCard = availableCards[randomIndex];
      
      // 주제에 맞는 조언 가져오기
      const topicMap: Record<string, keyof TarotReading> = {
        'love': 'final_advice_love',
        'success': 'final_advice_career',
        'career': 'final_advice_career',
        'money': 'final_advice_money',
        'wealth': 'final_advice_money'
      };
      
      const adviceKey = topicMap[topic] || 'final_advice_love';
      const adviceText = selectedAdviceCard[adviceKey] as string || '';
      
      setAdviceCard({
        cardId: selectedAdviceCard.tarot_id,
        cardData: selectedAdviceCard,
        adviceText
      });
      setShowAdvice(true);
    }
  };

  // 조언 카드 가져오기 (버튼 클릭 시 - 광고 표시 후 조언 카드 표시)
  const loadAdviceCard = async () => {
    if (selectedCards.length >= 3 && topic) {
      // 조언 카드 요청 추적
      Analytics.click({
        event_name: 'advice_card_requested',
        topic: topic
      });
      // 광고 로드 실패 확인
      if (allAdsFailed) {
        toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
          icon: 'icon-warning-circle-red500',
          iconType: 'circle',
        });
        return;
      }

      // 광고 지원 여부 확인
      if (GoogleAdMob.showAppsInTossAdMob.isSupported() !== true) {
        toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
          icon: 'icon-warning-circle-red500',
          iconType: 'circle',
        });
        return;
      }

      // 리워드 광고가 로드되어 있으면 리워드 광고 표시
      if (rewardedAdLoaded) {
        console.log('📺 [광고 테스트] 리워드 광고 표시 시도');
        GoogleAdMob.showAppsInTossAdMob({
          options: {
            adGroupId: REWARDED_AD_GROUP_ID,
          },
          onEvent: (event) => {
            console.log('📢 [광고 테스트] 리워드 광고 표시 이벤트:', event.type);
            switch (event.type) {
              case 'dismissed':
                console.log('✅ [광고 테스트] 리워드 광고 닫힘 - 조언 카드 표시');
                Analytics.click({
                  event_name: 'advice_card_unlocked_ad',
                  topic: topic || 'unknown',
                  ad_type: 'rewarded'
                });
                showAdviceCard();
                break;
              case 'userEarnedReward':
                console.log('🎁 [광고 테스트] 리워드 획득 - 조언 카드 표시', event.data);
                Analytics.click({
                  event_name: 'advice_card_unlocked_ad',
                  topic: topic || 'unknown',
                  ad_type: 'rewarded'
                });
                showAdviceCard();
                break;
              case 'failedToShow':
                console.error('❌ [광고 테스트] 리워드 광고 표시 실패');
                toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
                  icon: 'icon-warning-circle-red500',
                  iconType: 'circle',
                });
                break;
              case 'show':
                console.log('📺 [광고 테스트] 리워드 광고 컨텐츠 표시됨');
                break;
            }
          },
          onError: (error) => {
            console.error('❌ [광고 테스트] 리워드 광고 표시 오류:', error);
            toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
              icon: 'icon-warning-circle-red500',
              iconType: 'circle',
            });
          },
        });
        return;
      }

      // 전면형 광고가 로드되어 있으면 전면형 광고 표시
      if (interstitialAdLoaded) {
        console.log('📺 [광고 테스트] 전면형 광고 표시 시도');
        GoogleAdMob.showAppsInTossAdMob({
          options: {
            adGroupId: INTERSTITIAL_AD_GROUP_ID,
          },
          onEvent: (event) => {
            console.log('📢 [광고 테스트] 전면형 광고 표시 이벤트:', event.type);
            switch (event.type) {
              case 'dismissed':
                console.log('✅ [광고 테스트] 전면형 광고 닫힘 - 조언 카드 표시');
                Analytics.click({
                  event_name: 'advice_card_unlocked_ad',
                  topic: topic || 'unknown',
                  ad_type: 'interstitial'
                });
                showAdviceCard();
                break;
              case 'failedToShow':
                console.error('❌ [광고 테스트] 전면형 광고 표시 실패');
                toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
                  icon: 'icon-warning-circle-red500',
                  iconType: 'circle',
                });
                break;
              case 'show':
                console.log('📺 [광고 테스트] 전면형 광고 컨텐츠 표시됨');
                break;
            }
          },
          onError: (error) => {
            console.error('❌ [광고 테스트] 전면형 광고 표시 오류:', error);
            toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
              icon: 'icon-warning-circle-red500',
              iconType: 'circle',
            });
          },
        });
        return;
      }

      // 광고가 로드되지 않은 경우
      toast.openToast('광고를 받아올 수 없어요. 나중에 다시 시도해주세요.', {
        icon: 'icon-warning-circle-red500',
        iconType: 'circle',
      });
    }
  };

  useEffect(() => {
    // URL 파라미터에서 데이터 가져오기
    const cardsParam = searchParams.get('cards');
    const designParam = searchParams.get('design');
    
    console.log('Cards param:', cardsParam);
    console.log('Design param:', designParam);
    
    if (cardsParam) {
      try {
        const decoded = decodeURIComponent(cardsParam);
        const parsed = JSON.parse(decoded);
        console.log('Parsed cards:', parsed);
        setSelectedCards(parsed);
      } catch (e) {
        console.error('Failed to parse cards:', e, cardsParam);
      }
    }
    
    if (designParam) {
      try {
        const decoded = decodeURIComponent(designParam);
        const parsed = JSON.parse(decoded);
        console.log('Parsed design:', parsed);
        setBackDesign(parsed);
      } catch (e) {
        console.error('Failed to parse design:', e, designParam);
      }
    }
  }, [searchParams]);

  const handleCardFlip = (index: number) => {
    if (!flippedCards.includes(index)) {
      const positions = ['과거', '현재', '미래'];
      Analytics.click({
        event_name: 'card_flipped',
        position: positions[index],
        card_index: index,
        topic: topic || 'unknown'
      });
      
      const newFlippedCards = [...flippedCards, index];
      setFlippedCards(newFlippedCards);
      
      // 3장 모두 뒤집혔을 때 추적
      if (newFlippedCards.length === 3) {
        Analytics.click({
          event_name: 'all_cards_revealed',
          topic: topic || 'unknown'
        });
      }
    }
  };

  const handleReset = () => {
    // 히스토리를 완전히 리셋하면서 메인화면으로 이동
    window.history.replaceState({ page: 'main' }, '', '/');
    navigate('/', { replace: true });
  };

  // 브라우저 뒤로가기 버튼 처리
  useEffect(() => {
    const handlePopState = () => {
      // 뒤로가기 시 히스토리를 완전히 리셋하면서 메인화면으로 이동
      window.history.replaceState({ page: 'main' }, '', '/');
      navigate('/', { replace: true });
    };

    // popstate 이벤트 리스너 추가
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  console.log('Selected cards:', selectedCards);
  console.log('Back design:', backDesign);

  if (selectedCards.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Top
          title={
            <Top.TitleParagraph size={22} color={adaptive.grey900}>
              당신의 타로 리딩
            </Top.TitleParagraph>
          }
        />
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Post.Paragraph>카드 정보를 불러올 수 없습니다.</Post.Paragraph>
          <FixedBottomCTA onClick={() => {
            window.history.replaceState({ page: 'main' }, '', '/');
            navigate('/', { replace: true });
          }}>
            돌아가기
          </FixedBottomCTA>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Top
        title={
          <Top.TitleParagraph size={22} color={adaptive.grey900}>
            {`당신의 ${TOPIC_LABEL_MAP[topic ?? ''] ?? '타로'} 흐름`}
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph color={adaptive.grey700}>과거에서 미래로 이어지는 당신의 이야기를 확인해 보세요.</Top.SubtitleParagraph>
        }
        lowerGap={0}
      />

      <div style={{ padding: '16px 20px', overflow: 'visible', maxWidth: '100%' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          gap: '32px',
          marginBottom: '48px',
          width: '100%',
          overflow: 'visible'
        }}>
          {selectedCards.map((cardId, idx) => {
            const isFlipped = flippedCards.includes(idx);
            const cardInfo = cardDataMap.get(cardId);

            return (
              <div 
                key={cardId} 
                style={{ 
                  textAlign: 'left',
                  width: '100%',
                  maxWidth: '100%',
                  background: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    overflow: 'visible'
                  }}
                >
                  <div 
                    style={{
                      position: 'relative',
                      width: '220px',
                      height: '340px',
                      borderRadius: '22px',
                      overflow: 'visible',
                      boxShadow: '0 25px 45px rgba(15,23,42,0.25)',
                      cursor: 'pointer',
                      marginBottom: '20px'
                    }}
                    onClick={() => handleCardFlip(idx)}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        transition: 'transform 0.6s ease',
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                      }}
                    >
                      {/* 카드 뒷면 */}
                      <div 
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '22px',
                          overflow: 'hidden'
                        }}
                      >
                        <CardBack config={backDesign} />
                        <div style={{
                          position: 'absolute',
                          bottom: '22px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(15, 23, 42, 0.85)',
                          color: '#fff',
                          padding: '7px 18px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          letterSpacing: '0.4px'
                        }}>
                          탭하여 공개
                        </div>
                      </div>

                      {/* 카드 앞면 - 이미지만 표시 */}
                      <div 
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          borderRadius: '22px',
                          overflow: 'visible',
                          backgroundColor: 'transparent'
                        }}
                      >
                        <TarotCardWithEffects
                          image={getCardImagePath(cardId)}
                          alt={cardInfo?.name || `Card ${cardId}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '22px'
                          }}
                          behindGlowEnabled={true}
                          behindGlowColor="#667eea"
                          behindGlowSize={20}
                          enableTilt={true}
                          enableMobileTilt={true}
                          mobileTiltSensitivity={0.5}
                          onError={(e) => {
                            e.currentTarget.src = getCardImagePath(1);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 카드 설명 */}
                  {isFlipped && (
                    <div style={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      marginTop: '20px'
                    }}>
                      {/* 위치 제목 */}
                      <div style={{
                        paddingBottom: '12px',
                        borderBottom: `2px solid ${adaptive.grey200}`,
                        marginBottom: '16px'
                      }}>
                        <Post.H2 style={{
                          fontSize: '18px',
                          letterSpacing: '0.6px',
                          color: '#0f172a',
                          margin: 0,
                          fontWeight: 700
                        }}>
                          {spreadPositions[idx]}
                        </Post.H2>
                      </div>

                      {cardInfo ? (
                        <>
                          {/* 카드 이름 */}
                          <div style={{
                            marginBottom: '16px',
                            paddingBottom: '16px',
                            borderBottom: `1px solid ${adaptive.grey200}`
                          }}>
                            <Post.H3 style={{
                              fontSize: '20px',
                              fontWeight: 700,
                              color: '#111827',
                              margin: 0
                            }}>
                              {cardInfo.name}({cardInfo.eng_name})
                            </Post.H3>
                          </div>

                          {/* 타임라인 섹션 (과거/현재/미래에 따라 다른 내용 표시) */}
                          <div style={{
                            backgroundColor: '#eff6ff',
                            borderRadius: '12px',
                            padding: '20px',
                            borderLeft: `4px solid #1d4ed8`,
                            textAlign: 'left'
                          }}>
                            <div style={{ 
                              color: '#1d4ed8',
                              fontWeight: 600,
                              lineHeight: 1.8,
                              fontSize: '16px',
                              margin: 0,
                              textAlign: 'left',
                              wordBreak: 'normal',
                              wordSpacing: 'normal',
                              letterSpacing: 'normal'
                            }}>
                              {(() => {
                                const text = idx === 0 ? cardInfo.timeline.past : 
                                            idx === 1 ? cardInfo.timeline.present : 
                                            cardInfo.timeline.future;
                                // 문장 단위로 분리 (마침표, 느낌표, 물음표 기준)
                                const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                                
                                return sentences.map((sentence, i) => (
                                  <div key={i} style={{ 
                                    marginBottom: i < sentences.length - 1 ? '12px' : '0',
                                    textAlign: 'left',
                                    wordBreak: 'normal',
                                    wordSpacing: 'normal',
                                    letterSpacing: 'normal'
                                  }}>
                                    {sentence.trim()}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <Post.Paragraph style={{ 
                          color: adaptive.grey600,
                          marginBottom: '12px',
                          fontSize: '12px'
                        }}>
                          카드 {cardId}번
                        </Post.Paragraph>
                      )}
                      
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 조언 카드 */}
          {showAdvice && adviceCard && (
            <div 
              style={{ 
                textAlign: 'left',
                width: '100%',
                maxWidth: '100%',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '24px',
                  overflow: 'visible'
                }}
              >
                <div 
                  style={{
                    position: 'relative',
                    width: '220px',
                    height: '340px',
                    borderRadius: '22px',
                    overflow: 'visible',
                    boxShadow: '0 25px 45px rgba(15,23,42,0.25)',
                    cursor: 'pointer',
                    marginBottom: '20px'
                  }}
                  onClick={() => setAdviceCardFlipped(!adviceCardFlipped)}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      transition: 'transform 0.6s ease',
                      transformStyle: 'preserve-3d',
                      transform: adviceCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* 카드 뒷면 */}
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '22px',
                        overflow: 'hidden'
                      }}
                    >
                      <CardBack config={backDesign} />
                      <div style={{
                        position: 'absolute',
                        bottom: '22px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#fff',
                        padding: '7px 18px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.4px'
                      }}>
                        탭하여 공개
                      </div>
                    </div>

                    {/* 카드 앞면 - 이미지만 표시 */}
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        borderRadius: '22px',
                        overflow: 'visible',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <TarotCardWithEffects
                        image={getCardImagePath(adviceCard.cardId)}
                        alt={(() => {
                          const adviceCardInfo = cardDataMap.get(adviceCard.cardId);
                          return adviceCardInfo?.name || adviceCard.cardData?.card_name_kr || 'Advice Card';
                        })()}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '22px'
                        }}
                        behindGlowEnabled={true}
                        behindGlowColor="#667eea"
                        behindGlowSize={20}
                        enableTilt={true}
                        enableMobileTilt={true}
                        mobileTiltSensitivity={0.5}
                        onError={(e) => {
                          e.currentTarget.src = getCardImagePath(1);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 조언 카드 설명 */}
                {adviceCardFlipped && (
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: '20px'
                  }}>
                    {/* 조언 제목 */}
                    <div style={{
                      paddingBottom: '12px',
                      borderBottom: `2px solid ${adaptive.grey200}`,
                      marginBottom: '16px'
                    }}>
                      <Post.H2 style={{
                        fontSize: '18px',
                        letterSpacing: '0.6px',
                        color: '#0f172a',
                        margin: 0,
                        fontWeight: 700
                      }}>
                        조언
                      </Post.H2>
                    </div>

                    {(() => {
                      const adviceCardInfo = cardDataMap.get(adviceCard.cardId);
                      return adviceCardInfo ? (
                        <>
                          {/* 카드 이름 */}
                          <div style={{
                            marginBottom: '16px',
                            paddingBottom: '16px',
                            borderBottom: `1px solid ${adaptive.grey200}`
                          }}>
                            <Post.H3 style={{
                              fontSize: '20px',
                              fontWeight: 700,
                              color: '#111827',
                              margin: 0
                            }}>
                              {adviceCardInfo.name}({adviceCardInfo.eng_name})
                            </Post.H3>
                          </div>

                          {/* 조언 텍스트 섹션 */}
                          <div style={{
                            backgroundColor: '#eff6ff',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '16px',
                            borderLeft: `4px solid #1d4ed8`,
                            textAlign: 'left'
                          }}>
                            <div style={{ 
                              color: '#1d4ed8',
                              fontWeight: 600,
                              lineHeight: 1.8,
                              fontSize: '16px',
                              margin: 0,
                              textAlign: 'left',
                              wordBreak: 'normal',
                              wordSpacing: 'normal',
                              letterSpacing: 'normal'
                            }}>
                              {(() => {
                                const text = adviceCard.adviceText;
                                // 문장 단위로 분리 (마침표, 느낌표, 물음표 기준)
                                const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                                
                                return sentences.map((sentence, i) => (
                                  <div key={i} style={{ 
                                    marginBottom: i < sentences.length - 1 ? '12px' : '0',
                                    textAlign: 'left',
                                    wordBreak: 'normal',
                                    wordSpacing: 'normal',
                                    letterSpacing: 'normal'
                                  }}>
                                    {sentence.trim()}
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>

                          {/* 주의사항 섹션 */}
                          {adviceCardInfo.caution && (
                            <div style={{
                              backgroundColor: '#fff5e6',
                              borderRadius: '12px',
                              padding: '20px',
                              borderLeft: `4px solid #f59e0b`,
                              marginTop: '16px'
                            }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#d97706',
                                margin: '0 0 12px 0'
                              }}>
                                주의사항
                              </div>
                              <div style={{
                                lineHeight: 1.8,
                                color: '#92400e',
                                fontSize: '16px',
                                margin: 0,
                                textAlign: 'left',
                                wordBreak: 'normal',
                                wordSpacing: 'normal',
                                letterSpacing: 'normal',
                                fontWeight: 600
                              }}>
                                {(() => {
                                  const text = adviceCardInfo.caution;
                                  // 문장 단위로 분리 (마침표, 느낌표, 물음표 기준)
                                  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                                  
                                  return sentences.map((sentence, i) => (
                                    <div key={i} style={{ 
                                      marginBottom: i < sentences.length - 1 ? '12px' : '0',
                                      textAlign: 'left',
                                      wordBreak: 'normal',
                                      wordSpacing: 'normal',
                                      letterSpacing: 'normal'
                                    }}>
                                      {sentence.trim()}
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {adviceCard.cardData && (
                            <div style={{
                              marginBottom: '16px',
                              paddingBottom: '16px',
                              borderBottom: `1px solid ${adaptive.grey200}`
                            }}>
                              <Post.H3 style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#111827',
                                margin: 0
                              }}>
                                {adviceCard.cardData.card_name_kr}
                              </Post.H3>
                            </div>
                          )}
                          <div style={{
                            backgroundColor: '#eff6ff',
                            borderRadius: '12px',
                            padding: '16px',
                            borderLeft: `4px solid #1d4ed8`
                          }}>
                            <Post.Paragraph style={{ 
                              color: '#1d4ed8',
                              fontWeight: 600,
                              lineHeight: 1.8,
                              fontSize: '15px',
                              margin: 0
                            }}>
                              {adviceCard.adviceText}
                            </Post.Paragraph>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {flippedCards.length === 3 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            marginBottom: '100px'
          }}>
            {!showAdvice && (
              <div 
                onClick={loadAdviceCard}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setGlarePosition({ x, y });
                }}
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
                  gap: '22px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  setIsHovering(true);
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 30px 70px -30px rgba(15,23,42,0.65)';
                }}
                onMouseLeave={(e) => {
                  setIsHovering(false);
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 25px 60px -30px rgba(15,23,42,0.55)';
                }}
              >
                {/* 뿌옇게 처리된 오버레이 */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 1,
                  borderRadius: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: adaptive.grey900,
                      marginBottom: '8px'
                    }}>
                      ▶️ 광고 보고 조언카드 무료로 받기
                    </div>
                  </div>
                </div>
                {/* GlareHover 효과 - 자동 애니메이션 또는 마우스 추적 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isHovering 
                      ? `radial-gradient(circle 300px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.5), transparent 70%)`
                      : undefined,
                    pointerEvents: 'none',
                    zIndex: 2,
                    borderRadius: '28px',
                    transition: isHovering ? 'background 0.1s ease-out' : 'none',
                    mixBlendMode: 'overlay',
                    animation: !isHovering ? `glareMove 4s ease-in-out infinite` : 'none'
                  }}
                />
                <style>{`
                  @keyframes glareMove {
                    0% {
                      background: radial-gradient(circle 300px at 20% 30%, rgba(255, 255, 255, 0.4), transparent 70%);
                    }
                    25% {
                      background: radial-gradient(circle 300px at 80% 40%, rgba(255, 255, 255, 0.5), transparent 70%);
                    }
                    50% {
                      background: radial-gradient(circle 300px at 50% 70%, rgba(255, 255, 255, 0.4), transparent 70%);
                    }
                    75% {
                      background: radial-gradient(circle 300px at 30% 60%, rgba(255, 255, 255, 0.5), transparent 70%);
                    }
                    100% {
                      background: radial-gradient(circle 300px at 70% 20%, rgba(255, 255, 255, 0.4), transparent 70%);
                    }
                  }
                `}</style>

                {/* 조언 카드 미리보기 (뿌옇게) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px',
                    opacity: 0.3,
                    filter: 'blur(4px)',
                    pointerEvents: 'none'
                  }}
                >
                  <div 
                    style={{
                      position: 'relative',
                      width: '220px',
                      height: '340px',
                      borderRadius: '22px',
                      overflow: 'hidden',
                      boxShadow: '0 25px 45px rgba(15,23,42,0.25)'
                    }}
                  >
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CardBack config={backDesign} />
                      <div style={{
                        position: 'absolute',
                        bottom: '22px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#fff',
                        padding: '7px 18px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.4px'
                      }}>
                        조언
                      </div>
                    </div>
                  </div>

                  {/* 조언 카드 설명 미리보기 */}
                  <div style={{
                    width: '100%',
                    backgroundColor: '#fff',
                    borderRadius: '20px',
                    boxShadow: '0 20px 45px rgba(15,23,42,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '26px 24px'
                  }}>
                    <Post.H2 style={{
                      fontSize: '18px',
                      letterSpacing: '0.6px',
                      color: '#0f172a'
                    }}>
                      조언
                    </Post.H2>
                    <Post.H3 style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#111827'
                    }}>
                      조언 카드
                    </Post.H3>
                    <Post.Paragraph style={{ 
                      color: '#1d4ed8',
                      marginBottom: '10px',
                      fontWeight: 600,
                      lineHeight: 1.7
                    }}>
                      조언 카드의 메시지를 확인하세요
                    </Post.Paragraph>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => navigate('/topic-selection')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                width: '100%',
                maxWidth: '380px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              <span>다른 주제도 확인</span>
            </button>
            <button
              onClick={() => navigate('/daily-card')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#8b5cf6',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                width: '100%',
                maxWidth: '380px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#7c3aed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8b5cf6';
              }}
            >
              <span>오늘의 수호카드 받기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TarotResultPage;
