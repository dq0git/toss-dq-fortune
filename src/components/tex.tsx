import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardBack from './CardBack';

interface Card {
  id: number;
  isFlipped: boolean;
}

interface BackDesign {
  colorScheme: {
    bg: string;
    primary: string;
    secondary: string;
  };
  centerSymbol: string;
  glowIntensity: number;
}

const TarotCardApp = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('selecting');
  const [backDesign, setBackDesign] = useState<BackDesign | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const TOTAL_CARDS = 78;
  const VISIBLE_CARDS = 9;
  const TOTAL_PAGES = Math.ceil(TOTAL_CARDS / VISIBLE_CARDS);
  const MIN_SWIPE_DISTANCE = 50;

  const tarotMeanings = {
    positions: ['과거', '현재', '미래'],
    descriptions: [
      '과거의 영향력이 현재에 미치고 있습니다',
      '현재 당신이 마주한 상황과 감정',
      '다가올 미래와 가능성'
    ]
  };

  useEffect(() => {
    const initCards = Array.from({ length: TOTAL_CARDS }, (_, i) => ({
      id: i + 1,
      isFlipped: false,
    }));
    setCards(initCards);
  }, []);

  function generateRandomConfig() {
    const colorSchemes = [
      { bg: '#1a1a4a', primary: '#FFD700', secondary: '#FFA500' },
      { bg: '#0f1419', primary: '#00D9FF', secondary: '#00FFFF' },
      { bg: '#1a0a2e', primary: '#FF006E', secondary: '#FB5607' },
      { bg: '#0d1b2a', primary: '#90E0EF', secondary: '#CAF0F8' },
      { bg: '#1c0a00', primary: '#FF9E00', secondary: '#FFCF00' },
    ];

    const centerSymbols = ['moon', 'sun', 'star', 'eye', 'pentagram'];
    const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
    
    return {
      colorScheme: scheme,
      centerSymbol: centerSymbols[Math.floor(Math.random() * centerSymbols.length)],
      glowIntensity: 0.6 + Math.random() * 0.4,
    };
  }

  // Initialize the component directly to selecting phase
  useEffect(() => {
    const design = generateRandomConfig();
    setBackDesign(design);
    setCurrentPage(0);
    setSelectedCards([]);
    setFlippedCards([]);
  }, []);

  const handleCardClick = (cardId: number) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleComplete = () => {
    if (selectedCards.length === 3) {
      // Store selected cards for the result page
      const cardsData = selectedCards.map((cardId, index) => ({
        tarot_id: cardId,
        position: index === 0 ? '과거' : index === 1 ? '현재' : '미래',
        direction: Math.random() > 0.5 ? 'upright' : 'reversed'
      }));
      localStorage.setItem('selectedCards', JSON.stringify(cardsData));

      // Navigate to result page
      navigate('/result');
    }
  };

  const handleCardFlip = (index: number) => {
    if (!flippedCards.includes(index)) {
      setFlippedCards([...flippedCards, index]);
    }
  };

  const handleReset = () => {
    setSelectedCards([]);
    setFlippedCards([]);
    setCurrentPage(0);
  };

  const handleRandomPick = () => {
    const shuffled = [...Array(TOTAL_CARDS)].map((_, i) => i + 1).sort(() => Math.random() - 0.5);
    setSelectedCards(shuffled.slice(0, 3));
  };

  const nextPage = () => {
    if (currentPage < TOTAL_PAGES - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPage(currentPage + 1);
      setTimeout(() => setIsTransitioning(false), 600);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPage(currentPage - 1);
      setTimeout(() => setIsTransitioning(false), 600);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    if (touchStart) {
      const offset = e.targetTouches[0].clientX - touchStart;
      if ((currentPage === 0 && offset > 0) || (currentPage === TOTAL_PAGES - 1 && offset < 0)) {
        setSwipeOffset(offset * 0.3);
      } else {
        setSwipeOffset(offset);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;
    
    if (isLeftSwipe) {
      nextPage();
    } else if (isRightSwipe) {
      prevPage();
    }
    
    setSwipeOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const calculateCardPosition = (index: number) => {
    const startIndex = currentPage * VISIBLE_CARDS;
    const endIndex = Math.min(startIndex + VISIBLE_CARDS, TOTAL_CARDS);
    const visibleCount = endIndex - startIndex;

    const isInCurrentPage = index >= startIndex && index < endIndex;
    const isInPrevPage = index >= (currentPage - 1) * VISIBLE_CARDS && index < startIndex;
    const isInNextPage = index >= endIndex && index < (currentPage + 1) * VISIBLE_CARDS;

    if (!isInCurrentPage && !isInPrevPage && !isInNextPage) return null;

    let visibleIndex, pageOffset = 0;

    if (isInCurrentPage) {
      visibleIndex = index - startIndex;
      pageOffset = 0;
    } else if (isInPrevPage) {
      visibleIndex = index - (currentPage - 1) * VISIBLE_CARDS;
      pageOffset = -1;
    } else {
      visibleIndex = index - endIndex;
      pageOffset = 1;
    }

    // Adjust arc angle and radius for better fit
    const arcAngle = Math.min(90, visibleCount * 15); // Reduce angle for fewer cards
    const radius = Math.min(120, 200 / visibleCount * 2); // Adjust radius based on card count
    const angleStep = visibleCount > 1 ? arcAngle / (visibleCount - 1) : 0;
    const angle = visibleCount > 1 ? -arcAngle / 2 + (visibleIndex * angleStep) : 0;

    // Use responsive container width
    const containerWidth = Math.min(400, window.innerWidth - 40);
    const pageSlideOffset = pageOffset * containerWidth * 1.1;

    // Center the spread and constrain positioning
    const centerX = 0;
    const centerY = 20; // Move slightly down from center
    const x = centerX + Math.sin(angle * Math.PI / 180) * radius + swipeOffset + pageSlideOffset;
    const y = centerY + Math.cos(angle * Math.PI / 180) * radius * 0.5;

    const distanceFromCenter = Math.abs(visibleIndex - (visibleCount - 1) / 2);
    const scale = 1 - (distanceFromCenter / visibleCount) * 0.2; // Reduce scale variation

    let opacity = 1;

    if (isTransitioning && swipeOffset === 0) {
      opacity = isInCurrentPage ? 1 : 0;
    } else if (swipeOffset !== 0) {
      const swipeProgress = Math.abs(swipeOffset) / containerWidth;
      if (isInCurrentPage) {
        opacity = 1 - swipeProgress * 0.5;
      } else if ((isInPrevPage && swipeOffset > 0) || (isInNextPage && swipeOffset < 0)) {
        opacity = swipeProgress * 0.5;
      } else {
        opacity = 0;
      }
    } else {
      opacity = isInCurrentPage ? 1 : 0;
    }

    return { x, y, rotation: angle, scale: Math.max(0.7, scale), opacity: Math.max(0, Math.min(1, opacity)), isVisible: true };
  };

  const renderCard = (card: Card, position: any) => {
    if (!position) return null;

    const isSelected = selectedCards.includes(card.id);
    const isHovered = hoveredCard === card.id;
    const selectionIndex = selectedCards.indexOf(card.id);

    let finalScale = position.scale;
    if (isHovered && !isSelected) finalScale *= 1.15;
    if (isSelected) finalScale *= 1.2;

    return (
      <div
        key={card.id}
        className="spread-card"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg) scale(${finalScale})`,
          opacity: position.opacity * (isHovered || isSelected ? 1 : 0.85),
          zIndex: isSelected ? 100 : isHovered ? 50 : 10,
        }}
        onClick={() => handleCardClick(card.id)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div
          className="card-back-container"
          style={{
            filter: isSelected ? `drop-shadow(0 0 20px rgba(255, 215, 0, 0.7))` :
                    isHovered ? `drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))` :
                    'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
          }}
        >
          <CardBack className="card-back-image" />
          {isSelected && (
            <div className="selection-indicator">
              {selectionIndex + 1}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Skip the start phase - go directly to card selection

  // Skip revealing and result phases - navigate to app's result page instead

  return (
    <div className="card-selection">
      <div className="screen-container">
        <header className="screen-header">
          <h1>🔮 심층 운세</h1>
          <p>마음에 드는 카드를 선택하세요</p>
        </header>

        <div className="card-selection-progress">
          <div className="progress-text">
            {selectedCards.length}/3 장 선택됨
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(selectedCards.length / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="card-reveal-section">
          <div
            className="card-spread-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto',
              position: 'relative'
            }}
          >
            {currentPage === 0 && swipeOffset === 0 && selectedCards.length === 0 && (
              <div className="swipe-hint">
                ← 좌우로 스와이프하여 카드 탐색 →
              </div>
            )}

            {cards.map((card, index) => {
              const position = calculateCardPosition(index);
              return position?.isVisible ? renderCard(card, position) : null;
            })}
          </div>

          <div className="spread-navigation">
            <button
              onClick={prevPage}
              disabled={currentPage === 0 || isTransitioning}
              className="nav-button"
            >
              ‹
            </button>

            <div className="page-indicators">
              {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!isTransitioning) {
                      setIsTransitioning(true);
                      setCurrentPage(i);
                      setTimeout(() => setIsTransitioning(false), 600);
                    }
                  }}
                  className={`page-dot ${i === currentPage ? 'active' : ''}`}
                />
              ))}
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === TOTAL_PAGES - 1 || isTransitioning}
              className="nav-button"
            >
              ›
            </button>
          </div>
        </div>

        <div className="card-selection-actions">
          <button
            onClick={handleRandomPick}
            className="action-button secondary"
          >
            ✨ 운명에 맡기기 (랜덤 3장)
          </button>
          {selectedCards.length === 3 && (
            <button className="confirm-button" onClick={handleComplete}>
              🔮 카드 해석 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};



export default TarotCardApp;
