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
            <h2>연애운</h2>
            <p>사랑과 관계에 대한 운세를 확인하세요</p>
            <div className="topic-subtitle">솔로/썸 • 커플/짝사랑 • 재회/이별</div>
          </div>

          <div
            className="topic-card career"
            onClick={() => navigate('/subtopic-selection?topic=career')}
          >
            <div className="topic-icon">💼</div>
            <h2>직업운</h2>
            <p>직장과 커리어에 대한 운세를 확인하세요</p>
            <div className="topic-subtitle">직장/이직 • 승진/전환 • 사업/창업</div>
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
        </div>

        <div className="selection-hint">
          <p>💡 각 주제별로 세부 상황을 선택할 수 있습니다</p>
        </div>
      </div>
    </div>
  )
}

export default TopicSelection
