export interface EventNewsInfo {
  headline: string;
  icon: 'trending-up' | 'trending-down' | 'alert-circle' | 'flame' | 'star';
}

/**
 * packages/core/src/data/events.ts(会社全体)・data/storeEvents.ts(店舗ごと)のid→見出し文言。
 * どちらもUI文言を持たない設計(基盤④README準拠+同じレイヤー分離規約)のため、mobile側で対応付ける。
 */
export const EVENT_NEWS: Record<string, EventNewsInfo> = {
  // 会社全体イベント
  'viral-social-moment': { headline: 'SNSで話題沸騰、ブランド認知度が急上昇', icon: 'trending-up' },
  'weather-crop-failure': { headline: 'コーヒー豆の産地で不作、仕入れコストが高騰', icon: 'alert-circle' },
  'competitor-price-war': { headline: '競合が値下げ攻勢、ブランドイメージに影響', icon: 'trending-down' },
  'economic-boom': { headline: '好景気で客足が増加', icon: 'trending-up' },
  'economic-recession': { headline: '景気後退の兆し、売上に影響', icon: 'trending-down' },
  'quality-scandal': { headline: '品質に関する悪評が拡散', icon: 'alert-circle' },
  'loyalty-program-success': { headline: 'ロイヤリティプログラムが好評', icon: 'trending-up' },
  // 店舗ごとイベント
  'equipment-breakdown': { headline: 'エスプレッソマシンが故障、修繕費が発生', icon: 'alert-circle' },
  'employee-strike': { headline: '従業員の不満が高まりストライキが発生', icon: 'alert-circle' },
  'rent-hike-notice': { headline: 'ビルオーナーから賃料値上げの通告', icon: 'alert-circle' },
  'viral-buzz': { headline: 'インフルエンサーの投稿で行列ができるほどの人気に', icon: 'star' },
  'food-safety-rumor': { headline: '食中毒の噂がSNSで拡散', icon: 'alert-circle' },
};

export function getEventNews(eventId: string): EventNewsInfo {
  return EVENT_NEWS[eventId] ?? { headline: eventId, icon: 'flame' };
}
