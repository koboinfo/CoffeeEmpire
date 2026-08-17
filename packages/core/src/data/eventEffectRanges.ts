/**
 * 会社全体イベント(data/events.ts)の効果量をランダム化するためのレンジテーブル。
 * イベントidごとに、効果キー(cash/brandAwareness等)ごとの[min, max]を定義する。
 * ここにエントリが無いキーはSimEvent.effectの固定値をそのまま使う(後方互換のフォールバック)。
 * SimEvent/rollEvents/applyEffect自体(基盤④README準拠のAPI)は変更しない。
 */
export const EVENT_EFFECT_RANGES: Record<string, Partial<Record<string, [number, number]>>> = {
  'economic-boom': { cash: [200_000, 500_000] },
  'economic-recession': { cash: [-500_000, -200_000] },
  'weather-crop-failure': { cash: [-600_000, -200_000] },
  'viral-social-moment': { brandAwareness: [10, 20] },
  'competitor-price-war': { brandAwareness: [-8, -3] },
  'quality-scandal': { brandAwareness: [-30, -10] },
  'loyalty-program-success': { cash: [30_000, 90_000], brandAwareness: [5, 10] },
};

function randomInRange([min, max]: [number, number], rng: () => number): number {
  return min + rng() * (max - min);
}

/**
 * イベントidに対応するレンジがあればその中からランダムな値を、無ければbaseEffectの固定値を採用する。
 * 数値は整数に丸める(cash/statusesはいずれも整数運用のため)。
 */
export function resolveEventEffect(
  eventId: string,
  baseEffect: Record<string, number>,
  rng: () => number = Math.random
): Record<string, number> {
  const ranges = EVENT_EFFECT_RANGES[eventId];
  if (!ranges) return baseEffect;

  const resolved: Record<string, number> = { ...baseEffect };
  for (const [key, range] of Object.entries(ranges)) {
    if (!range) continue;
    resolved[key] = Math.round(randomInRange(range, rng));
  }
  return resolved;
}
