import type { CoffeeEmpireState } from '../types/simState.js';

export type CreditRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';

export interface CreditRatingResult {
  rating: CreditRating;
  score: number; // 0-100の内部スコア(UI表示にも使える)
  interestRateMultiplier: number; // 融資金利オファーに乗算する係数(格付けが低いほど大きい)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

const RATING_TABLE: { minScore: number; rating: CreditRating; interestRateMultiplier: number }[] = [
  { minScore: 90, rating: 'AAA', interestRateMultiplier: 0.7 },
  { minScore: 80, rating: 'AA', interestRateMultiplier: 0.8 },
  { minScore: 70, rating: 'A', interestRateMultiplier: 0.9 },
  { minScore: 55, rating: 'BBB', interestRateMultiplier: 1.0 },
  { minScore: 40, rating: 'BB', interestRateMultiplier: 1.2 },
  { minScore: 25, rating: 'B', interestRateMultiplier: 1.5 },
  { minScore: 10, rating: 'CCC', interestRateMultiplier: 2.0 },
  { minScore: 0, rating: 'D', interestRateMultiplier: 3.0 },
];

export interface CreditRatingInputs {
  cash: number;
  totalAssets: number;
  totalLiabilities: number;
  trailingNetIncome: number; // 直近決算・直近数ターンの純利益等、呼び出し側が用意する代表値
  monthlyRevenue: number;
  isBankrupt: boolean;
}

/**
 * 信用格付け。負債比率(debtRatio)・収益性(netIncome/revenue)・手元資金(revenue何ヶ月分か)の
 * 3指標を加点式で0-100スコア化し、8段階(AAA〜D)にマッピングする。正確な信用モデルではなく、
 * 「財務が健全なほど有利な金利で借りられる」体験を優先した単純モデル(calculateDynamicStockPriceと同系統)。
 */
export function calculateCreditRating(inputs: CreditRatingInputs): CreditRatingResult {
  if (inputs.isBankrupt) {
    return { rating: 'D', score: 0, interestRateMultiplier: 3.0 };
  }

  const debtRatio = inputs.totalAssets > 0 ? inputs.totalLiabilities / inputs.totalAssets : inputs.totalLiabilities > 0 ? 1 : 0;
  const debtScore = clamp(100 - debtRatio * 100, 0, 40); // 負債比率0%で満点40、100%以上で0

  const profitMargin = inputs.monthlyRevenue > 0 ? inputs.trailingNetIncome / inputs.monthlyRevenue : 0;
  const profitScore = clamp(30 + profitMargin * 60, 0, 30); // -50%〜+50%の利益率を0-30へ線形マップ

  const cashRunwayMonths = inputs.monthlyRevenue > 0 ? inputs.cash / inputs.monthlyRevenue : inputs.cash > 0 ? 12 : 0;
  const cashScore = clamp((cashRunwayMonths / 6) * 30, 0, 30); // 手元資金が売上6ヶ月分以上で満点30

  const score = Math.round(clamp(debtScore + profitScore + cashScore, 0, 100));
  const matched = RATING_TABLE.find((row) => score >= row.minScore) ?? RATING_TABLE[RATING_TABLE.length - 1];

  return { rating: matched.rating, score, interestRateMultiplier: matched.interestRateMultiplier };
}

/** state(BS/直近PL)から信用格付けの入力値を組み立てる補助関数。呼び出し側(mobile/turnEngine)の重複を減らす。 */
export function buildCreditRatingInputsFromState(
  state: CoffeeEmpireState,
  latestBalanceSheet: { totalAssets: number; totalLiabilities: number; cash: number } | undefined,
  latestIncomeStatement: { netIncome: number; revenue: number } | undefined
): CreditRatingInputs {
  return {
    cash: state.cash,
    totalAssets: latestBalanceSheet?.totalAssets ?? state.cash,
    totalLiabilities: latestBalanceSheet?.totalLiabilities ?? 0,
    trailingNetIncome: latestIncomeStatement?.netIncome ?? 0,
    monthlyRevenue: latestIncomeStatement?.revenue ?? 0,
    isBankrupt: state.isBankrupt,
  };
}
