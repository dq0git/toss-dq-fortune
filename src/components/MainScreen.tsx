import React from 'react'
import { useNavigate } from '../router.gen.ts';
import { generateHapticFeedback} from '@apps-in-toss/web-framework';
import { ListRow, Button } from '@toss/tds-mobile';

const MainScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="main-screen">
      <div className="main-container">
        <header className="main-header">
          <p className="app-subtitle" style={{ textAlign: 'left' }}>타로카드로 운세를 풀어 드려요.</p>
        </header>

        <div className="main-options">
          <ListRow
            left="🔮"
            contents={<ListRow.Texts type="2RowTypeA" top="주제별 운세와 조언 받기" bottom="원하는 주제의 운세와 조언을 받아요." />}
            onClick={() => {
              navigate('/topic-selection');
              generateHapticFeedback({ type: "tickWeak" });
            }}
            right={
            <Button color="primary" size="small" variant="weak">
              이동
            </Button>
  }
          />

          <ListRow
            left="✨"
            contents={<ListRow.Texts type="2RowTypeA" top="오늘의 운세 흐름 보기" bottom="매일 가볍게 하루의 에너지와 전반적인 흐름을 확인해 보세요." />}
             
            onClick={() => navigate('/daily-card')}
          />

          <ListRow
            left="🛡️"
            contents={<ListRow.Texts type="2RowTypeA" top="나의 수호 카드 찾기" bottom="수호 카드를 선택하고 특정 영역의 운을 보완해 보세요." />}
            onClick={() => navigate('/tarot-talisman')}
          />
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
