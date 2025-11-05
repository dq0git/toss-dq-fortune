import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from '../router.gen.ts'
import { tarotAPI, TarotReading } from '../lib/supabase'
import { Card } from '../types'
import { hasCardImage, getCardFallback, getImageId } from '../lib/cardImages'

const CardSelection = () => {
  const navigate = useNavigate()
  const { topic, subTopic } = useParams()
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [availableCards, setAvailableCards] = useState<TarotReading[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedCards, setRevealedCards] = useState([false, false, false])

  useEffect(() => {
    loadAndSelectCards()
  }, [])

  const loadAndSelectCards = async () => {
    try {
      setLoading(true)
      const cards = await tarotAPI.getAllCards()

      const shuffled = [...cards].sort(() => 0.5 - Math.random())
      const selected: Card[] = shuffled.slice(0, 3).map((card, index) => ({
        ...card,
        direction: Math.random() > 0.5 ? 'upright' : 'reversed',
        position: index === 0 ? '과거' : index === 1 ? '현재' : '미래'
      }))

      setAvailableCards(cards)
      setSelectedCards(selected)
    } catch (error) {
      console.error('Error loading cards:', error)
      setAvailableCards([])
    } finally {
      setLoading(false)
    }
  }

  const getTopicDisplayName = (topic: string | null, subTopic: string | null) => {
    if (!topic || !subTopic) return ''
    const topicNames: { [key: string]: string } = {
      'love': '연애운',
      'career': '직업운',
      'money': '금전운'
    }
    
    const subtopicNames: { [key: string]: string } = {
      'single': '솔로/썸',
      'couple': '커플/짝사랑',
      'breakup': '재회/이별',
      'job': '직장/이직',
      'promotion': '승진/전환',
      'business': '사업/창업',
      'income': '수입/지출',
      'investment': '투자/저축',
      'sidejob': '부업/사업'
    }

    return `${topicNames[topic]} (${subtopicNames[subTopic]})`
  }

  const handleCardFlip = (index: number) => {
    if (!revealedCards[index]) {
      const newRevealed = [...revealedCards]
      newRevealed[index] = true
      setRevealedCards(newRevealed)
    }
  }

  const handleConfirm = () => {
    if (revealedCards.every(revealed => revealed)) {
      // Store selected cards for result page to access
      localStorage.setItem('selectedCards', JSON.stringify(selectedCards))
      navigate('/result')
    }
  }

  const handleReselect = () => {
    loadAndSelectCards()
    setRevealedCards([false, false, false])
  }

  const getTopicIcon = (topic: string | null) => {
    if (!topic) return ''
    const icons: { [key: string]: string } = {
      'love': '💖',
      'career': '💼',
      'money': '💰'
    }
    return icons[topic] || '🔮'
  }

  if (loading) {
    return (
      <div className="card-selection">
        <div className="screen-container">
          <div className="loading-screen">
            <h2>🔮 카드를 준비하고 있습니다...</h2>
            <p>잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    )
  }

  if (availableCards.length === 0) {
    return (
      <div className="card-selection">
        <div className="screen-container">
          <div className="error-screen">
            <h2>⚠️ 카드를 불러올 수 없습니다</h2>
            <p>네트워크 연결을 확인해주세요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-selection">
      <div className="screen-container">
        <header className="screen-header">
          <h1>{getTopicIcon(topic || null)} {getTopicDisplayName(topic || null, subTopic || null)}</h1>
          <p>카드를 한 장씩 뒤집어 그 의미를 확인하세요</p>
        </header>

        <div className="card-selection-progress">
          <div className="progress-text">
            {revealedCards.filter(revealed => revealed).length}/3 장 확인됨
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(revealedCards.filter(revealed => revealed).length / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="card-reveal-section">
          <div className="cards-container">
            {selectedCards.map((card, index) => (
              <div key={index} className="card-slot">
                <div className="card-position-label">
                  {card.position}
                </div>
                {!revealedCards[index] ? (
                  <div
                    className="card-back-reveal"
                    onClick={() => handleCardFlip(index)}
                  >
                    <img
                      src={new URL(`../assets/cards/back.png`, import.meta.url).href}
                      alt="카드 뒷면"
                      className="card-back-image"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '15px'
                      }}
                    />
                    <div className="flip-hint">클릭하여 카드 뒤집기</div>
                  </div>
                ) : (
                  <div className="card-revealed">
                    <div className="card-image-revealed">
                    <img
                      src={new URL(`../assets/cards/${getImageId(card.tarot_id)}.png`, import.meta.url).href}
                      alt={card.card_name_kr}
                      className="card-image-display"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card-selection-actions">
          <button className="action-button secondary" onClick={handleReselect}>
            🔄 카드 다시 뽑기
          </button>
          {revealedCards.every(revealed => revealed) && (
            <button className="confirm-button" onClick={handleConfirm}>
              🔮 카드 해석 보기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardSelection
