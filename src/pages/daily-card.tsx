import React, { useState, useEffect } from 'react'
import { useNavigate } from '../router.gen';
import { tarotAPI, TarotReading } from '../lib/supabase'
import CardBack from '../components/CardBack'
import TarotCardWithEffects from '../components/TarotCardWithEffects'
import { Top, Post, Button } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import cardTTData from '../data/card_tt.json';
import { Analytics } from '@apps-in-toss/web-framework';
import { trackClickEvent } from '../firebase/analytics';

// 디버깅 모드 설정 (true로 하면 데이터 소스가 표시됨)
const DEBUG_MODE = true

interface Card extends TarotReading {
}

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

interface DebugProps {
  intent: string;
  dataSource: string;
}

const DebugInfo = ({ intent, dataSource }: DebugProps) => {
  if (!DEBUG_MODE) return null

  return (
    <div style={{
      fontSize: '0.8em',
      color: '#666',
      marginTop: '8px',
      padding: '4px 8px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      fontFamily: 'monospace'
    }}>
      <div><strong>[의도:</strong> {intent}]</div>
      <div><strong>[실데이터:</strong> {dataSource}]</div>
    </div>
  )
}

const DailyCard = () => {
  const navigate = useNavigate();
  const [dailyCard, setDailyCard] = useState<Card | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [hasUsedToday, setHasUsedToday] = useState(false)
  const [cardData, setCardData] = useState<CardTTData | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<keyof CardTTJson | null>(null)

  // 카드 이미지 경로 가져오기 (0~77번까지 모두 지원)
  const getCardImagePath = (cardId: number): string => {
    // 0~77 범위 내의 카드는 해당 번호의 이미지 사용
    const imageId = Math.max(0, Math.min(77, cardId));
    return new URL(`../assets/cards/${imageId}.webp`, import.meta.url).href;
  };

  useEffect(() => {
    loadDailyCard()
  }, [])

  // card_tt.json에서 카드 데이터 가져오기 (랜덤 주제 사용)
  useEffect(() => {
    if (dailyCard && selectedTopic) {
      const cardTTJson = cardTTData as CardTTJson;
      // 선택된 주제에서 카드 찾기
      const foundCard = cardTTJson[selectedTopic].find(card => card.id === dailyCard.tarot_id);
      if (foundCard) {
        setCardData(foundCard);
      }
    }
  }, [dailyCard, selectedTopic])

  // 날짜를 YYYY-MM-DD 형식으로 변환 (시간대 문제 방지)
  const getDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const loadDailyCard = async () => {
    try {
      const today = new Date()
      const todayStr = getDateString(today)

      // 초기화 플래그 확인 (초기화 후인지 확인)
      const wasReset = localStorage.getItem('dailyCardResetFlag') === 'true'
      
      // 초기화 후가 아니면 저장된 카드 데이터 확인
      const storedCardData = !wasReset ? localStorage.getItem('dailyCardData') : null
      if (storedCardData) {
        try {
          const { card, date, topic } = JSON.parse(storedCardData)
          // 날짜가 오늘과 같으면 저장된 카드 사용
          if (date === todayStr) {
            console.log('[DailyCard] 저장된 카드 사용:', card.card_name_kr, 'tarot_id:', card.tarot_id, 'topic:', topic)
            setDailyCard(card)
            setSelectedTopic(topic || 'love')
            setIsRevealed(true)
            setHasUsedToday(true)
            return
          } else {
            // 날짜가 다르면 오래된 데이터 삭제
            console.log('[DailyCard] 오래된 데이터 삭제:', date, 'vs 오늘:', todayStr)
            localStorage.removeItem('dailyCardData')
          }
        } catch (e) {
          // 파싱 에러 시 데이터 삭제
          console.error('[DailyCard] 파싱 에러, 데이터 삭제:', e)
          localStorage.removeItem('dailyCardData')
        }
      }

      // 오늘 날짜를 기반으로 고정된 카드 선택 (일관성을 위해)
      const cards = await tarotAPI.getAllCards()
      if (cards.length > 0) {
        // 올해 1월 1일 00:00:00을 기준으로 올바른 dayOfYear 계산
        const startOfYear = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0)
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
        const dayOfYear = Math.floor((todayStart.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
        
        // 사용자별 고유 ID 생성 (없으면 생성)
        let userId = localStorage.getItem('dailyCardUserId')
        if (!userId) {
          userId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          localStorage.setItem('dailyCardUserId', userId)
        }
        
        // 날짜 + 사용자 ID 기반 시드를 사용하여 사용자별로 다른 카드 선택
        // 초기화 후에는 완전히 랜덤하게 선택 (타임스탬프 기반)
        let seed: number
        if (wasReset) {
          // 초기화 후에는 완전히 랜덤하게 선택
          seed = Date.now() + Math.floor(Math.random() * 1000000)
          console.log('[DailyCard] 초기화 후 랜덤 카드 선택')
        } else {
          // 일반적인 경우: 날짜 + 사용자 ID 기반
          const userIdNum = parseInt(userId.split('-')[0]) || 0
          seed = today.getFullYear() * 10000 + dayOfYear + (userIdNum % 10000)
        }
        
        // 초기화 플래그 제거
        if (wasReset) {
          localStorage.removeItem('dailyCardResetFlag')
        }
        
        // 더 나은 해시 함수로 개선 (여러 소수 사용)
        let hash = seed
        hash = ((hash << 16) ^ (hash >> 16)) * 2246822507
        hash = ((hash << 16) ^ (hash >> 16)) * 2246822519
        hash = ((hash << 16) ^ (hash >> 16)) * 2654435761
        const cardIndex = Math.abs(hash) % cards.length
        const card = cards[cardIndex]

        // 주제 랜덤 선택 (love, success, wealth)
        const topics: (keyof CardTTJson)[] = ['love', 'success', 'wealth']
        let selectedTopic: keyof CardTTJson
        if (wasReset) {
          // 초기화 후에는 완전히 랜덤하게 선택
          selectedTopic = topics[Math.floor(Math.random() * topics.length)]
        } else {
          // 주제 선택을 위한 별도 해시
          let topicHash = seed * 7919
          topicHash = ((topicHash << 16) ^ (topicHash >> 16)) * 2246822527
          selectedTopic = topics[Math.abs(topicHash) % topics.length]
        }

        console.log('[DailyCard] 새 카드 계산:', {
          today: todayStr,
          dayOfYear,
          seed,
          hash: Math.abs(hash),
          cardIndex,
          totalCards: cards.length,
          selectedCard: card.card_name_kr,
          tarot_id: card.tarot_id,
          selectedTopic,
          wasReset
        })
        
        // 디버깅: localStorage 강제 클리어 (개발용 - 필요시 주석 해제)
        // localStorage.removeItem('dailyCardData')

        const todayCard: Card = card
        setDailyCard(todayCard)
        setSelectedTopic(selectedTopic)
      }
    } catch (error) {
      console.error('Error loading daily card:', error)
    }
  }

  const handleRevealCard = () => {
    if (!hasUsedToday && dailyCard && selectedTopic) {
      // 오늘의 운세흐름 카드 공개 추적
      const event = {
        event_name: 'daily_card_revealed',
        card_id: dailyCard.tarot_id,
        topic: selectedTopic
      };
      Analytics.click(event);
      trackClickEvent(event);
      
      setIsRevealed(true)
      setHasUsedToday(true)

      // 로컬 스토리지에 오늘의 카드 데이터 저장
      const today = new Date()
      const todayStr = getDateString(today)
      const cardData = { card: dailyCard, date: todayStr, topic: selectedTopic }
      localStorage.setItem('dailyCardData', JSON.stringify(cardData))
    }
  }

  const getDailyMeaning = () => {
    if (!dailyCard || !selectedTopic || !cardData) return ''
    // oneLineSummary만 반환
    return cardData.oneLineSummary || ''
  }

  return (
    <div className="daily-card">
      <div className="screen-container">
        <Top
          title={
            <Top.TitleParagraph size={22} color={adaptive.grey900}>
              오늘의 운세흐름
            </Top.TitleParagraph>
          }
          subtitleBottom={
            <Top.SubtitleParagraph color={adaptive.grey700}>
              오늘 하루 당신에게 전하는 메시지입니다
            </Top.SubtitleParagraph>
          }
          lowerGap={0}
        />

        <div className="daily-card-content">
          {!isRevealed ? (
            <div className="card-reveal-section">
              <div className="card-back-large" onClick={handleRevealCard}>
                <CardBack
                  className="card-back-image"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '20px'
                  }}
                />
                <div className="reveal-hint">
                  <p>카드를 터치하여 오늘의 운세를 확인하세요</p>
                </div>
              </div>
            </div>
          ) : dailyCard ? (
            <div className="card-revealed-section">
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '64px',
                padding: '16px',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}>
                {/* 카드 이미지 - 이미지만 표시 */}
                <div 
                  style={{
                    position: 'relative',
                    width: '220px',
                    height: '340px',
                    borderRadius: '22px',
                    overflow: 'visible',
                    boxShadow: '0 25px 45px rgba(15,23,42,0.25)',
                    backgroundColor: 'transparent',
                    marginBottom: '0px',
                    flexShrink: 0
                  }}
                >
                  <TarotCardWithEffects
                    image={getCardImagePath(dailyCard.tarot_id)}
                    alt={cardData?.name || dailyCard.card_name_kr}
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

                {/* 카드 설명 */}
                <div style={{
                  width: '100%',
                  maxWidth: '380px',
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  padding: '26px 24px',
                  boxShadow: '0 20px 45px rgba(15,23,42,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginTop: '0px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {cardData ? (
                    <>
                      <Post.H3 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '8px'
                      }}>
                        {cardData.name}
                      </Post.H3>
                      <Post.Paragraph style={{ 
                        color: adaptive.grey500,
                        marginBottom: '6px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}>
                        {cardData.eng_name}
                      </Post.Paragraph>
                      <Post.Paragraph style={{ 
                        color: '#1d4ed8',
                        marginBottom: '10px',
                        fontWeight: 600,
                        lineHeight: 1.7
                      }}>
                        {cardData.oneLineSummary}
                      </Post.Paragraph>
                    </>
                  ) : (
                    <Post.Paragraph style={{ 
                      color: adaptive.grey600,
                      marginBottom: '12px',
                      fontSize: '12px'
                    }}>
                      {dailyCard.card_name_kr}
                    </Post.Paragraph>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {isRevealed && (
          <div style={{ 
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <Button onClick={() => {
              // 현재 페이지를 히스토리에서 제거하고 새 페이지로 이동
              navigate('/topic-selection', { replace: true });
            }}>
              고민 더 깊게 보기
            </Button>
            <Button onClick={() => {
              // 현재 페이지를 히스토리에서 제거하고 새 페이지로 이동
              navigate('/tarot-talisman', { replace: true });
            }}>
              부족한 운 채우기
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}

export default DailyCard
