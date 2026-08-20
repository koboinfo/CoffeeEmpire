import type { Farm } from '../types/supplyChain.js';

/**
 * Phase 4初期データ。QグレードはSCA基準を参考にした概算値(80以上=スペシャルティ級)。
 * flavor(香り/酸味/苦味)は各産地の一般的な特徴を参考にした概算値で、qGradeとは独立。
 */
// pricePerKgは円/kg(日本の生豆輸入相場を参考に較正。Jamaica Blue Mountainのみ最高級豆として一般的なレンジを意図的に超える)。
// 実効価格はcalculateEffectiveBeanPrice(farm, turn)がturnごとに変動させる(このpricePerKgは変動の基準値)。
export const farms: Farm[] = [
  {
    id: 'farm-brazil-cerrado',
    country: 'brazil',
    qGrade: 78,
    flavor: { aroma: 55, acidity: 35, bitterness: 55 }, // ナッツ・チョコレート系、酸味は控えめでバランス型
    pricePerKg: 1900,
    availableKgPerMonth: 5000,
    reliability: 85,
  },
  {
    id: 'farm-ethiopia-yirgacheffe',
    country: 'ethiopia',
    qGrade: 88,
    flavor: { aroma: 90, acidity: 85, bitterness: 25 }, // 華やかな花・柑橘系の香りと明るい酸味が特徴
    pricePerKg: 3500,
    availableKgPerMonth: 1200,
    reliability: 65,
  },
  {
    id: 'farm-colombia-huila',
    country: 'colombia',
    qGrade: 84,
    flavor: { aroma: 70, acidity: 60, bitterness: 45 }, // フルーティな甘みとほどよい酸味のバランス型
    pricePerKg: 2700,
    availableKgPerMonth: 2500,
    reliability: 78,
  },
  {
    id: 'farm-vietnam-daklak',
    country: 'vietnam',
    qGrade: 70,
    flavor: { aroma: 40, acidity: 20, bitterness: 80 }, // ロブスタ主体、力強い苦味とコク
    pricePerKg: 1500,
    availableKgPerMonth: 8000,
    reliability: 90,
  },
  {
    id: 'farm-guatemala-antigua',
    country: 'guatemala',
    qGrade: 86,
    flavor: { aroma: 65, acidity: 55, bitterness: 50 }, // スモーキーさとほどよい酸味のバランス型
    pricePerKg: 3000,
    availableKgPerMonth: 1000,
    reliability: 70,
  },
  {
    id: 'farm-kenya-nyeri',
    country: 'kenya',
    qGrade: 89,
    flavor: { aroma: 80, acidity: 90, bitterness: 30 }, // ベリー系の華やかな香りと強い酸味
    pricePerKg: 3800,
    availableKgPerMonth: 900,
    reliability: 60,
  },
  {
    id: 'farm-indonesia-mandheling',
    country: 'indonesia',
    qGrade: 81,
    flavor: { aroma: 60, acidity: 15, bitterness: 75 }, // 低酸味・重厚なコクとアーシーな香り
    pricePerKg: 2300,
    availableKgPerMonth: 1800,
    reliability: 72,
  },
  {
    id: 'farm-jamaica-bluemountain',
    country: 'jamaica',
    qGrade: 92,
    flavor: { aroma: 85, acidity: 50, bitterness: 35 }, // マイルドかつ上品な香りと調和の取れた味わい
    pricePerKg: 8500,
    availableKgPerMonth: 300,
    reliability: 55,
  },
];
