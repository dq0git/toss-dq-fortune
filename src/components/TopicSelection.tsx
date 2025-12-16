import React from 'react';
import { useNavigate } from '../router.gen.ts';
import tarotData from '../data/tarot-data.json';
import { Top, ListRow, Badge, Text } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { Spacing } from './Spacing';
import { Analytics } from '@apps-in-toss/web-framework';
import { trackClickEvent } from '../firebase/analytics';

const TopicSelection = () => {
  const navigate = useNavigate();
  const topics = tarotData.topics;

  const handleTopicClick = (topicKey: string) => {
    const event = {
      event_name: 'topic_selected',
      topic: topicKey
    };
    Analytics.click(event);
    trackClickEvent(event);
    navigate(`/card-selection?topic=${topicKey}&subTopic=${Object.keys(topics[topicKey as keyof typeof topics].subtopics)[0]}`);
  };

  // 1. 주제별 질문 데이터를 각 줄마다 분리 (각 topic마다 3줄)
  const topicQuestions = {
    love: [
      [
        "그 사람의 속마음이 궁금해요",
        "우린 다시 만날 수 있을까요?",
        "올해는 연애할 수 있을까요?",
        "지금 만나는 사람과 결혼할 수 있을까요?",
        "썸(짝사랑)을 끝내고 연애할 수 있을까요?"
      ],
      [
        "이 사람과 헤어지는 게 맞을까요?",
        "새로운 인연은 언제쯤 나타날까요?",
        "고백해도 괜찮을까요?",
        "요즘 우리 관계, 이대로 괜찮을까요?",
        "이 사람과의 궁합은 어떨까요?"
      ]
    ],
    success: [
      [
        "이번 시험(면접)에 합격할 수 있을까요?",
        "이직(창업)해도 괜찮을까요?",
        "지금 하고 있는 일이 잘 풀릴까요?",
        "올해 승진(진급)할 수 있을까요?",
        "제가 세운 목표를 이룰 수 있을까요?"
      ],
      [
        "새로운 도전을 하기에 좋은 시기인가요?",
        "직장에서(팀에서) 인정받을 수 있을까요?",
        "이사나 변동운이 있을까요?",
        "지금 공부하는 방향이 맞을까요?",
        "경쟁(경쟁자)을 이길 수 있을까요?"
      ]
    ],
    money: [
      [
        "돈이 언제쯤 들어올까요?",
        "지금 투자(주식/부동산)해도 될까요?",
        "부업(사업)이 잘 될까요?",
        "요즘 지출이 많은데, 막을 수 있을까요?",
        "목돈을 모을 수 있을까요?"
      ],
      [
        "연봉 협상이 잘 될까요?",
        "지금 하고 있는 투자를 계속해도 될까요?",
        "사업을 확장해도 괜찮을까요?",
        "돈을 빌려줘도(빌려도) 괜찮을까요?",
        "뜻밖의 행운(횡재)이 있을까요?"
      ]
    ]
  };

  const topicTagStyles: Record<'love' | 'success' | 'money', { background: string; border: string; text: string }> = {
    love: {
      background: 'linear-gradient(90deg, rgba(255, 236, 244, 0.95) 0%, rgba(255, 224, 238, 0.95) 100%)',
      border: 'rgba(244, 114, 182, 0.4)',
      text: '#C2185B'
    },
    success: {
      background: 'linear-gradient(90deg, rgba(255, 247, 224, 0.95) 0%, rgba(255, 240, 205, 0.95) 100%)',
      border: 'rgba(245, 158, 11, 0.4)',
      text: '#B45309'
    },
    money: {
      background: 'linear-gradient(90deg, rgba(228, 248, 236, 0.95) 0%, rgba(212, 240, 223, 0.95) 100%)',
      border: 'rgba(34, 197, 94, 0.4)',
      text: '#15803D'
    }
  };

  const isPrimaryTopic = (key: string): key is keyof typeof topicQuestions =>
    key === 'love' || key === 'success' || key === 'money';

  // 2. 각 topic 카드 아래에 해당 topic의 3줄 질문들을 표시

  return (
    <div className="topic-selection">
      <div className="screen-container">
        <header className="screen-header">
          <Top
            title={
              <Top.TitleParagraph size={22} color={adaptive.grey900} style={{ textAlign: 'left' }}>
                주제별 운세와 조언 받기
              </Top.TitleParagraph>
            }
            subtitleBottom={
              <Top.SubtitleParagraph style={{ textAlign: 'left' }}>먼저 궁금한 주제를 선택해요</Top.SubtitleParagraph>
            }
            lowerGap={0}
          />
        </header>

        {/* Spacing 컴포넌트 등으로 헤더와 카드 목록 사이에 간격 추가 */}
        <Spacing size={0} />

        <div className="topic-options">
          {Object.entries(topics)
            .filter(([key]) => key !== 'general')
            .map(([topicKey, topicData]) => (
              <div
                key={topicKey}
                style={{
                  marginBottom: '8px',
                  backgroundColor: adaptive.grey100,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid transparent`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onClick={() => handleTopicClick(topicKey)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = adaptive.grey200;
                  e.currentTarget.style.borderColor = adaptive.grey300;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = adaptive.grey100;
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <ListRow
                  left={
                    <ListRow.AssetIcon
                      variant="fill"
                      shape="circle-masking"
                      name={
                        topicKey === 'love' ? 'icon-emoji-two-hearts' :
                          topicKey === 'money' ? 'icon-money-bag-green' :
                            'icon-trophy'
                      }
                    />
                  }
                  contents={
                    <ListRow.Texts
                      type="1RowTypeA"
                      top={topicData.name}
                      topProps={{ color: adaptive.grey800, fontWeight: 'bold' }}
                    />
                  }
                  verticalPadding="small"
                />

                <div style={{ padding: '0px 20px 16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: '8px' }}>
                    {Object.values(topicData.subtopics).map((subtopic, index) => (
                      <Badge
                        key={index}
                        size="small"
                        color={
                          topicKey === 'love' ? 'red' :
                            topicKey === 'success' ? 'yellow' :
                              topicKey === 'money' ? 'green' :
                                'blue'
                        }
                        variant="weak"
                      >
                        #{subtopic.name}
                      </Badge>
                    ))}
                  </div>

                  {/* 각 topic별 3줄 스크롤 질문 표시 */}
                  {isPrimaryTopic(topicKey) ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      overflow: 'hidden',
                      position: 'relative',
                      marginTop: '6px',
                      touchAction: 'pan-y'
                    }}>
                      {topicQuestions[topicKey].map((questions, lineIndex) => {
                        const palette = topicTagStyles[topicKey];
                        const repeatedQuestions = Array.from({ length: 6 }, () => questions).flat();
                        return (
                          <div
                            key={lineIndex}
                            style={{
                              overflow: 'hidden',
                              width: '100%',
                              maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
                              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)'
                            }}
                          >
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap',
                                animation: `scrollLeft ${(30 + lineIndex * 6) * 2}s linear infinite`,
                                animationDirection: lineIndex % 2 === 0 ? 'normal' : 'reverse',
                                paddingLeft: '0%',
                                fontSize: '12px',
                                color: '#000000',
                                userSelect: 'none'
                              }}
                            >
                              {repeatedQuestions.map((question, pillIndex) => (
                                <span
                                  key={`${lineIndex}-${pillIndex}`}
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: '999px',
                                    background: '#FFFFFF',
                                    border: 'none',
                                    fontWeight: 500,
                                    letterSpacing: '0.1px',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.06)'
                                  }}
                                >
                                  {question}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
        </div>


      </div>
    </div>
  );
};

export default TopicSelection;
