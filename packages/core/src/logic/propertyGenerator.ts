import type { City, Property } from '../types/store.js';

// 賃料は「所得レベル1につき何円/月」を表す実額ベースの単価(日本の実店舗賃料相場を参考に較正)。
const SIZE_PRESETS: { size: Property['size']; footTrafficMultiplier: number; rentPerIncomeLevel: number }[] = [
  { size: 'kiosk', footTrafficMultiplier: 0.4, rentPerIncomeLevel: 15_000 },
  { size: 'small', footTrafficMultiplier: 0.7, rentPerIncomeLevel: 25_000 },
  { size: 'medium', footTrafficMultiplier: 1.0, rentPerIncomeLevel: 90_000 },
];

/**
 * 都市の人口動態(footTrafficIndex/incomeLevel)から出店可能な物件候補を3件生成する。
 * variance(±10%)にのみrngを使い、規模ごとの相対関係(kiosk<small<medium)は常に保たれる。
 */
export function generatePropertiesForCity(city: City, rng: () => number = Math.random): Property[] {
  return SIZE_PRESETS.map((preset, index) => {
    const variance = 0.9 + rng() * 0.2; // 0.9 - 1.1
    const footTraffic = Math.round(city.footTrafficIndex * 1000 * preset.footTrafficMultiplier * variance);
    const rentPerMonth = Math.round(city.incomeLevel * preset.rentPerIncomeLevel * variance);

    return {
      id: `prop-${city.id}-${preset.size}-${index}`,
      cityId: city.id,
      size: preset.size,
      footTraffic,
      rentPerMonth,
      ownership: 'unowned',
    };
  });
}
