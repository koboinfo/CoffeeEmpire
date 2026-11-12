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
  calculateEquityCompensationExpense,
  buildIncomeStatementWithTax,
  calculateStoresDepreciationAndNetBookValue,
  calculateInventoryValue,
  buildBalanceSheet,
  buildCashFlowStatement,
  averageMenuPrice,
  averageMenuQuality,
  calculateUtilization,
  calculateUtilizationSatisfactionDelta,
  calculateUtilizationMotivationDelta,
  calculateManagementOverheadCost,
} from './financials.js';
import { rollEvents, applyEffect } from './events.js';
import { resolveEventEffect } from '../data/eventEffectRanges.js';
import { rollStoreEvents } from './storeEvents.js';
import { calculateSeasonalFactor } from './seasonality.js';
import {
  decayBrandAwarenessByCity,
  bumpCityBrandAwareness,
  getCityBrandAwareness,
  calculateCityAwarenessRevenueFactor,
} from './branding.js';
import { applyExecutiveAutomation, calculateDynamicStockPrice, calculateMarketShareRatio } from './corporate.js';
import { serviceLoans } from './loans.js';
import { calculateCompetitivePressure, simulateCompetitorTurn } from './competitorAI.js';
import { calculateMarketSaturationFactor } from './scaleEconomics.js';
import { advanceStartup, createStartupFromSeed } from './startupInvestment.js';
import { STARTUP_SEED_POOL } from '../data/startupCatalog.js';
import type { Startup, StartupInvestment } from '../types/startup.js';
import { calculateResearchEffects } from './research.js';
import { calculateOwnedFarmHarvest } from './supplyChain.js';
import { calculateEmployerSocialInsurance, calculateAnnualSettlement } from './taxes.js';
import { evaluateNewAchievements } from './achievements.js';
import { checkVictoryCondition } from './gameOutcome.js';
import { achievements, type AchievementDefinition } from '../data/achievements.js';
import { calculateRealEstateMonthlyResult } from './realEstateLogic.js';
import { updateLandValueAnnual, calculateCommercialDensity } from './landValue.js';
import type { RealEstateInvestment } from '../types/corporate.js';
import { calculateFranchiseRoyaltyIncome } from './franchiseLogic.js';
import {
  BOARD_CONFIDENCE_DEFAULT,
  applyBoardConfidenceDelta,
  calculateBoardConfidenceDelta,
  shouldDismissBoard,
} from './boardLogic.js';

/** 決算(年1回)の間隔。turnUnitが'month'固定のため12ターン=1年とする。 */
export const SETTLEMENT_INTERVAL_TURNS = 12;
/** VC投資のステージ遷移判定・新規案件補充の間隔(四半期=3ターン)。 */
export const STARTUP_QUARTER_INTERVAL_TURNS = 3;
/** 同時に投資検討できるスタートアップ案件数の上限(seed/seriesA/seriesBの現役案件のみ数える)。 */
const MAX_ACTIVE_STARTUP_OPPORTUNITIES = 4;

export interface TurnContext {
  properties: Record<string, Property>;
  cities: Record<string, City>;
  farms: Record<string, Farm>;
}

export interface StoreReport {
  storeId: string;
  revenue: number;
  customers: number;
  /** 座席数×回転率から算出した月間の物理的な収容上限。稼働率(customers/capacity)の表示に使う。 */
  capacity: number;
  /**
   * 座席キャパシティでクランプする前の生の需要客数。customersと違いcapacityを超えうるため、
   * demandCustomers/capacityは客数上のcustomers/capacity(最大100%)と違い、真の混雑度(100%超も)を表す。
   */
  demandCustomers: number;
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
  plItems: PLLineItem[];
  eventCashEffect: number;
  unlockedAchievements: AchievementDefinition[]; // このターンで新たに解除された実績(報酬は既にnextState.cashへ加算済み)
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

  // 都市ごとのブランド認知度(Phase C追加)。まずbaselineへ向けて全都市を一律減衰させ、
  // 稼働中のcityId付きキャンペーンがあればそのキャンペーン期間中、毎ターン按分した効果量を加点する。
  // 既存のグローバルstatuses.brandAwareness(イベント/launchCampaignの即時付与)は無変更で並存させる。
  let cityBrandAwareness = decayBrandAwarenessByCity(state.brandAwarenessByCity);
  for (const campaign of state.activeCampaigns) {
    if (!campaign.cityId) continue;
    if (state.turn - campaign.startedAtTurn >= campaign.durationTurns) continue;
    cityBrandAwareness = bumpCityBrandAwareness(
      cityBrandAwareness,
      campaign.cityId,
      campaign.awarenessEffect / campaign.durationTurns
    );
  }

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
    // 市場飽和(カニバリゼーション): 同一都市の自社店舗数が増えるほど1店舗あたりの実効需要係数が
    // 逓減する(都市の需要プールは有限であるため)。1店舗なら1.0、店舗数が増えるほど下限0.15まで逓減する。
    const storeCountInSameCity = state.stores.filter(
      (s) => context.properties[s.propertyId]?.cityId === property.cityId
    ).length;
    const marketSaturationFactor = calculateMarketSaturationFactor(storeCountInSameCity);
    const interiorQualityFactor = calculateInteriorQualityFactor(store.equipment);
    const cityAwarenessFactor = calculateCityAwarenessRevenueFactor(getCityBrandAwareness(cityBrandAwareness, property.cityId));

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
    const storeEventSatisfactionDelta = storeEventResults.reduce((sum, event) => sum + event.satisfactionDelta, 0);
    const storeEventMotivationDelta = storeEventResults.reduce((sum, event) => sum + event.motivationDelta, 0);

    // 稼働中のマーケティング施策(SNS/ロイヤルティ等)とR&D(marketing/staffブランチ等)による
    // 入店率・リピート率ボーナスを集計する。施策はcityId指定ならその都市の店舗のみ、
    // cityId未指定(全社対象)は全店舗に適用する。R&D効果は元々全店舗一律。
    let entryRateBonus = researchEffects.entryRateBonus;
    let repeatRateBonus = researchEffects.repeatRateBonus;
    for (const campaign of state.activeCampaigns) {
      if (campaign.cityId && campaign.cityId !== property.cityId) continue;
      if (state.turn - campaign.startedAtTurn >= campaign.durationTurns) continue;
      entryRateBonus += campaign.entryRateBonus ?? 0;
      repeatRateBonus += campaign.repeatRateBonus ?? 0;
    }

    const rawRevenue = calculateStoreRevenue(store, property, city, { entryRateBonus, repeatRateBonus });
    const revenue =
      rawRevenue.revenue *
      competitivePressure *
      marketSaturationFactor *
      researchEffects.revenueMultiplier *
      interiorQualityFactor *
      storeEventRevenueMultiplier *
      seasonalFactor *
      cityAwarenessFactor;
    const variableCost =
      rawRevenue.variableCost *
      competitivePressure *
      marketSaturationFactor *
      researchEffects.costMultiplier *
      interiorQualityFactor *
      storeEventRevenueMultiplier *
      seasonalFactor *
      cityAwarenessFactor;
    plItems.push({ key: `revenue:${store.id}`, label: `${store.name} 売上`, amount: revenue, kind: 'revenue' });
    storeReports[store.id] = {
      storeId: store.id,
      revenue,
      customers: rawRevenue.customers,
      capacity: rawRevenue.capacity,
      demandCustomers: rawRevenue.demandCustomers,
    };

    // 混雑(稼働率>85%)による満足度・従業員モチベーションへの悪化(店舗イベントとは独立に毎ターン発生する)。
    // 店舗イベント由来のデルタと合算して1つのdeltaにまとめる。
    const utilization = calculateUtilization(rawRevenue.demandCustomers, rawRevenue.capacity);
    storeSatisfactionDeltaById[store.id] = storeEventSatisfactionDelta + calculateUtilizationSatisfactionDelta(utilization);
    storeMotivationDeltaById[store.id] = storeEventMotivationDelta + calculateUtilizationMotivationDelta(utilization);
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

  // 本社家賃(headquarters設置済みの場合のみ)。以前はheadquarters.rentPerMonthが保持されているのに
  // 毎月のPLに一切計上されないバグがあったため、ここで初めて費用化する。
  if (state.headquarters) {
    plItems.push({
      key: 'rent:headquarters',
      label: '本社家賃',
      amount: state.headquarters.rentPerMonth,
      kind: 'fixedCost',
    });
  }

  // 店舗数に対して超線形に増える管理オーバーヘッド(規模の不経済)。本社の部門投資で割り引かれる。
  const managementOverheadCost = calculateManagementOverheadCost(state.stores.length, state.headquarters);
  if (managementOverheadCost > 0) {
    plItems.push({
      key: 'managementOverhead',
      label: '本社管理オーバーヘッド',
      amount: managementOverheadCost,
      kind: 'fixedCost',
    });
  }

  // ストックオプション/RSU相当の株式報酬費用(Phase A追加)。会計上はP&Lの費用として計上するが、
  // 現金支出を伴わない非資金費用のため、下のoperatingCashFlow算定で減価償却と同様に足し戻す。
  const equityCompensationExpense = calculateEquityCompensationExpense(state.employees);
  if (equityCompensationExpense > 0) {
    plItems.push({
      key: 'equityCompensation',
      label: '株式報酬費用',
      amount: equityCompensationExpense,
      kind: 'fixedCost',
    });
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

  const nextTurn = state.turn + 1;

  // 不動産投資(保有不動産)の毎ターン処理: 賃貸収入(空室リスク控除後)・維持費・減価償却。
  // evaluateRealEstateInvestmentは購入時点の一回限りの見積もりで、以後の毎ターン処理はここで行う。
  let realEstateMonthlyDepreciation = 0;
  let realEstateNetBookValue = 0;
  for (const investment of state.ownedRealEstate) {
    const result = calculateRealEstateMonthlyResult(investment, nextTurn, rng);
    realEstateMonthlyDepreciation += result.monthlyDepreciation;
    realEstateNetBookValue += result.netBookValue;
    plItems.push({
      key: `realestate:${investment.id}`,
      label: result.isVacant ? '不動産賃貸収入(空室)' : '不動産賃貸収入',
      amount: result.effectiveRentalIncome,
      kind: 'revenue',
    });
    plItems.push({
      key: `realestateMaintenance:${investment.id}`,
      label: '不動産維持費',
      amount: result.maintenanceCost,
      kind: 'fixedCost',
    });
  }

  // フランチャイズ契約のロイヤリティ収入。フランチャイジー側の運営費はプレイヤーが負担しないため
  // 対応するコスト項目は無い(収益のみのPL明細)。
  for (const contract of state.franchiseContracts ?? []) {
    const royalty = calculateFranchiseRoyaltyIncome(contract);
    if (royalty <= 0) continue;
    plItems.push({
      key: `franchiseRoyalty:${contract.id}`,
      label: 'FCロイヤリティ収入',
      amount: royalty,
      kind: 'revenue',
    });
  }

  const { totalMonthlyDepreciation: storesMonthlyDepreciation, totalNetBookValue: storesNetBookValue } =
    calculateStoresDepreciationAndNetBookValue(state.stores, nextTurn);
  const totalMonthlyDepreciation = storesMonthlyDepreciation + realEstateMonthlyDepreciation;
  const totalNetBookValue = storesNetBookValue + realEstateNetBookValue;
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

  // VC/スタートアップ投資(レポート§3-2)。四半期(3ターン)ごとに全案件のステージ遷移を進め、
  // 案件数が上限を割っていれば新規案件を1つ補充する。exited(イグジット)した案件に自社の
  // 出資があれば、その時点の評価額×出資比率を即座に現金化してvcPortfolioから除く
  // (failedは投資額が既に支払い済みの全損であり、追加のcash効果は発生しない)。
  const isStartupQuarterTurn = nextTurn % STARTUP_QUARTER_INTERVAL_TURNS === 0;
  let nextStartups: Startup[] = state.startups ?? [];
  let nextVcPortfolio: StartupInvestment[] = state.vcPortfolio ?? [];
  let vcExitCashEffect = 0;

  if (isStartupQuarterTurn) {
    const previousStageById = new Map(nextStartups.map((startup) => [startup.id, startup.stage]));
    nextStartups = nextStartups.map((startup) => advanceStartup(startup, rng));

    const investmentByStartupId = new Map(nextVcPortfolio.map((investment) => [investment.startupId, investment]));
    for (const startup of nextStartups) {
      if (startup.stage !== 'exited') continue;
      if (previousStageById.get(startup.id) === 'exited') continue; // 既にイグジット済み(このターンの新規イグジットのみ対象)
      const investment = investmentByStartupId.get(startup.id);
      if (!investment) continue;
      vcExitCashEffect += Math.round(startup.valuation * investment.ownershipStake);
    }
    nextVcPortfolio = nextVcPortfolio.filter((investment) => {
      const startup = nextStartups.find((s) => s.id === investment.startupId);
      return startup?.stage !== 'exited';
    });

    const activeOpportunityCount = nextStartups.filter((s) => s.stage !== 'exited' && s.stage !== 'failed').length;
    if (activeOpportunityCount < MAX_ACTIVE_STARTUP_OPPORTUNITIES) {
      const seedIndex = Math.floor(rng() * STARTUP_SEED_POOL.length);
      nextStartups = [...nextStartups, createStartupFromSeed(seedIndex, nextTurn)];
    }
  }

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

  // 減価償却と同じく、株式報酬費用(非資金費用)もnetIncomeから足し戻して営業キャッシュフローを算定する。
  // vcExitCashEffect: VC投資のイグジット時払戻。真の分類は投資キャッシュフローだが、
  // investingCashFlowは既存実装で0固定(未モデル化)のため、他の自動発生する一時的cash効果
  // (eventCashEffect)と同じ扱いでoperatingCashFlowに合算する(既存の簡略化パターンを踏襲)。
  const operatingCashFlow =
    incomeStatement.netIncome + totalMonthlyDepreciation + equityCompensationExpense + eventCashEffect + vcExitCashEffect;
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

  // 取締役会/株主総会機構(boardLogic.ts)。上場中(state.stock.isPublic)のみ信任スコアを更新する
  // (未上場中は解任リスクの対象外)。isBankruptと同じ「一度trueになったら固定」方式。
  const previousBoardConfidence = state.boardConfidence ?? BOARD_CONFIDENCE_DEFAULT;
  let boardConfidence = previousBoardConfidence;
  if (state.stock.isPublic) {
    const delta = calculateBoardConfidenceDelta({
      pretaxIncome: incomeStatement.pretaxIncome,
      dividendPerSharePerTurn: state.stock.dividendPerSharePerTurn,
      previousSharePrice: state.stock.sharePrice,
      currentSharePrice: stock.sharePrice,
    });
    boardConfidence = applyBoardConfidenceDelta(previousBoardConfidence, delta);
  }
  const isBoardDismissed = (state.isBoardDismissed ?? false) || (state.stock.isPublic && shouldDismissBoard(boardConfidence));

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

  // 自社の直近の出店ペース(ラバーバンド用)。openedAtTurnを使い、新規のstore-count履歴を
  // 追加保存せずに「直近RUBBER_BAND_WINDOW_TURNSターンで開店した店舗の割合」から近似する。
  const RUBBER_BAND_WINDOW_TURNS = 6;
  const recentStoreOpenings = state.stores.filter((store) => state.turn - store.openedAtTurn < RUBBER_BAND_WINDOW_TURNS).length;
  const priorStoreCount = Math.max(1, state.stores.length - recentStoreOpenings);
  const playerGrowthRate = recentStoreOpenings / priorStoreCount;

  // 地価の年次更新(レポート§3-3)。年1回(決算と同じ12ターン周期)、保有不動産ごとに
  // 都市の所得水準から近似した基礎成長率+自社の同一都市出店密度(自己強化ループ)+ノイズで
  // landValueを更新する。既存のmonthlyRentalIncome/purchasePriceには影響しない
  // (地価はキャピタルゲインの追跡のみに使い、賃料計算のロジックは変更しない小さな統合)。
  const nextOwnedRealEstate: RealEstateInvestment[] = isSettlementTurn
    ? state.ownedRealEstate.map((investment) => {
        const property = context.properties[investment.propertyId];
        const city = property ? context.cities[property.cityId] : undefined;
        if (!property || !city) return investment;

        const ownStoreCountInCity = playerStoresByCity[property.cityId] ?? 0;
        const incomeLevelRatio = Math.min(1, Math.max(0, city.incomeLevel / 10));
        const cityBaseGrowthRate = 0.005 + incomeLevelRatio * 0.035; // 年0.5〜4%
        const { landValue } = updateLandValueAnnual(
          { landValue: investment.landValue ?? investment.purchasePrice },
          {
            cityBaseGrowthRate,
            footTrafficGrowthRate: 0, // 人流の履歴を保持していないため中立(0)で近似する既知の簡略化
            commercialDensity: calculateCommercialDensity(ownStoreCountInCity),
            rng,
          }
        );
        return { ...investment, landValue };
      })
    : state.ownedRealEstate;

  const { competitors: nextCompetitorBrands } = simulateCompetitorTurn(
    state.competitorBrands,
    { playerAvgQuality, playerAvgPrice, cityIds: Object.keys(context.cities), playerStoresByCity, playerGrowthRate },
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

  // state.statuses.avgQuality/employeeMoraleを実データ(全店舗メニュー品質の平均/全従業員motivationの平均)
  // から再計算する。従来はワールド生成時の初期値(70/60)から動かず、これを発火条件とする
  // quality-scandal/loyalty-program-successイベントが事実上永久に発火しない(または常に発火可能な)
  // 状態になっていた既知のギャップだった。他のstatuses(brandAwareness等)はapplyEffect由来のまま無変更。
  const nextEmployeeMorale = employeesAfterEvents.length
    ? employeesAfterEvents.reduce((sum, employee) => sum + employee.motivation, 0) / employeesAfterEvents.length
    : (statusState.statuses.employeeMorale?.value ?? 60);
  const statusesWithLiveMetrics = {
    ...statusState.statuses,
    avgQuality: {
      ...(statusState.statuses.avgQuality ?? { key: 'avgQuality', min: 0, max: 100, value: 0 }),
      value: Math.min(100, Math.max(0, playerAvgQuality)),
    },
    employeeMorale: {
      ...(statusState.statuses.employeeMorale ?? { key: 'employeeMorale', min: 0, max: 100, value: 0 }),
      value: Math.min(100, Math.max(0, nextEmployeeMorale)),
    },
  };

  const provisionalNextState: CoffeeEmpireState = {
    ...statusState,
    statuses: statusesWithLiveMetrics,
    activeCampaigns,
    cash: cashFlowStatement.endingCash,
    loans: loanServicing.updatedLoans,
    stock,
    competitorBrands: nextCompetitorBrands,
    greenBeanInventory: greenBeanInventoryAfterHarvest,
    ownedFarms: ownedFarmsAfterHarvest,
    stores: storesAfterEvents,
    employees: employeesAfterEvents,
    brandAwarenessByCity: cityBrandAwareness,
    fiscalPeriod: { accumulatedPretaxIncome: nextAccumulatedPretaxIncome },
    startups: nextStartups,
    vcPortfolio: nextVcPortfolio,
    ownedRealEstate: nextOwnedRealEstate,
    // 黒字倒産: 決算での一括納税等でcashが一度でもマイナスになったらtrueのまま固定する。
    isBankrupt: state.isBankrupt || cashFlowStatement.endingCash < 0,
    boardConfidence,
    isBoardDismissed,
  };

  // 実績(マイルストーン)判定: 新規解除分のみ報酬(cash)を加算し、達成済みIDに積み増す。
  const unlockedAchievements = evaluateNewAchievements(
    { state: provisionalNextState, latestIncomeStatement: incomeStatement },
    achievements,
    state.unlockedAchievementIds
  );
  const achievementRewardCash = unlockedAchievements.reduce((sum, achievement) => sum + achievement.rewardCash, 0);

  const nextState: CoffeeEmpireState = {
    ...provisionalNextState,
    cash: provisionalNextState.cash + achievementRewardCash,
    unlockedAchievementIds: [...state.unlockedAchievementIds, ...unlockedAchievements.map((achievement) => achievement.id)],
    // クリア条件(checkVictoryCondition)を一度満たしたらtrueで固定する(isBankruptと同じ方式)。
    isVictoryAchieved: state.isVictoryAchieved || checkVictoryCondition(provisionalNextState),
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
    plItems,
    eventCashEffect,
    unlockedAchievements,
  };
}
