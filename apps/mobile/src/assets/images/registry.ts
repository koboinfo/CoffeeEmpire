import type { ImageSourcePropType } from 'react-native';

/**
 * 実写アセットのレジストリ。/src/assets/images/README.md 参照。
 * Metroは静的な require パスしか解決できないため、動的な `require(`./cities/${id}.webp`)` は使えない。
 * ファイルを追加したら、下記のコメントを解除して1エントリずつ静的に登録する。
 */
const CITY_IMAGES: Partial<Record<string, ImageSourcePropType>> = {
  // 'city-tokyo': require('./cities/city-tokyo.webp'),
};

const INTERIOR_IMAGES: Partial<Record<1 | 2 | 4, ImageSourcePropType>> = {
  // 1: require('./interiors/tier-1.webp'),
  // 2: require('./interiors/tier-2.webp'),
  // 4: require('./interiors/tier-4.webp'),
};

const ORIGIN_IMAGES: Partial<Record<string, ImageSourcePropType>> = {
  // brazil: require('./origins/brazil.webp'),
};

const NEWS_IMAGES: Partial<Record<string, ImageSourcePropType>> = {
  // 'viral-social-moment': require('./news/viral-social-moment.webp'),
};

export function getCityImage(cityId: string): ImageSourcePropType | undefined {
  return CITY_IMAGES[cityId];
}

export function getInteriorImage(tier: number): ImageSourcePropType | undefined {
  return INTERIOR_IMAGES[tier as 1 | 2 | 4];
}

export function getOriginImage(country: string): ImageSourcePropType | undefined {
  return ORIGIN_IMAGES[country];
}

export function getNewsImage(eventId: string): ImageSourcePropType | undefined {
  return NEWS_IMAGES[eventId];
}
