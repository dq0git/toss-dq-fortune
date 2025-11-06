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
          <p className="app-subtitle" style={{ textAlign: 'left' }}>타로카드로 운세를 풀어 드려요.</p>
        </header>

        <div className="main-options">
          <div className="option-card primary" onClick={() => {
            navigate('/topic-selection');
            generateHapticFeedback({ type: "tickWeak" });
            }
          }>
            <h2 style={{ textAlign: 'left' }}>🔮 주제별 운세와 조언 받기</h2>
            <p style={{ textAlign: 'left' }}>원하는 주제의 운세와<br />조언을 받아요.</p>
          </div>

          <div className="option-card secondary" onClick={() => navigate('/daily-card')}>
            <h2 style={{ textAlign: 'left' }}>✨ 오늘의 운세 흐름 보기</h2>
            <p style={{ textAlign: 'left' }}>매일 가볍게 하루의 에너지와<br />전반적인 흐름을 확인해 보세요.</p>
          </div>

          <div className="option-card tertiary" onClick={() => navigate('/tarot-talisman')}>
            <h2 style={{ textAlign: 'left' }}>🛡️ 나의 수호 카드 찾기</h2>
            <p style={{ textAlign: 'left' }}>수호 카드를 선택하고<br />특정 영역의 운을 보완해 보세요.</p>
          </div>
        </div>

        <div className="main-footer">
          <p className="disclaimer" style={{ textAlign: 'left' }}>
            타로는 참고용이며, 인생의 중요한 결정은 신중히 하시기 바랍니다.
          </p>
        </div>
        
      </div>
    </div>
  )
}

export default MainScreen
