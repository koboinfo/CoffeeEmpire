function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const CITY_BRAND_AWARENESS_BASELINE = 20; // 未出店・未認知都市の初期値相当
const CITY_BRAND_AWARENESS_DECAY_RATE = 0.985; // 毎ターン1.5%ずつbaselineへ回帰する(継続宣伝が無いと徐々に忘れられる)

/** 都市の認知度を取得する。未設定キーはbaseline扱い(後方互換: 新規追加フィールドのため)。 */
export function getCityBrandAwareness(byCity: Record<string, number> | undefined, cityId: string): number {
  return byCity?.[cityId] ?? CITY_BRAND_AWARENESS_BASELINE;
}

/**
 * 全都市の認知度をbaselineへ向けてわずかに減衰させる(継続的な宣伝が無いと徐々に忘れられる)。
 * calculateSeasonalFactorと同じ「毎ターン呼び出す純粋関数」パターン。
 */
export function decayBrandAwarenessByCity(byCity: Record<string, number> | undefined): Record<string, number> {
  const next: Record<string, number> = { ...(byCity ?? {}) };
  for (const cityId of Object.keys(next)) {
    const current = next[cityId];
    const decayed = CITY_BRAND_AWARENESS_BASELINE + (current - CITY_BRAND_AWARENESS_BASELINE) * CITY_BRAND_AWARENESS_DECAY_RATE;
    next[cityId] = Math.round(clamp(decayed, 0, 100) * 10) / 10;
  }
  return next;
}

/** 特定都市の認知度へdeltaを加算する(マーケティングキャンペーンの都度加点に使う)。 */
export function bumpCityBrandAwareness(
  byCity: Record<string, number> | undefined,
  cityId: string,
  delta: number
): Record<string, number> {
  const current = getCityBrandAwareness(byCity, cityId);
  return { ...(byCity ?? {}), [cityId]: Math.round(clamp(current + delta, 0, 100) * 10) / 10 };
}

const MIN_CITY_AWARENESS_FACTOR = 0.9;
const MAX_CITY_AWARENESS_FACTOR = 1.1;

/**
 * 都市認知度(0-100)から売上への乗数(0.9-1.1)を算出する。turnEngineで
 * competitivePressure/researchEffectsと同じ「事後乗算」パターンで店舗revenue/variableCostへ適用する。
 */
export function calculateCityAwarenessRevenueFactor(awareness: number): number {
  const normalized = clamp(awareness, 0, 100) / 100;
  return MIN_CITY_AWARENESS_FACTOR + normalized * (MAX_CITY_AWARENESS_FACTOR - MIN_CITY_AWARENESS_FACTOR);
}
