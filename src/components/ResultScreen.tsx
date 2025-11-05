import React, { useState } from 'react'
import tarotData from '../data/tarot-data.json'

const ResultScreen = ({ topic, subTopic, cards, onBackToMain }) => {
  const [showAdviceCard, setShowAdviceCard] = useState(false)
  const [adviceCard, setAdviceCard] = useState(null)

  const getMeaningKey = (topic, subTopic, position) => {
    if (topic === 'general') {
      return `general_${position}`
    }
    return `${topic}_${subTopic}_${position}`
  }

  const getPositionName = (index) => {
    const positions = ['과거', '현재', '미래']
    return positions[index]
  }

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

  const getSummaryText = () => {
    const pastCard = cards[0]
    const presentCard = cards[1]
    const futureCard = cards[2]
    
    return `과거에 ${pastCard.name}의 에너지가 있었지만, 현재는 ${presentCard.name}의 상황이네요. 미래의 ${futureCard.name}을 위한 조언이 필요합니다.`
  }

  const handleShowAdviceCard = () => {
    // 랜덤한 조언 카드 선택
    const randomCard = tarotData.cards[Math.floor(Math.random() * tarotData.cards.length)]
    setAdviceCard(randomCard)
    setShowAdviceCard(true)
  }

  const getAdviceMeaning = () => {
    if (!adviceCard) return ''
    
    const meaningKey = getMeaningKey(topic, subTopic, 'present')
    return adviceCard.meanings[meaningKey] || adviceCard.meanings['general_present']
  }

  return (
    <div className="result-screen">
      <div className="screen-container">
        <header className="screen-header">
          <h1>🔮 {getTopicDisplayName(topic, subTopic)} 리딩 결과</h1>
          <p>카드가 당신에게 전하는 메시지입니다</p>
        </header>

        <div className="reading-results">
          {cards.map((card, index) => {
            const position = getPositionName(index)
            const meaningKey = getMeaningKey(topic, subTopic, position === '과거' ? 'past' : position === '현재' ? 'present' : 'future')
            const meaning = card.meanings[meaningKey] || card.meanings[`general_${position === '과거' ? 'past' : position === '현재' ? 'present' : 'future'}`]

            return (
              <div key={card.id} className="card-result">
                <div className="card-result-header">
                  <h3>{position}</h3>
                  <div className="card-image">
                    <div className="card-placeholder">
                      <span className="card-name">{card.name}</span>
                    </div>
                  </div>
                </div>
                <div className="card-meaning">
                  <p>{meaning}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="reading-summary">
          <h3>📝 종합 한 줄 요약</h3>
          <p>{getSummaryText()}</p>
        </div>

        {!showAdviceCard ? (
          <div className="advice-section">
            <div className="advice-card-prompt">
              <h3>✨ 더 깊은 조언이 필요하신가요?</h3>
              <p>현재 상황에 대한 구체적인 조언 카드를 한 장 더 뽑아보세요</p>
              <button className="advice-button" onClick={handleShowAdviceCard}>
                🔮 최종 조언 카드 1장 더 보기
              </button>
            </div>
          </div>
        ) : (
          <div className="advice-card-result">
            <h3>✨ 최종 조언 카드</h3>
            <div className="advice-card">
              <div className="card-image">
                <div className="card-placeholder">
                  <span className="card-name">{adviceCard.name}</span>
                </div>
              </div>
              <div className="card-meaning">
                <p>{getAdviceMeaning()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="result-actions">
          <button className="action-button secondary" onClick={onBackToMain}>
            🔄 다시 뽑기
          </button>
          <button className="action-button primary">
            💾 이 리딩 저장하기
          </button>
          <button className="action-button secondary">
            🔗 결과 공유하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultScreen
