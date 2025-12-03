import React from 'react'
import { useNavigate, useSearchParams } from '../router.gen.ts'
import { Analytics } from '@apps-in-toss/web-framework'

type Topic = 'love' | 'success' | 'money'
type SubTopic = { name: string; description: string }

const SubTopicSelection = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('topic') as Topic
  const getTopicDisplayName = (topic: Topic) => {
    const names = {
      'love': '애정운',
      'success': '성공운',
      'money': '금전운'
    }
    return names[topic] || topic
  }

  const getTopicIcon = (topic: Topic) => {
    const icons = {
      'love': '💖',
      'success': '⭐',
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
      'success': {
        'goal': { name: '목표달성', description: '중요한 목표 달성 가능성에 대해' },
        'career': { name: '성공/승진', description: '커리어 성공이나 승진 기회에 대해' },
        'challenge': { name: '도전/변화', description: '새로운 도전이나 변화에 대해' }
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
              onClick={() => {
                Analytics.click({
                  event_name: 'subtopic_selected',
                  topic: topic,
                  subtopic: key
                });
                navigate(`/card-selection?topic=${topic}&subTopic=${key}`);
              }}
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
