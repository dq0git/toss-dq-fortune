import React, { useState, useEffect } from 'react'
import { useNavigate } from '../router.gen';
import { tarotAPI, TarotReading } from '../lib/supabase'
import CardBack from '../components/CardBack'

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

  useEffect(() => {
    loadDailyCard()
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
      const cards = await tarotAPI.getAllCards()
      if (cards.length > 0) {
        const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
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
              <div className="daily-card-result">
                <div className="card-image-large">
                  <div className="card-placeholder-large">
                    <span className="card-name-large">{dailyCard.card_name_kr}</span>
                    {dailyCard.direction === 'reversed' && (
                      <span className="card-direction">역방향</span>
                    )}
                  </div>
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
      </div>
    </div>
  )
}

export default DailyCard
