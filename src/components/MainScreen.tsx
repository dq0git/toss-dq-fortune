import React from 'react'

const MainScreen = ({ onScreenChange }) => {
  return (
    <div className="main-screen">
      <div className="main-container">
        <header className="main-header">
          <h1 className="app-title">🔮 쓰리 카드 타로</h1>
          <p className="app-subtitle">과거, 현재, 미래를 통해 당신의 운명을 읽어드립니다</p>
        </header>

        <div className="main-options">
          <div className="option-card primary" onClick={() => onScreenChange('topic-selection')}>
            <div className="option-icon">🔮</div>
            <h2>주제별 운세 확인하기</h2>
            <p>연애, 직업, 종합운 중 하나를 선택하여<br />과거-현재-미래의 흐름을 파악하세요</p>
            <div className="option-badge">핵심 기능</div>
          </div>

          <div className="option-card secondary" onClick={() => onScreenChange('daily-card')}>
            <div className="option-icon">✨</div>
            <h2>오늘의 운세 빠르게 확인하기</h2>
            <p>매일 한 장의 카드로<br />오늘의 운세를 간단히 확인하세요</p>
            <div className="option-badge">습관 유도</div>
          </div>
        </div>

        <div className="main-footer">
          <p className="disclaimer">
            타로는 참고용이며, 인생의 중요한 결정은 신중히 하시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MainScreen
