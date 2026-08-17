import type { TaxRule, SettlementResult } from '../types/finance.js';
import type { EntityType } from '../types/corporate.js';

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

/**
 * 累進課税(所得税)。課税所得を各ブラケットへ順に割り振り、ブラケットごとの税率で
 * 積み上げ計算する(速算控除方式と数学的に等価な、より読みやすい実装)。
 */
export function calculatePersonalIncomeTax(taxableIncome: number, taxRule: TaxRule): number {
  const income = clampNonNegative(taxableIncome);
  let tax = 0;
  let lowerBound = 0;
  for (const bracket of taxRule.personalIncomeTaxBrackets) {
    if (income <= lowerBound) break;
    const taxableInBracket = Math.min(income, bracket.upTo) - lowerBound;
    tax += taxableInBracket * bracket.rate;
    lowerBound = bracket.upTo;
  }
  return Math.round(tax);
}

/** 住民税(所得割)。概ねフラット税率で近似する。 */
export function calculateResidentTax(taxableIncome: number, taxRule: TaxRule): number {
  return Math.round(clampNonNegative(taxableIncome) * taxRule.residentTaxRate);
}

/** 個人事業税。事業主控除(年290万円)を超えた所得にのみ課税される。 */
export function calculateBusinessTax(taxableIncome: number, taxRule: TaxRule): number {
  const base = clampNonNegative(taxableIncome - taxRule.businessTaxDeduction);
  return Math.round(base * taxRule.businessTaxRate);
}

/** 法人税。中小企業向け軽減税率(課税所得800万円以下)と、超過分の通常税率の二段階。 */
export function calculateCorporateTax(pretaxIncome: number, taxRule: TaxRule): number {
  const income = clampNonNegative(pretaxIncome);
  const lowPortion = Math.min(income, taxRule.corporateTaxLowRateThreshold);
  const highPortion = Math.max(0, income - taxRule.corporateTaxLowRateThreshold);
  return Math.round(lowPortion * taxRule.corporateTaxRateLow + highPortion * taxRule.corporateTaxRateHigh);
}

/** 法人住民税均等割。黒字・赤字を問わず毎年必ず発生する定額の最低納税額。 */
export function calculateCorporateInhabitantTaxMinimum(taxRule: TaxRule): number {
  return taxRule.corporateInhabitantTaxMinimumPerYear;
}

/**
 * 社会保険料(健康保険・厚生年金)の事業主負担。法人成り後、毎月の給与総額に対して
 * 発生する固定費として扱う(個人事業主段階では原則対象外とする簡略化)。
 */
export function calculateEmployerSocialInsurance(payroll: number, taxRule: TaxRule): number {
  return Math.round(clampNonNegative(payroll) * taxRule.employerSocialInsuranceRate);
}

/**
 * 消費税課税事業者判定。本来は基準期間(前々事業年度)の売上高で判定するが、
 * 本アプリでは直近12ヶ月の売上高で簡略に判定する。
 */
export function isConsumptionTaxable(trailing12MonthRevenue: number, taxRule: TaxRule): boolean {
  return trailing12MonthRevenue > taxRule.consumptionTaxRevenueThreshold;
}

export interface AnnualSettlementInputs {
  turn: number;
  entityType: EntityType;
  accumulatedPretaxIncome: number; // 決算期間中の累計税引前利益(赤字ならマイナス)
  trailing12MonthRevenue: number;
  taxRule: TaxRule;
}

/**
 * 決算(年1回)時の一括納税額を算定する。個人事業主は所得税(累進)+住民税+個人事業税、
 * 法人/HDは法人税(軽減税率二段階)+法人住民税均等割(赤字でも発生)を課す。
 * 消費税そのものの納税額は本アプリの価格モデル上(税込前提)算入せず、
 * isConsumptionTaxableは「次期から課税事業者に切り替わる」という通知目的にのみ用いる。
 */
export function calculateAnnualSettlement(inputs: AnnualSettlementInputs): SettlementResult {
  const { turn, entityType, accumulatedPretaxIncome, trailing12MonthRevenue, taxRule } = inputs;
  const taxableIncome = clampNonNegative(accumulatedPretaxIncome);
  const breakdown: Record<string, number> = {};

  if (entityType === 'soleProprietorship') {
    breakdown.incomeTax = calculatePersonalIncomeTax(taxableIncome, taxRule);
    breakdown.residentTax = calculateResidentTax(taxableIncome, taxRule);
    breakdown.businessTax = calculateBusinessTax(taxableIncome, taxRule);
  } else {
    breakdown.corporateTax = calculateCorporateTax(taxableIncome, taxRule);
    breakdown.corporateInhabitantTaxMinimum = calculateCorporateInhabitantTaxMinimum(taxRule);
  }

  const totalTaxDue = Object.values(breakdown).reduce((sum, value) => sum + value, 0);

  return {
    turn,
    entityType,
    pretaxIncomeForPeriod: accumulatedPretaxIncome,
    breakdown,
    isConsumptionTaxable: isConsumptionTaxable(trailing12MonthRevenue, taxRule),
    totalTaxDue,
  };
}
