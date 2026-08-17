import type { Farm } from '../types/supplyChain.js';

/**
 * Phase 4初期データ。QグレードはSCA基準を参考にした概算値(80以上=スペシャルティ級)。
 */
// pricePerKgは円/kg(日本の生豆輸入相場を参考に較正。Jamaica Blue Mountainのみ最高級豆として一般的なレンジを意図的に超える)。
export const farms: Farm[] = [
  { id: 'farm-brazil-cerrado', country: 'brazil', qGrade: 78, pricePerKg: 1900, availableKgPerMonth: 5000, reliability: 85 },
  { id: 'farm-ethiopia-yirgacheffe', country: 'ethiopia', qGrade: 88, pricePerKg: 3500, availableKgPerMonth: 1200, reliability: 65 },
  { id: 'farm-colombia-huila', country: 'colombia', qGrade: 84, pricePerKg: 2700, availableKgPerMonth: 2500, reliability: 78 },
  { id: 'farm-vietnam-daklak', country: 'vietnam', qGrade: 70, pricePerKg: 1500, availableKgPerMonth: 8000, reliability: 90 },
  { id: 'farm-guatemala-antigua', country: 'guatemala', qGrade: 86, pricePerKg: 3000, availableKgPerMonth: 1000, reliability: 70 },
  { id: 'farm-kenya-nyeri', country: 'kenya', qGrade: 89, pricePerKg: 3800, availableKgPerMonth: 900, reliability: 60 },
  { id: 'farm-indonesia-mandheling', country: 'indonesia', qGrade: 81, pricePerKg: 2300, availableKgPerMonth: 1800, reliability: 72 },
  { id: 'farm-jamaica-bluemountain', country: 'jamaica', qGrade: 92, pricePerKg: 8500, availableKgPerMonth: 300, reliability: 55 },
];
