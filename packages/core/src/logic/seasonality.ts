// 月ごとの季節係数(1月=0 〜 12月=11)。夏場のアイスドリンク需要・年末年始の人出などを
// ±20〜30%程度の売上変動として表現する(実店舗の繁忙期/閑散期の目安を参考に較正)。
const SEASONAL_FACTORS_BY_MONTH: number[] = [
  0.75, // 1月: 正月明けの閑散期
  0.85, // 2月
  1.05, // 3月: 年度替わり
  1.1, // 4月: 新生活シーズン
  1.0, // 5月
  0.85, // 6月: 梅雨
  1.2, // 7月: 夏場のアイス需要
  1.3, // 8月: 夏休みピーク
  1.0, // 9月
  0.95, // 10月
  0.9, // 11月
  1.15, // 12月: 年末商戦
];

/**
 * `turn`(1始まり、1ターン=1ヶ月)から0始まりの月インデックス(0=1月)を求める。
 * apps/mobile/src/components/HudBar.tsxの表示用日付ロジックと同じ計算式に揃える。
 */
export function turnToMonthIndex(turn: number): number {
  const monthIndex = Math.max(turn - 1, 0);
  return monthIndex % 12;
}

export function calculateSeasonalFactor(turn: number): number {
  return SEASONAL_FACTORS_BY_MONTH[turnToMonthIndex(turn)];
}
