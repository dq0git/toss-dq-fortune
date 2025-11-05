import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase 설정 (환경변수로 관리)
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

// 타로 리딩 데이터 타입 정의
export interface TarotReading {
  tarot_id: number;
  card_name_kr: string;
  direction: 'upright' | 'reversed';
  arcana_type: 'major' | 'minor';
  suit: 'cups' | 'wands' | 'swords' | 'pentacles' | null;
  love_past: string;
  love_present: string; 
  love_future: string;
  career_past: string;
  career_present: string;
  career_future: string;
  money_past: string;
  money_present: string;
  money_future: string;
  final_advice_love: string;
  final_advice_career: string;
  final_advice_money: string;
  daily_advice: string;
  affirmation_love: string;
  affirmation_career: string;
  affirmation_money: string;
}

// API 함수들
export const tarotAPI = {
  // 모든 타로 카드 가져오기
  async getAllCards(): Promise<TarotReading[]> {
    const { data, error } = await supabase
      .from('tarot_readings')
      .select('*')
      .order('tarot_id')
    
    if (error) {
      console.error('Error fetching tarot cards:', error)
      return []
    }
    
    return data || []
  },

  // 특정 카드 가져오기
  async getCardById(id: number): Promise<TarotReading | null> {
    const { data, error } = await supabase
      .from('tarot_readings')
      .select('*')
      .eq('tarot_id', id)
      .single()
    
    if (error) {
      console.error('Error fetching card:', error)
      return null
    }
    
    return data
  },

  // 랜덤 카드 가져오기 (방향 랜덤 설정)
  async getRandomCard(): Promise<TarotReading | null> {
    const cards = await this.getAllCards()
    if (cards.length === 0) return null
    
    const randomCard = cards[Math.floor(Math.random() * cards.length)]
    
    // 방향 랜덤 설정
    const direction = Math.random() > 0.5 ? 'upright' : 'reversed'
    
    return {
      ...randomCard,
      direction
    }
  },

  // 여러 랜덤 카드 가져오기 (3+1카드용)
  async getRandomCards(count = 3): Promise<TarotReading[]> {
    const cards = await this.getAllCards()
    if (cards.length === 0) return []
    
    const selectedCards: TarotReading[] = []
    const usedIds = new Set<number>()
    
    for (let i = 0; i < count; i++) {
      let randomCard: TarotReading
      do {
        randomCard = cards[Math.floor(Math.random() * cards.length)]
      } while (usedIds.has(randomCard.tarot_id))
      
      usedIds.add(randomCard.tarot_id)
      
      // 방향 랜덤 설정
      const direction = Math.random() > 0.5 ? 'upright' : 'reversed'
      
      selectedCards.push({
        ...randomCard,
        direction
      })
    }
    
    return selectedCards
  },

  // 주제별 해석 가져오기
  getMeaningByTopic(card: TarotReading, topic: string, time: string): string {
    const topicMap: { [key: string]: string } = {
      'love': 'love',
      'career': 'career', 
      'money': 'money'
    }
    
    const timeMap: { [key: string]: string } = {
      'past': 'past',
      'present': 'present',
      'future': 'future'
    }
    
    const topicKey = topicMap[topic]
    const timeKey = timeMap[time]
    
    if (!topicKey || !timeKey) return ''
    
    const meaningKey = `${topicKey}_${timeKey}` as keyof TarotReading
    return (card[meaningKey] as string) || ''
  },

  // 주제별 최종 조언 가져오기
  getFinalAdviceByTopic(card: TarotReading, topic: string): string {
    const topicMap: { [key: string]: string } = {
      'love': 'final_advice_love',
      'career': 'final_advice_career',
      'money': 'final_advice_money'
    }
    
    const adviceKey = topicMap[topic] as keyof TarotReading
    return adviceKey ? (card[adviceKey] as string) : ''
  },

  // 주제별 부적 암시 가져오기
  getAffirmationByTopic(card: TarotReading, topic: string): string {
    const topicMap: { [key: string]: string } = {
      'love': 'affirmation_love',
      'career': 'affirmation_career', 
      'money': 'affirmation_money'
    }
    
    const affirmationKey = topicMap[topic] as keyof TarotReading
    return affirmationKey ? (card[affirmationKey] as string) : ''
  },

  // 오늘의 운세용 일일 조언 가져오기
  getDailyAdvice(card: TarotReading): string {
    return card.daily_advice || ''
  }
}
