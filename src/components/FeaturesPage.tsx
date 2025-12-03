import React from 'react';
import { useNavigate } from '../router.gen';
import { generateHapticFeedback, Analytics } from '@apps-in-toss/web-framework';
import { Top, ListRow } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';

const FeaturesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="features-page">
      <div className="screen-container">
        <Top
          title={
            <Top.TitleParagraph size={22} color={adaptive.grey900} style={{ textAlign: 'left' }}>
              타로카드로 운세를 풀어 드려요
            </Top.TitleParagraph>
          }
          subtitleBottom={
            <Top.SubtitleParagraph style={{ textAlign: 'left' }}>
              원하는 기능을 선택하세요
            </Top.SubtitleParagraph>
          }
          lowerGap={0}
        />

        <div style={{ padding: '16px' }}>
          <ListRow
            left={<ListRow.AssetIcon variant="fill" shape="circle-masking" name="icon-u1FA84" />}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="주제별 운세와 조언 받기"
                topProps={{ color: adaptive.grey800, fontWeight: 'bold' }}
                bottom="궁금한 주제의 운세와 조언을 받아요"
                bottomProps={{ color: adaptive.grey600 }}
              />
            }
            arrowType="right"
            onClick={() => {
              Analytics.click({
                event_name: 'features_topic_click'
              });
              navigate('/topic-selection');
              generateHapticFeedback({ type: "tickWeak" });
            }}
            verticalPadding="small"
          />

          <ListRow
            left={<ListRow.AssetIcon variant="fill" shape="circle-masking" name="icon-graph-line-up" />}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="오늘의 운세흐름 보기"
                topProps={{ color: adaptive.grey800, fontWeight: 'bold' }}
                bottom="하루의 전반적인 흐름을 확인해요"
                bottomProps={{ color: adaptive.grey600 }}
              />
            }
            arrowType="right"
            onClick={() => {
              Analytics.click({
                event_name: 'features_daily_card_click'
              });
              navigate('/daily-card');
            }}
            verticalPadding="small"
          />

          <ListRow
            left={<ListRow.AssetIcon variant="fill" shape="circle-masking" name="icon-shield-blue" />}
            contents={
              <ListRow.Texts
                type="2RowTypeA"
                top="나의 수호카드 찾기"
                topProps={{ color: adaptive.grey800, fontWeight: 'bold' }}
                bottom="수호카드를 찾고 운을 보완해요"
                bottomProps={{ color: adaptive.grey600 }}
              />
            }
            arrowType="right"
            onClick={() => {
              Analytics.click({
                event_name: 'features_guardian_card_click'
              });
              navigate('/tarot-talisman');
            }}
            verticalPadding="small"
          />
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;

