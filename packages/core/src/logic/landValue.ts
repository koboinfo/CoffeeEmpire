/**
 * Coffee Inc 2 Teardownレポート §3-3(不動産市場・地価の年次更新)に基づく実装。
 * 既存のRealEstateInvestment(types/corporate.ts、進行中の別セッションが編集中)には依存せず、
 * 独立したLandValueStateとして地価のみを扱う。turnEngine.tsの年次フックへの配線
 * (年1回=12ターンごとの呼び出し)は未着手で、次回セッションでの統合を前提にしている。
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface LandValueState {
  /** 区画(Property)の地価。円建て。 */
  landValue: number;
}

export interface LandValueUpdateParams {
  /** 都市固有の年間基礎成長率(0.005〜0.04目安=年0.5〜4%)。 */
  cityBaseGrowthRate: number;
  /** 直近1年の人流(footTraffic)の増減率。プラスなら地価を押し上げる。 */
  footTrafficGrowthRate: number;
  /**
   * 周辺の商業密度。レポート§3-3の自己強化ループの本体:
   * 「自社が出店して賑わいを作った地域ほど地価が上がる」を表現するため、
   * 呼び出し側(turnEngine統合時)は自社+競合の同一都市店舗数から密度を算出して渡す想定。
   * 0(密度なし)〜1(高密度)の範囲を想定するが、上限は設けない(呼び出し側の設計自由度を残す)。
   */
  commercialDensity: number;
  /** テスト用にrngを注入する(裸のMath.random()を呼ばない、packages/core全体の規約)。 */
  rng?: () => number;
}

const FOOT_TRAFFIC_GROWTH_WEIGHT = 0.3;
const COMMERCIAL_DENSITY_WEIGHT = 0.2;
const GROWTH_NOISE_AMPLITUDE = 0.03;
const MIN_ANNUAL_GROWTH_RATE = -0.15; // 地価下落は年-15%までにクランプ(無制限下落による発散を防ぐ)
const MAX_ANNUAL_GROWTH_RATE = 0.5; // 地価上昇も年+50%までにクランプ

/**
 * [-amplitude, +amplitude]の一様乱数ノイズ。rng()==0.5(中央値)でノイズ0になるようにし、
 * テストでの決定的な検証をしやすくしている(真の正規分布である必要はなく、
 * 「年ごとにランダムなブレを与える」という設計意図を満たせば十分)。
 */
function symmetricNoise(rng: () => number, amplitude: number): number {
  return (rng() - 0.5) * 2 * amplitude;
}

/**
 * 地価の年次更新(レポート§3-3 updateLandValue)。年1回、turnEngineの年次フックから呼ぶ想定。
 * growth = 都市基礎成長率 + 人流成長率寄与 + 商業密度寄与 + ノイズ
 */
export function updateLandValueAnnual(state: LandValueState, params: LandValueUpdateParams): LandValueState {
  const rng = params.rng ?? Math.random;
  const rawGrowth =
    params.cityBaseGrowthRate +
    FOOT_TRAFFIC_GROWTH_WEIGHT * params.footTrafficGrowthRate +
    COMMERCIAL_DENSITY_WEIGHT * params.commercialDensity +
    symmetricNoise(rng, GROWTH_NOISE_AMPLITUDE);

  const growth = clamp(rawGrowth, MIN_ANNUAL_GROWTH_RATE, MAX_ANNUAL_GROWTH_RATE);
  const landValue = Math.max(0, Math.round(state.landValue * (1 + growth)));

  return { landValue };
}

/**
 * 自社出店による自己強化ループ用のcommercialDensityの簡易算出。
 * 同一都市の自社店舗数を、密度が飽和する目安(SATURATION_STORE_COUNT店)で正規化する。
 * レポート§3-3note: 「自社が出店して賑わいを作った地域の物件を保有していると、
 * 自社の成功が地価に反映される」という自己強化構造を意図的に持たせるための関数。
 */
const SATURATION_STORE_COUNT = 8;

export function calculateCommercialDensity(ownStoreCountInCity: number): number {
  return clamp(ownStoreCountInCity / SATURATION_STORE_COUNT, 0, 1);
}
