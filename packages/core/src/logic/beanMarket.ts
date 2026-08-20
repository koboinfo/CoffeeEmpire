import type { Farm } from '../types/supplyChain.js';

/**
 * farmIdから決定論的な位相オフセット(0〜2π)を作る。rngを使わず、同じfarmId+turnなら
 * 常に同じ値を返す(市場閲覧時に見せた価格と購入確定時の価格が一致するようにするため)。
 */
function phaseFromFarmId(farmId: string): number {
  let hash = 0;
  for (let i = 0; i < farmId.length; i++) {
    hash = (hash * 31 + farmId.charCodeAt(i)) % 997;
  }
  return (hash / 997) * Math.PI * 2;
}

const PRICE_CYCLE_LENGTH_TURNS = 9; // 需給サイクルの周期(ターン数)。季節性(12)とずらして重ならないようにする
const PRICE_CYCLE_AMPLITUDE = 0.12; // 周期変動の振幅(±12%)
const PRICE_NOISE_AMPLITUDE = 0.08; // 短期的な揺らぎの振幅(±8%)

/**
 * farmId・turnから決定論的な生豆価格係数を算出する(rngなし、calculateSeasonalFactorと同じ設計)。
 * 産地ごとに周期の位相をずらした緩やかな需給サイクル + turnごとの短期ノイズを重ね、
 * 「ある程度バラつきがあるが極端すぎない」価格変動を表現する。
 */
export function calculateBeanPriceFactor(farmId: string, turn: number): number {
  const phase = phaseFromFarmId(farmId);
  const cycle = Math.sin((turn / PRICE_CYCLE_LENGTH_TURNS) * Math.PI * 2 + phase) * PRICE_CYCLE_AMPLITUDE;
  const noise = Math.sin(turn * 2.7 + phase * 3) * PRICE_NOISE_AMPLITUDE;
  return 1 + cycle + noise;
}

/**
 * 基準単価(Farm.pricePerKg)にturn変動を適用した実効単価。市場閲覧(SupplyChainScreen)と
 * 購入確定(supplyChainSlice)の両方でこの関数を使うことで、見た目の価格と請求額を一致させる。
 */
export function calculateEffectiveBeanPrice(farm: Pick<Farm, 'id' | 'pricePerKg'>, turn: number): number {
  return Math.round(farm.pricePerKg * calculateBeanPriceFactor(farm.id, turn));
}
