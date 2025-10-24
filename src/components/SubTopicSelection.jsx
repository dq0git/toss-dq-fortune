import React from 'react'
import tarotData from '../data/tarot-data.json'

const SubTopicSelection = ({ topic, onSubTopicSelect, onBack }) => {
  const topicData = tarotData.topics[topic]
  const subtopics = topicData.subtopics

  const getTopicDisplayName = (topic) => {
    const names = {
      'love': '연애운',
      'career': '직업·금전운',
      'general': '종합운'
    }
    return names[topic] || topic
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
    <div className="subtopic-selection">
      <div className="screen-container">
        <header className="screen-header">
          <button className="back-button" onClick={onBack}>
            ← 뒤로
          </button>
          <h1>{getTopicIcon(topic)} {getTopicDisplayName(topic)}</h1>
          <p>당신의 상황은?</p>
        </header>

        <div className="subtopic-options">
          {Object.entries(subtopics).map(([key, subtopic]) => (
            <div 
              key={key}
              className="subtopic-card" 
              onClick={() => onSubTopicSelect(key)}
            >
              <div className="subtopic-content">
                <h3>{subtopic.name}</h3>
                <p>{subtopic.description}</p>
              </div>
              <div className="subtopic-arrow">→</div>
            </div>
          ))}
        </div>

        <div className="selection-hint">
          <p>💡 가장 가까운 상황을 선택해주세요</p>
        </div>
      </div>
    </div>
  )
}

export default SubTopicSelection
