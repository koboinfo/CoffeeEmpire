import type { CoffeeEmpireState } from '../types/simState.js';

/** クリア条件(「メガチェーン達成」)の店舗数しきい値。HOLDING_MIN_STORE_COUNT(10)のさらに倍。 */
export const VICTORY_MIN_STORE_COUNT = 20;

/**
 * クリア(メガチェーン達成・IPO成功)条件: 持株会社体制へ移行し、株式を公開し、
 * かつ店舗数がVICTORY_MIN_STORE_COUNT以上。一度満たしたらnextState.isVictoryAchievedを
 * trueで固定する(呼び出し側の責務。isBankruptと同じ「以後復帰しない」方式)。
 */
export function checkVictoryCondition(state: CoffeeEmpireState): boolean {
  return state.entityType === 'holding' && state.stock.isPublic && state.stores.length >= VICTORY_MIN_STORE_COUNT;
}
