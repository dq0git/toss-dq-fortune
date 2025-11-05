import React, { useState, useEffect } from 'react'
import tarotData from '../data/tarot-data.json'

const CardSelection = ({ topic, subTopic, onCardsSelect, onBack }) => {
  const [selectedCards, setSelectedCards] = useState([])
  const [shuffledCards, setShuffledCards] = useState([])

  useEffect(() => {
    // 카드 섞기
    const shuffled = [...tarotData.cards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
  }, [])

  const getTopicDisplayName = (topic, subTopic) => {
    const topicNames = {
      'love': '연애운',
      'career': '직업·금전운',
      'general': '종합운'
    }
    
    const subtopicNames = {
      'single': '솔로/썸',
      'couple': '커플/짝사랑',
      'breakup': '재회/이별',
      'job': '직장/이직',
      'money': '투자/수입',
      'business': '사업/창업'
    }

    if (topic === 'general') {
      return `${topicNames[topic]}`
    }
    
    return `${topicNames[topic]} (${subtopicNames[subTopic]})`
  }

  const handleCardClick = (cardId) => {
    if (selectedCards.includes(cardId)) {
      // 이미 선택된 카드면 제거
      setSelectedCards(selectedCards.filter(id => id !== cardId))
    } else if (selectedCards.length < 3) {
      // 3장 미만이면 추가
      setSelectedCards([...selectedCards, cardId])
    }
  }

  const handleConfirm = () => {
    if (selectedCards.length === 3) {
      const selectedCardData = selectedCards.map(cardId => 
        tarotData.cards.find(card => card.id === cardId)
      )
      onCardsSelect(selectedCardData)
    }
  }

  const getTopicIcon = (topic) => {
    const icons = {
      'love': '💖',
      'career': '💼',
      'general': '✨'
    }
    return icons[topic] || '🔮'
  }

  return (
    <div className="card-selection">
      <div className="screen-container">
        <header className="screen-header">
          <button className="back-button" onClick={onBack}>
            ← 뒤로
          </button>
          <h1>{getTopicIcon(topic)} {getTopicDisplayName(topic, subTopic)}</h1>
          <p>관계를 알고 싶은 그 사람(혹은 상황)을 선명하게 떠올리며,<br />마음을 집중해 3장의 카드를 선택하세요.</p>
        </header>

        <div className="card-selection-progress">
          <div className="progress-text">
            {selectedCards.length}/3 장 선택됨
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(selectedCards.length / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="card-grid">
          {shuffledCards.map((card) => (
            <div 
              key={card.id}
              className={`card-back ${selectedCards.includes(card.id) ? 'selected' : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="card-back-image">
                <div className="tarot-back-pattern"></div>
              </div>
              {selectedCards.includes(card.id) && (
                <div className="card-selected-indicator">
                  <span>{selectedCards.indexOf(card.id) + 1}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="card-selection-actions">
          {selectedCards.length === 3 ? (
            <button className="confirm-button" onClick={handleConfirm}>
              🔮 카드 해석 보기
            </button>
          ) : (
            <div className="selection-hint">
              <p>💡 3장의 카드를 선택해주세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CardSelection
