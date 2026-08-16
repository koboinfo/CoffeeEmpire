import type { City, Property } from '../types/store.js';

const SIZE_PRESETS: { size: Property['size']; footTrafficMultiplier: number; rentMultiplier: number }[] = [
  { size: 'kiosk', footTrafficMultiplier: 0.4, rentMultiplier: 0.3 },
  { size: 'small', footTrafficMultiplier: 0.7, rentMultiplier: 0.6 },
  { size: 'medium', footTrafficMultiplier: 1.0, rentMultiplier: 1.0 },
];

/**
 * 都市の人口動態(footTrafficIndex/incomeLevel)から出店可能な物件候補を3件生成する。
 * variance(±10%)にのみrngを使い、規模ごとの相対関係(kiosk<small<medium)は常に保たれる。
 */
export function generatePropertiesForCity(city: City, rng: () => number = Math.random): Property[] {
  return SIZE_PRESETS.map((preset, index) => {
    const variance = 0.9 + rng() * 0.2; // 0.9 - 1.1
    const footTraffic = Math.round(city.footTrafficIndex * 1000 * preset.footTrafficMultiplier * variance);
    const rentPerMonth = Math.round(city.incomeLevel * 500 * preset.rentMultiplier * variance);

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
