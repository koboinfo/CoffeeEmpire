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

export interface TaxRule {
  corporateTaxRate: number; // 例: 0.30
}
