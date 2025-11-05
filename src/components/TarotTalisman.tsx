import React, { useState, useEffect } from 'react'
import { tarotAPI, TarotReading } from '../lib/supabase'
import { Card } from '../types'
import { getImageId } from '../lib/cardImages'


interface Props {
  onBack: () => void;
}

interface Talisman {
  card: TarotReading;
  type: string;
  createdAt: string;
}

const TarotTalisman = ({ onBack }: Props) => {
  const [currentTalisman, setCurrentTalisman] = useState<Talisman | null>(null)
  const [newTalisman, setNewTalisman] = useState<Talisman | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [hasUsedFree, setHasUsedFree] = useState(false)
  const [showUnlockOptions, setShowUnlockOptions] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    // 로컬 스토리지에서 오늘의 부적 사용 여부 확인
    const today = new Date().toDateString()
    const lastUsed = localStorage.getItem('talismanLastUsed')
    const usedToday = lastUsed === today
    
    setHasUsedFree(usedToday)
    
    if (usedToday) {
      // 오늘 이미 사용했다면 기존 부적 로드
      const savedTalisman = localStorage.getItem('todayTalisman')
      if (savedTalisman) {
        setCurrentTalisman(JSON.parse(savedTalisman))
        setIsRevealed(true)
      }
    }
  }, [])

  const generateTalisman = async (): Promise<Talisman | null> => {
    const randomCard = await tarotAPI.getRandomCard()
    if (!randomCard) return null
    
    const talismanTypes = ['love', 'career', 'money']
    const randomType = talismanTypes[Math.floor(Math.random() * talismanTypes.length)]
    
    return {
      card: randomCard,
      type: randomType,
      createdAt: new Date().toISOString()
    }
  }

  const handleGenerateTalisman = async () => {
    if (!hasUsedFree) {
      // 무료 생성
      const talisman = await generateTalisman()
      if (talisman) {
        setCurrentTalisman(talisman)
        setIsRevealed(true)
        setHasUsedFree(true)
        
        // 로컬 스토리지에 저장
        const today = new Date().toDateString()
        localStorage.setItem('talismanLastUsed', today)
        localStorage.setItem('todayTalisman', JSON.stringify(talisman))
      }
    } else {
      // 재시도 - 잠금 해제 옵션 표시
      setShowUnlockOptions(true)
    }
  }

  const handleUnlockByShare = async () => {
    // 공유 시뮬레이션
    const talisman = await generateTalisman()
    if (talisman) {
      setNewTalisman(talisman)
      setShowUnlockOptions(false)
    }
  }

  const handleUnlockByAd = async () => {
    // 광고 시청 시뮬레이션
    const talisman = await generateTalisman()
    if (talisman) {
      setNewTalisman(talisman)
      setShowUnlockOptions(false)
    }
  }

  const handleSelectTalisman = (selectedTalisman: Talisman) => {
    setCurrentTalisman(selectedTalisman)
    setNewTalisman(null)
    
    // 로컬 스토리지 업데이트
    localStorage.setItem('todayTalisman', JSON.stringify(selectedTalisman))
  }

  const getTalismanTypeName = (type: string): string => {
    const typeNames: Record<string, string> = {
      'love': '애정운',
      'career': '직업운',
      'money': '금전운'
    }
    return typeNames[type] || '종합운'
  }

  const getTalismanTypeIcon = (type: string): string => {
    const typeIcons: Record<string, string> = {
      'love': '💖',
      'career': '💼',
      'money': '💰'
    }
    return typeIcons[type] || '✨'
  }

  const getTalismanMeaning = (talisman: Talisman | null): string => {
    if (!talisman) return ''
    return tarotAPI.getAffirmationByTopic(talisman.card, talisman.type)
  }

  return (
    <div className="tarot-talisman">
      <div className="screen-container">
        <header className="screen-header">
          <h1>🛡️ 타로 부적</h1>
          <p>긍정적인 암시를 얻고 특정 분야의 운을 강화하세요</p>
        </header>

        <div className="talisman-content">
          {!isRevealed ? (
            <div className="talisman-generate-section">
              <div className="talisman-intro">
                <h3>오늘의 부적을 생성하세요</h3>
                <p>매일 한 번 무료로 부적을 생성할 수 있습니다</p>
              </div>
              
            <div className="talisman-card-back" onClick={handleGenerateTalisman}>
              <img
                src={new URL(`../assets/cards/back.png`, import.meta.url).href}
                alt="카드 뒷면"
                className="card-back-image"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '20px'
                }}
              />
              <div className="generate-hint">
                <p>터치하여 타로 부적 생성</p>
              </div>
            </div>
            </div>
          ) : (
            <div className="talisman-result-section">
              {!newTalisman ? (
                <div className="current-talisman">
                  <h3>오늘의 부적</h3>
                  <div className="talisman-card">
                    <div className="talisman-type">
                      {getTalismanTypeIcon(currentTalisman!.type)} {getTalismanTypeName(currentTalisman!.type)}
                    </div>
                    <div className="card-image-large">
                      <img
                        src={new URL(`../assets/cards/${getImageId(currentTalisman!.card.tarot_id)}.png`, import.meta.url).href}
                        alt={currentTalisman!.card.card_name_kr}
                        className="card-image-display"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px'
                        }}
                      />
                    </div>
                    <div className="talisman-meaning">
                      <p>{getTalismanMeaning(currentTalisman)}</p>
                    </div>
                    {!showDetail && (
                      <button className="detail-button" onClick={() => setShowDetail(true)}>
                        📖 상세 보기
                      </button>
                    )}
                    {showDetail && (
                      <div className="talisman-description">
                        <p>{getTalismanMeaning(currentTalisman)}</p>
                        <button className="detail-button" onClick={() => setShowDetail(false)}>
                          ▲ 간단히 보기
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button className="action-button secondary" onClick={() => setShowUnlockOptions(true)}>
                    🔄 다른 부적 뽑기
                  </button>
                </div>
              ) : (
                <div className="talisman-selection">
                  <h3>부적을 선택하세요</h3>
                  
                  <div className="talisman-options">
                    <div className="talisman-option" onClick={() => handleSelectTalisman(currentTalisman!)}>
                      <div className="talisman-type">
                        {getTalismanTypeIcon(currentTalisman!.type)} {getTalismanTypeName(currentTalisman!.type)}
                      </div>
                      <div className="card-image">
                        <img
                          src={new URL(`../assets/cards/${getImageId(currentTalisman!.card.tarot_id)}.png`, import.meta.url).href}
                          alt={currentTalisman!.card.card_name_kr}
                          className="card-image-display"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '6px'
                          }}
                        />
                      </div>
                      <div className="talisman-label">기존 부적</div>
                    </div>
                    
                    <div className="talisman-option" onClick={() => handleSelectTalisman(newTalisman!)}>
                      <div className="talisman-type">
                        {getTalismanTypeIcon(newTalisman!.type)} {getTalismanTypeName(newTalisman!.type)}
                      </div>
                      <div className="card-image">
                        <img
                          src={new URL(`../assets/cards/${getImageId(newTalisman!.card.tarot_id)}.png`, import.meta.url).href}
                          alt={newTalisman!.card.card_name_kr}
                          className="card-image-display"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '6px'
                          }}
                        />
                      </div>
                      <div className="talisman-label">새로운 부적</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showUnlockOptions && (
          <div className="unlock-modal">
            <div className="unlock-content">
              <h3>🔒 부적을 다시 뽑으려면</h3>
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

        <div className="talisman-actions">
          <button className="action-button secondary" onClick={onBack}>
            🔄 메인으로 돌아가기
          </button>
          {isRevealed && (
            <button className="action-button primary">
              💾 부적 저장하기
            </button>
          )}
        </div>

        <div className="talisman-info">
          <p>💡 매일 새로운 부적으로 하루의 운을 강화하세요</p>
        </div>
      </div>
    </div>
  )
}

export default TarotTalisman
