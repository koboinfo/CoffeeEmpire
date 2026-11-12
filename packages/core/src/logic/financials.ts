import type { Store, MenuItem, Property, Equipment } from '../types/store.js';
import type { City } from '../types/store.js';
import type { Employee } from '../types/employee.js';
import type { Farm, GreenBeanLot } from '../types/supplyChain.js';
import type { DepreciationSchedule, IncomeStatement, BalanceSheet, CashFlowStatement, TaxRule } from '../types/finance.js';
import type { HeadquartersOffice } from '../types/corporate.js';
import type { PLLineItem } from '../types/simState.js';
import { resolvePropertyCapacity } from './propertyGenerator.js';

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
  /** 座席数×回転率から算出した月間の物理的な収容上限(稼働率=customers/capacity表示用)。 */
  capacity: number;
  /**
   * 座席キャパシティでクランプする前の生の需要客数。customersと異なりcapacityを超えうるため、
   * demandCustomers/capacityは「どれだけ客を取りこぼしているか」を表す真の混雑度になる
   * (calculateUtilization参照)。
   */
  demandCustomers: number;
}

// カフェの回転率目安(滞在時間が長い業態のため1日2〜3回転が一般的。その中央値)。
const TURNOVER_PER_SEAT_PER_DAY = 2.5;
// 上の回転率目安が前提とする基準営業時間(時間)。営業時間がこれより長い/短いと回転数も比例して増減する。
const BASE_OPERATING_HOURS_SPAN = 10;
const DAYS_PER_TURN = 30; // 1ターン=1ヶ月の営業日数近似

// data/cityRent.tsのRENT_PER_TSUBO_JPYが基準点にしている東京の実勢坪単価(¥18,000/坪/月)。
// referencePrice(価格許容上限)を実勢賃料プレミアムに連動させる際の基準値として使う。
const BASELINE_RENT_PER_TSUBO_JPY = 18_000;
// 実勢賃料が基準(東京)より高い都市ほど、客が許容する価格帯も引き上げる(例: Londonの一等地は
// 家賃が突出して高いが、実際にコーヒー1杯の価格も現地の一般的な水準よりずっと高い)。
// 下限を1(=賃料プレミアムなしと同じ)にクランプしているため、家賃が基準より安い都市の価格上限は
// 従来通りincomeLevelのみで決まる(rentPerMonthが小さいテストフィクスチャの挙動にも影響しない)。
const MAX_RENT_PRICE_PREMIUM = 6;

/** マーケティング施策(activeCampaigns)が稼働中の店舗の需要側計算に与える効果。呼び出し側で集計して渡す。 */
export interface StoreMarketingEffects {
  /** entryRateIndexへの倍率ボーナス(例: 0.2 = +20%)。SNSマーケティング等、新規客の呼び込みに効く施策向け。 */
  entryRateBonus?: number;
  /** satisfactionFactorへの倍率ボーナス(リピート率)。ロイヤルティ施策等、既存客の再来店に効く施策向け。 */
  repeatRateBonus?: number;
}

/**
 * 客数 = min(需要側, 供給側)。
 *
 * 需要側 = 立地の足数(footTraffic) × 入店率指数(品質係数×価格係数×満足度係数)。
 * 価格係数は都市の所得水準(incomeLevel)に対する相対価格で決まる(高所得都市ほど高価格を許容)。
 * marketingEffects.entryRateBonus/repeatRateBonusは、稼働中のマーケティング施策(SNS/ロイヤルティ等)による
 * 入店率・リピート率の底上げをそれぞれentryRateIndex/satisfactionFactorに反映する(Phase F追加)。
 * 需要側(=座席の物理上限に達する前)に効くため、満席の店に施策を打っても取りこぼす、という
 * 座席キャパシティ(下記)との自然な緊張関係が生まれる。
 *
 * 供給側 = 座席数 × 回転率 × 営業日数 × 営業時間係数。人気店でも満席なら客を取りこぼす
 * (Phase E追加。以前はfootTraffic側の需要だけで客数が決まり、座席という物理制約が存在しなかった)。
 */
export function calculateStoreRevenue(
  store: Store,
  property: Property,
  city: City,
  marketingEffects: StoreMarketingEffects = {}
): StoreRevenueResult {
  const avgPrice = averageMenuPrice(store.menu);
  const avgCost = averageMenuCost(store.menu);
  const avgQuality = averageMenuQuality(store.menu);

  const qualityFactor = 0.5 + avgQuality / 100; // 0.5 - 1.5

  const { sizeTsubo, seats } = resolvePropertyCapacity(property);
  const rentPerTsubo = property.rentPerMonth / Math.max(1, sizeTsubo);
  const rentPricePremium = clamp(rentPerTsubo / BASELINE_RENT_PER_TSUBO_JPY, 1, MAX_RENT_PRICE_PREMIUM);
  const referencePrice = Math.max(1, city.incomeLevel) * 200 * rentPricePremium;
  const priceFactor = avgPrice > 0 ? clamp(1.5 - avgPrice / referencePrice, 0.3, 1.5) : 1;
  const satisfactionFactor =
    (0.7 + (store.cumulativeCustomerSatisfaction / 100) * 0.6) * (1 + (marketingEffects.repeatRateBonus ?? 0)); // 0.7 - 1.3 ×リピート施策
  const entryRateIndex = qualityFactor * priceFactor * satisfactionFactor * (1 + (marketingEffects.entryRateBonus ?? 0));

  const demandCustomers = property.footTraffic * entryRateIndex;

  const operatingHoursSpan = Math.max(1, store.operatingHours.close - store.operatingHours.open);
  const hoursFactor = clamp(operatingHoursSpan / BASE_OPERATING_HOURS_SPAN, 0.5, 1.5);
  const capacity = seats * TURNOVER_PER_SEAT_PER_DAY * DAYS_PER_TURN * hoursFactor;

  const customers = Math.max(0, Math.round(Math.min(demandCustomers, capacity)));
  const revenue = customers * avgPrice;
  const variableCost = customers * avgCost;

  return {
    revenue,
    variableCost,
    customers,
    capacity: Math.round(capacity),
    demandCustomers: Math.max(0, Math.round(demandCustomers)),
  };
}

/**
 * 真の混雑度(=座席キャパシティに対する需要の比率)。customers/capacityと異なり1.0(100%)を
 * 超えうる。取りこぼし(demandCustomers - customers)が発生しているかどうかは
 * utilization > 1 で判定できる。capacityが0の店舗(座席未設定)はutilization=0として扱う。
 */
export function calculateUtilization(demandCustomers: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return demandCustomers / capacity;
}

// 稼働率がこの値を超えると、行列・提供遅延によって満足度/士気が悪化し始める。
const UTILIZATION_STRAIN_THRESHOLD = 0.85;
// 上のしきい値からどれだけ超過すると悪化が頭打ちになるか(=このrange分の超過で最大値に到達)。
const UTILIZATION_STRAIN_RANGE = 0.35;

function utilizationStrain(utilization: number): number {
  if (utilization <= UTILIZATION_STRAIN_THRESHOLD) return 0;
  return clamp((utilization - UTILIZATION_STRAIN_THRESHOLD) / UTILIZATION_STRAIN_RANGE, 0, 1);
}

/**
 * 稼働率から、1ターンあたりのcumulativeCustomerSatisfaction増減量を返す。
 * 混雑(strain)が無い店舗はわずかに回復し(+0.5/ターン)、しきい値を超えると
 * strain^1.5に比例して最大-12/ターンまで悪化する(取りこぼし=行列・提供遅延の代理指標)。
 */
export function calculateUtilizationSatisfactionDelta(utilization: number): number {
  const strain = utilizationStrain(utilization);
  if (strain === 0) return 0.5;
  return -(strain ** 1.5) * 12;
}

/**
 * 稼働率から、1ターンあたりの従業員motivation増減量を返す(過負荷の店舗に配属中の全従業員に適用)。
 * 満足度と異なり余裕があっても回復はしない(接客が楽なこと自体はモチベーションを上げない)。
 * しきい値超過時はstrain^1.5に比例して最大-8/ターンまで悪化する。
 */
export function calculateUtilizationMotivationDelta(utilization: number): number {
  const strain = utilizationStrain(utilization);
  if (strain === 0) return 0;
  return -(strain ** 1.5) * 8;
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

// 店舗運営の管理オーバーヘッド(給与計算・法務・在庫統括・本社間の調整コスト等)の基礎額。
// storeCount=1でのオーバーヘッド(円/月)。
const HQ_OVERHEAD_BASE_PER_STORE_JPY = 15_000;
// 店舗数に対して超線形に増える指数。storeCount^1.15。10店舗で基礎額の約14.1倍、
// 50店舗で約88.6倍、100店舗で約199倍になる(=規模の不経済。店舗を増やすほど1店舗あたりの
// 管理コストも上がっていく)。
const HQ_OVERHEAD_SCALING_EXPONENT = 1.15;
// 本社の部門(HR/IT/マーケ/財務)投資が、上の管理オーバーヘッドを割り引く度合い。
// レベル1につき8%、上限60%(部門投資を最大まで積んでも管理コストがゼロにはならない)。
const DEPARTMENT_OVERHEAD_DISCOUNT_PER_LEVEL = 0.08;
const MAX_DEPARTMENT_OVERHEAD_DISCOUNT = 0.6;

/**
 * 店舗数の増加に対して超線形に増える管理オーバーヘッド。本社(headquarters)の部門レベル合計が
 * 高いほど割り引かれる(未設置なら割引0)。「本社は店舗数が少ないうちに建てても、まだオーバーヘッド
 * 自体が小さいので割引効果が薄い。店舗数が増えてから投資すると効いてくる」という時間的な
 * 判断を促すために、割引の適用対象(この関数)と割引率の決定要因(部門投資)を分けている。
 */
export function calculateManagementOverheadCost(
  storeCount: number,
  headquarters: HeadquartersOffice | undefined
): number {
  if (storeCount <= 0) return 0;
  const base = HQ_OVERHEAD_BASE_PER_STORE_JPY * storeCount ** HQ_OVERHEAD_SCALING_EXPONENT;
  const departmentLevels = headquarters
    ? Object.values(headquarters.departments).reduce((sum, dept) => sum + (dept?.level ?? 0), 0)
    : 0;
  const discount = clamp(departmentLevels * DEPARTMENT_OVERHEAD_DISCOUNT_PER_LEVEL, 0, MAX_DEPARTMENT_OVERHEAD_DISCOUNT);
  return Math.round(base * (1 - discount));
}

export function calculatePayroll(employees: Employee[]): number {
  return employees.reduce((sum, employee) => sum + employee.salaryPerMonth, 0);
}

/**
 * ストックオプション/RSU相当の株式報酬費用(月額換算)。calculatePayrollと同じ集計パターン。
 * 会計上は費用としてP&L(fixedCost)に計上する一方、現金支出を伴わない(非資金費用)ため、
 * turnEngine側では減価償却と同じ「営業キャッシュフローへの足し戻し」対象として扱う。
 */
export function calculateEquityCompensationExpense(employees: Employee[]): number {
  return employees.reduce((sum, employee) => sum + (employee.equityCompensationPerMonth ?? 0), 0);
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
    else if (item.key === 'payroll' || item.key === 'employerSocialInsurance' || item.key === 'equityCompensation')
      labor += item.amount;
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
