import type { SimState, SimEvent } from '../types/simState.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 基盤④(Sim Core Engine) README準拠のAPI。rng()の戻り値がprobability未満なら発生とみなす。 */
export function rollEvents<TEffect = Record<string, number>>(
  events: SimEvent<TEffect>[],
  state: SimState,
  rng: () => number = Math.random
): SimEvent<TEffect>[] {
  return events.filter((event) => {
    if (event.condition && !event.condition(state)) return false;
    return rng() < event.probability;
  });
}

/**
 * effectのキーが'cash'ならcashに加算、それ以外はstatusesの同名キーにmin/maxでクランプして加算する。
 * 対応するstatusキーが存在しない場合は無視する(アプリ側でstatusesを未定義のまま参照しないため)。
 */
export function applyEffect(state: SimState, effect: Record<string, number>): SimState {
  const statuses = { ...state.statuses };
  let cash = state.cash;

  for (const [key, delta] of Object.entries(effect)) {
    if (key === 'cash') {
      cash += delta;
      continue;
    }
    const current = statuses[key];
    if (!current) continue;
    const nextValue = clamp(current.value + delta, current.min ?? -Infinity, current.max ?? Infinity);
    statuses[key] = { ...current, value: nextValue };
  }

  return { ...state, statuses, cash };
}
