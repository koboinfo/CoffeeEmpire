export interface DepreciationSchedule {
  assetId: string; // Equipment/Property/RealEstateInvestment等
  originalCost: number;
  usefulLifeMonths: number;
  method: 'straightLine'; // 将来的に定率法等を追加可能な設計
  monthlyDepreciation: number;
}

export interface IncomeStatement {
  // P&L
  turn: number;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number; // 人件費・賃料・マーケ費等の合算
  depreciation: number;
  operatingIncome: number;
  interestExpense: number;
  pretaxIncome: number;
  corporateTax: number; // 法人税率を適用
  netIncome: number;
}

export interface BalanceSheet {
  turn: number;
  cash: number;
  inventoryValue: number; // 生豆・焙煎豆在庫
  propertyAndEquipmentNet: number; // 減価償却後の簿価
  totalAssets: number;
  accountsPayable: number;
  longTermDebt: number;
  totalLiabilities: number;
  paidInCapital: number; // IPO調達分
  retainedEarnings: number;
  totalEquity: number;
}

export interface CashFlowStatement {
  turn: number;
  operatingCashFlow: number;
  investingCashFlow: number; // 設備投資・不動産投資・M&A
  financingCashFlow: number; // IPO調達・配当支払・借入
  netCashChange: number;
  endingCash: number;
}

import type { EntityType } from './corporate.js';

export interface IncomeTaxBracket {
  upTo: number; // この課税所得(円)までがこのブラケットの税率で課税される(最終ブラケットはInfinity)
  rate: number;
}

export interface TaxRule {
  corporateTaxRate: number; // レガシーフォールバック。turnEngineの決算課税では使用しない(既存呼び出し元との後方互換のため残す)
  corporateTaxRateLow: number; // 中小企業向け軽減税率(例: 0.15。課税所得800万円以下部分)
  corporateTaxRateHigh: number; // 軽減税率適用外の税率(例: 0.232)
  corporateTaxLowRateThreshold: number; // 軽減税率が適用される課税所得の上限(例: 8,000,000円)
  corporateInhabitantTaxMinimumPerYear: number; // 法人住民税均等割。赤字でも毎年必ず発生する
  employerSocialInsuranceRate: number; // 健康保険・厚生年金の事業主負担(概算・給与総額に対する率)
  personalIncomeTaxBrackets: IncomeTaxBracket[]; // 個人の所得税(累進課税)
  residentTaxRate: number; // 住民税(概ねフラット、例: 0.10)
  businessTaxRate: number; // 個人事業税
  businessTaxDeduction: number; // 個人事業税の事業主控除(年290万円)
  consumptionTaxRate: number; // 消費税率
  consumptionTaxRevenueThreshold: number; // 課税事業者へ切り替わる売上高の基準(簡略化して直近12ヶ月の売上高で判定する)
}

/** 決算(年1回)時の一括納税結果。個人事業主/法人で内訳の税目が異なる(breakdownのキー参照)。 */
export interface SettlementResult {
  turn: number;
  entityType: EntityType;
  pretaxIncomeForPeriod: number; // 決算期間中の累計税引前利益(赤字ならマイナス)
  breakdown: Record<string, number>; // 税目ごとの金額(例: incomeTax/residentTax/businessTax または corporateTax/corporateInhabitantTaxMinimum)
  isConsumptionTaxable: boolean; // 次期以降、消費税課税事業者になるかどうか
  totalTaxDue: number; // breakdownの合計。この金額がキャッシュから一括で引き落とされる
}
