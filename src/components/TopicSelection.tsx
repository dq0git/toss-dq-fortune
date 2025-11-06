import React, { useState } from 'react'
import { useNavigate } from '../router.gen.ts'
import tarotData from '../data/tarot-data.json'

const TopicSelection = () => {
  const navigate = useNavigate()
  const topics = tarotData.topics
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  const handleSubtopicSelect = (topicKey: string, subtopicKey: string) => {
    navigate(`/card-selection?topic=${topicKey}&subTopic=${subtopicKey}`)
  }

  const getTopicData = (topicKey: string) => {
    return topics[topicKey as keyof typeof topics]
  }

  return (
    <div className="topic-selection">
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="screen-container">
        <header className="screen-header">
          <h1>무엇이 궁금하신가요??</h1>
          <p>궁금한 주제와 상황을 선택해주세요</p>
        </header>

        <div className="topic-options">
          {Object.entries(topics).filter(([key]) => key !== 'general').map(([topicKey, topicData]) => (
            <div key={topicKey} style={{ marginBottom: '1rem' }}>
              <div
                className={`topic-card ${topicKey}`}
                onClick={() => setSelectedTopic(selectedTopic === topicKey ? null : topicKey)}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  transform: selectedTopic === topicKey ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: selectedTopic === topicKey ? '0 8px 25px rgba(0,0,0,0.15)' : 'none',
                  maxWidth: '320px',
                  margin: '0 auto',
                  padding: '1rem',
                  minHeight: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <div className="topic-icon" style={{ fontSize: '1.5rem', lineHeight: '1' }}>{topicData.icon}</div>
                  <h2 style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    lineHeight: '1.2'
                  }}>{topicData.name}</h2>
                </div>
                <p style={{
                  margin: '0 0 0.25rem 0',
                  fontSize: '0.85rem',
                  opacity: 0.9,
                  lineHeight: '1.3'
                }}>{topicKey === 'love' ? '사랑과 관계에 대한 운세를 확인하세요' :
                     topicKey === 'money' ? '재정과 투자에 대한 운세를 확인하세요' :
                     '목표 달성과 성공에 대한 운세를 확인하세요'}</p>
                <div className="topic-subtitle" style={{
                  fontSize: '0.75rem',
                  opacity: 0.7,
                  lineHeight: '1.2'
                }}>
                  {Object.values(topicData.subtopics).map(subtopic => subtopic.name).join(' • ')}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  fontSize: '1rem',
                  color: 'rgba(255,255,255,0.6)',
                  transition: 'transform 0.3s ease'
                }}>
                  {selectedTopic === topicKey ? '▲' : '▼'}
                </div>
              </div>

              {selectedTopic === topicKey && (
                <div style={{
                  marginTop: '1rem',
                  animation: 'slideDown 0.3s ease-out'
                }}>
                  {Object.entries(topicData.subtopics).map(([subtopicKey, subtopicData]) => (
                    <div
                      key={subtopicKey}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => handleSubtopicSelect(topicKey, subtopicKey)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div>
                        <h3 style={{
                          margin: '0 0 0.25rem 0',
                          fontSize: '1rem',
                          fontWeight: '600'
                        }}>{subtopicData.name}</h3>
                        <p style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          opacity: 0.8
                        }}>{subtopicData.description}</p>
                      </div>
                      <div style={{
                        fontSize: '1.2rem',
                        opacity: 0.7
                      }}>→</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="selection-hint">
          <p>💡 주제를 선택하면 세부 상황을 고를 수 있습니다</p>
        </div>
      </div>


    </div>
  )
}

export default TopicSelection
