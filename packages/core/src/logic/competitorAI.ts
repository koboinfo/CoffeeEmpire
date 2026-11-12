import type { CompetitorBrand } from '../types/corporate.js';
import { calculateCompetitorRubberBandGrowthRate } from './scaleEconomics.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface CompetitorMarketContext {
  playerAvgQuality: number; // 0-100
  playerAvgPrice: number;
  cityIds: string[]; // 出店拡大(expand)時の候補都市
  playerStoresByCity?: Record<string, number>; // 自社の都市別出店数。指定時は自社が強い都市ほど出店拡大の重みを上げる
  /**
   * 自社の直近の出店ペース(0以上、店舗数ベースの成長率)。指定時、競合の出店拡大確率を
   * ラバーバンド(calculateCompetitorRubberBandGrowthRate)で自社成長率の0.4〜0.6倍まで
   * 追随して引き上げる(「プレイヤーの成長を無効化しない」範囲での抵抗。レポート§6-1)。
   * 未指定なら従来通り固定確率(EXPANSION_PROBABILITY)のまま。
   */
  playerGrowthRate?: number;
}

/**
 * 出店拡大先の都市を選ぶ。playerStoresByCityが無ければ完全ランダム(従来通り)。
 * 指定があれば「自社出店数+1」を重みとした加重抽選にし、自社の好調な都市ほど
 * 競合に狙われやすくする(店舗単位の近接配置までは行わない近似実装)。
 */
function pickExpansionCity(
  cityIds: string[],
  playerStoresByCity: Record<string, number> | undefined,
  rng: () => number
): string {
  if (!playerStoresByCity) {
    return cityIds[Math.floor(rng() * cityIds.length) % cityIds.length];
  }

  const weights = cityIds.map((cityId) => (playerStoresByCity[cityId] ?? 0) + 1);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = rng() * totalWeight;
  for (let i = 0; i < cityIds.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return cityIds[i];
  }
  return cityIds[cityIds.length - 1];
}

export type CompetitorAction =
  | { type: 'holdPrice' }
  | { type: 'priceCut'; magnitude: number }
  | { type: 'priceHike'; magnitude: number }
  | { type: 'expand'; investedAmount: number; cityId: string };

const STRUGGLING_VALUATION_THRESHOLD = 500_000;
const GROWTH_VALUATION_THRESHOLD = 1_000_000;
const CONFIDENT_VALUATION_THRESHOLD = 2_000_000;
const EXPANSION_PROBABILITY = 0.3;

/**
 * NPC競合ブランドの意思決定ヒューリスティック:
 * 1. 資金力(valuation)が乏しい競合は値下げで顧客をつなぎとめる。
 * 2. プレイヤーの平均品質が競合を明確に上回り、かつ競合に十分な資金力があれば
 *    価格競争を避けて値上げ+ブランド価値強化に振る。
 * 3. 資金力があり値下げ/値上げの判断に至らない場合、一定確率で出店拡大に投資する
 *    (candidate都市からランダムに1つ選ぶ。候補が無い/現金が足りなければholdPriceにフォールバック)。
 * 4. それ以外は様子見(holdPrice)。
 */
export function decideCompetitorAction(
  competitor: CompetitorBrand,
  context: CompetitorMarketContext,
  rng: () => number = Math.random
): CompetitorAction {
  if (competitor.valuation < STRUGGLING_VALUATION_THRESHOLD) {
    return { type: 'priceCut', magnitude: 0.05 };
  }

  if (context.playerAvgQuality > 70 && competitor.valuation > CONFIDENT_VALUATION_THRESHOLD) {
    return { type: 'priceHike', magnitude: 0.03 };
  }

  // プレイヤーが急成長している局面では、競合の出店拡大確率をラバーバンドで引き上げる
  // (自社成長率の0.4〜0.6倍が上限。プレイヤーの成長を無効化しない範囲での抵抗)。
  const rubberBandBoost = calculateCompetitorRubberBandGrowthRate(context.playerGrowthRate ?? 0);
  const effectiveExpansionProbability = clamp(EXPANSION_PROBABILITY * (1 + rubberBandBoost), 0, 0.9);

  if (competitor.valuation > GROWTH_VALUATION_THRESHOLD && rng() < effectiveExpansionProbability) {
    const investedAmount = competitor.valuation * 0.02;
    if (context.cityIds.length > 0 && competitor.cash >= investedAmount) {
      const cityId = pickExpansionCity(context.cityIds, context.playerStoresByCity, rng);
      return { type: 'expand', investedAmount, cityId };
    }
  }

  return { type: 'holdPrice' };
}

export function applyCompetitorAction(competitor: CompetitorBrand, action: CompetitorAction): CompetitorBrand {
  switch (action.type) {
    case 'priceCut':
      return {
        ...competitor,
        valuation: competitor.valuation * (1 - action.magnitude * 0.5),
        avgPrice: Math.max(1, Math.round(competitor.avgPrice * (1 - action.magnitude))),
      };
    case 'priceHike':
      return {
        ...competitor,
        valuation: competitor.valuation * (1 + action.magnitude),
        avgPrice: Math.round(competitor.avgPrice * (1 + action.magnitude)),
      };
    case 'expand':
      return {
        ...competitor,
        valuation: competitor.valuation + action.investedAmount,
        cash: competitor.cash - action.investedAmount,
        storesByCity: {
          ...competitor.storesByCity,
          [action.cityId]: (competitor.storesByCity[action.cityId] ?? 0) + 1,
        },
      };
    case 'holdPrice':
      return competitor;
    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

export function simulateCompetitorTurn(
  competitors: CompetitorBrand[],
  context: CompetitorMarketContext,
  rng: () => number = Math.random
): { competitors: CompetitorBrand[]; actions: Record<string, CompetitorAction> } {
  const actions: Record<string, CompetitorAction> = {};
  const nextCompetitors = competitors.map((competitor) => {
    const action = decideCompetitorAction(competitor, context, rng);
    actions[competitor.id] = action;
    return applyCompetitorAction(competitor, action);
  });
  return { competitors: nextCompetitors, actions };
}

export interface CityMarketShareEntry {
  id: string; // 'player' または競合のid
  name: string;
  storeCount: number;
  share: number; // 0-1
}

/**
 * 都市単位の市場シェア(出店数ベースの近似)。自社は'player'固定id、名前は呼び出し側で
 * 差し替えて良い(ここでは'自社'固定)。円グラフでの可視化を想定した並び(自社が先頭)。
 */
export function calculateCityMarketShare(
  cityId: string,
  playerStoreCount: number,
  competitors: CompetitorBrand[]
): CityMarketShareEntry[] {
  const competitorCounts = competitors.map((competitor) => ({
    id: competitor.id,
    name: competitor.name,
    storeCount: competitor.storesByCity[cityId] ?? 0,
  }));
  const total = playerStoreCount + competitorCounts.reduce((sum, entry) => sum + entry.storeCount, 0);
  const toShare = (count: number) => (total > 0 ? count / total : 0);

  return [
    { id: 'player', name: '自社', storeCount: playerStoreCount, share: toShare(playerStoreCount) },
    ...competitorCounts.map((entry) => ({ ...entry, share: toShare(entry.storeCount) })),
  ];
}

const MAX_DEMAND_REDUCTION = 0.5;
const REDUCTION_PER_COMPETITOR_STORE = 0.05;

/**
 * 競合の出店密度による自店舗の需要干渉(0.5-1.0)。都市内の競合店舗が1店増えるごとに
 * 客足を5%奪われると仮定し、最大でも半減(0.5)に留める(店が消滅するほどの干渉は避ける)。
 */
export function calculateCompetitivePressure(cityId: string, competitors: CompetitorBrand[]): number {
  const competitorStoreCount = competitors.reduce(
    (sum, competitor) => sum + (competitor.storesByCity[cityId] ?? 0),
    0
  );
  const reduction = Math.min(MAX_DEMAND_REDUCTION, competitorStoreCount * REDUCTION_PER_COMPETITOR_STORE);
  return 1 - reduction;
}
