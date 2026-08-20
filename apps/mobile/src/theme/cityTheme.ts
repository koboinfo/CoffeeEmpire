import { colors } from './theme';

interface CityTheme {
  accentColor: string;
  landmarkEmoji: string;
}

/**
 * 実写の都市マップ画像(assets/images/registry.ts)が用意されるまでの暫定演出。
 * 都市ごとにアクセントカラーとランドマーク絵文字を固定し、街並みの個性を最小コストで出す。
 */
const CITY_THEMES: Record<string, CityTheme> = {
  'city-tokyo': { accentColor: '#E2564B', landmarkEmoji: '🗼' },
  'city-newyork': { accentColor: '#4E8CFF', landmarkEmoji: '🗽' },
  'city-london': { accentColor: '#8C9EFF', landmarkEmoji: '🎡' },
  'city-seoul': { accentColor: '#5FBE72', landmarkEmoji: '🏯' },
  'city-singapore': { accentColor: '#E8A23D', landmarkEmoji: '🌳' },
  'city-shanghai': { accentColor: '#D9722C', landmarkEmoji: '🏙️' },
  'city-saopaulo': { accentColor: '#5FBE72', landmarkEmoji: '🌆' },
  'city-mexicocity': { accentColor: '#E8A23D', landmarkEmoji: '🌵' },
  'city-addisababa': { accentColor: '#D9722C', landmarkEmoji: '⛰️' },
  'city-nairobi': { accentColor: '#B85A1F', landmarkEmoji: '🦁' },
  'city-jakarta': { accentColor: '#4E8CFF', landmarkEmoji: '🕌' },
  'city-sydney': { accentColor: '#4E8CFF', landmarkEmoji: '🏛️' },
};

const DEFAULT_THEME: CityTheme = { accentColor: colors.roast, landmarkEmoji: '🏙️' };

export function getCityTheme(cityId: string): CityTheme {
  return CITY_THEMES[cityId] ?? DEFAULT_THEME;
}
