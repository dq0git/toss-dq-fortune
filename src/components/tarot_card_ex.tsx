import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { tarotAPI } from '../lib/supabase';
import { Card } from '../types';

type Phase = 'start' | 'selecting' | 'revealing' | 'result';

type CardConfig = {
  colorScheme: {
    bg: string;
    primary: string;
    secondary: string;
  };
  centerSymbol: string;
  glowIntensity: number;
};

type CardData = {
  id: number;
  isFlipped: boolean;
};

type CardPosition = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  isVisible: boolean;
};

const TarotCardApp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic');
  const subTopic = searchParams.get('subTopic');
  const [phase, setPhase] = useState<Phase>('start');
  const [backDesign, setBackDesign] = useState<CardConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);

  const TOTAL_CARDS = 78;
  const VISIBLE_CARDS = 13; // 2줄로 6장 + 7장 배치
  const TOTAL_PAGES = Math.ceil(TOTAL_CARDS / VISIBLE_CARDS);
  const MIN_SWIPE_DISTANCE = 50;
  // Transition timing (ms) - adjust here to change swipe/slide speed
  const TRANSITION_LONG_MS = 100; // previously 600ms
  const TRANSITION_SHORT_MS = 100; // previously 400ms

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
    // 주제 선택 후 바로 시작
    if (topic && subTopic) {
      startReading();
    }
  }, [topic, subTopic]);

  function generateRandomConfig(): CardConfig {
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

  const startReading = () => {
    const design = generateRandomConfig();
    setBackDesign(design);
    setPhase('selecting');
    setCurrentPage(0);
    setSelectedCards([]);
    setFlippedCards([]);
  };

  const handleCardClick = (cardId: number) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else if (selectedCards.length < 3) {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const handleComplete = () => {
    if (selectedCards.length === 3) {
      setPhase('revealing');
      setTimeout(() => {
        setPhase('result');
      }, 300000);
    }
  };

  const handleCardFlip = (index: number) => {
    if (!flippedCards.includes(index)) {
      setFlippedCards([...flippedCards, index]);
    }
  };

  const handleReset = () => {
    setPhase('start');
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
  setTimeout(() => setIsTransitioning(false), TRANSITION_LONG_MS);
    }
  };

  const prevPage = () => {
    if (currentPage > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPage(currentPage - 1);
  setTimeout(() => setIsTransitioning(false), TRANSITION_LONG_MS);
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

  const calculateCardPosition = (index: number): CardPosition | null => {
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

    // 2줄로 배치: 상단 6장, 하단 7장
    const isTopRow = visibleIndex < 6;
    const rowIndex = isTopRow ? visibleIndex : visibleIndex - 6;
    const cardsPerRow = isTopRow ? 6 : 7;

    // 각 행의 호 각도와 반지름 설정
    const arcAngle = 110; // 각 행의 호 각도 (좀 더 넓게)
    const radius = 180;   // 각 행의 반지름 (좀 더 크게)
    const verticalSpacing = 90; // 상하 행 간격 (좀 더 넓게)

    const angleStep = arcAngle / Math.max(1, (cardsPerRow - 1));
    const angle = -arcAngle / 2 + (rowIndex * angleStep);

    const pageSlideOffset = pageOffset * window.innerWidth * 1.2;
    const x = Math.sin(angle * Math.PI / 180) * radius + swipeOffset + pageSlideOffset;

    // 상단 행은 위로, 하단 행은 아래로 배치
    const baseY = isTopRow ? -verticalSpacing : verticalSpacing;
    const y = baseY + Math.cos(angle * Math.PI / 180) * radius * 0.3;

    const distanceFromCenter = Math.abs(rowIndex - (cardsPerRow - 1) / 2);
    const scale = Math.max(0.75, 1 - (distanceFromCenter / Math.max(1, cardsPerRow)) * 0.25);

    let opacity = 1;

    if (isTransitioning && swipeOffset === 0) {
      opacity = isInCurrentPage ? 0 : ((isInPrevPage && pageOffset === -1) || (isInNextPage && pageOffset === 1)) ? 1 : 0;
    } else if (swipeOffset !== 0) {
      const swipeProgress = Math.abs(swipeOffset) / window.innerWidth;
      if (isInCurrentPage) {
        opacity = 1 - swipeProgress;
      } else if ((isInPrevPage && swipeOffset > 0) || (isInNextPage && swipeOffset < 0)) {
        opacity = swipeProgress;
      } else {
        opacity = 0;
      }
    } else {
      opacity = isInCurrentPage ? 1 : 0;
    }

    return { x, y, rotation: angle, scale, opacity: Math.max(0, Math.min(1, opacity)), isVisible: true };
  };

  const renderCard = (card: CardData, position: CardPosition) => {
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
        className="absolute cursor-pointer transition-all"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg) scale(${finalScale})`,
          transitionDuration: swipeOffset !== 0 ? '0ms' : isTransitioning ? `${TRANSITION_LONG_MS}ms` : `${TRANSITION_SHORT_MS}ms`,
          transitionTimingFunction: isTransitioning ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'ease',
          zIndex: isSelected ? 100 : isHovered ? 50 : 10,
          opacity: position.opacity * (isHovered || isSelected ? 1 : 0.85),
        }}
        onClick={() => phase === 'selecting' && handleCardClick(card.id)}
        onMouseEnter={() => setHoveredCard(card.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div 
          className="relative"
          style={{
            width: '55px',
            height: '85px',
            filter: isSelected ? `drop-shadow(0 0 20px ${backDesign?.colorScheme.primary}aa)` : 
                    isHovered ? `drop-shadow(0 0 10px ${backDesign?.colorScheme.primary}66)` : 
                    'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
          }}
        >
          <CardBack config={backDesign} />
          {isSelected && (
            <div 
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: backDesign?.colorScheme.primary,
                color: backDesign?.colorScheme.bg,
              }}
            >
              {selectionIndex + 1}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200">
              ✨ 타로 리딩
            </h1>
            <p className="text-purple-200 text-lg">
              마음을 가다듬고 <br />질문을 떠올려보세요
            </p>
          </div>
          
          <button
            onClick={startReading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <Sparkles size={24} />
            <span>리딩 시작</span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'revealing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
        <style>{`
          @keyframes sparkle {
            0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1) rotate(180deg); opacity: 1; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px ${backDesign?.colorScheme.primary}66, 0 0 40px ${backDesign?.colorScheme.primary}33; }
            50% { box-shadow: 0 0 40px ${backDesign?.colorScheme.primary}99, 0 0 80px ${backDesign?.colorScheme.primary}66; }
          }
          @keyframes ray-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        
        <div className="relative w-full max-w-2xl aspect-square">
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{ animation: 'ray-spin 3s linear infinite' }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 w-1 origin-bottom"
                style={{
                  height: '40%',
                  background: `linear-gradient(to top, ${backDesign?.colorScheme.primary}00, ${backDesign?.colorScheme.primary}66)`,
                  transform: `rotate(${i * 30}deg) translateX(-50%)`,
                }}
              />
            ))}
          </div>

          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `sparkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              <Sparkles size={12 + Math.random() * 20} style={{ color: backDesign?.colorScheme.primary }} />
            </div>
          ))}

          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              animation: 'float 2s ease-in-out infinite, pulse-glow 2s ease-in-out infinite',
            }}
          >
            <div 
              className="text-center space-y-6 p-8 rounded-2xl"
              style={{
                background: `radial-gradient(circle, ${backDesign?.colorScheme.bg}dd, ${backDesign?.colorScheme.bg}99)`,
              }}
            >
              <div className="text-6xl mb-4 animate-pulse">🔮</div>
              <h2 
                className="text-3xl font-bold"
                style={{ color: backDesign?.colorScheme.primary }}
              >
                운명의 카드를 공개합니다
              </h2>
              <p className="text-purple-200 text-lg">
                당신이 선택한 세 장의 카드가<br />
                곧 운명을 알려줄 것입니다...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200">
            당신의 타로 리딩
          </h2>
          <p className="text-center text-purple-300 mb-8">카드를 터치하여 운명을 확인하세요</p>
          
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {selectedCards.map((cardId, idx) => {
              const isFlipped = flippedCards.includes(idx);
              return (
                <div key={cardId} className="text-center space-y-3">
                  <div 
                    className="relative cursor-pointer transition-all duration-500 hover:scale-105"
                    style={{
                      width: '',
                      height: '180px',
                      transformStyle: 'preserve-3d',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      filter: isFlipped ? 'none' : `drop-shadow(0 0 15px ${backDesign?.colorScheme.primary}66)`,
                    }}
                    onClick={() => handleCardFlip(idx)}
                  >
                    <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
                      <CardBack config={backDesign} />
                      {!isFlipped && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full animate-pulse">
                            탭하여 공개
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div 
                      className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-yellow-300 rounded-lg flex items-center justify-center p-4"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <div className="text-center">
                        <div className="text-5xl mb-3">🌟</div>
                        <div className="text-sm font-bold text-purple-900 mb-2">
                          {tarotMeanings.positions[idx]}
                        </div>
                        <div className="text-xs text-purple-700">카드 {cardId}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`transition-all duration-500 ${isFlipped ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0'} overflow-hidden`}>
                    <div className="text-yellow-300 font-bold text-lg mb-1">
                      {tarotMeanings.positions[idx]}
                    </div>
                    <div className="text-purple-200 text-sm mb-2">카드 {cardId}번</div>
                    <div className="text-purple-300 text-xs bg-purple-900/30 p-3 rounded-lg">
                      {tarotMeanings.descriptions[idx]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {flippedCards.length === 3 && (
            <div className="flex justify-center gap-4 animate-fade-in">
              <button
                onClick={handleReset}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-all"
              >
                <RotateCcw size={20} />
                <span>다시 시작</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex flex-col overflow-hidden">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>

      <div className="p-3 text-center flex-shrink-0">
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-1">
          마음에 드는 카드를 선택하세요
        </h2>
        <p className="text-purple-200 text-sm">{selectedCards.length}/3 선택됨</p>
      </div>

      <div 
        className="flex-1 relative overflow-hidden flex items-center justify-center" 
        style={{ 
          minHeight: '320px',
          maxHeight: 'calc(100vh - 220px)',
          paddingTop: '12px',
          paddingBottom: '12px'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentPage === 0 && swipeOffset === 0 && selectedCards.length === 0 && (
          <div className="absolute top-2 transform -translate-x-1/2 text-purple-300 text-xxs animate-pulse z-50 pointer-events-none">
            ← 좌우로 스와이프 →
          </div>
        )}
        
        {cards.map((card, index) => {
          const position = calculateCardPosition(index);
          return position?.isVisible ? renderCard(card, position) : null;
        })}
      </div>

      <div className="flex justify-center items-center gap-2 py-2 flex-shrink-0">
        <button
          onClick={prevPage}
          disabled={currentPage === 0 || isTransitioning}
          className="p-2 rounded-full bg-purple-800/50 hover:bg-purple-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>
        
        <div className="flex gap-2 px-4">
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentPage(i);
                  setTimeout(() => setIsTransitioning(false), TRANSITION_LONG_MS);
                }
              }}
              className={`h-2 rounded-full transition-all ${
                i === currentPage ? 'bg-yellow-400 w-8' : 'bg-purple-400/30 hover:bg-purple-400/50 w-2'
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={nextPage}
          disabled={currentPage === TOTAL_PAGES - 1 || isTransitioning}
          className="p-2 rounded-full bg-purple-800/50 hover:bg-purple-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      </div>

      <div className="p-3 space-y-2 flex-shrink-0">
        <button
          onClick={handleComplete}
          disabled={selectedCards.length !== 3}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all disabled:opacity-50 text-sm"
        >
          {selectedCards.length === 3 ? '선택 완료' : `${3 - selectedCards.length}장 더 선택하세요`}
        </button>
        
        <button
          onClick={handleRandomPick}
          className="w-full bg-purple-700/50 hover:bg-purple-600/50 text-white font-bold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
        >
          <Sparkles size={18} />
          <span>운명에 맡기기 (랜덤 3장)</span>
        </button>
      </div>
    </div>
  );
};

interface CardBackProps {
  config: CardConfig | null;
}

const CardBack = ({ config }: CardBackProps) => {
  if (!config) return null;
  const { colorScheme, centerSymbol, glowIntensity } = config;

  const renderSymbol = () => {
    const cx = 27.5, cy = 42.5;
    switch (centerSymbol) {
      case 'moon':
        return (
          <>
            <circle cx={cx} cy={cy} r="12" fill="url(#moonGlow)" opacity={glowIntensity * 0.6} />
            <circle cx={cx} cy={cy} r="8" fill={colorScheme.bg} />
            <path d="M 22,42.5 A 8,8 0 1,1 22,42.5 A 6,6 0 1,0 22,42.5" fill="url(#goldGradient)" />
          </>
        );
      case 'sun':
        return (
          <>
            <circle cx={cx} cy={cy} r="12" fill="url(#moonGlow)" opacity={glowIntensity} />
            <circle cx={cx} cy={cy} r="6" fill="url(#goldGradient)" />
            {[...Array(8)].map((_, i) => (
              <line 
                key={i} x1={cx} y1={cy}
                x2={cx + Math.cos(i * Math.PI / 4) * 10}
                y2={cy + Math.sin(i * Math.PI / 4) * 10}
                stroke="url(#goldGradient)" strokeWidth="1.5" strokeLinecap="round"
              />
            ))}
          </>
        );
      case 'star':
        return (
          <>
            <circle cx={cx} cy={cy} r="11" fill="url(#moonGlow)" opacity={glowIntensity} />
            <path d="M 27.5,33 L 30,40 L 37,40.5 L 32,45 L 33.5,52 L 27.5,48 L 21.5,52 L 23,45 L 18,40.5 L 25,40 Z"
                  fill="url(#goldGradient)" stroke={colorScheme.bg} strokeWidth="0.5" />
          </>
        );
      case 'eye':
        return (
          <>
            <ellipse cx={cx} cy={cy} rx="11" ry="7" fill="url(#moonGlow)" opacity={glowIntensity} />
            <ellipse cx={cx} cy={cy} rx="9" ry="5" fill="url(#goldGradient)" />
            <ellipse cx={cx} cy={cy} rx="7" ry="4" fill={colorScheme.bg} />
            <circle cx={cx} cy={cy} r="2.5" fill="url(#goldGradient)" />
          </>
        );
      case 'pentagram':
        return (
          <>
            <circle cx={cx} cy={cy} r="12" fill="url(#moonGlow)" opacity={glowIntensity} />
            <circle cx={cx} cy={cy} r="8" fill="none" stroke="url(#goldGradient)" strokeWidth="0.5" />
            <path d="M 27.5,35.5 L 30,41 L 36,41 L 31.5,44.5 L 33.5,50 L 27.5,46 L 21.5,50 L 23.5,44.5 L 19,41 L 25,41 Z"
                  fill="none" stroke="url(#goldGradient)" strokeWidth="0.8" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 55 85" className="w-full h-full">
      <defs>
        <radialGradient id="moonGlow">
          <stop offset="0%" style={{ stopColor: colorScheme.primary, stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: colorScheme.bg, stopOpacity: 0 }} />
        </radialGradient>
        <linearGradient id="goldGradient">
          <stop offset="0%" style={{ stopColor: colorScheme.primary }} />
          <stop offset="100%" style={{ stopColor: colorScheme.secondary }} />
        </linearGradient>
        <g id="star">
          <path d="M 0,-2 L 0.5,-0.5 L 2,-0.5 L 1,0.5 L 1.5,2 L 0,1 L -1.5,2 L -1,0.5 L -2,-0.5 L -0.5,-0.5 Z" fill="url(#goldGradient)" />
        </g>
      </defs>
      <rect width="55" height="85" rx="3" fill={colorScheme.bg} />
      <rect x="2" y="2" width="51" height="81" rx="2" fill="none" stroke="url(#goldGradient)" strokeWidth="0.8" />
      {renderSymbol()}
      <g opacity="0.6">
        <use href="#star" x="27.5" y="20" transform="scale(0.8)" />
        <use href="#star" x="15" y="25" transform="scale(0.6)" />
        <use href="#star" x="40" y="25" transform="scale(0.6)" />
        <use href="#star" x="27.5" y="65" transform="scale(0.7)" />
      </g>
    </svg>
  );
};

export default TarotCardApp;
