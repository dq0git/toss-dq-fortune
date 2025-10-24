import React, { useState, useEffect } from 'react'
import tarotData from '../data/tarot-data.json'

const DailyCard = ({ onBack }) => {
  const [dailyCard, setDailyCard] = useState(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    // 오늘 날짜를 기반으로 고정된 카드 선택 (일관성을 위해)
    const today = new Date()
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
    const cardIndex = dayOfYear % tarotData.cards.length
    setDailyCard(tarotData.cards[cardIndex])
  }, [])

  const handleRevealCard = () => {
    setIsRevealed(true)
  }

  const getDailyMeaning = () => {
    if (!dailyCard) return ''
    return dailyCard.meanings['general_present'] || '오늘은 새로운 기회가 다가오고 있습니다.'
  }

  return (
    <div className="daily-card">
      <div className="screen-container">
        <header className="screen-header">
          <button className="back-button" onClick={onBack}>
            ← 뒤로
          </button>
          <h1>✨ 오늘의 원카드</h1>
          <p>오늘 하루 당신에게 전하는 메시지입니다</p>
        </header>

        <div className="daily-card-content">
          {!isRevealed ? (
            <div className="card-reveal-section">
              <div className="card-back-large" onClick={handleRevealCard}>
                <div className="tarot-back-pattern-large"></div>
                <div className="reveal-hint">
                  <p>카드를 터치하여 오늘의 운세를 확인하세요</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-revealed-section">
              <div className="daily-card-result">
                <div className="card-image-large">
                  <div className="card-placeholder-large">
                    <span className="card-name-large">{dailyCard.name}</span>
                  </div>
                </div>
                <div className="daily-meaning">
                  <h3>오늘의 메시지</h3>
                  <p>{getDailyMeaning()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="daily-actions">
          <button className="action-button secondary" onClick={onBack}>
            🔄 메인으로 돌아가기
          </button>
          {isRevealed && (
            <button className="action-button primary">
              💾 오늘의 카드 저장하기
            </button>
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
