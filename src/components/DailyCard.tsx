import React, { useState, useEffect } from 'react'
import { useNavigate } from '../router.gen.ts';
import { tarotAPI, TarotReading } from '../lib/supabase'
import { hasCardImage, getCardFallback, getImageId } from '../lib/cardImages'

// 디버깅 모드 설정 (true로 하면 데이터 소스가 표시됨)
const DEBUG_MODE = true

interface Card extends TarotReading {
  direction: 'upright' | 'reversed';
}

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
  const [guardianCard, setGuardianCard] = useState<Card | null>(null)
  const [showGuardianCard, setShowGuardianCard] = useState(false)

  useEffect(() => {
    loadDailyCard()
    checkGuardianCard()
  }, [])

  const loadDailyCard = async () => {
    try {
      const today = new Date()
      const todayStr = today.toDateString()

      // 오래된 오늘의 카드 데이터 확인
      const storedCardData = localStorage.getItem('dailyCardData')
      if (storedCardData) {
        const { card, direction, date } = JSON.parse(storedCardData)
        if (date === todayStr) {
          setDailyCard({ ...card, direction })
          setIsRevealed(true)
          setHasUsedToday(true)
          return
        }
      }

      // 오늘 날짜를 기반으로 고정된 카드 선택 (일관성을 위해)
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))

      const cards = await tarotAPI.getAllCards()
      if (cards.length > 0) {
        const cardIndex = dayOfYear % cards.length
        const card = cards[cardIndex]

        // 방향 랜덤 설정
        const direction: 'upright' | 'reversed' = Math.random() > 0.5 ? 'upright' : 'reversed'
        const todayCard: Card = { ...card, direction }
        setDailyCard(todayCard)
      }
    } catch (error) {
      console.error('Error loading daily card:', error)
    }
  }

  const handleRevealCard = () => {
    if (!hasUsedToday && dailyCard) {
      setIsRevealed(true)
      setHasUsedToday(true)

      // 로컬 스토리지에 오늘의 카드 데이터 저장
      const today = new Date().toDateString()
      const cardData = { card: dailyCard, direction: dailyCard.direction, date: today }
      localStorage.setItem('dailyCardData', JSON.stringify(cardData))
    }
  }

  const getDailyMeaning = () => {
    if (!dailyCard) return ''
    return tarotAPI.getDailyAdvice(dailyCard)
  }

  const checkGuardianCard = async () => {
    try {
      const storedGuardianData = localStorage.getItem('guardianCardData')
      const now = new Date().getTime()

      if (storedGuardianData) {
        const { card, timestamp } = JSON.parse(storedGuardianData)
        const hoursPassed = (now - timestamp) / (1000 * 60 * 60)

        // 24시간이 지나지 않았으면 저장된 카드 사용
        if (hoursPassed < 24) {
          setGuardianCard(card)
          setShowGuardianCard(true)
          return
        }
      }

      // 24시간이 지났거나 데이터가 없으면 새 카드 생성
      const cards = await tarotAPI.getAllCards()
      if (cards.length > 0) {
        // 메이저 아르카나 카드만 필터링 (수호 카드는 메이저 아르카나가 적합)
        const majorArcana = cards.filter(card => card.arcana_type === 'major')
        const selectedCards = majorArcana.length > 0 ? majorArcana : cards
        
        const randomCard = selectedCards[Math.floor(Math.random() * selectedCards.length)]
        const direction: 'upright' | 'reversed' = Math.random() > 0.5 ? 'upright' : 'reversed'
        const newGuardianCard: Card = { ...randomCard, direction }

        // 새 카드를 localStorage에 저장
        const guardianData = {
          card: newGuardianCard,
          timestamp: now
        }
        localStorage.setItem('guardianCardData', JSON.stringify(guardianData))

        setGuardianCard(newGuardianCard)
        setShowGuardianCard(true)
      }
    } catch (error) {
      console.error('Error loading guardian card:', error)
    }
  }

  const getGuardianMessage = () => {
    if (!guardianCard) return ''
    return tarotAPI.getDailyAdvice(guardianCard)
  }

  return (
    <div className="daily-card">
      <div className="screen-container">
        <header className="screen-header">
          <h1>✨ 오늘의 원카드</h1>
          <p>오늘 하루 당신에게 전하는 메시지입니다</p>
        </header>

        <div className="daily-card-content">
          {!isRevealed ? (
            <div className="card-reveal-section">
              <div className="card-back-large" onClick={handleRevealCard}>
                <img
                  src={new URL(`../assets/cards/back.png`, import.meta.url).href}
                  alt="카드 뒷면"
                  className="card-back-image"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
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
              <div className="daily-card-result">
                <div className="card-image-large">
                  <img
                    src={new URL(`../assets/cards/${getImageId(dailyCard.tarot_id)}.png`, import.meta.url).href}
                    alt={dailyCard.card_name_kr}
                    className="card-image-display"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                </div>
                <div className="daily-meaning">
                  <h3>오늘의 메시지</h3>
                  <p>{getDailyMeaning()}</p>
                  <DebugInfo
                    intent="오늘의 운세 일일 조언 해석"
                    dataSource={`tarot_readings 테이블 ${dailyCard.tarot_id}:${dailyCard.card_name_kr} 카드, daily_advice 컬럼`}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="daily-actions">
          <button className="action-button secondary" onClick={() => navigate('/')}>
            🔄 메인으로 돌아가기
          </button>
          {isRevealed && (
            <>
              <button className="action-button primary">
                💾 오늘의 카드 저장하기
              </button>
              <div className="follow-up-actions">
                <button className="follow-up-button" onClick={() => navigate('/topic-selection')}>
                  🔮 심층 운세 보기
                </button>
                <button className="follow-up-button" onClick={() => navigate('/tarot-talisman')}>
                  🛡️ 타로 부적 만들기
                </button>
              </div>
            </>
          )}
        </div>

        <div className="daily-info">
          <p>💡 매일 다른 카드로 새로운 메시지를 받아보세요</p>
        </div>

        {showGuardianCard && guardianCard && (
          <div className="guardian-card-section">
            <div className="guardian-card-header">
              <h3>🛡️ 오늘의 수호 카드</h3>
              <p className="guardian-subtitle">24시간 동안 당신을 지켜줄 카드입니다</p>
              <p className="guardian-timing">수호 카드는 24시간마다 변경됩니다</p>
            </div>
            <div className="guardian-card-display">
              <div className="guardian-card-info">
                <div className="guardian-card-image">
                  <img
                    src={new URL(`../assets/cards/${getImageId(guardianCard.tarot_id)}.png`, import.meta.url).href}
                    alt={guardianCard.card_name_kr}
                    className="card-image-guardian"
                    style={{
                      width: '120px',
                      height: '180px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      margin: '0 auto 15px',
                      display: 'block'
                    }}
                  />
                </div>
                <div className="guardian-card-name">
                  {guardianCard.card_name_kr}
                  {guardianCard.direction === 'reversed' && (
                    <span className="card-direction-small"> (역방향)</span>
                  )}
                </div>
                <div className="guardian-card-message">
                  <p>{getGuardianMessage()}</p>
                  <DebugInfo
                    intent="수호 카드 메시지"
                    dataSource={`tarot_readings 테이블 ${guardianCard.tarot_id}:${guardianCard.card_name_kr} 카드, daily_advice 컬럼`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyCard
