import type { City } from '../types/store.js';

/**
 * Phase 4初期データ。人口・所得水準は実際の都市規模感に寄せた概算値であり、統計的厳密性は
 * 目的としない(ゲームバランス調整用のプレースホルダ)。
 *
 * footTrafficIndexはPhase F(実データ較正)でWikipediaインフォボード記載の人口密度(人/km²、
 * 都市ごとに行政区分は異なる: 市域/Greater London/City of Sydney LGA等)を東京基準
 * (密度6,363人/km²→指数1.4を維持)に比例換算した値に置き換えた。密度が高いほど路面店前の
 * 歩行者密度も高い傾向があるという前提。所得水準による需要への影響は`incomeLevel`(価格許容度)
 * と`data/cityRent.ts`の実勢賃料側で別途反映されるため、Addis Ababa/Jakarta/Seoulのような
 * 人口密集だが低〜中所得の都市がTokyo/NYより高い指数になるのは意図的(「賃料は安いが人通りは
 * 多い」という薄利多売型の都市が生まれる)。
 * 出典密度: Tokyo 6,363, New York 11,314, London(Greater London) 5,782, Seoul 15,828,
 * Singapore 8,290, Shanghai 3,923, São Paulo 7,820, Mexico City 6,202, Addis Ababa 11,900,
 * Nairobi 6,317, Jakarta 16,600, Sydney(City of Sydney LGA) 8,470(いずれも人/km²)。
 */
export const cities: City[] = [
  { id: 'city-tokyo', name: 'Tokyo', country: 'Japan', population: 14_000_000, incomeLevel: 8, footTrafficIndex: 1.4 },
  { id: 'city-newyork', name: 'New York', country: 'USA', population: 8_400_000, incomeLevel: 9, footTrafficIndex: 2.49 },
  { id: 'city-london', name: 'London', country: 'UK', population: 9_000_000, incomeLevel: 9, footTrafficIndex: 1.27 },
  { id: 'city-seoul', name: 'Seoul', country: 'South Korea', population: 9_700_000, incomeLevel: 7, footTrafficIndex: 3.48 },
  { id: 'city-singapore', name: 'Singapore', country: 'Singapore', population: 5_700_000, incomeLevel: 9, footTrafficIndex: 1.82 },
  { id: 'city-shanghai', name: 'Shanghai', country: 'China', population: 24_000_000, incomeLevel: 6, footTrafficIndex: 0.86 },
  { id: 'city-saopaulo', name: 'São Paulo', country: 'Brazil', population: 12_000_000, incomeLevel: 4, footTrafficIndex: 1.72 },
  { id: 'city-mexicocity', name: 'Mexico City', country: 'Mexico', population: 9_200_000, incomeLevel: 4, footTrafficIndex: 1.36 },
  { id: 'city-addisababa', name: 'Addis Ababa', country: 'Ethiopia', population: 3_500_000, incomeLevel: 2, footTrafficIndex: 2.62 },
  { id: 'city-nairobi', name: 'Nairobi', country: 'Kenya', population: 4_400_000, incomeLevel: 3, footTrafficIndex: 1.39 },
  { id: 'city-jakarta', name: 'Jakarta', country: 'Indonesia', population: 10_500_000, incomeLevel: 4, footTrafficIndex: 3.65 },
  { id: 'city-sydney', name: 'Sydney', country: 'Australia', population: 5_300_000, incomeLevel: 8, footTrafficIndex: 1.86 },
];
