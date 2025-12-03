import React from 'react';

interface BackDesign {
  colorScheme: {
    bg: string;
    primary: string;
    secondary: string;
  };
  centerSymbol: string;
  glowIntensity: number;
}

interface CardBackProps {
  className?: string;
  style?: React.CSSProperties;
}

const CardBack: React.FC<CardBackProps> = ({ className = '', style = {} }) => {
  // Generate random design for each card back
  const generateRandomConfig = React.useMemo(() => {
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
    } as BackDesign;
  }, []);

  const { colorScheme, centerSymbol, glowIntensity } = generateRandomConfig;

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
    <svg 
      viewBox="0 0 55 85" 
      className={`w-full h-full ${className}`} 
      style={{
        ...style,
        display: 'block',
        borderRadius: 'inherit',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
      preserveAspectRatio="xMidYMid slice"
    >
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
      {/* 배경 - 테두리 안쪽에 그려서 테두리가 가장자리에 보이도록 */}
      <rect x="1.5" y="1.5" width="52" height="82" rx="3.5" fill={colorScheme.bg} />
      {/* 테두리 - 카드 가장자리에 맞춰서 그리기 */}
      <rect x="0" y="0" width="55" height="85" rx="4" fill="none" stroke="url(#goldGradient)" strokeWidth="3" />
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

export default CardBack;
