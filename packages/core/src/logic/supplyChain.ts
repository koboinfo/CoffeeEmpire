import type { Farm, RoastLevel } from '../types/supplyChain.js';

export interface GreenBeanPurchaseResult {
  deliveredKg: number;
  cost: number;
}

const SUPPLY_DISRUPTION_DELIVERY_RATE = 0.7;

/**
 * 生豆購入結果を算定する。requestedKgは農園のavailableKgPerMonthで頭打ちにし、
 * reliability(供給安定性)に応じた確率で供給不足(70%しか届かない)が発生する。
 */
export function calculateGreenBeanPurchase(
  farm: Farm,
  requestedKg: number,
  rng: () => number = Math.random
): GreenBeanPurchaseResult {
  const cappedKg = Math.min(requestedKg, farm.availableKgPerMonth);
  const isDisrupted = rng() > farm.reliability / 100;
  const deliveredKg = isDisrupted ? Math.round(cappedKg * SUPPLY_DISRUPTION_DELIVERY_RATE) : cappedKg;
  const cost = Math.round(deliveredKg * farm.pricePerKg);

  return { deliveredKg, cost };
}

const ROAST_YIELD_RATE: Record<RoastLevel, number> = {
  light: 0.86,
  medium: 0.84,
  darkMedium: 0.82,
  dark: 0.8,
};

// 深煎りほど風味の産地由来ニュアンスが均され、素材のQグレードが評価に反映されにくくなる想定の簡易補正。
const ROAST_LEVEL_QUALITY_FACTOR: Record<RoastLevel, number> = {
  light: 1.0,
  medium: 0.98,
  darkMedium: 0.95,
  dark: 0.9,
};

export interface RoastableLot {
  qGrade: number;
  kg: number;
  pricePerKg: number;
}

export interface RoastOutputResult {
  outputKg: number;
  qualityScore: number;
  costPerKg: number;
}

/**
 * 生豆ロット(複数可)を焙煎した際の歩留まり後の重量・品質スコア・原価を計算する。
 * qualityScoreは投入豆のkg加重平均Qグレードに焙煎度合いの品質係数を乗じたもの。
 * costPerKgは投入生豆コスト合計を歩留まり後kgで割ったもの(焙煎ロス分だけ単価が上がる)。
 */
export function calculateRoastOutput(lots: RoastableLot[], roastLevel: RoastLevel): RoastOutputResult {
  const totalKg = lots.reduce((sum, lot) => sum + lot.kg, 0);
  if (totalKg === 0) {
    return { outputKg: 0, qualityScore: 0, costPerKg: 0 };
  }

  const weightedQGrade = lots.reduce((sum, lot) => sum + lot.qGrade * lot.kg, 0) / totalKg;
  const totalInputCost = lots.reduce((sum, lot) => sum + lot.pricePerKg * lot.kg, 0);
  const outputKg = Math.round(totalKg * ROAST_YIELD_RATE[roastLevel]);
  const qualityScore = Math.round(weightedQGrade * ROAST_LEVEL_QUALITY_FACTOR[roastLevel]);
  const costPerKg = outputKg > 0 ? Math.round((totalInputCost / outputKg) * 100) / 100 : 0;

  return { outputKg, qualityScore, costPerKg };
}

/**
 * 自社農園の買収価格。月産量×市場単価の24ヶ月分を目安にする(不動産投資評価と同系統のロジック)。
 */
export function calculateFarmAcquisitionPrice(farm: Farm): number {
  return Math.round(farm.availableKgPerMonth * farm.pricePerKg * 24);
}

const FARM_HARVEST_FAILURE_PROBABILITY = 0.12; // 天候リスク: 毎ターン12%の確率で不作が発生する
const FARM_HARVEST_FAILURE_YIELD_RATE = 0.2; // 不作時は通常の20%しか収穫できない
const OWNED_FARM_MAINTENANCE_RATE = 0.1; // 自社農園は市場単価の10%相当の維持費のみで収穫できる(原価を大幅圧縮)

export interface OwnedFarmHarvestResult {
  deliveredKg: number;
  maintenanceCost: number;
  isHarvestFailure: boolean;
}

/**
 * 自社農園の毎ターン自動収穫。市場からの購入(calculateGreenBeanPurchase)と異なり
 * availableKgPerMonthの頭打ちは常にフル収穫(不作でない限り)で、コストは維持費のみ
 * (市場単価の10%)。天候リスクにより一定確率で収穫量が激減する。
 */
export function calculateOwnedFarmHarvest(farm: Farm, rng: () => number = Math.random): OwnedFarmHarvestResult {
  const isHarvestFailure = rng() < FARM_HARVEST_FAILURE_PROBABILITY;
  const yieldRate = isHarvestFailure ? FARM_HARVEST_FAILURE_YIELD_RATE : 1;
  const deliveredKg = Math.round(farm.availableKgPerMonth * yieldRate);
  const maintenanceCost = Math.round(deliveredKg * farm.pricePerKg * OWNED_FARM_MAINTENANCE_RATE);

  return { deliveredKg, maintenanceCost, isHarvestFailure };
}
