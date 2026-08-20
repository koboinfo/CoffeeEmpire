import type { City, Property } from '../types/store.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// カフェは1坪あたり1.5席が目安(個人店の相場)。
export const SEATS_PER_TSUBO = 1.5;

// サイズごとの基準坪数(mediumの20坪を基準に、kiosk/smallは実勢の小型店舗規模感に寄せた値)。
const SIZE_TSUBO: Record<Property['size'], number> = {
  kiosk: 5,
  small: 10,
  medium: 20,
  large: 35,
  flagship: 60,
};

/**
 * sizeTsubo/seatsが未設定のPropertyのための後方互換フォールバック
 * (Phase E以前に生成されたセーブ・テストフィクスチャ向け)。
 */
export function resolvePropertyCapacity(property: Property): { sizeTsubo: number; seats: number } {
  const sizeTsubo = property.sizeTsubo ?? SIZE_TSUBO[property.size] ?? SIZE_TSUBO.medium;
  const seats = property.seats ?? Math.max(1, Math.round(sizeTsubo * SEATS_PER_TSUBO));
  return { sizeTsubo, seats };
}

/**
 * 家賃坪単価(円/月)のフォールバック式。rentPerTsuboByCityIdに当該都市が無い場合のみ使う
 * (data/cityRent.tsの実データテーブルに載っていないテスト用フィクスチャ・将来追加都市向け)。
 * 都市の所得水準×客足指数が高いほど坪単価が上がる、という内部整合性優先の簡易式。
 */
function fallbackRentPerTsubo(city: City): number {
  return clamp(city.incomeLevel * city.footTrafficIndex * 600, 2_000, 12_000);
}

const SIZE_PRESETS: Property['size'][] = ['kiosk', 'small', 'medium'];

/**
 * 都市の人口動態(footTrafficIndex/incomeLevel)から出店可能な物件候補を3件生成する。
 * variance(±10%)にのみrngを使い、規模ごとの相対関係(kiosk<small<medium)は常に保たれる。
 * 坪数(sizeTsubo)を物理的な起点とし、賃料・座席数・footTrafficの規模係数を同じ坪数から導出する。
 *
 * rentPerTsuboByCityId: 都市ごとの実勢家賃(data/cityRent.tsのRENT_PER_TSUBO_JPY)を呼び出し側が
 * 注入する。logic/*.tsはdata/*.tsの値をimportしない規約(ARCHITECTURE.md参照)のため、mobile層の
 * 呼び出しコード側でRENT_PER_TSUBO_JPYを渡す。未指定・未登録都市はfallbackRentPerTsuboを使う。
 */
export function generatePropertiesForCity(
  city: City,
  rng: () => number = Math.random,
  rentPerTsuboByCityId: Record<string, number> = {}
): Property[] {
  const rentPerTsubo = rentPerTsuboByCityId[city.id] ?? fallbackRentPerTsubo(city);
  const mediumTsubo = SIZE_TSUBO.medium;

  return SIZE_PRESETS.map((size, index) => {
    const variance = 0.9 + rng() * 0.2; // 0.9 - 1.1
    const sizeTsubo = SIZE_TSUBO[size];
    const seats = Math.max(1, Math.round(sizeTsubo * SEATS_PER_TSUBO));
    const footTrafficMultiplier = sizeTsubo / mediumTsubo; // medium(20坪)を基準1.0とする相対値
    const footTraffic = Math.round(city.footTrafficIndex * 1000 * footTrafficMultiplier * variance);
    const rentPerMonth = Math.round(sizeTsubo * rentPerTsubo * variance);

    return {
      id: `prop-${city.id}-${size}-${index}`,
      cityId: city.id,
      size,
      sizeTsubo,
      seats,
      footTraffic,
      rentPerMonth,
      ownership: 'unowned',
    };
  });
}
