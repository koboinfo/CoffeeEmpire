import type { City } from '../types/store.js';

/**
 * Phase 4初期データ。人口・所得水準・足数指数は実際の都市規模感に寄せた概算値であり、
 * 統計的厳密性は目的としない(ゲームバランス調整用のプレースホルダ)。
 */
export const cities: City[] = [
  { id: 'city-tokyo', name: 'Tokyo', country: 'Japan', population: 14_000_000, incomeLevel: 8, footTrafficIndex: 1.4 },
  { id: 'city-newyork', name: 'New York', country: 'USA', population: 8_400_000, incomeLevel: 9, footTrafficIndex: 1.5 },
  { id: 'city-london', name: 'London', country: 'UK', population: 9_000_000, incomeLevel: 9, footTrafficIndex: 1.3 },
  { id: 'city-seoul', name: 'Seoul', country: 'South Korea', population: 9_700_000, incomeLevel: 7, footTrafficIndex: 1.3 },
  { id: 'city-singapore', name: 'Singapore', country: 'Singapore', population: 5_700_000, incomeLevel: 9, footTrafficIndex: 1.2 },
  { id: 'city-shanghai', name: 'Shanghai', country: 'China', population: 24_000_000, incomeLevel: 6, footTrafficIndex: 1.4 },
  { id: 'city-saopaulo', name: 'São Paulo', country: 'Brazil', population: 12_000_000, incomeLevel: 4, footTrafficIndex: 1.1 },
  { id: 'city-mexicocity', name: 'Mexico City', country: 'Mexico', population: 9_200_000, incomeLevel: 4, footTrafficIndex: 1.1 },
  { id: 'city-addisababa', name: 'Addis Ababa', country: 'Ethiopia', population: 3_500_000, incomeLevel: 2, footTrafficIndex: 0.8 },
  { id: 'city-nairobi', name: 'Nairobi', country: 'Kenya', population: 4_400_000, incomeLevel: 3, footTrafficIndex: 0.9 },
  { id: 'city-jakarta', name: 'Jakarta', country: 'Indonesia', population: 10_500_000, incomeLevel: 4, footTrafficIndex: 1.1 },
  { id: 'city-sydney', name: 'Sydney', country: 'Australia', population: 5_300_000, incomeLevel: 8, footTrafficIndex: 1.2 },
];
