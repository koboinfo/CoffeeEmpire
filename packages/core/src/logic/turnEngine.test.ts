import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Store, MenuItem, Equipment } from '../types/store.js';
import type { GreenBeanLot } from '../types/supplyChain.js';
import type { MarketingCampaign, RealEstateInvestment } from '../types/corporate.js';
import type { CoffeeEmpireState, SimEvent } from '../types/simState.js';
import type { StoreEventDefinition } from '../types/storeEvents.js';
import { advanceTurn, SETTLEMENT_INTERVAL_TURNS } from './turnEngine.js';
import { defaultTaxRule } from '../data/taxConstants.js';

function makeMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 'menu-1',
    name: 'Latte',
    category: 'coffee',
    basePrice: 500,
    currentPrice: 500,
    costOfGoods: 150,
    qualityScore: 70,
    ...overrides,
  };
}

function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    id: 'store-1',
    propertyId: 'prop-1',
    name: 'Downtown Store',
    equipment: [],
    menu: [makeMenuItem()],
    employeeIds: [],
    openedAtTurn: 0,
    cumulativeCustomerSatisfaction: 60, operatingHours: { open: 7, close: 21 },
    ...overrides,
  };
}

function makeState(overrides: Partial<CoffeeEmpireState> = {}): CoffeeEmpireState {
  return {
    turn: 0,
    turnUnit: 'month',
    statuses: {
      brandAwareness: { key: 'brandAwareness', value: 50, min: 0, max: 100 },
    },
    cash: 10000,
    entityType: 'corporation',
    entityStatus: {},
    fiscalPeriod: { accumulatedPretaxIncome: 0 },
    isBankrupt: false,
    isVictoryAchieved: false,
    // デフォルトでentityType: 'corporation'のため、'first-incorporation'実績は既に達成済み扱いにしておく
    // (未達成のままだとadvanceTurn初回呼び出しで報酬(cash)が付与され、無関係なテストのcash断言が狂うため)。
    unlockedAchievementIds: ['first-incorporation'],
    stores: [makeStore()],
    employees: [],
    greenBeanInventory: [],
    roastedInventory: [],
    roasteries: [],
    ownedFarms: [],
    activeCampaigns: [],
    stock: { isPublic: false, sharePrice: 0, totalShares: 0, publicFloatShares: 0, dividendPerSharePerTurn: 0 },
    ownedRealEstate: [],
    competitorBrands: [],
    acquisitions: [],
    taxRule: defaultTaxRule,
    executiveAutomation: { autoPricing: false, autoHiring: false, autoMarketing: false },
    loans: [],
    researchUnlockedIds: [],
    history: {
      incomeStatements: [],
      balanceSheets: [],
      cashFlowStatements: [],
      stockPrices: [],
      newsFeed: [],
      settlements: [],
    },
    ...overrides,
  };
}

const context = {
  properties: {
    'prop-1': {
      id: 'prop-1',
      cityId: 'city-1',
      size: 'medium' as const,
      footTraffic: 1000,
      rentPerMonth: 3000,
      ownership: 'leased' as const,
    },
  },
  cities: {
    'city-1': {
      id: 'city-1',
      name: 'Metropolis',
      country: 'USA',
      population: 1_000_000,
      incomeLevel: 5,
      footTrafficIndex: 1,
    },
  },
  farms: {
    'farm-1': { id: 'farm-1', country: 'brazil', qGrade: 78, pricePerKg: 6.5, availableKgPerMonth: 5000, reliability: 85 },
  },
};

test('advanceTurn: turnがインクリメントされる', () => {
  const { nextState } = advanceTurn(makeState(), context, [], () => 1);
  assert.equal(nextState.turn, 1);
});

test('advanceTurn: 純利益がcashに反映される', () => {
  const state = makeState();
  const { nextState, incomeStatement } = advanceTurn(state, context, [], () => 1);
  assert.equal(nextState.cash, state.cash + incomeStatement.netIncome);
});

test('advanceTurn: 存在しないpropertyIdの店舗はPL計算から除外される', () => {
  const state = makeState({ stores: [makeStore({ propertyId: 'missing-prop' })] });
  const { incomeStatement } = advanceTurn(state, context, [], () => 1);
  assert.equal(incomeStatement.revenue, 0);
});

test('advanceTurn: 発生したイベントの効果が適用される', () => {
  const events: SimEvent[] = [{ id: 'bonus', probability: 1, effect: { cash: 1000 } }];
  const state = makeState();
  const { nextState, incomeStatement, triggeredEvents } = advanceTurn(state, context, events, () => 0);

  assert.equal(triggeredEvents.length, 1);
  assert.equal(nextState.cash, state.cash + 1000 + incomeStatement.netIncome);
});

test('advanceTurn: 人件費が0人のときpayrollのPL項目を含めない(不要なゼロ項目を作らない)', () => {
  const state = makeState({ employees: [] });
  const { incomeStatement } = advanceTurn(state, context, [], () => 1);
  // 人件費0でもoperatingExpensesはrent(3000)+水道光熱費(機材0件・営業14時間=61000)を含む(payroll項目は追加されない設計)
  assert.equal(incomeStatement.operatingExpenses, 64000);
});

test('advanceTurn: balanceSheetの資産合計=負債合計+資本合計が成立する', () => {
  const { balanceSheet } = advanceTurn(makeState(), context, [], () => 1);
  assert.equal(balanceSheet.totalAssets, balanceSheet.totalLiabilities + balanceSheet.totalEquity);
});

test('advanceTurn: cashFlowStatementのendingCashはnextState.cashと一致する', () => {
  const { nextState, cashFlowStatement } = advanceTurn(makeState(), context, [], () => 1);
  assert.equal(cashFlowStatement.endingCash, nextState.cash);
});

test('advanceTurn: 設備の減価償却費がincomeStatementとbalanceSheetに反映される', () => {
  const equipment: Equipment = {
    id: 'eq-1',
    category: 'espressoMachine',
    tier: 3,
    purchaseCost: 12000,
    maintenanceCostPerMonth: 100,
    depreciationMonths: 12,
    purchasedAtTurn: 0,
  };
  const state = makeState({ stores: [makeStore({ equipment: [equipment] })] });
  const { incomeStatement, balanceSheet } = advanceTurn(state, context, [], () => 1);

  assert.equal(incomeStatement.depreciation, 1000); // 12000/12
  assert.equal(balanceSheet.propertyAndEquipmentNet, 11000); // 12000 - 1000
});

test('advanceTurn: 設備の維持費がoperatingExpensesに含まれる', () => {
  const equipment: Equipment = {
    id: 'eq-1',
    category: 'grinder',
    tier: 2,
    purchaseCost: 1500,
    maintenanceCostPerMonth: 30,
    depreciationMonths: 24,
    purchasedAtTurn: 0,
  };
  const state = makeState({ stores: [makeStore({ equipment: [equipment] })] });
  const { incomeStatement } = advanceTurn(state, context, [], () => 1);
  // rent(3000) + maintenance(30) + 水道光熱費(機材1件・営業14時間=69000)
  assert.equal(incomeStatement.operatingExpenses, 72030);
});

test('advanceTurn: furniture(座席・内装)機材があると売上が増加する(interiorQualityFactor)', () => {
  const furniture: Equipment = {
    id: 'eq-furniture',
    category: 'furniture',
    tier: 4,
    purchaseCost: 9000,
    maintenanceCostPerMonth: 90,
    depreciationMonths: 60,
    purchasedAtTurn: 0,
  };
  const withoutFurniture = advanceTurn(makeState(), context, [], () => 1);
  const withFurniture = advanceTurn(
    makeState({ stores: [makeStore({ equipment: [furniture] })] }),
    context,
    [],
    () => 1
  );

  assert.ok(withFurniture.incomeStatement.revenue > withoutFurniture.incomeStatement.revenue);
});

test('advanceTurn: 生豆在庫がbalanceSheetのinventoryValueに反映される', () => {
  const lot: GreenBeanLot = { id: 'lot-1', farmId: 'farm-1', qGrade: 78, kg: 100, pricePerKg: 6.5, purchasedAtTurn: 0 };
  const state = makeState({ greenBeanInventory: [lot] });
  const { balanceSheet } = advanceTurn(state, context, [], () => 1);
  assert.equal(balanceSheet.inventoryValue, 650); // 100kg * 6.5
});

test('advanceTurn: 不動産の賃貸収入がincomeStatement.revenueに反映される', () => {
  const investment: RealEstateInvestment = {
    id: 're-1',
    propertyId: 'prop-invest',
    purchasePrice: 100000,
    monthlyRentalIncome: 700,
    purchasedAtTurn: 0,
  };
  const state = makeState({ stores: [], ownedRealEstate: [investment] });
  const { incomeStatement } = advanceTurn(state, context, [], () => 1);
  assert.equal(incomeStatement.revenue, 700);
});

test('advanceTurn: durationTurnsを経過したキャンペーンはactiveCampaignsから除外される', () => {
  const campaign: MarketingCampaign = {
    id: 'camp-1',
    type: 'localAd',
    budget: 1000,
    durationTurns: 2,
    awarenessEffect: 5,
    startedAtTurn: 0,
  };
  const state = makeState({ turn: 2, activeCampaigns: [campaign] }); // nextTurn=3, 3-0=3 >= durationTurns(2)
  const { nextState } = advanceTurn(state, context, [], () => 1);
  assert.equal(nextState.activeCampaigns.length, 0);
});

test('advanceTurn: durationTurns内のキャンペーンはactiveCampaignsに残る', () => {
  const campaign: MarketingCampaign = {
    id: 'camp-1',
    type: 'localAd',
    budget: 1000,
    durationTurns: 5,
    awarenessEffect: 5,
    startedAtTurn: 0,
  };
  const state = makeState({ turn: 1, activeCampaigns: [campaign] }); // nextTurn=2, 2-0=2 < 5
  const { nextState } = advanceTurn(state, context, [], () => 1);
  assert.equal(nextState.activeCampaigns.length, 1);
});

test('advanceTurn: capitalInjectionはbalanceSheetのpaidInCapitalとfinancingCashFlowに反映される', () => {
  const state = makeState();
  const { balanceSheet, cashFlowStatement } = advanceTurn(state, context, [], () => 1, 3_000_000);
  assert.equal(balanceSheet.paidInCapital, 3_000_000);
  assert.equal(cashFlowStatement.financingCashFlow, 3_000_000);
  assert.equal(balanceSheet.totalAssets, balanceSheet.totalLiabilities + balanceSheet.totalEquity);
});

test('advanceTurn: 上場中は配当がfinancingCashFlowをマイナスする', () => {
  const state = makeState({
    stock: { isPublic: true, sharePrice: 100, totalShares: 100000, publicFloatShares: 30000, dividendPerSharePerTurn: 0.5 },
  });
  const { cashFlowStatement } = advanceTurn(state, context, [], () => 1);
  assert.equal(cashFlowStatement.financingCashFlow, -15000); // 0.5 * 30000
});

test('advanceTurn: 融資の利息がincomeStatement.interestExpenseに、元本返済分がbalanceSheet.longTermDebtの減少に反映される', () => {
  const state = makeState({
    loans: [
      {
        id: 'loan-1',
        principal: 120_000,
        remainingPrincipal: 120_000,
        annualInterestRate: 0,
        originatedAtTurn: 0,
        termTurns: 12,
        monthlyPayment: 10_000,
      },
    ],
  });
  const { nextState, incomeStatement, balanceSheet } = advanceTurn(state, context, [], () => 1);
  assert.equal(incomeStatement.interestExpense, 0); // 金利0%
  assert.equal(balanceSheet.longTermDebt, 110_000); // 120,000 - 10,000
  assert.equal(nextState.loans[0].remainingPrincipal, 110_000);
});

test('advanceTurn: 完済した融資はnextState.loansから消える', () => {
  const state = makeState({
    loans: [
      {
        id: 'loan-1',
        principal: 10_000,
        remainingPrincipal: 500,
        annualInterestRate: 0,
        originatedAtTurn: 0,
        termTurns: 10,
        monthlyPayment: 1_000,
      },
    ],
  });
  const { nextState } = advanceTurn(state, context, [], () => 1);
  assert.equal(nextState.loans.length, 0);
});

test('advanceTurn: 上場中は黒字ターンで株価が前ターンより上昇する', () => {
  const state = makeState({
    stores: [makeStore({ menu: [makeMenuItem({ currentPrice: 800, costOfGoods: 100, qualityScore: 90 })] })],
    stock: { isPublic: true, sharePrice: 100, totalShares: 100000, publicFloatShares: 30000, dividendPerSharePerTurn: 0 },
  });
  const { nextState } = advanceTurn(state, context, [], () => 1);
  assert.ok(nextState.stock.sharePrice > 100);
});

test('advanceTurn: 非上場ならsharePriceは変化しない', () => {
  const state = makeState({
    stock: { isPublic: false, sharePrice: 0, totalShares: 0, publicFloatShares: 0, dividendPerSharePerTurn: 0 },
  });
  const { nextState } = advanceTurn(state, context, [], () => 1);
  assert.equal(nextState.stock.sharePrice, 0);
});

test('advanceTurn: CFOが居てautoPricing=trueなら当ターンの収益から自動調整後の価格が使われる', () => {
  const state = makeState({
    executiveAutomation: { autoPricing: true, autoHiring: false, autoMarketing: false },
    employees: [
      {
        id: 'exec-cfo',
        name: 'CFO',
        role: 'executive',
        executiveTitle: 'CFO',
        skillLevel: 80,
        salaryPerMonth: 9000,
        motivation: 70,
        hiredAtTurn: 0,
      },
    ],
  });
  const withAutomation = advanceTurn(state, context, [], () => 0.5);
  const withoutAutomation = advanceTurn({ ...state, executiveAutomation: { autoPricing: false, autoHiring: false, autoMarketing: false } }, context, [], () => 0.5);
  assert.notEqual(withAutomation.incomeStatement.revenue, withoutAutomation.incomeStatement.revenue);
});

test('advanceTurn: 同一都市に競合店舗があると自店舗の売上が減少する(需要干渉)', () => {
  const withoutCompetitor = makeState({ competitorBrands: [] });
  const withCompetitor = makeState({
    competitorBrands: [
      {
        id: 'comp-1',
        name: 'Rival',
        valuation: 1_000_000,
        isAcquirable: true,
        cash: 100_000,
        storesByCity: { 'city-1': 3 },
        avgPrice: 500,
      },
    ],
  });
  const resultWithout = advanceTurn(withoutCompetitor, context, [], () => 1);
  const resultWith = advanceTurn(withCompetitor, context, [], () => 1);
  assert.ok(resultWith.incomeStatement.revenue < resultWithout.incomeStatement.revenue);
});

test('advanceTurn: NPC競合はターンごとにvaluationやstoresByCityが変化しうる(nextStateに反映される)', () => {
  const state = makeState({
    competitorBrands: [
      {
        id: 'comp-1',
        name: 'Rival',
        valuation: 1_500_000,
        isAcquirable: true,
        cash: 500_000,
        storesByCity: {},
        avgPrice: 500,
      },
    ],
  });
  // rng=0.1: expand条件(rng<0.3)を満たすため出店拡大が起きるはず
  const { nextState } = advanceTurn(state, context, [], () => 0.1);
  assert.equal(nextState.competitorBrands[0].storesByCity['city-1'], 1);
});

test('advanceTurn: R&Dツリーでアンロック済みのノードがあると売上にバフがかかる', () => {
  const researchTree = [
    {
      id: 'app1',
      label: 'App',
      description: '',
      cost: 30_000,
      branch: 'app' as const,
      tier: 1 as const,
      effects: { revenueMultiplier: 1.1 },
    },
  ];
  const withoutResearch = makeState({ researchUnlockedIds: [] });
  const withResearch = makeState({ researchUnlockedIds: ['app1'] });
  const resultWithout = advanceTurn(withoutResearch, context, [], () => 1, 0, [], researchTree);
  const resultWith = advanceTurn(withResearch, context, [], () => 1, 0, [], researchTree);
  assert.ok(resultWith.incomeStatement.revenue > resultWithout.incomeStatement.revenue);
});

test('advanceTurn: R&Dの原価削減ノードは原価(=粗利)に反映される', () => {
  const researchTree = [
    {
      id: 'eco1',
      label: 'Eco',
      description: '',
      cost: 20_000,
      branch: 'eco' as const,
      tier: 1 as const,
      effects: { costMultiplier: 0.5 },
    },
  ];
  const withoutResearch = makeState({ researchUnlockedIds: [] });
  const withResearch = makeState({ researchUnlockedIds: ['eco1'] });
  const resultWithout = advanceTurn(withoutResearch, context, [], () => 1, 0, [], researchTree);
  const resultWith = advanceTurn(withResearch, context, [], () => 1, 0, [], researchTree);
  assert.ok(resultWith.incomeStatement.costOfGoodsSold < resultWithout.incomeStatement.costOfGoodsSold);
});

test('advanceTurn: 自社農園を保有していると不作でない限り毎ターン生豆在庫が増える', () => {
  const state = makeState({
    ownedFarms: [{ id: 'owned-1', farmId: 'farm-1', purchasePrice: 500_000, purchasedAtTurn: 0, lastHarvestFailed: false }],
  });
  const { nextState } = advanceTurn(state, context, [], () => 0.9); // 0.9 > 0.12 → 不作でない
  assert.equal(nextState.greenBeanInventory.length, 1);
  assert.equal(nextState.greenBeanInventory[0].kg, 5000); // context.farms['farm-1'].availableKgPerMonth
  assert.equal(nextState.ownedFarms[0].lastHarvestFailed, false);
});

test('advanceTurn: 自社農園が不作だとlastHarvestFailedがtrueになり収穫量が激減する', () => {
  const state = makeState({
    ownedFarms: [{ id: 'owned-1', farmId: 'farm-1', purchasePrice: 500_000, purchasedAtTurn: 0, lastHarvestFailed: false }],
  });
  const { nextState } = advanceTurn(state, context, [], () => 0.05); // 0.05 < 0.12 → 不作
  assert.equal(nextState.ownedFarms[0].lastHarvestFailed, true);
  assert.equal(nextState.greenBeanInventory[0].kg, 1000); // 5000 * 0.2
});

test('advanceTurn: 自社農園の維持費はincomeStatement.operatingExpensesに反映される', () => {
  const withoutFarm = makeState({ ownedFarms: [] });
  const withFarm = makeState({
    ownedFarms: [{ id: 'owned-1', farmId: 'farm-1', purchasePrice: 500_000, purchasedAtTurn: 0, lastHarvestFailed: false }],
  });
  const resultWithout = advanceTurn(withoutFarm, context, [], () => 0.9);
  const resultWith = advanceTurn(withFarm, context, [], () => 0.9);
  assert.ok(resultWith.incomeStatement.operatingExpenses > resultWithout.incomeStatement.operatingExpenses);
});

test('advanceTurn: 店舗ごとイベントが発生するとtriggeredStoreEventsに積まれ、現金に反映される', () => {
  const storeEventDefinitions: StoreEventDefinition[] = [
    { id: 'equipment-breakdown', probability: 1, cashRange: [-150_000, -150_000] },
  ];
  const state = makeState();
  const { nextState, triggeredStoreEvents, incomeStatement } = advanceTurn(
    state,
    context,
    [],
    () => 0,
    0,
    [],
    [],
    storeEventDefinitions
  );

  assert.equal(triggeredStoreEvents.length, 1);
  assert.equal(triggeredStoreEvents[0].eventId, 'equipment-breakdown');
  assert.equal(triggeredStoreEvents[0].storeId, state.stores[0].id);
  // 店舗イベントの現金影響はincomeStatementのPLには乗らず、直接cashに反映される(既存の会社イベントと同じ設計)。
  assert.equal(nextState.cash, state.cash + incomeStatement.netIncome - 150_000);
});

test('advanceTurn: 店舗ごとイベントで顧客満足度が変化する', () => {
  const storeEventDefinitions: StoreEventDefinition[] = [
    { id: 'food-safety-rumor', probability: 1, satisfactionRange: [-20, -20] },
  ];
  const state = makeState();
  const { nextState } = advanceTurn(state, context, [], () => 0, 0, [], [], storeEventDefinitions);

  assert.equal(nextState.stores[0].cumulativeCustomerSatisfaction, 40); // 60 - 20
});

test('advanceTurn: viral-buzz型の店舗イベントは当ターンの売上を増加させる', () => {
  const storeEventDefinitions: StoreEventDefinition[] = [
    { id: 'viral-buzz', probability: 1, revenueMultiplierRange: [3, 3] },
  ];
  const state = makeState();
  const withoutBuzz = advanceTurn(state, context, [], () => 0);
  const withBuzz = advanceTurn(state, context, [], () => 0, 0, [], [], storeEventDefinitions);

  assert.ok(withBuzz.incomeStatement.revenue > withoutBuzz.incomeStatement.revenue);
});

test('advanceTurn: 決算ターン以外はcorporateTaxが0で、税引前利益がfiscalPeriodに累積される', () => {
  const state = makeState({ turn: 0, fiscalPeriod: { accumulatedPretaxIncome: 500 } });
  const { nextState, incomeStatement, settlement } = advanceTurn(state, context, [], () => 1);

  assert.equal(incomeStatement.corporateTax, 0);
  assert.equal(settlement, undefined);
  assert.equal(nextState.fiscalPeriod.accumulatedPretaxIncome, 500 + incomeStatement.pretaxIncome);
});

test(`advanceTurn: ${SETTLEMENT_INTERVAL_TURNS}の倍数ターンで決算が発生し、累計利益に対して一括課税されfiscalPeriodがリセットされる`, () => {
  const state = makeState({
    turn: SETTLEMENT_INTERVAL_TURNS - 1,
    entityType: 'corporation',
    cash: 100_000_000,
    fiscalPeriod: { accumulatedPretaxIncome: 9_000_000 },
  });
  const { nextState, incomeStatement, settlement } = advanceTurn(state, context, [], () => 1);

  assert.ok(settlement);
  assert.equal(settlement!.turn, SETTLEMENT_INTERVAL_TURNS);
  assert.ok(settlement!.totalTaxDue > 0);
  assert.equal(incomeStatement.corporateTax, settlement!.totalTaxDue);
  assert.equal(nextState.fiscalPeriod.accumulatedPretaxIncome, 0);
});

test('advanceTurn: 法人は赤字決算でも法人住民税均等割が発生する', () => {
  const state = makeState({
    turn: SETTLEMENT_INTERVAL_TURNS - 1,
    entityType: 'corporation',
    stores: [],
    cash: 1_000_000,
    fiscalPeriod: { accumulatedPretaxIncome: -3_000_000 },
  });
  const { settlement } = advanceTurn(state, context, [], () => 1);

  assert.ok(settlement);
  assert.equal(settlement!.breakdown.corporateInhabitantTaxMinimum, 70_000);
  assert.equal(settlement!.totalTaxDue, 70_000);
});

test('advanceTurn: 法人成り後は給与総額に社会保険料(事業主負担)が加算される', () => {
  const employees = [
    {
      id: 'emp-1',
      name: 'Barista',
      role: 'barista' as const,
      skillLevel: 50,
      salaryPerMonth: 200_000,
      motivation: 80,
      hiredAtTurn: 0,
    },
  ];
  const soleProp = advanceTurn(makeState({ entityType: 'soleProprietorship', employees }), context, [], () => 1);
  const corp = advanceTurn(makeState({ entityType: 'corporation', employees }), context, [], () => 1);

  assert.ok(corp.incomeStatement.operatingExpenses > soleProp.incomeStatement.operatingExpenses);
});

test('advanceTurn: 決算での一括納税でcashがマイナスになると黒字倒産(isBankrupt)になる', () => {
  const state = makeState({
    turn: SETTLEMENT_INTERVAL_TURNS - 1,
    entityType: 'corporation',
    cash: 100_000, // 決算納税額を大きく下回るギリギリの手元資金
    fiscalPeriod: { accumulatedPretaxIncome: 50_000_000 },
  });
  const { nextState, settlement } = advanceTurn(state, context, [], () => 1);

  assert.ok(settlement!.totalTaxDue > state.cash);
  assert.equal(nextState.isBankrupt, true);
});

test('advanceTurn: 実績の新規解除条件を満たすと報酬(cash)が加算されunlockedAchievementIdsに積まれる', () => {
  const state = makeState({ entityType: 'soleProprietorship', unlockedAchievementIds: [], cash: 10_000 });
  const { nextState, unlockedAchievements } = advanceTurn(state, context, [], () => 1);

  // makeStateのデフォルトentityTypeは'soleProprietorship'に上書きしているため、
  // このターンで'first-incorporation'は満たさず、実績報酬は発生しない。
  assert.equal(unlockedAchievements.length, 0);
  assert.equal(nextState.unlockedAchievementIds.length, 0);
});

test('advanceTurn: 法人成り済みの状態でadvanceTurnすると初回のみfirst-incorporation実績が解除され報酬が加算される', () => {
  const baseState = makeState({ entityType: 'corporation', cash: 10_000 });
  const notYetUnlocked = { ...baseState, unlockedAchievementIds: [] };
  const alreadyUnlocked = { ...baseState, unlockedAchievementIds: ['first-incorporation'] };

  const { nextState, unlockedAchievements } = advanceTurn(notYetUnlocked, context, [], () => 1);
  const { nextState: nextStateAlready } = advanceTurn(alreadyUnlocked, context, [], () => 1);

  const unlocked = unlockedAchievements.find((a) => a.id === 'first-incorporation');
  assert.ok(unlocked);
  // 報酬の有無以外は同一条件なので、cashの差はちょうど報酬額と一致する
  assert.equal(nextState.cash - nextStateAlready.cash, unlocked!.rewardCash);
  assert.ok(nextState.unlockedAchievementIds.includes('first-incorporation'));

  // 既に解除済みの状態からadvanceTurnしても再度は解除されない
  const second = advanceTurn(nextState, context, [], () => 1);
  assert.equal(second.unlockedAchievements.some((a) => a.id === 'first-incorporation'), false);
});

test('advanceTurn: クリア条件(HD化+IPO+店舗数20以上)を満たすとisVictoryAchievedがtrueで固定される', () => {
  const stores = Array.from({ length: 20 }, (_, i) => ({
    id: `store-${i}`,
    propertyId: 'prop-1',
    name: `store-${i}`,
    equipment: [],
    menu: [makeMenuItem()],
    employeeIds: [],
    openedAtTurn: 0,
    cumulativeCustomerSatisfaction: 60,
    operatingHours: { open: 7, close: 21 },
  }));
  const state = makeState({
    entityType: 'holding',
    stores,
    stock: { isPublic: true, sharePrice: 500, totalShares: 100_000, publicFloatShares: 30_000, dividendPerSharePerTurn: 0 },
  });
  const { nextState } = advanceTurn(state, context, [], () => 1);
  assert.equal(nextState.isVictoryAchieved, true);

  // 店舗が減って条件を割ってもtrueのまま固定される
  const shrunkState = { ...nextState, stores: [stores[0]] };
  const { nextState: nextAfterShrink } = advanceTurn(shrunkState, context, [], () => 1);
  assert.equal(nextAfterShrink.isVictoryAchieved, true);
});
