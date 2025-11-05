import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from '../router.gen.ts'
import { tarotAPI, TarotReading } from '../lib/supabase'
import { Card } from '../types'
import { hasCardImage, getCardFallback, getImageId } from '../lib/cardImages'

const CardSelection = () => {
  const navigate = useNavigate()
  const { topic, subTopic } = useParams()
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [availableCards, setAvailableCards] = useState<TarotReading[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedCards, setRevealedCards] = useState([false, false, false])

  // New state for enhanced card selection
  const [currentPage, setCurrentPage] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)

  const TOTAL_CARDS = 78
  const VISIBLE_CARDS = 9
  const TOTAL_PAGES = Math.ceil(TOTAL_CARDS / VISIBLE_CARDS)
  const MIN_SWIPE_DISTANCE = 50

  useEffect(() => {
    loadAndSelectCards()
  }, [])

  const loadAndSelectCards = async () => {
    try {
      setLoading(true)
      const cards = await tarotAPI.getAllCards()

      const shuffled = [...cards].sort(() => 0.5 - Math.random())
      const selected: Card[] = shuffled.slice(0, 3).map((card, index) => ({
        ...card,
        direction: Math.random() > 0.5 ? 'upright' : 'reversed',
        position: index === 0 ? '과거' : index === 1 ? '현재' : '미래'
      }))

      setAvailableCards(cards)
      setSelectedCards(selected)
    } catch (error) {
      console.error('Error loading cards:', error)
      setAvailableCards([])
    } finally {
      setLoading(false)
    }
  }

  const getTopicDisplayName = (topic: string | null, subTopic: string | null) => {
    if (!topic || !subTopic) return ''
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

    return `${topicNames[topic]} (${subtopicNames[subTopic]})`
  }

  const handleCardFlip = (index: number) => {
    if (!revealedCards[index]) {
      const newRevealed = [...revealedCards]
      newRevealed[index] = true
      setRevealedCards(newRevealed)
    }
  }

  const handleConfirm = () => {
    if (revealedCards.every(revealed => revealed)) {
      // Store selected cards for result page to access
      localStorage.setItem('selectedCards', JSON.stringify(selectedCards))
      navigate('/result')
    }
  }

  const handleReselect = () => {
    loadAndSelectCards()
    setRevealedCards([false, false, false])
  }

  // Enhanced card selection functions
  const handleCardClick = (cardId: number) => {
    if (selectedCards.some(card => card.tarot_id === cardId)) {
      setSelectedCards(selectedCards.filter(card => card.tarot_id !== cardId))
    } else if (selectedCards.length < 3) {
      const card = availableCards.find(c => c.tarot_id === cardId)
      if (card) {
        const position = selectedCards.length === 0 ? '과거' : selectedCards.length === 1 ? '현재' : '미래'
        const direction: 'upright' | 'reversed' = Math.random() > 0.5 ? 'upright' : 'reversed'
        setSelectedCards([...selectedCards, { ...card, direction, position }])
      }
    }
  }

  const handleRandomPick = () => {
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5)
    const randomCards: Card[] = shuffled.slice(0, 3).map((card, index) => ({
      ...card,
      direction: Math.random() > 0.5 ? 'upright' : 'reversed',
      position: index === 0 ? '과거' : index === 1 ? '현재' : '미래'
    }))
    setSelectedCards(randomCards)
  }

  const nextPage = () => {
    if (currentPage < TOTAL_PAGES - 1 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentPage(currentPage + 1)
      setTimeout(() => setIsTransitioning(false), 600)
    }
  }

  const prevPage = () => {
    if (currentPage > 0 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentPage(currentPage - 1)
      setTimeout(() => setIsTransitioning(false), 600)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
    if (touchStart) {
      const offset = e.targetTouches[0].clientX - touchStart
      if ((currentPage === 0 && offset > 0) || (currentPage === TOTAL_PAGES - 1 && offset < 0)) {
        setSwipeOffset(offset * 0.3)
      } else {
        setSwipeOffset(offset)
      }
    }
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0)
      return
    }

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE

    if (isLeftSwipe) {
      nextPage()
    } else if (isRightSwipe) {
      prevPage()
    }

    setSwipeOffset(0)
    setTouchStart(null)
    setTouchEnd(null)
  }

  const calculateCardPosition = (index: number) => {
    const startIndex = currentPage * VISIBLE_CARDS
    const endIndex = Math.min(startIndex + VISIBLE_CARDS, TOTAL_CARDS)
    const visibleCount = endIndex - startIndex

    const isInCurrentPage = index >= startIndex && index < endIndex
    const isInPrevPage = index >= (currentPage - 1) * VISIBLE_CARDS && index < startIndex
    const isInNextPage = index >= endIndex && index < (currentPage + 1) * VISIBLE_CARDS

    if (!isInCurrentPage && !isInPrevPage && !isInNextPage) return null

    let visibleIndex, pageOffset = 0

    if (isInCurrentPage) {
      visibleIndex = index - startIndex
      pageOffset = 0
    } else if (isInPrevPage) {
      visibleIndex = index - (currentPage - 1) * VISIBLE_CARDS
      pageOffset = -1
    } else {
      visibleIndex = index - endIndex
      pageOffset = 1
    }

    const arcAngle = 110
    const radius = 200
    const angleStep = arcAngle / (visibleCount - 1)
    const angle = -arcAngle / 2 + (visibleIndex * angleStep)

    const pageSlideOffset = pageOffset * window.innerWidth * 1.2
    const x = Math.sin(angle * Math.PI / 180) * radius + swipeOffset + pageSlideOffset
    const y = -Math.cos(angle * Math.PI / 180) * radius * 0.6

    const distanceFromCenter = Math.abs(visibleIndex - (visibleCount - 1) / 2)
    const scale = 1 - (distanceFromCenter / visibleCount) * 0.3

    let opacity = 1

    if (isTransitioning && swipeOffset === 0) {
      opacity = isInCurrentPage ? 0 : ((isInPrevPage && pageOffset === -1) || (isInNextPage && pageOffset === 1)) ? 1 : 0
    } else if (swipeOffset !== 0) {
      const swipeProgress = Math.abs(swipeOffset) / window.innerWidth
      if (isInCurrentPage) {
        opacity = 1 - swipeProgress
      } else if ((isInPrevPage && swipeOffset > 0) || (isInNextPage && swipeOffset < 0)) {
        opacity = swipeProgress
      } else {
        opacity = 0
      }
    } else {
      opacity = isInCurrentPage ? 1 : 0
    }

    return { x, y, rotation: angle, scale, opacity: Math.max(0, Math.min(1, opacity)), isVisible: true }
  }

  const renderCard = (card: TarotReading, position: any) => {
    if (!position) return null

    const isSelected = selectedCards.some(selected => selected.tarot_id === card.tarot_id)
    const isHovered = hoveredCard === card.tarot_id
    const selectionIndex = selectedCards.findIndex(selected => selected.tarot_id === card.tarot_id)

    let finalScale = position.scale
    if (isHovered && !isSelected) finalScale *= 1.15
    if (isSelected) finalScale *= 1.2

    return (
      <div
        key={card.tarot_id}
        className="absolute cursor-pointer transition-all"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg) scale(${finalScale})`,
          transitionDuration: swipeOffset !== 0 ? '0ms' : isTransitioning ? '600ms' : '400ms',
          transitionTimingFunction: isTransitioning ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'ease',
          zIndex: isSelected ? 100 : isHovered ? 50 : 10,
          opacity: position.opacity * (isHovered || isSelected ? 1 : 0.85),
        }}
        onClick={() => handleCardClick(card.tarot_id)}
        onMouseEnter={() => setHoveredCard(card.tarot_id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        <div
          className="relative"
          style={{
            width: '55px',
            height: '85px',
            filter: isSelected ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.7))' :
                    isHovered ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))' :
                    'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
          }}
        >
          <img
            src={new URL(`../assets/cards/back.png`, import.meta.url).href}
            alt="카드 뒷면"
            className="w-full h-full object-cover rounded"
          />
          {isSelected && (
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold bg-yellow-400 text-purple-900">
              {selectionIndex + 1}
            </div>
          )}
        </div>
      </div>
    )
  }

  const getTopicIcon = (topic: string | null) => {
    if (!topic) return ''
    const icons: { [key: string]: string } = {
      'love': '💖',
      'career': '💼',
      'money': '💰'
    }
    return icons[topic] || '🔮'
  }

  if (loading) {
    return (
      <div className="card-selection">
        <div className="screen-container">
          <div className="loading-screen">
            <h2>🔮 카드를 준비하고 있습니다...</h2>
            <p>잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    )
  }

  if (availableCards.length === 0) {
    return (
      <div className="card-selection">
        <div className="screen-container">
          <div className="error-screen">
            <h2>⚠️ 카드를 불러올 수 없습니다</h2>
            <p>네트워크 연결을 확인해주세요</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-selection">
      <div className="screen-container">
        <header className="screen-header">
          <h1>{getTopicIcon(topic || null)} {getTopicDisplayName(topic || null, subTopic || null)}</h1>
          <p>카드를 한 장씩 뒤집어 그 의미를 확인하세요</p>
        </header>

        <div className="card-selection-progress">
          <div className="progress-text">
            {revealedCards.filter(revealed => revealed).length}/3 장 확인됨
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(revealedCards.filter(revealed => revealed).length / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {selectedCards.length === 0 ? (
          <>
            <div className="card-selection-instruction">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-2">
                마음에 드는 카드를 선택하세요
              </h2>
              <p className="text-purple-200">{selectedCards.length}/3 선택됨</p>
            </div>

            <div
              className="flex-1 relative overflow-hidden"
              style={{ minHeight: '400px' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {currentPage === 0 && swipeOffset === 0 && selectedCards.length === 0 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-purple-300 text-sm animate-pulse z-50">
                  ← 좌우로 스와이프하여 카드 탐색 →
                </div>
              )}

              {availableCards.map((card, index) => {
                const position = calculateCardPosition(index)
                return position?.isVisible ? renderCard(card, position) : null
              })}
            </div>

            <div className="flex justify-center items-center gap-2 py-4">
              <button
                onClick={prevPage}
                disabled={currentPage === 0 || isTransitioning}
                className="p-2 rounded-full bg-purple-800/50 hover:bg-purple-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 text-white text-xl"
              >
                ‹
              </button>

              <div className="flex gap-2 px-4">
                {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isTransitioning) {
                        setIsTransitioning(true)
                        setCurrentPage(i)
                        setTimeout(() => setIsTransitioning(false), 600)
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
                className="p-2 rounded-full bg-purple-800/50 hover:bg-purple-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 text-white text-xl"
              >
                ›
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button
                onClick={handleRandomPick}
                className="w-full bg-purple-700/50 hover:bg-purple-600/50 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                ✨
                <span>운명에 맡기기 (랜덤 3장)</span>
              </button>
            </div>
          </>
        ) : (
          <div className="card-reveal-section">
            <div className="cards-container">
              {selectedCards.map((card, index) => (
                <div key={index} className="card-slot">
                  <div className="card-position-label">
                    {card.position}
                  </div>
                  {!revealedCards[index] ? (
                    <div
                      className="card-back-reveal"
                      onClick={() => handleCardFlip(index)}
                    >
                      <img
                        src={new URL(`../assets/cards/back.png`, import.meta.url).href}
                        alt="카드 뒷면"
                        className="card-back-image"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '15px'
                        }}
                      />
                      <div className="flip-hint">클릭하여 카드 뒤집기</div>
                    </div>
                  ) : (
                    <div className="card-revealed">
                      <div className="card-image-revealed">
                        <img
                          src={new URL(`../assets/cards/${getImageId(card.tarot_id)}.png`, import.meta.url).href}
                          alt={card.card_name_kr}
                          className="card-image-display"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '8px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCards.length === 3 && (
          <div className="card-selection-actions">
            <button className="action-button secondary" onClick={() => {
              setSelectedCards([])
              setCurrentPage(0)
            }}>
              🔄 카드 다시 선택
            </button>
            {revealedCards.every(revealed => revealed) && (
              <button className="confirm-button" onClick={handleConfirm}>
                🔮 카드 해석 보기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CardSelection
