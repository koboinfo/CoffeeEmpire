import type { CoffeeEmpireState } from '../types/simState.js';

export const INCORPORATION_COST = 1_000_000; // 定款認証・登録免許税等の概算(法人成り手続き費用)
export const HOLDING_ESTABLISHMENT_COST = 5_000_000;
export const HOLDING_MIN_STORE_COUNT = 10;
export const HOLDING_MIN_CITY_COUNT = 3;

/** 個人事業主→株式会社化(法人成り)の条件を満たすか。 */
export function canIncorporate(state: CoffeeEmpireState): boolean {
  return state.entityType === 'soleProprietorship' && state.cash >= INCORPORATION_COST;
}

/**
 * 法人成りを実行する。条件を満たさない場合はstateをそのまま返す(呼び出し側で
 * canIncorporateを先に確認する使い方を想定するが、二重防御として内部でも再チェックする)。
 * 個人事業の累計損益と法人の決算期を混同しないよう、fiscalPeriodはリセットする。
 */
export function incorporateCompany(state: CoffeeEmpireState): CoffeeEmpireState {
  if (!canIncorporate(state)) return state;
  return {
    ...state,
    cash: state.cash - INCORPORATION_COST,
    entityType: 'corporation',
    entityStatus: { ...state.entityStatus, incorporatedAtTurn: state.turn },
    fiscalPeriod: { accumulatedPretaxIncome: 0 },
  };
}

/**
 * ホールディングス化(HD体制への移行)の条件を満たすか。本アプリにはブランド概念が
 * 無いため、店舗数・出店都市数を「マルチブランド・多店舗展開」の代理指標として用いる
 * (既知の簡略化。詳細はARCHITECTURE.md参照)。distinctCityCountは呼び出し側
 * (mobile層)がstore.propertyId→Property.cityIdの解決結果から算出して渡す。
 */
export function canEstablishHolding(state: CoffeeEmpireState, distinctCityCount: number): boolean {
  return (
    state.entityType === 'corporation' &&
    state.stores.length >= HOLDING_MIN_STORE_COUNT &&
    distinctCityCount >= HOLDING_MIN_CITY_COUNT &&
    state.cash >= HOLDING_ESTABLISHMENT_COST
  );
}

export function establishHolding(state: CoffeeEmpireState, distinctCityCount: number): CoffeeEmpireState {
  if (!canEstablishHolding(state, distinctCityCount)) return state;
  return {
    ...state,
    cash: state.cash - HOLDING_ESTABLISHMENT_COST,
    entityType: 'holding',
    entityStatus: { ...state.entityStatus, holdingEstablishedAtTurn: state.turn },
  };
}
