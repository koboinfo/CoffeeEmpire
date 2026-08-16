export interface EventNewsInfo {
  headline: string;
  icon: 'trending-up' | 'trending-down' | 'alert-circle' | 'flame' | 'star';
}

/**
 * packages/core/src/data/events.ts のSimEvent(id)に対応する見出し文言。
 * SimEvent自体は基盤④README準拠でUI文言を持たない設計のため、mobile側でid→見出しを対応付ける。
 */
export const EVENT_NEWS: Record<string, EventNewsInfo> = {
  'viral-social-moment': { headline: 'SNSで話題沸騰、ブランド認知度が急上昇', icon: 'trending-up' },
  'weather-crop-failure': { headline: 'コーヒー豆の産地で不作、仕入れコストに影響', icon: 'alert-circle' },
  'employee-strike': { headline: '従業員の不満が高まりストライキが発生', icon: 'alert-circle' },
  'equipment-breakdown': { headline: '店舗設備が故障、修繕費が発生', icon: 'alert-circle' },
  'competitor-price-war': { headline: '競合が値下げ攻勢、ブランドイメージに影響', icon: 'trending-down' },
  'economic-boom': { headline: '好景気で客足が増加', icon: 'trending-up' },
  'economic-recession': { headline: '景気後退の兆し、売上に影響', icon: 'trending-down' },
  'quality-scandal': { headline: '品質に関する悪評が拡散', icon: 'alert-circle' },
  'celebrity-endorsement': { headline: '著名人が来店し話題に', icon: 'star' },
  'loyalty-program-success': { headline: 'ロイヤリティプログラムが好評', icon: 'trending-up' },
};

export function getEventNews(eventId: string): EventNewsInfo {
  return EVENT_NEWS[eventId] ?? { headline: eventId, icon: 'flame' };
}
