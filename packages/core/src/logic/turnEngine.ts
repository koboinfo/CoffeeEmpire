import type { Property, City } from '../types/store.js';
import type { Farm, GreenBeanLot } from '../types/supplyChain.js';
import type { CoffeeEmpireState, PLLineItem, SimEvent } from '../types/simState.js';
import type { IncomeStatement, BalanceSheet, CashFlowStatement, SettlementResult } from '../types/finance.js';
import type { MarketingCampaignPreset } from '../data/marketingCampaignPresets.js';
import type { ResearchNodeDefinition } from '../types/research.js';
import type { StoreEventDefinition, TriggeredStoreEvent } from '../types/storeEvents.js';
import {
  calculateStoreRevenue,
  calculateInteriorQualityFactor,
  calculatePayroll,
  buildIncomeStatementWithTax,
  calculateStoresDepreciationAndNetBookValue,
  calculateInventoryValue,
  buildBalanceSheet,
  buildCashFlowStatement,
  averageMenuPrice,
  averageMenuQuality,
} from './financials.js';
import { rollEvents, applyEffect } from './events.js';
import { resolveEventEffect } from '../data/eventEffectRanges.js';
import { rollStoreEvents } from './storeEvents.js';
import { calculateSeasonalFactor } from './seasonality.js';
import { applyExecutiveAutomation, calculateDynamicStockPrice, calculateMarketShareRatio } from './corporate.js';
import { serviceLoans } from './loans.js';
import { calculateCompetitivePressure, simulateCompetitorTurn } from './competitorAI.js';
import { calculateResearchEffects } from './research.js';
import { calculateOwnedFarmHarvest } from './supplyChain.js';
import { calculateEmployerSocialInsurance, calculateAnnualSettlement } from './taxes.js';

/** 決算(年1回)の間隔。turnUnitが'month'固定のため12ターン=1年とする。 */
export const SETTLEMENT_INTERVAL_TURNS = 12;

export interface TurnContext {
  properties: Record<string, Property>;
  cities: Record<string, City>;
  farms: Record<string, Farm>;
}

export interface StoreReport {
  storeId: string;
  revenue: number;
  customers: number;
}

export interface AdvanceTurnResult {
  nextState: CoffeeEmpireState;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
  triggeredEvents: SimEvent[];
  triggeredStoreEvents: TriggeredStoreEvent[];
  storeReports: Record<string, StoreReport>;
  settlement?: SettlementResult; // 決算ターン(SETTLEMENT_INTERVAL_TURNSごと)のみ設定される
}

/**
 * 基盤④(Sim Core Engine) README準拠のadvanceTurn。
 * 注意: 買掛金・長期借入は発生させる仕組みがまだ存在しないため常に0として扱う。
 * M&A・不動産投資の購入額は貸借対照表の資産(PP&E等)には計上されない(既知の簡略化)。
 * 焙煎後在庫の評価額も焙煎コスト内訳が未定義のため0扱い。
 *
 * capitalInjection: このターンで確定した増資額(IPO等)。financingCashFlowと
 * 資本(paidInCapital)の両方に反映される。IPO実行時点では即座にcashへ加算せず、
 * 次回のadvanceTurn呼び出し時にこの引数経由で計上することで貸借対照表の整合性を保つ。
 */
export function advanceTurn(
  rawState: CoffeeEmpireState,
  context: TurnContext,
  events: SimEvent[],
  rng: () => number = Math.random,
  capitalInjection = 0,
  marketingPresets: MarketingCampaignPreset[] = [],
  researchTree: ResearchNodeDefinition[] = [],
  storeEventDefinitions: StoreEventDefinition[] = []
): AdvanceTurnResult {
  // 役員への権限委譲(自動価格調整/自動採用/自動宣伝)を収益計算より前に適用し、
  // 当ターンの損益へ反映させる。stores/employees/activeCampaigns以外はstateと同一。
  const state = applyExecutiveAutomation(rawState, context, marketingPresets, rng);

  // R&Dツリーでアンロック済みのノード効果(売上/原価への乗数)。全店舗に一律適用する。
  const researchEffects = calculateResearchEffects(state.researchUnlockedIds, researchTree);

  // 自社農園の毎ターン自動収穫。市場購入より大幅に低い維持費で生豆を得られる代わりに
  // 天候リスク(不作)を負う(calculateOwnedFarmHarvest参照)。
  const harvestedLots: GreenBeanLot[] = [];
  let totalFarmMaintenanceCost = 0;
  const ownedFarmsAfterHarvest = state.ownedFarms.map((ownedFarm) => {
    const farm = context.farms[ownedFarm.farmId];
    if (!farm) return ownedFarm;

    const harvest = calculateOwnedFarmHarvest(farm, rng);
    totalFarmMaintenanceCost += harvest.maintenanceCost;
    if (harvest.deliveredKg > 0) {
      harvestedLots.push({
        id: `lot-owned-${ownedFarm.id}-t${state.turn}`,
        farmId: farm.id,
        qGrade: farm.qGrade,
        kg: harvest.deliveredKg,
        pricePerKg: farm.pricePerKg * 0.1, // 自社農園産は維持費相当を単価とみなす(在庫評価用)
        purchasedAtTurn: state.turn,
      });
    }
    return { ...ownedFarm, lastHarvestFailed: harvest.isHarvestFailure };
  });

  // 季節変動係数(夏場のアイス需要・年末商戦などで月ごとに売上が±20〜30%ほど揺れる)。全店舗一律に適用する。
  const seasonalFactor = calculateSeasonalFactor(state.turn + 1);

  const plItems: PLLineItem[] = [];
  const storeReports: Record<string, StoreReport> = {};
  const triggeredStoreEvents: TriggeredStoreEvent[] = [];
  let storeEventCashEffect = 0;
  const storeSatisfactionDeltaById: Record<string, number> = {};
  const storeMotivationDeltaById: Record<string, number> = {};

  if (totalFarmMaintenanceCost > 0) {
    plItems.push({
      key: 'ownedFarmMaintenance',
      label: '自社農園維持費',
      amount: totalFarmMaintenanceCost,
      kind: 'fixedCost',
    });
  }

  for (const store of state.stores) {
    const property = context.properties[store.propertyId];
    const city = property ? context.cities[property.cityId] : undefined;
    if (!property || !city) continue;

    // 競合の出店密度による需要干渉(0.5-1.0倍)。都市内の競合店舗が多いほど客足が落ちる。
    const competitivePressure = calculateCompetitivePressure(property.cityId, state.competitorBrands);
    const interiorQualityFactor = calculateInteriorQualityFactor(store.equipment);

    // 店舗ごとイベント(機材故障/ストライキ/賃料値上げ/SNSバズり/悪評)を1店舗ずつ独立判定する。
    const storeEmployees = state.employees.filter((employee) => employee.assignedStoreId === store.id);
    const avgEmployeeMotivation =
      storeEmployees.length > 0
        ? storeEmployees.reduce((sum, employee) => sum + employee.motivation, 0) / storeEmployees.length
        : 100; // 従業員がいない店舗はストライキのしようがないため高値をデフォルトにする
    const storeEventResults = rollStoreEvents(storeEventDefinitions, store, avgEmployeeMotivation, rng);
    triggeredStoreEvents.push(...storeEventResults);
    const storeEventRevenueMultiplier = storeEventResults.reduce((mult, event) => mult * event.revenueMultiplier, 1);
    storeEventCashEffect += storeEventResults.reduce((sum, event) => sum + event.cashAmount, 0);
    if (storeEventResults.length > 0) {
      storeSatisfactionDeltaById[store.id] = storeEventResults.reduce(
        (sum, event) => sum + event.satisfactionDelta,
        0
      );
      storeMotivationDeltaById[store.id] = storeEventResults.reduce((sum, event) => sum + event.motivationDelta, 0);
    }

    const rawRevenue = calculateStoreRevenue(store, property, city);
    const revenue =
      rawRevenue.revenue *
      competitivePressure *
      researchEffects.revenueMultiplier *
      interiorQualityFactor *
      storeEventRevenueMultiplier *
      seasonalFactor;
    const variableCost =
      rawRevenue.variableCost *
      competitivePressure *
      researchEffects.costMultiplier *
      interiorQualityFactor *
      storeEventRevenueMultiplier *
      seasonalFactor;
    plItems.push({ key: `revenue:${store.id}`, label: `${store.name} 売上`, amount: revenue, kind: 'revenue' });
    storeReports[store.id] = { storeId: store.id, revenue, customers: rawRevenue.customers };
    plItems.push({
      key: `cogs:${store.id}`,
      label: `${store.name} 原材料費`,
      amount: variableCost,
      kind: 'variableCost',
    });
    plItems.push({
      key: `rent:${store.id}`,
      label: `${store.name} 賃料`,
      amount: property.rentPerMonth,
      kind: 'fixedCost',
    });

    const maintenanceCost = store.equipment.reduce((sum, equipment) => sum + equipment.maintenanceCostPerMonth, 0);
    if (maintenanceCost > 0) {
      plItems.push({
        key: `maintenance:${store.id}`,
        label: `${store.name} 設備維持費`,
        amount: maintenanceCost,
        kind: 'fixedCost',
      });
    }

    // 水道光熱費: 機材数・営業時間の長さに連動し、月額4万〜10万円の実勢レンジにクランプする。
    const operatingHoursSpan = Math.max(0, store.operatingHours.close - store.operatingHours.open);
    const utilitiesCost = Math.min(
      100_000,
      Math.max(40_000, 40_000 + store.equipment.length * 8_000 + operatingHoursSpan * 1_500)
    );
    plItems.push({
      key: `utilities:${store.id}`,
      label: `${store.name} 水道光熱費`,
      amount: utilitiesCost,
      kind: 'fixedCost',
    });
  }

  const payroll = calculatePayroll(state.employees);
  if (state.employees.length > 0) {
    plItems.push({ key: 'payroll', label: '人件費', amount: payroll, kind: 'fixedCost' });
  }

  // 社会保険料(健康保険・厚生年金)の事業主負担。法人成り後、給与総額に連動して
  // 毎月確実にキャッシュを圧迫する固定費として発生する(個人事業主段階では対象外)。
  if (state.entityType !== 'soleProprietorship' && payroll > 0) {
    const employerSocialInsurance = calculateEmployerSocialInsurance(payroll, state.taxRule);
    plItems.push({
      key: 'employerSocialInsurance',
      label: '社会保険料(事業主負担)',
      amount: employerSocialInsurance,
      kind: 'fixedCost',
    });
  }

  for (const campaign of state.activeCampaigns) {
    plItems.push({
      key: `marketing:${campaign.id}`,
      label: 'マーケティング費',
      amount: campaign.budget,
      kind: 'fixedCost',
    });
  }

  for (const investment of state.ownedRealEstate) {
    plItems.push({
      key: `realestate:${investment.id}`,
      label: '不動産賃貸収入',
      amount: investment.monthlyRentalIncome,
      kind: 'revenue',
    });
  }

  const nextTurn = state.turn + 1;
  const { totalMonthlyDepreciation, totalNetBookValue } = calculateStoresDepreciationAndNetBookValue(
    state.stores,
    nextTurn
  );
  const loanServicing = serviceLoans(state.loans);

  // 税金は毎月のPLでは計上しない(月次のcorporateTax=0)。決算ターン(年1回)まで
  // 税引前利益を累積し、決算月にまとめて一括で課税・引き落とすことで「黒字倒産」
  // (帳簿上は黒字でも納税タイミングでキャッシュが枯渇するリスク)を再現する。
  const provisionalIncomeStatement = buildIncomeStatementWithTax(
    nextTurn,
    plItems,
    totalMonthlyDepreciation,
    loanServicing.totalInterestExpense,
    0
  );
  const accumulatedPretaxIncome = state.fiscalPeriod.accumulatedPretaxIncome + provisionalIncomeStatement.pretaxIncome;
  const isSettlementTurn = nextTurn % SETTLEMENT_INTERVAL_TURNS === 0;

  let incomeStatement = provisionalIncomeStatement;
  let settlement: SettlementResult | undefined;
  let nextAccumulatedPretaxIncome = accumulatedPretaxIncome;

  if (isSettlementTurn) {
    // 直近12ヶ月(当月含む)の売上高。消費税課税事業者判定(基準期間の簡略化)に使う。
    const priorRevenues = state.history.incomeStatements
      .slice(-(SETTLEMENT_INTERVAL_TURNS - 1))
      .map((statement) => statement.revenue);
    const trailing12MonthRevenue =
      provisionalIncomeStatement.revenue + priorRevenues.reduce((sum, revenue) => sum + revenue, 0);

    settlement = calculateAnnualSettlement({
      turn: nextTurn,
      entityType: state.entityType,
      accumulatedPretaxIncome,
      trailing12MonthRevenue,
      taxRule: state.taxRule,
    });

    incomeStatement = buildIncomeStatementWithTax(
      nextTurn,
      plItems,
      totalMonthlyDepreciation,
      loanServicing.totalInterestExpense,
      settlement.totalTaxDue
    );
    nextAccumulatedPretaxIncome = 0;
  }

  const triggeredEvents = rollEvents(events, state, rng);
  const resolvedCompanyEffects = triggeredEvents.map((event) => resolveEventEffect(event.id, event.effect, rng));
  const companyEventCashEffect = resolvedCompanyEffects.reduce((sum, effect) => sum + (effect.cash ?? 0), 0);
  const eventCashEffect = companyEventCashEffect + storeEventCashEffect;

  let statusState: CoffeeEmpireState = { ...state, turn: nextTurn };
  for (const effect of resolvedCompanyEffects) {
    const { cash: _cash, ...statusOnlyEffect } = effect;
    statusState = { ...statusState, ...applyEffect(statusState, statusOnlyEffect) };
  }

  const greenBeanInventoryAfterHarvest = [...state.greenBeanInventory, ...harvestedLots];
  const inventoryValue = calculateInventoryValue(greenBeanInventoryAfterHarvest, Object.values(context.farms));
  const propertyAndEquipmentNet = totalNetBookValue;
  const accountsPayable = 0;
  const longTermDebt = loanServicing.updatedLoans.reduce((sum, loan) => sum + loan.remainingPrincipal, 0);
  const paidInCapitalChange = capitalInjection;

  const operatingCashFlow = incomeStatement.netIncome + totalMonthlyDepreciation + eventCashEffect;
  const investingCashFlow = 0;
  const dividendPayout = state.stock.isPublic
    ? state.stock.dividendPerSharePerTurn * state.stock.publicFloatShares
    : 0;
  // 融資の元本返済分(利息はnetIncome経由で既にoperatingCashFlowへ反映済み)を追加で減算する。
  const financingCashFlow = capitalInjection - dividendPayout - loanServicing.totalPrincipalRepayment;

  const cashFlowStatement = buildCashFlowStatement(
    nextTurn,
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
    state.cash
  );

  const previousBalanceSheets = state.history.balanceSheets;
  const previousBalanceSheet = previousBalanceSheets[previousBalanceSheets.length - 1];
  const balanceSheet = buildBalanceSheet({
    turn: nextTurn,
    previous: previousBalanceSheet,
    netIncome: incomeStatement.netIncome,
    cashChange: cashFlowStatement.netCashChange,
    inventoryValue,
    propertyAndEquipmentNet,
    accountsPayable,
    longTermDebt,
    paidInCapitalChange,
  });

  const activeCampaigns = statusState.activeCampaigns.filter(
    (campaign) => nextTurn - campaign.startedAtTurn < campaign.durationTurns
  );

  const marketShareRatio = calculateMarketShareRatio(
    balanceSheet.totalAssets,
    state.competitorBrands.map((competitor) => competitor.valuation)
  );
  const stock = state.stock.isPublic
    ? {
        ...state.stock,
        sharePrice: calculateDynamicStockPrice(state.stock.sharePrice, incomeStatement, marketShareRatio),
      }
    : state.stock;

  // NPC競合ブランドのターン処理(値付け/出店拡大の意思決定)。プレイヤーの平均品質・平均価格を
  // 全店舗のメニューから算出し、競合が「プレイヤーに対して」どう動くかの判断材料にする。
  const allMenuItems = state.stores.flatMap((store) => store.menu);
  const playerAvgQuality = averageMenuQuality(allMenuItems);
  const playerAvgPrice = averageMenuPrice(allMenuItems);

  // 自社の都市別出店数。競合の出店拡大が自社の好調な都市を優先的に狙うための重み付けに使う
  // (店舗単位の近接配置ではなく都市単位の近似)。
  const playerStoresByCity: Record<string, number> = {};
  for (const store of state.stores) {
    const property = context.properties[store.propertyId];
    if (!property) continue;
    playerStoresByCity[property.cityId] = (playerStoresByCity[property.cityId] ?? 0) + 1;
  }

  const { competitors: nextCompetitorBrands } = simulateCompetitorTurn(
    state.competitorBrands,
    { playerAvgQuality, playerAvgPrice, cityIds: Object.keys(context.cities), playerStoresByCity },
    rng
  );

  // 店舗ごとイベントによる顧客満足度・従業員モチベーションへの影響をnextStateに反映する。
  const storesAfterEvents = statusState.stores.map((store) => {
    const delta = storeSatisfactionDeltaById[store.id];
    if (!delta) return store;
    return {
      ...store,
      cumulativeCustomerSatisfaction: Math.min(100, Math.max(0, store.cumulativeCustomerSatisfaction + delta)),
    };
  });
  const employeesAfterEvents = statusState.employees.map((employee) => {
    const delta = employee.assignedStoreId ? storeMotivationDeltaById[employee.assignedStoreId] : undefined;
    if (!delta) return employee;
    return { ...employee, motivation: Math.min(100, Math.max(0, employee.motivation + delta)) };
  });

  const nextState: CoffeeEmpireState = {
    ...statusState,
    activeCampaigns,
    cash: cashFlowStatement.endingCash,
    loans: loanServicing.updatedLoans,
    stock,
    competitorBrands: nextCompetitorBrands,
    greenBeanInventory: greenBeanInventoryAfterHarvest,
    ownedFarms: ownedFarmsAfterHarvest,
    stores: storesAfterEvents,
    employees: employeesAfterEvents,
    fiscalPeriod: { accumulatedPretaxIncome: nextAccumulatedPretaxIncome },
    // 黒字倒産: 決算での一括納税等でcashが一度でもマイナスになったらtrueのまま固定する。
    isBankrupt: state.isBankrupt || cashFlowStatement.endingCash < 0,
  };

  return {
    nextState,
    incomeStatement,
    balanceSheet,
    cashFlowStatement,
    settlement,
    triggeredEvents,
    triggeredStoreEvents,
    storeReports,
  };
}
