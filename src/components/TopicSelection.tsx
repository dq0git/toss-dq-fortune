import React from 'react'
import tarotData from '../data/tarot-data.json'

const TopicSelection = ({ onTopicSelect, onBack }) => {
  const topics = tarotData.topics

  return (
    <div className="topic-selection">
      <div className="screen-container">
        <header className="screen-header">
          <button className="back-button" onClick={onBack}>
            ← 뒤로
          </button>
          <h1>무엇이 궁금하신가요?</h1>
          <p>궁금한 주제를 선택해주세요</p>
        </header>

        <div className="topic-options">
          <div 
            className="topic-card love" 
            onClick={() => onTopicSelect('love')}
          >
            <div className="topic-icon">💖</div>
            <h2>연애운</h2>
            <p>사랑과 관계에 대한 운세를 확인하세요</p>
            <div className="topic-subtitle">솔로/썸 • 커플/짝사랑 • 재회/이별</div>
          </div>

          <div 
            className="topic-card career" 
            onClick={() => onTopicSelect('career')}
          >
            <div className="topic-icon">💼</div>
            <h2>직업·금전운</h2>
            <p>직장과 금전에 대한 운세를 확인하세요</p>
            <div className="topic-subtitle">직장/이직 • 투자/수입 • 사업/창업</div>
          </div>

          <div 
            className="topic-card general" 
            onClick={() => onTopicSelect('general')}
          >
            <div className="topic-icon">✨</div>
            <h2>종합운</h2>
            <p>전반적인 운세와 인생의 흐름을 확인하세요</p>
            <div className="topic-subtitle">과거-현재-미래의 전체적인 흐름</div>
          </div>
        </div>

        <div className="selection-hint">
          <p>💡 각 주제별로 세부 상황을 선택할 수 있습니다</p>
        </div>
      </div>
    </div>
  )
}

export default TopicSelection
