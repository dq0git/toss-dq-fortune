// 디버깅 모드 설정 (true로 하면 데이터 소스가 표시됨)
const DEBUG_MODE = true

interface Card extends TarotReading {
  direction: 'upright' | 'reversed';
  position?: '과거' | '현재' | '미래';
}

interface Props {
  topic: string | null;
  subTopic: string | null;
  cards: Card[];
  onBackToMain: () => void;
}

interface DebugProps {
  intent: string;
  dataSource: string;
}

const DebugInfo = ({ intent, dataSource }: DebugProps) => {
  if (!DEBUG_MODE) return null

  return (
    <div style={{
      fontSize: '0.8em',
      color: '#666',
      marginTop: '8px',
      padding: '4px 8px',
      backgroundColor: '#f0f0f0',
      borderRadius: '4px',
      fontFamily: 'monospace'
    }}>
      <div><strong>[의도:</strong> {intent}]</div>
      <div><strong>[실데이터:</strong> {dataSource}]</div>
    </div>
  )
}

import React, { useState } from 'react'
import { tarotAPI, TarotReading } from '../lib/supabase'
import { hasCardImage, getImageId } from '../lib/cardImages'

const ResultScreen = ({ topic, subTopic, cards, onBackToMain }: Props) => {
  const [showAdviceCard, setShowAdviceCard] = useState(false)
  const [adviceCard, setAdviceCard] = useState<TarotReading | null>(null)
  const [showUnlockOptions, setShowUnlockOptions] = useState(false)

  const getMeaningKey = (topic: string, time: string) => {
    const timeMap: { [key: string]: string } = {
      '과거': 'past',
      '현재': 'present',
      '미래': 'future'
    }
    return tarotAPI.getMeaningByTopic(cards[0], topic, timeMap[time])
  }

  const getPositionName = (index: number) => {
    const positions = ['과거', '현재', '미래']
    return positions[index]
  }

  const getTopicDisplayName = (topic: string | null, subTopic: string | null) => {
    if (!topic || !subTopic) return '타로 리딩'

    const topicNames: { [key: string]: string } = {
      'love': '연애운',
      'career': '직업운',
      'money': '금전운'
    }

    const subtopicNames: { [key: string]: string } = {
      'single': '솔로/썸',
      'couple': '커플/짝사랑',
      'breakup': '재회/이별',
      'job': '직장/이직',
      'promotion': '승진/전환',
      'business': '사업/창업',
      'income': '수입/지출',
      'investment': '투자/저축',
      'sidejob': '부업/사업'
    }

    return `${topicNames[topic] || topic} (${subtopicNames[subTopic] || subTopic})`
  }

  const getSummaryText = () => {
    const pastCard = cards[0]
    const presentCard = cards[1]
    const futureCard = cards[2]
    
    return `과거에 ${pastCard.card_name_kr}의 에너지가 있었지만, 현재는 ${presentCard.card_name_kr}의 상황이네요. 미래의 ${futureCard.card_name_kr}을 위한 조언이 필요합니다.`
  }

  const handleShowAdviceCard = () => {
    setShowUnlockOptions(true)
  }

  const handleUnlockByShare = async () => {
    // 공유 시뮬레이션
    const randomCard = await tarotAPI.getRandomCard()
    setAdviceCard(randomCard)
    setShowAdviceCard(true)
    setShowUnlockOptions(false)
  }

  const handleUnlockByAd = async () => {
    // 광고 시청 시뮬레이션
    const randomCard = await tarotAPI.getRandomCard()
    setAdviceCard(randomCard)
    setShowAdviceCard(true)
    setShowUnlockOptions(false)
  }

  const getAdviceMeaning = () => {
    if (!adviceCard || !topic) return ''
    return tarotAPI.getFinalAdviceByTopic(adviceCard, topic)
  }

  return (
    <div className="result-screen">
      <div className="screen-container">
        <header className="screen-header">
          <h1>🔮 {getTopicDisplayName(topic, subTopic)} 리딩 결과</h1>
          <p>카드가 당신에게 전하는 메시지입니다</p>
        </header>

        <div className="reading-results">
          {cards.map((card: Card, index: number) => {
            const position = getPositionName(index)
            const timeKey = position === '과거' ? 'past' : position === '현재' ? 'present' : 'future'
            const meaning = topic ? tarotAPI.getMeaningByTopic(card as TarotReading, topic, timeKey) : ''

            return (
              <div key={card.tarot_id} className="card-result">
                <div className="card-result-header">
                  <h3>{position}</h3>
                  <div className="card-image">
                    <img
                      src={new URL(`../assets/cards/${getImageId(card.tarot_id)}.png`, import.meta.url).href}
                      alt={card.card_name_kr}
                      className="card-image-display"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        border: '2px solid rgba(0, 0, 0, 0.15)'
                      }}
                    />
                  </div>
                </div>
                <div className="card-meaning">
                  <p>{meaning}</p>
                  {topic && (
                    <DebugInfo
                      intent={`${getTopicDisplayName(topic, subTopic)} ${position} 해석`}
                      dataSource={`tarot_readings 테이블 ${card.tarot_id}:${card.card_name_kr} 카드, ${topic}_${timeKey} 컬럼`}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 종합 한 줄 요약 기능 주석처리
        <div className="reading-summary">
          <h3>📝 종합 한 줄 요약</h3>
          <p>{getSummaryText()}</p>
        </div>
        */}

        {!showAdviceCard ? (
          <div className="advice-section">
            <div className="advice-card-prompt">
              <h3>✨ 해결을 위한 추가 조언</h3>
              <p>현재 상황에 대한 핵심 행동 지침을 담은<br />추가 조언 카드를 뽑아보세요</p>
              <button className="advice-button" onClick={handleShowAdviceCard}>
                🔮 최종 조언 카드 1장 더 보기
              </button>
            </div>
          </div>
        ) : (
          <div className="advice-card-result">
            <h3>✨ 최종 조언 카드</h3>
            <div className="advice-card">
              <div className="card-image">
                {adviceCard ? (
                  <img
                    src={new URL(`../assets/cards/${getImageId(adviceCard.tarot_id)}.png`, import.meta.url).href}
                    alt={adviceCard.card_name_kr}
                    className="card-image-display"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  />
                ) : null}
              </div>
              <div className="card-meaning">
                <p>{getAdviceMeaning()}</p>
                {topic && adviceCard && (
                  <DebugInfo
                    intent={`${getTopicDisplayName(topic, subTopic)} 최종 조언 해석`}
                    dataSource={`tarot_readings 테이블 ${adviceCard.tarot_id}:${adviceCard.card_name_kr} 카드, final_advice_${topic} 컬럼`}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {showUnlockOptions && (
          <div className="unlock-modal">
            <div className="unlock-content">
              <h3>🔒 추가 조언 카드를 보려면</h3>
              <p>다음 중 하나를 선택해주세요</p>
              
              <div className="unlock-options">
                <button className="unlock-button share" onClick={handleUnlockByShare}>
                  📱 친구에게 공유하기
                </button>
                <button className="unlock-button ad" onClick={handleUnlockByAd}>
                  📺 보상형 광고 시청
                </button>
              </div>
              
              <button className="unlock-cancel" onClick={() => setShowUnlockOptions(false)}>
                취소
              </button>
            </div>
          </div>
        )}

        <div className="result-actions">
          <button className="action-button secondary" onClick={onBackToMain}>
            🔄 다시 뽑기
          </button>
          <button className="action-button primary">
            💾 이 리딩 저장하기
          </button>
          <button className="action-button secondary">
            🔗 결과 공유하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultScreen
