import type { City, Property } from '../types/store.js';
import type { FranchiseContract } from '../types/franchise.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const DEFAULT_ROYALTY_RATE = 0.06; // 一般的なFC加盟料相場(売上の5-8%程度)の目安として6%固定
const AVG_SPEND_PER_INCOME_LEVEL = 80; // calculateStoreRevenueのreferencePrice(incomeLevel*200)より控えめな客単価原単位

/**
 * フランチャイズ契約を新規に結ぶ際の見積もり(月間総売上・ロイヤリティ率)。
 * evaluateRealEstateInvestment(logic/corporate.ts)と同じ「rng injectedのpost-hoc見積もり」パターン。
 * フランチャイジー側の売上シミュレーションは行わず、物件の客足指数と都市の所得水準から粗く見積もる。
 */
export interface FranchiseOpportunityEvaluation {
  royaltyRate: number;
  monthlyGrossRevenueEstimate: number;
}

export function evaluateFranchiseOpportunity(
  property: Property,
  city: City,
  rng: () => number = Math.random
): FranchiseOpportunityEvaluation {
  const variance = 0.85 + rng() * 0.3; // 0.85-1.15
  const avgSpend = Math.max(1, city.incomeLevel) * AVG_SPEND_PER_INCOME_LEVEL;
  const monthlyGrossRevenueEstimate = Math.round(property.footTraffic * avgSpend * variance);
  return { royaltyRate: DEFAULT_ROYALTY_RATE, monthlyGrossRevenueEstimate: Math.max(0, monthlyGrossRevenueEstimate) };
}

/**
 * 契約1件分の当月ロイヤリティ収入。フランチャイジーが店舗運営費を全額負担するため、
 * プレイヤー側には直接の運営コストが発生しない(PLの収益項目のみとして計上する)。
 */
export function calculateFranchiseRoyaltyIncome(contract: FranchiseContract): number {
  return Math.round(contract.monthlyGrossRevenueEstimate * clamp(contract.royaltyRate, 0, 1));
}

export function calculateTotalFranchiseRoyaltyIncome(contracts: FranchiseContract[]): number {
  return contracts.reduce((sum, contract) => sum + calculateFranchiseRoyaltyIncome(contract), 0);
}
