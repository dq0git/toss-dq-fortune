import React from 'react'
import { useNavigate } from '../router.gen.ts';
import { generateHapticFeedback} from '@apps-in-toss/web-framework';
import { Button } from '@toss/tds-mobile';

const MainScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="main-screen">
      <div className="main-container">
        <header className="main-header">
          <h1 className="app-title">🔮 쓰리 카드 타로!!</h1>
          <p className="app-subtitle">과거, 현재, 미래를 통해 당신의 운명을 읽어드립니다</p>
        </header>

        <div className="main-options">
          <div className="option-card primary" onClick={() => {
            navigate('/topic-selection');
            generateHapticFeedback({ type: "tickWeak" });
            }
          }>
            <div className="option-icon">🔮</div>
            <h2>심층 운세</h2>
            <p>특정 질문에 대한 깊이 있는 통찰과<br />해결책을 제공합니다</p>
            <div className="option-badge">핵심 수익 모델</div>
            <div className="option-subtitle">3+1카드 스프레드</div>
          </div>

          <div className="option-card secondary" onClick={() => navigate('/daily-card')}>
            <div className="option-icon">✨</div>
            <h2>오늘의 운세</h2>
            <p>매일 아침 가볍게 하루의<br />전반적인 에너지를 진단하세요</p>
            <div className="option-badge">일일 트래픽</div>
            <div className="option-subtitle">하루 1회 무료</div>
          </div>

          <div className="option-card tertiary" onClick={() => navigate('/tarot-talisman')}>
            <div className="option-icon">🛡️</div>
            <h2>수호 카드</h2>
            <p>나의 수호 카드를 선택하여<br />특정 분야의 운을 강화하세요</p>
            <div className="option-badge">참여 유도</div>
            <div className="option-subtitle">나의 수호 카드 고르기</div>
          </div>

          <div className="option-card quaternary" onClick={() => navigate('/camera')}>
            <div className="option-icon">📷</div>
            <h2>카메라 테스트</h2>
            <p>카메라 기능을 테스트해보세요</p>
            <div className="option-badge">테스트</div>
            <div className="option-subtitle">사진 촬영</div>
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
