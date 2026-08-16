import type { Property, City } from '../types/store.js';
import type { Farm, GreenBeanLot } from '../types/supplyChain.js';
import type { CoffeeEmpireState, PLLineItem, SimEvent } from '../types/simState.js';
import type { IncomeStatement, BalanceSheet, CashFlowStatement } from '../types/finance.js';
import type { MarketingCampaignPreset } from '../data/marketingCampaignPresets.js';
import type { ResearchNodeDefinition } from '../types/research.js';
import {
  calculateStoreRevenue,
  calculatePayroll,
  buildIncomeStatement,
  calculateStoresDepreciationAndNetBookValue,
  calculateInventoryValue,
  buildBalanceSheet,
  buildCashFlowStatement,
  averageMenuPrice,
  averageMenuQuality,
} from './financials.js';
import { rollEvents, applyEffect } from './events.js';
import { applyExecutiveAutomation, calculateDynamicStockPrice, calculateMarketShareRatio } from './corporate.js';
import { serviceLoans } from './loans.js';
import { calculateCompetitivePressure, simulateCompetitorTurn } from './competitorAI.js';
import { calculateResearchEffects } from './research.js';
import { calculateOwnedFarmHarvest } from './supplyChain.js';

export interface TurnContext {
  properties: Record<string, Property>;
  cities: Record<string, City>;
  farms: Record<string, Farm>;
}

export interface AdvanceTurnResult {
  nextState: CoffeeEmpireState;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlowStatement: CashFlowStatement;
  triggeredEvents: SimEvent[];
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
  researchTree: ResearchNodeDefinition[] = []
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

  const plItems: PLLineItem[] = [];

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
    const rawRevenue = calculateStoreRevenue(store, property, city);
    const revenue = rawRevenue.revenue * competitivePressure * researchEffects.revenueMultiplier;
    const variableCost = rawRevenue.variableCost * competitivePressure * researchEffects.costMultiplier;
    plItems.push({ key: `revenue:${store.id}`, label: `${store.name} 売上`, amount: revenue, kind: 'revenue' });
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
  }

  const payroll = calculatePayroll(state.employees);
  if (state.employees.length > 0) {
    plItems.push({ key: 'payroll', label: '人件費', amount: payroll, kind: 'fixedCost' });
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
  const incomeStatement = buildIncomeStatement(
    nextTurn,
    plItems,
    totalMonthlyDepreciation,
    loanServicing.totalInterestExpense,
    state.taxRule
  );

  const triggeredEvents = rollEvents(events, state, rng);
  const eventCashEffect = triggeredEvents.reduce((sum, event) => sum + (event.effect.cash ?? 0), 0);

  let statusState: CoffeeEmpireState = { ...state, turn: nextTurn };
  for (const event of triggeredEvents) {
    const { cash: _cash, ...statusOnlyEffect } = event.effect;
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
  const { competitors: nextCompetitorBrands } = simulateCompetitorTurn(
    state.competitorBrands,
    { playerAvgQuality, playerAvgPrice, cityIds: Object.keys(context.cities) },
    rng
  );

  const nextState: CoffeeEmpireState = {
    ...statusState,
    activeCampaigns,
    cash: cashFlowStatement.endingCash,
    loans: loanServicing.updatedLoans,
    stock,
    competitorBrands: nextCompetitorBrands,
    greenBeanInventory: greenBeanInventoryAfterHarvest,
    ownedFarms: ownedFarmsAfterHarvest,
  };

  return { nextState, incomeStatement, balanceSheet, cashFlowStatement, triggeredEvents };
}
