import React from 'react'
import { useNavigate } from '../router.gen.ts'
import tarotData from '../data/tarot-data.json'

const TopicSelection = () => {
  const navigate = useNavigate()
  const topics = tarotData.topics

  return (
    <div className="topic-selection">
      <div className="screen-container">
        <header className="screen-header">
          <h1>무엇이 궁금하신가요??</h1>
          <p>궁금한 주제를 선택해주세요</p>
        </header>

        <div className="topic-options">
          <div
            className="topic-card love"
            onClick={() => navigate('/subtopic-selection?topic=love')}
          >
            <div className="topic-icon">💖</div>
            <h2>애정운</h2>
            <p>사랑과 관계에 대한 운세를 확인하세요</p>
            <div className="topic-subtitle">솔로/썸 • 커플/짝사랑 • 재회/이별</div>
          </div>

          <div
            className="topic-card money"
            onClick={() => navigate('/subtopic-selection?topic=money')}
          >
            <div className="topic-icon">💰</div>
            <h2>금전운</h2>
            <p>재정과 투자에 대한 운세를 확인하세요</p>
            <div className="topic-subtitle">수입/지출 • 투자/저축 • 부업/사업</div>
          </div>

          <div
            className="topic-card success"
            onClick={() => navigate('/subtopic-selection?topic=success')}
          >
            <div className="topic-icon">⭐</div>
            <h2>성공운</h2>
            <p>목표 달성과 성공에 대한 운세를 확인하세요</p>
            <div className="topic-subtitle">목표달성 • 성공/승진 • 도전/변화</div>
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
