import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CoffeeEmpireState } from '@coffee-empire/core';

const STORAGE_KEY = 'coffee-empire/save-v1';

export async function saveState(state: CoffeeEmpireState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // 端末ストレージの書き込み失敗はゲーム進行を止めるべきではないため、警告のみに留める。
    console.warn('[persistence] failed to save state', error);
  }
}

/**
 * 保存データが存在しない、または壊れている(JSONパース失敗・形状不正)場合はnullを返す。
 * 呼び出し側はnullのときcreateInitialState()にフォールバックすること。
 */
export async function loadState(): Promise<CoffeeEmpireState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isCoffeeEmpireStateShape(parsed)) {
      console.warn('[persistence] saved data has unexpected shape, discarding');
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('[persistence] failed to load state', error);
    return null;
  }
}

function isCoffeeEmpireStateShape(value: unknown): value is CoffeeEmpireState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.turn === 'number' &&
    typeof candidate.cash === 'number' &&
    Array.isArray(candidate.stores) &&
    typeof candidate.statuses === 'object'
  );
}
