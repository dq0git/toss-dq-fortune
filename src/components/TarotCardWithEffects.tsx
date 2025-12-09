import React, { useState, useRef, useEffect } from 'react';

interface TarotCardWithEffectsProps {
  image: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: number;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  touchAction?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const TarotCardWithEffects: React.FC<TarotCardWithEffectsProps> = ({
  image,
  alt = 'Card',
  className = '',
  style = {},
  behindGlowEnabled = true,
  behindGlowColor = 'rgba(125, 190, 255, 0.67)',
  behindGlowSize = 25,
  enableTilt = true,
  enableMobileTilt = true,
  mobileTiltSensitivity = 0.5,
  touchAction = 'pan-y',
  onError
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [pointerPos, setPointerPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const updatePointerPosition = (clientX: number, clientY: number) => {
    if (!cardRef.current || !wrapperRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setPointerPos({ x, y });

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const pointerFromLeft = (clientX - rect.left) / rect.width;
    const pointerFromTop = (clientY - rect.top) / rect.height;
    const pointerFromCenter = Math.sqrt(
      Math.pow(pointerFromLeft - 0.5, 2) + Math.pow(pointerFromTop - 0.5, 2)
    );

    const rotateX = (pointerFromTop - 0.5) * -15;
    const rotateY = (pointerFromLeft - 0.5) * 15;

    // wrapper와 card 모두에 CSS 변수 설정
    [wrapperRef.current, cardRef.current].forEach((el) => {
      if (el) {
        el.style.setProperty('--pointer-x', `${x}%`);
        el.style.setProperty('--pointer-y', `${y}%`);
        el.style.setProperty('--pointer-from-left', String(pointerFromLeft));
        el.style.setProperty('--pointer-from-top', String(pointerFromTop));
        el.style.setProperty('--pointer-from-center', String(pointerFromCenter));
        el.style.setProperty('--rotate-x', `${rotateX}deg`);
        el.style.setProperty('--rotate-y', `${rotateY}deg`);
        el.style.setProperty('--background-x', `${x}%`);
        el.style.setProperty('--background-y', `${y}%`);
      }
    });

    // 빛나는 효과 업데이트
    if (overlayRef.current && isHovered) {
      const offsetX = clientX - rect.left;
      const offsetY = clientY - rect.top;
      // 가로 움직임을 2배로 증가
      const backgroundPosition = (offsetX / 2.5 + offsetY / 5);
      const opacity = Math.min(offsetX / 200, 1);
      
      overlayRef.current.style.backgroundPosition = `${backgroundPosition}%`;
      overlayRef.current.style.filter = `opacity(${opacity}) brightness(1.2)`;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;
    
    updatePointerPosition(e.clientX, e.clientY);
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    setTilt({ x: x * 15, y: y * -15 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--card-opacity', '1');
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--card-opacity', '0');
    }
    if (overlayRef.current) {
      overlayRef.current.style.filter = 'opacity(0)';
    }
    if (!enableTilt) return;
    setTilt({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!enableMobileTilt || !isMobile || !cardRef.current) return;

    const touch = e.touches[0];
    updatePointerPosition(touch.clientX, touch.clientY);
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (touch.clientX - centerX) / (rect.width / 2);
    const y = (touch.clientY - centerY) / (rect.height / 2);
    
    setTilt({ 
      x: x * 15 * mobileTiltSensitivity, 
      y: y * -15 * mobileTiltSensitivity 
    });
  };

  const handleTouchStart = () => {
    setIsHovered(true);
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--card-opacity', '1');
    }
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty('--card-opacity', '0');
    }
    if (overlayRef.current) {
      overlayRef.current.style.filter = 'opacity(0)';
    }
    if (!enableMobileTilt) return;
    setTilt({ x: 0, y: 0 });
  };

  const tiltStyle = (enableTilt || (enableMobileTilt && isMobile))
    ? {
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: isHovered ? 'none' : 'transform 1s ease',
      }
    : {};

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.setProperty('--behind-glow-color', behindGlowColor);
      cardRef.current.style.setProperty('--behind-glow-size', `${behindGlowSize}%`);
    }
  }, [behindGlowColor, behindGlowSize]);

  return (
    <div
      ref={wrapperRef}
      className="pc-card-wrapper tarot-card-wrapper"
      style={{
        ...style,
        perspective: '500px',
        transform: 'translate3d(0, 0, 0.1px)',
        position: 'relative',
        touchAction: touchAction,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 단계별 확인: 2단계 - behind glow 활성화 */}
      {behindGlowEnabled && (
        <div className="pc-behind tarot-card-behind" />
      )}
      <div className="pc-card-shell tarot-card-shell">
        <div
          ref={cardRef}
          className={`pc-card tarot-card-with-effects ${isHovered ? 'active' : ''} ${className}`}
          style={{
            ...tiltStyle,
            backgroundColor: 'transparent',
            borderRadius: 'inherit',
            position: 'relative',
            overflow: 'visible',
            backfaceVisibility: 'visible',
            width: '100%',
            height: '100%',
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* 단계별 확인: 5단계 - 이미지 position을 absolute로 변경 */}
          <img
            src={image}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 'inherit',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1,
            }}
            onError={onError}
          />
          {/* 모든 효과 활성화 - 원래 설정으로 복원 */}
          {/* <div className="pc-inside tarot-card-inside" style={{ zIndex: 1, display: 'none' }} /> */}
          <div className="pc-shine tarot-card-shine" />
          <div className="pc-glare tarot-card-glare" />
          
          {/* 빛나는 효과 overlay */}
          <div
            ref={overlayRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: `linear-gradient(105deg,
                transparent 40%,
                rgba(255, 219, 112, 0.8) 45%,
                rgba(132, 50, 255, 0.6) 50%,
                transparent 54%)`,
              filter: 'brightness(1.1) opacity(0)',
              mixBlendMode: 'color-dodge',
              backgroundSize: '150% 150%',
              backgroundPosition: '100%',
              transition: 'all 0.1s',
              borderRadius: 'inherit',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TarotCardWithEffects;

