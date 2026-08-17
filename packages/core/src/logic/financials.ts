import type { Store, MenuItem, Property, Equipment } from '../types/store.js';
import type { City } from '../types/store.js';
import type { Employee } from '../types/employee.js';
import type { Farm, GreenBeanLot } from '../types/supplyChain.js';
import type { DepreciationSchedule, IncomeStatement, BalanceSheet, CashFlowStatement, TaxRule } from '../types/finance.js';
import type { PLLineItem } from '../types/simState.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function averageMenuPrice(menu: MenuItem[]): number {
  return average(menu.map((item) => item.currentPrice));
}

export function averageMenuCost(menu: MenuItem[]): number {
  return average(menu.map((item) => item.costOfGoods));
}

export function averageMenuQuality(menu: MenuItem[]): number {
  return average(menu.map((item) => item.qualityScore));
}

export interface StoreRevenueResult {
  revenue: number;
  variableCost: number;
  customers: number;
}

/**
 * 客数 = 立地の足数 × 品質係数 × 価格係数 × 顧客満足係数。
 * 価格係数は都市の所得水準(incomeLevel)に対する相対価格で決まる(高所得都市ほど高価格を許容)。
 */
export function calculateStoreRevenue(store: Store, property: Property, city: City): StoreRevenueResult {
  const avgPrice = averageMenuPrice(store.menu);
  const avgCost = averageMenuCost(store.menu);
  const avgQuality = averageMenuQuality(store.menu);

  const qualityFactor = 0.5 + avgQuality / 100; // 0.5 - 1.5
  const referencePrice = Math.max(1, city.incomeLevel) * 200;
  const priceFactor = avgPrice > 0 ? clamp(1.5 - avgPrice / referencePrice, 0.3, 1.5) : 1;
  const satisfactionFactor = 0.7 + (store.cumulativeCustomerSatisfaction / 100) * 0.6; // 0.7 - 1.3

  const customers = Math.max(0, Math.round(property.footTraffic * qualityFactor * priceFactor * satisfactionFactor));
  const revenue = customers * avgPrice;
  const variableCost = customers * avgCost;

  return { revenue, variableCost, customers };
}

const INTERIOR_TIER_BONUS = 0.04; // 什器・内装(furniture)のtier1につき客単価・客数に+4%
const MAX_INTERIOR_FACTOR = 1.3; // 最大+30%(座席が豪華でも際限なく客を呼べるわけではない)

/**
 * 座席・内装(furniture)機材のtierによる売上係数。店舗に複数のfurniture機材があれば
 * 最も高いtierのものを採用する(内装は入れ替え前提で、重ね置きでは強化されない)。
 * calculateStoreRevenue自体には手を入れず、turnEngine側でrevenue/variableCostへ
 * 事後乗算する(競合の需要干渉・R&D効果と同じ適用パターン)。
 */
export function calculateInteriorQualityFactor(equipment: Equipment[]): number {
  const furnitureTiers = equipment.filter((item) => item.category === 'furniture').map((item) => item.tier);
  if (furnitureTiers.length === 0) return 1;
  const bestTier = Math.max(...furnitureTiers);
  return clamp(1 + bestTier * INTERIOR_TIER_BONUS, 1, MAX_INTERIOR_FACTOR);
}

export function calculatePayroll(employees: Employee[]): number {
  return employees.reduce((sum, employee) => sum + employee.salaryPerMonth, 0);
}

export function calculateDepreciationTotal(schedules: DepreciationSchedule[]): number {
  return schedules.reduce((sum, schedule) => sum + schedule.monthlyDepreciation, 0);
}

/** 基盤④(Sim Core Engine) README準拠のAPI */
export function calculatePL(items: PLLineItem[]): { revenue: number; costs: number; profit: number } {
  const revenue = items.filter((item) => item.kind === 'revenue').reduce((sum, item) => sum + item.amount, 0);
  const costs = items
    .filter((item) => item.kind === 'fixedCost' || item.kind === 'variableCost')
    .reduce((sum, item) => sum + item.amount, 0);
  return { revenue, costs, profit: revenue - costs };
}

export interface ExpenseCategory {
  key: 'rent' | 'labor' | 'utilities' | 'cogs' | 'other';
  label: string;
  amount: number;
}

export interface ExpenseBreakdown {
  categories: ExpenseCategory[];
  total: number;
}

/**
 * 毎月のキャッシュアウトを「家賃/人件費/水道光熱費/原価/税金・その他」の5カテゴリに集計する。
 * extraOther(決算の一括納税額・イベントによる臨時収支など、plItemsに含まれない項目)は
 * 「税金・その他」に合算する。
 */
export function categorizeExpenses(items: PLLineItem[], extraOther = 0): ExpenseBreakdown {
  let rent = 0;
  let labor = 0;
  let utilities = 0;
  let cogs = 0;
  let other = extraOther;

  for (const item of items) {
    if (item.kind === 'revenue') continue;
    if (item.key.startsWith('rent:')) rent += item.amount;
    else if (item.key.startsWith('cogs:')) cogs += item.amount;
    else if (item.key.startsWith('utilities:')) utilities += item.amount;
    else if (item.key === 'payroll' || item.key === 'employerSocialInsurance') labor += item.amount;
    else other += item.amount;
  }

  const categories: ExpenseCategory[] = [
    { key: 'rent', label: '家賃', amount: rent },
    { key: 'labor', label: '人件費', amount: labor },
    { key: 'utilities', label: '水道光熱費', amount: utilities },
    { key: 'cogs', label: '豆の仕入れ原価', amount: cogs },
    { key: 'other', label: '税金・その他', amount: other },
  ];

  return { categories, total: categories.reduce((sum, category) => sum + category.amount, 0) };
}

export function calculateTax(pretaxIncome: number, taxRule: TaxRule): number {
  return Math.max(0, pretaxIncome) * taxRule.corporateTaxRate;
}

interface PretaxStatement {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  depreciation: number;
  operatingIncome: number;
  interestExpense: number;
  pretaxIncome: number;
}

function buildPretaxStatement(items: PLLineItem[], depreciation: number, interestExpense: number): PretaxStatement {
  const revenue = items.filter((item) => item.kind === 'revenue').reduce((sum, item) => sum + item.amount, 0);
  const costOfGoodsSold = items
    .filter((item) => item.kind === 'variableCost')
    .reduce((sum, item) => sum + item.amount, 0);
  const operatingExpenses = items
    .filter((item) => item.kind === 'fixedCost')
    .reduce((sum, item) => sum + item.amount, 0);

  const grossProfit = revenue - costOfGoodsSold;
  const operatingIncome = grossProfit - operatingExpenses - depreciation;
  const pretaxIncome = operatingIncome - interestExpense;

  return {
    revenue,
    costOfGoodsSold,
    grossProfit,
    operatingExpenses,
    depreciation,
    operatingIncome,
    interestExpense,
    pretaxIncome,
  };
}

export function buildIncomeStatement(
  turn: number,
  items: PLLineItem[],
  depreciation: number,
  interestExpense: number,
  taxRule: TaxRule
): IncomeStatement {
  const pretax = buildPretaxStatement(items, depreciation, interestExpense);
  const corporateTax = calculateTax(pretax.pretaxIncome, taxRule);
  const netIncome = pretax.pretaxIncome - corporateTax;

  return { turn, ...pretax, corporateTax, netIncome };
}

/**
 * buildIncomeStatementと同じPL集計を行うが、税額をtaxRuleから内部計算せず
 * taxAmountとして直接受け取る。turnEngineの決算(年1回)課税で使う: 決算月以外は
 * taxAmount=0(月次では課税しない)、決算月はcalculateAnnualSettlementの結果を渡す。
 */
export function buildIncomeStatementWithTax(
  turn: number,
  items: PLLineItem[],
  depreciation: number,
  interestExpense: number,
  taxAmount: number
): IncomeStatement {
  const pretax = buildPretaxStatement(items, depreciation, interestExpense);
  const corporateTax = Math.max(0, taxAmount);
  const netIncome = pretax.pretaxIncome - corporateTax;

  return { turn, ...pretax, corporateTax, netIncome };
}

export interface BalanceSheetInputs {
  turn: number;
  previous: BalanceSheet | undefined;
  netIncome: number;
  cashChange: number;
  inventoryValue: number;
  propertyAndEquipmentNet: number;
  accountsPayable: number;
  longTermDebt: number;
  paidInCapitalChange: number;
}

export function buildBalanceSheet(inputs: BalanceSheetInputs): BalanceSheet {
  const cash = (inputs.previous?.cash ?? 0) + inputs.cashChange;
  const retainedEarnings = (inputs.previous?.retainedEarnings ?? 0) + inputs.netIncome;
  const paidInCapital = (inputs.previous?.paidInCapital ?? 0) + inputs.paidInCapitalChange;

  const totalAssets = cash + inputs.inventoryValue + inputs.propertyAndEquipmentNet;
  const totalLiabilities = inputs.accountsPayable + inputs.longTermDebt;
  const totalEquity = paidInCapital + retainedEarnings;

  return {
    turn: inputs.turn,
    cash,
    inventoryValue: inputs.inventoryValue,
    propertyAndEquipmentNet: inputs.propertyAndEquipmentNet,
    totalAssets,
    accountsPayable: inputs.accountsPayable,
    longTermDebt: inputs.longTermDebt,
    totalLiabilities,
    paidInCapital,
    retainedEarnings,
    totalEquity,
  };
}

export interface EquipmentDepreciationResult {
  monthlyDepreciation: number;
  netBookValue: number;
}

/**
 * 定額法(straightLine)で当月分の減価償却費と簿価を計算する。
 * 耐用年数(depreciationMonths)を経過した設備は減価償却費0・簿価0として扱う(過剰償却を防ぐ)。
 */
export function calculateEquipmentDepreciation(equipment: Equipment, currentTurn: number): EquipmentDepreciationResult {
  const age = currentTurn - equipment.purchasedAtTurn;
  const monthlyDepreciation = equipment.purchaseCost / equipment.depreciationMonths;

  if (age >= equipment.depreciationMonths) {
    return { monthlyDepreciation: 0, netBookValue: 0 };
  }

  const accumulated = monthlyDepreciation * Math.max(0, age);
  return { monthlyDepreciation, netBookValue: Math.max(0, equipment.purchaseCost - accumulated) };
}

export interface StoresDepreciationResult {
  totalMonthlyDepreciation: number;
  totalNetBookValue: number;
}

export function calculateStoresDepreciationAndNetBookValue(stores: Store[], currentTurn: number): StoresDepreciationResult {
  let totalMonthlyDepreciation = 0;
  let totalNetBookValue = 0;

  for (const store of stores) {
    for (const equipment of store.equipment) {
      const { monthlyDepreciation, netBookValue } = calculateEquipmentDepreciation(equipment, currentTurn);
      totalMonthlyDepreciation += monthlyDepreciation;
      totalNetBookValue += netBookValue;
    }
  }

  return { totalMonthlyDepreciation, totalNetBookValue };
}

/**
 * 生豆在庫の評価額(kg×農園単価の合計)。焙煎後在庫は焙煎コスト内訳が未定義のため評価対象外(0扱い)。
 */
export function calculateInventoryValue(greenBeanInventory: GreenBeanLot[], farms: Farm[]): number {
  const priceByFarmId = new Map(farms.map((farm) => [farm.id, farm.pricePerKg]));
  return greenBeanInventory.reduce((sum, lot) => sum + lot.kg * (priceByFarmId.get(lot.farmId) ?? 0), 0);
}

export function buildCashFlowStatement(
  turn: number,
  operatingCashFlow: number,
  investingCashFlow: number,
  financingCashFlow: number,
  previousEndingCash: number
): CashFlowStatement {
  const netCashChange = operatingCashFlow + investingCashFlow + financingCashFlow;
  return {
    turn,
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    netCashChange,
    endingCash: previousEndingCash + netCashChange,
  };
}
