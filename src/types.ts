export type Screen = 'main' | 'topic-selection' | 'subtopic-selection' | 'card-selection' | 'result' | 'daily-card' | 'tarot-talisman' | 'camera';

export interface Card {
  tarot_id: number;
  card_name_kr: string;
  direction: 'upright' | 'reversed';
  position?: '과거' | '현재' | '미래';
  // 다른 카드 속성들도 필요에 따라 추가할 수 있습니다.
}
