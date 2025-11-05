import React from 'react'
import { useNavigate, useSearchParams } from '../router.gen.ts'

type Topic = 'love' | 'career' | 'money'
type SubTopic = { name: string; description: string }

const SubTopicSelection = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('topic') as Topic
  const getTopicDisplayName = (topic: Topic) => {
    const names = {
      'love': '연애운',
      'career': '직업운',
      'money': '금전운'
    }
    return names[topic] || topic
  }

  const getTopicIcon = (topic: Topic) => {
    const icons = {
      'love': '💖',
      'career': '💼',
      'money': '💰'
    }
    return icons[topic] || '🔮'
  }

  const getSubtopics = (topic: Topic) => {
    const subtopics = {
      'love': {
        'single': { name: '솔로/썸', description: '새로운 만남이나 현재 썸타는 관계에 대해' },
        'couple': { name: '커플/짝사랑', description: '현재 연인 관계나 짝사랑 상황에 대해' },
        'breakup': { name: '재회/이별', description: '이별 후 상황이나 재회 가능성에 대해' }
      },
      'career': {
        'job': { name: '직장/이직', description: '현재 직장이나 새로운 직장에 대해' },
        'promotion': { name: '승진/전환', description: '승진이나 직업 전환에 대해' },
        'business': { name: '사업/창업', description: '사업이나 창업에 대해' }
      },
      'money': {
        'income': { name: '수입/지출', description: '수입과 지출 관리에 대해' },
        'investment': { name: '투자/저축', description: '투자나 저축 계획에 대해' },
        'sidejob': { name: '부업/사업', description: '부업이나 사업 수입에 대해' }
      }
    }
    return subtopics[topic as keyof typeof subtopics] || {}
  }

  const subtopics = getSubtopics(topic)

  return (
    <div className="subtopic-selection">
      <div className="screen-container">
        <header className="screen-header">
          <h1>{getTopicIcon(topic)} {getTopicDisplayName(topic)}</h1>
          <p>당신의 상황은?</p>
        </header>

        <div className="subtopic-options">
          {Object.entries(subtopics).map(([key, subtopic]) => (
            <div
              key={key}
              className="subtopic-card"
              onClick={() => navigate(`/card-selection?topic=${topic}&subTopic=${key}`)}
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
