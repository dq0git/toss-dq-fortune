import React, { useState } from 'react';
import { useNavigate } from '../router.gen';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { Card } from '../types';
import { tarotAPI } from '../lib/supabase';
import cardsData from '../data/cards.json';

const typeMapping: Record<GuardianType, keyof typeof cardsData> = {
  love: 'love',
  career: 'success',
  money: 'wealth'
};

type GuardianType = 'love' | 'career' | 'money';

interface Guardian {
  card: Card;
  meaning: string;
  description: string;
}

const TarotTalisman = () => {
  const navigate = useNavigate();
  const [guardianCards, setGuardianCards] = useState<Record<GuardianType, Guardian | null>>({
    love: null,
    career: null,
    money: null,
  });
  const [updating, setUpdating] = useState<GuardianType | null>(null);
  const [choices, setChoices] = useState<{current: Guardian, new: Guardian} | null>(null);
  const [revealed, setRevealed] = useState([false, false]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<GuardianType | null>(null);
  const [confirmMode, setConfirmMode] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Guardian | null>(null);
  const [showDetails, setShowDetails] = useState<Record<GuardianType, boolean>>({
    love: false,
    career: false,
    money: false,
  });
  const [modalDetails, setModalDetails] = useState<[boolean, boolean]>([false, false]);

  React.useEffect(() => {
    generateAllGuardians();
  }, []);

  const generateGuardian = async (type: GuardianType): Promise<Guardian | null> => {
    const cardCategory = typeMapping[type];
    const categoryCards = cardsData[cardCategory];
    if (categoryCards && categoryCards.length > 0) {
      const selectedCard = categoryCards[Math.floor(Math.random() * categoryCards.length)];
      const card: Card = {
        tarot_id: selectedCard.id,
        card_name_kr: selectedCard.name,
        direction: 'upright'
      };
      return { card, meaning: selectedCard.meaning, description: selectedCard.description };
    }
    // fallback, but since we have data, should not reach here
    const fallbackCard = await tarotAPI.getRandomCard();
    if (!fallbackCard) return null;
    return {
      card: fallbackCard,
      meaning: '카드 데이터를 불러올 수 없습니다.',
      description: ''
    };
  };

  const generateAllGuardians = async () => {
    const newGuardians: Record<GuardianType, Guardian | null> = {
      love: null,
      career: null,
      money: null,
    };
    for (const type of ['love', 'career', 'money'] as GuardianType[]) {
      newGuardians[type] = await generateGuardian(type);
    }
    setGuardianCards(newGuardians);
  };

  const handleRenew = async (type: GuardianType) => {
    const current = guardianCards[type];
    if (!current) return;
    const newGuardian = await generateGuardian(type);
    if (!newGuardian) return;
    setSelectedType(type);
    setUpdating(type);
    setChoices({ current, new: newGuardian });
    setRevealed([true, false]);
    setModalDetails([false, false]);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setUpdating(null);
    setChoices(null);
    setSelectedType(null);
  };

  const handleSelectGuardian = (selected: Guardian) => {
    if (!updating) return;
    setPendingSelection(selected);
    setConfirmMode(true);
  };

  const handleConfirmSelection = () => {
    if (pendingSelection) {
      setGuardianCards(prev => ({
        ...prev,
        [updating as string]: pendingSelection
      }));
      setUpdating(null);
      setChoices(null);
      setConfirmMode(false);
      setPendingSelection(null);
      setModalOpen(false);
    }
  };

  const handleCancelSelection = () => {
    setConfirmMode(false);
    setPendingSelection(null);
  };

  const handleFlip = (index: number) => {
    setRevealed(prev => prev.map((r, i) => i === index ? true : r));
  };

  const getTypeName = (type: GuardianType) => {
    const names = { love: '관계운', career: '성공운', money: '재물운' };
    return names[type];
  };

  const getTypeIcon = (type: GuardianType) => {
    const icons = { love: '💖', career: '🎉', money: '💰' };
    return icons[type];
  };

  return (
    <div className="tarot-talisman">
      <div className="screen-container">
        <header className="screen-header">
          <h1>🛡️ 수호 카드</h1>
          <p>각 분야별 수호 카드를 설정하세요</p>
        </header>

        <div className="main-content">
          {(['love', 'career', 'money'] as GuardianType[]).map((type) => (
            <div key={type} className="guardian-section" style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{getTypeIcon(type)} {getTypeName(type)} 수호 카드</h3>
                <button className="select-new-button" onClick={() => handleRenew(type)} style={{ fontSize: '14px', padding: '4px 8px' }}>
                  🔄 새 선택
                </button>
              </div>
              {guardianCards[type] ? (
                <div className="guardian-card-display" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '128px', flexShrink: 0 }}>
                    <div className="card-image-large" style={{ width: '128px', height: '180px', flexShrink: 0 }}>
                      <div className="card-placeholder-large">
                        <span className="card-name-large">{guardianCards[type]!.card.card_name_kr}</span>
                        {guardianCards[type]!.card.direction === 'reversed' && (
                          <span className="card-direction-large">역방향</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="guardian-info">
                    <div className="guardian-meaning">
                      <p style={{ whiteSpace: 'pre-line' }}>{guardianCards[type]!.meaning}</p>
                    </div>
                    {guardianCards[type]!.description && (
                      <>
                        {!showDetails[type] && (
                          <button className="detail-button" onClick={() => setShowDetails(prev => ({ ...prev, [type]: true }))}>
                            📖 상세 보기
                          </button>
                        )}
                        {showDetails[type] && (
                          <div className="guardian-description">
                            <p style={{ whiteSpace: 'pre-line', marginTop: '12px' }}>{guardianCards[type]!.description}</p>
                            <button className="detail-button" onClick={() => setShowDetails(prev => ({ ...prev, [type]: false }))}>
                              ▲ 간단히 보기
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="loading">카드를 생성하는 중...</div>
              )}
            </div>
          ))}

          <div className="talisman-actions">
            <button className="action-button secondary" onClick={() => navigate('/')}>
              🔮 메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
          <div style={{ width: '100%', height: '100%', backgroundColor: 'white', overflow: 'scroll', padding: '50px 20px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {confirmMode && pendingSelection ? (
              <div className="guardian-confirmation" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ marginBottom: '24px' }}>"{pendingSelection.card.card_name_kr}" 카드를 선택 할까요?</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }} onClick={handleConfirmSelection}>
                    예
                  </button>
                  <button style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }} onClick={handleCancelSelection}>
                    아니오
                  </button>
                </div>
              </div>
            ) : choices && (
              <div className="guardian-selection" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <p style={{ marginBottom: '16px', fontSize: '12px', color: '#000', fontWeight: 'bold', flexShrink: 0 }}>수호 카드는 24시간마다 변경할 수 있습니다.</p>
                <h4 style={{ marginBottom: '24px', flexShrink: 0 }}>새로운 수호 카드를 선택하세요</h4>
                <div className="guardian-options" style={{ flex: 1, overflow: 'auto', padding: '0 10px 20px' }}>
                  {[{ guardian: choices.current, label: '기존 카드' }, { guardian: choices.new, label: '새로운 카드 발견!' }].map((option, index) => (
                    <div
                      key={index}
                      className="guardian-option"
                      style={{
                        padding: '16px',
                        border: '2px solid #ddd',
                        borderRadius: '12px',
                        background: index === 0 ? '#f8f9fa' : '#e9f7ef',
                        borderColor: index === 0 ? '#007bff' : '#28a745'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ position: 'relative', width: '80px', height: '100px', perspective: '1000px' }}>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!revealed[index]) {
                                handleFlip(index);
                              } else {
                                handleSelectGuardian(option.guardian);
                              }
                            }}
                            style={{
                              position: 'relative',
                              width: '100%',
                              height: '100%',
                              transformStyle: 'preserve-3d',
                              transition: 'transform 0.6s',
                              transform: revealed[index] ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            }}
                          >
                            {/* Back */}
                            <div
                              style={{
                                backfaceVisibility: 'hidden',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                background: '#f5f5f5',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <span style={{ fontSize: '18px' }}>🃏</span>
                              <div style={{ position: 'absolute', bottom: '2px', fontSize: '8px', textAlign: 'center', lineHeight: '1' }}>카드<br />뒤집기</div>
                            </div>
                            {/* Front */}
                            <div
                              style={{
                                backfaceVisibility: 'hidden',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                transform: 'rotateY(180deg)',
                                background: 'white',
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                boxSizing: 'border-box',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                paddingTop: '4px',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span>{option.guardian.card.card_name_kr.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                        {revealed[index] && (
                          <div className="guardian-meaning" style={{ fontSize: '12px', flex: 1 }}>
                            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{option.guardian.meaning}</p>
                            {option.guardian.description && (
                              <>
                                {!modalDetails[index] && (
                                  <button
                                    className="detail-button"
                                    onClick={(e) => { e.stopPropagation(); setModalDetails(prev => [prev[0], prev[1]].map((d, i) => i === index ? true : d) as [boolean, boolean]); }}
                                    style={{ fontSize: '10px', padding: '2px 6px', marginTop: '4px' }}
                                  >
                                    📖 상세
                                  </button>
                                )}
                                {modalDetails[index] && (
                                  <div className="guardian-description" style={{ marginTop: '6px' }}>
                                    <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: '10px' }}>{option.guardian.description}</p>
                                    <button
                                      className="detail-button"
                                      onClick={(e) => { e.stopPropagation(); setModalDetails(prev => [prev[0], prev[1]].map((d, i) => i === index ? false : d) as [boolean, boolean]); }}
                                      style={{ fontSize: '10px', padding: '2px 6px', marginTop: '4px' }}
                                    >
                                      ▲ 간단
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                            {index === 0 ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSelectGuardian(option.guardian); }}
                                style={{ marginTop: '4px', padding: '4px 8px', fontSize: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                              >
                                현재 카드 유지
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSelectGuardian(option.guardian); }}
                                style={{ marginTop: '4px', padding: '4px 8px', fontSize: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
                              >
                                ✨ 이 카드로 수호 카드 변경
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="option-label">{option.label} {index === 0 && <span style={{ fontSize: '10px', color: '#007bff', fontWeight: 'bold', marginLeft: '8px' }}>✓현재 사용중</span>}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TarotTalisman;
