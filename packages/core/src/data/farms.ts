import type { Farm } from '../types/supplyChain.js';

/**
 * Phase 4初期データ。QグレードはSCA基準を参考にした概算値(80以上=スペシャルティ級)。
 */
export const farms: Farm[] = [
  { id: 'farm-brazil-cerrado', country: 'brazil', qGrade: 78, pricePerKg: 6.5, availableKgPerMonth: 5000, reliability: 85 },
  { id: 'farm-ethiopia-yirgacheffe', country: 'ethiopia', qGrade: 88, pricePerKg: 12.0, availableKgPerMonth: 1200, reliability: 65 },
  { id: 'farm-colombia-huila', country: 'colombia', qGrade: 84, pricePerKg: 9.5, availableKgPerMonth: 2500, reliability: 78 },
  { id: 'farm-vietnam-daklak', country: 'vietnam', qGrade: 70, pricePerKg: 4.0, availableKgPerMonth: 8000, reliability: 90 },
  { id: 'farm-guatemala-antigua', country: 'guatemala', qGrade: 86, pricePerKg: 10.5, availableKgPerMonth: 1000, reliability: 70 },
  { id: 'farm-kenya-nyeri', country: 'kenya', qGrade: 89, pricePerKg: 13.0, availableKgPerMonth: 900, reliability: 60 },
  { id: 'farm-indonesia-mandheling', country: 'indonesia', qGrade: 81, pricePerKg: 8.0, availableKgPerMonth: 1800, reliability: 72 },
  { id: 'farm-jamaica-bluemountain', country: 'jamaica', qGrade: 92, pricePerKg: 28.0, availableKgPerMonth: 300, reliability: 55 },
];
