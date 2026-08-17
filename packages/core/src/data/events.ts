import type { SimEvent } from '../types/simState.js';

/**
 * 会社全体イベントテーブル(全社のcash/statusesに一括で作用する)。probabilityは1ターン(月次)あたりの発生確率。
 * conditionはSimState.statuses/cashを参照する(基盤④README準拠)。
 * effect内の数値は実際には使われない場合がある(eventEffectRanges.tsにレンジ定義があるイベントは
 * そちらの乱数値が優先される。ここでのeffectはレンジ未定義時のフォールバック値)。
 * 店舗ごとに発生するイベント(機材故障・従業員ストライキ・賃料値上げ・SNSバズり・悪評)は
 * data/storeEvents.tsを参照。
 */
export const events: SimEvent[] = [
  {
    id: 'viral-social-moment',
    probability: 0.08,
    effect: { brandAwareness: 15 },
  },
  {
    id: 'weather-crop-failure',
    probability: 0.05,
    effect: { cash: -400000 },
  },
  {
    id: 'competitor-price-war',
    probability: 0.05,
    effect: { brandAwareness: -5 },
  },
  {
    id: 'economic-boom',
    probability: 0.05,
    effect: { cash: 300000 },
  },
  {
    id: 'economic-recession',
    probability: 0.05,
    effect: { cash: -300000 },
  },
  {
    id: 'quality-scandal',
    probability: 0.03,
    condition: (state) => (state.statuses.avgQuality?.value ?? 100) < 50,
    effect: { brandAwareness: -20 },
  },
  {
    id: 'loyalty-program-success',
    probability: 0.07,
    condition: (state) => (state.statuses.employeeMorale?.value ?? 0) > 70,
    effect: { brandAwareness: 8, cash: 60000 },
  },
];
