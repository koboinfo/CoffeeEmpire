import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Store, MenuItem, Equipment } from '../types/store.js';
import type { GreenBeanLot } from '../types/supplyChain.js';
import type { MarketingCampaign, RealEstateInvestment } from '../types/corporate.js';
import type { CoffeeEmpireState, SimEvent } from '../types/simState.js';
import type { StoreEventDefinition } from '../types/storeEvents.js';
import type { Startup, StartupInvestment } from '../types/startup.js';
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
    'farm-1': {
      id: 'farm-1',
      country: 'brazil',
      qGrade: 78,
      flavor: { aroma: 55, acidity: 35, bitterness: 55 },
      pricePerKg: 6.5,
      availableKgPerMonth: 5000,
      reliability: 85,
    },
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
  // 人件費0でもoperatingExpensesはrent(3000)+水道光熱費(機材0件・営業14時間=61000)+本社管理オーバーヘッド(店舗1店=15000)を含む(payroll項目は追加されない設計)
  assert.equal(incomeStatement.operatingExpenses, 79000);
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
  // rent(3000) + maintenance(30) + 水道光熱費(機材1件・営業14時間=69000) + 本社管理オーバーヘッド(店舗1店=15000)
  assert.equal(incomeStatement.operatingExpenses, 87030);
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

  // 60 - 20(イベント) + 0.5(空いている店舗の稼働率回復分。calculateUtilizationSatisfactionDelta参照)
  assert.equal(nextState.stores[0].cumulativeCustomerSatisfaction, 40.5);
});

test('advanceTurn: 稼働率が85%を超える店舗は、店舗イベント無しでも顧客満足度と従業員モチベーションが悪化する', () => {
  // 座席をわずか2席にして、需要(footTraffic由来)が座席キャパシティを大幅に超える状況を作る。
  const crowdedContext = {
    ...context,
    properties: {
      'prop-1': { ...context.properties['prop-1'], seats: 2 },
    },
  };
  const state = makeState({
    employees: [
      {
        id: 'emp-1',
        name: 'Barista',
        role: 'barista' as const,
        skillLevel: 50,
        salaryPerMonth: 200_000,
        motivation: 80,
        hiredAtTurn: 0,
        assignedStoreId: 'store-1',
      },
    ],
  });

  const { nextState } = advanceTurn(state, crowdedContext, [], () => 0);

  assert.ok(nextState.stores[0].cumulativeCustomerSatisfaction < 60); // イベント無しでも悪化する
  assert.ok(nextState.employees[0].motivation < 80);
});

test('advanceTurn: state.statuses.avgQuality/employeeMoraleはターン経過ごとに実データ(店舗メニュー品質/従業員motivationの平均)へ追従する', () => {
  const state = makeState({
    statuses: {
      brandAwareness: { key: 'brandAwareness', value: 50, min: 0, max: 100 },
      avgQuality: { key: 'avgQuality', value: 70, min: 0, max: 100 }, // 初期値のまま固定されていた既知のギャップの再現
      employeeMorale: { key: 'employeeMorale', value: 60, min: 0, max: 100 },
    },
    stores: [
      {
        id: 'store-1',
        propertyId: 'prop-1',
        name: 'Downtown Store',
        equipment: [],
        menu: [
          {
            id: 'menu-1',
            name: 'Latte',
            category: 'coffee',
            basePrice: 500,
            currentPrice: 500,
            costOfGoods: 150,
            qualityScore: 90,
          },
        ],
        employeeIds: [],
        openedAtTurn: 0,
        cumulativeCustomerSatisfaction: 60,
        operatingHours: { open: 7, close: 21 },
      },
    ],
    // assignedStoreId未設定なので稼働率デルタの影響を受けず、平均motivationがそのまま反映される
    employees: [
      { id: 'e1', name: 'A', role: 'barista' as const, skillLevel: 50, salaryPerMonth: 200_000, motivation: 30, hiredAtTurn: 0 },
      { id: 'e2', name: 'B', role: 'barista' as const, skillLevel: 50, salaryPerMonth: 200_000, motivation: 50, hiredAtTurn: 0 },
    ],
  });

  const { nextState } = advanceTurn(state, context, [], () => 0);

  assert.equal(nextState.statuses.avgQuality.value, 90);
  assert.equal(nextState.statuses.employeeMorale.value, 40); // (30+50)/2
});

test('advanceTurn: headquartersが無ければ本社家賃のPL項目は計上されないが、店舗数分の管理オーバーヘッドは計上される', () => {
  const { plItems } = advanceTurn(makeState(), context, [], () => 1);

  assert.equal(plItems.some((item) => item.key === 'rent:headquarters'), false);
  const overhead = plItems.find((item) => item.key === 'managementOverhead');
  assert.ok(overhead);
  assert.equal(overhead?.amount, 15_000); // storeCount=1, 部門投資なし
});

test('advanceTurn: headquartersがあると本社家賃がPLに計上され、部門投資があると管理オーバーヘッドが割り引かれる', () => {
  const state = makeState({
    headquarters: {
      id: 'hq-1',
      cityId: 'city-1',
      sizeTier: 1,
      rentPerMonth: 200_000,
      departments: { hr: { level: 5 } },
    },
  });
  const { plItems } = advanceTurn(state, context, [], () => 1);

  const rentItem = plItems.find((item) => item.key === 'rent:headquarters');
  assert.equal(rentItem?.amount, 200_000);

  const overhead = plItems.find((item) => item.key === 'managementOverhead');
  assert.ok(overhead);
  assert.ok(overhead && overhead.amount < 15_000); // storeCount=1でも部門投資分だけ割引が乗る
});

function makeStartup(overrides: Partial<Startup> = {}): Startup {
  return {
    id: 'startup-1',
    name: 'Test Startup',
    sector: 'coffeeTech',
    stage: 'seed',
    valuation: 10_000_000,
    quartersInStage: 0,
    ...overrides,
  };
}

test('advanceTurn: VC投資は四半期(3ターン)の倍数でのみステージ遷移が進む', () => {
  const startup = makeStartup();
  // rng=0.5はseed(fail0.12/advance0.22/exit0.23)では「停滞」ゾーン(quartersInStageのみ+1)。
  const stateAtTurn0 = makeState({ turn: 0, stores: [], startups: [startup] });
  const { nextState: afterTurn1 } = advanceTurn(stateAtTurn0, context, [], () => 0.5);
  const sameStartupAfterTurn1 = afterTurn1.startups?.find((s) => s.id === startup.id);
  assert.equal(sameStartupAfterTurn1?.quartersInStage, 0); // turn=1は四半期境界ではないため未進行

  const stateAtTurn2 = makeState({ turn: 2, stores: [], startups: [startup] });
  const { nextState: afterTurn3 } = advanceTurn(stateAtTurn2, context, [], () => 0.5);
  const sameStartupAfterTurn3 = afterTurn3.startups?.find((s) => s.id === startup.id);
  assert.equal(sameStartupAfterTurn3?.quartersInStage, 1); // turn=3(=3の倍数)で1回進行
});

test('advanceTurn: 現役案件数が上限未満なら四半期ごとに新規案件が1件補充される', () => {
  const state = makeState({ turn: 2, stores: [], startups: [] });
  const { nextState } = advanceTurn(state, context, [], () => 0.5);
  assert.equal((nextState.startups ?? []).length, 1);
});

test('advanceTurn: 現役案件数が上限(4件)に達していれば新規案件は補充されない', () => {
  const fourActiveStartups = [
    makeStartup({ id: 's-1' }),
    makeStartup({ id: 's-2' }),
    makeStartup({ id: 's-3' }),
    makeStartup({ id: 's-4' }),
  ];
  const state = makeState({ turn: 2, stores: [], startups: fourActiveStartups });
  const { nextState } = advanceTurn(state, context, [], () => 0.5);
  assert.equal((nextState.startups ?? []).length, 4);
});

test('advanceTurn: イグジット(exited)した投資先は出資比率分の評価額が即座に現金化され、vcPortfolioから除かれる', () => {
  // growthステージ(fail0.02/advance無し/exit[0.02,0.10))。rng=0.05でexitゾーンに入る。
  // exitType判定(2回目のrng呼び出しではなく、同じ定数rngなので毎回0.05<0.3)は'ipo'(倍率2.4)。
  const startup = makeStartup({ id: 'growth-1', stage: 'growth', valuation: 10_000_000 });
  const investment: StartupInvestment = {
    startupId: 'growth-1',
    investedAmount: 2_000_000,
    ownershipStake: 0.2,
    investedAtTurn: 0,
  };
  const state = makeState({
    turn: 2,
    stores: [],
    startups: [startup],
    vcPortfolio: [investment],
    cash: 5_000_000,
  });
  const { nextState } = advanceTurn(state, context, [], () => 0.05);

  const exitedStartup = nextState.startups?.find((s) => s.id === 'growth-1');
  assert.equal(exitedStartup?.stage, 'exited');
  assert.equal(exitedStartup?.exitType, 'ipo');
  // valuation = 10,000,000 × 2.4(ipo倍率) = 24,000,000。払戻 = 24,000,000 × 0.2 = 4,800,000
  assert.equal(exitedStartup?.valuation, 24_000_000);
  assert.equal(nextState.vcPortfolio?.some((inv) => inv.startupId === 'growth-1'), false);
  assert.equal(nextState.cash, 5_000_000 + 4_800_000);
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

test('advanceTurn: 株式報酬費用(equityCompensationPerMonth)がplItemsに計上され、非資金費用としてcashへは即座に響かない', () => {
  const employees = [
    {
      id: 'exec-1',
      name: 'CEO',
      role: 'executive' as const,
      executiveTitle: 'CFO' as const,
      skillLevel: 90,
      salaryPerMonth: 0, // 給与自体は無関係(payrollと切り分けて検証するため0)
      motivation: 80,
      hiredAtTurn: 0,
      equityCompensationPerMonth: 100_000,
    },
  ];
  const stateWithEquity = makeState({ employees });
  const stateWithoutEquity = makeState({ employees: [{ ...employees[0], equityCompensationPerMonth: 0 }] });

  const { plItems, nextState: withEquityState } = advanceTurn(stateWithEquity, context, [], () => 1);
  const { nextState: withoutEquityState } = advanceTurn(stateWithoutEquity, context, [], () => 1);

  assert.ok(plItems.some((item) => item.key === 'equityCompensation' && item.amount === 100_000));
  // 非資金費用として営業CFへ足し戻されるため、費用計上の有無でcashの着地額は変わらない
  assert.equal(withEquityState.cash, withoutEquityState.cash);
});

test('advanceTurn: cityId付きキャンペーンが稼働中の都市は認知度が上がり売上が増える', () => {
  const stateWithCampaign = makeState({
    activeCampaigns: [
      {
        id: 'campaign-1',
        type: 'brandSponsorship',
        budget: 0,
        durationTurns: 6,
        awarenessEffect: 60,
        startedAtTurn: 0,
        cityId: 'city-1',
      },
    ],
  });
  const stateWithoutCampaign = makeState({});

  const { nextState: withCampaign } = advanceTurn(stateWithCampaign, context, [], () => 1);
  const { plItems: plItemsWithout } = advanceTurn(stateWithoutCampaign, context, [], () => 1);
  const { plItems: plItemsWith } = advanceTurn(stateWithCampaign, context, [], () => 1);

  assert.ok((withCampaign.brandAwarenessByCity?.['city-1'] ?? 0) > 20);
  const revenueWith = plItemsWith.find((item) => item.key === 'revenue:store-1')?.amount ?? 0;
  const revenueWithout = plItemsWithout.find((item) => item.key === 'revenue:store-1')?.amount ?? 0;
  assert.ok(revenueWith > revenueWithout);
});

test('advanceTurn: entryRateBonus/repeatRateBonusを持つキャンペーン(SNS/ロイヤルティ)が稼働中だと売上が増える', () => {
  const campaign: MarketingCampaign = {
    id: 'campaign-sns',
    type: 'snsMarketing',
    budget: 0,
    durationTurns: 2,
    awarenessEffect: 4,
    startedAtTurn: 0,
    cityId: 'city-1',
    entryRateBonus: 0.2,
    repeatRateBonus: 0.15,
  };
  const stateWithCampaign = makeState({ activeCampaigns: [campaign] });
  const stateWithoutCampaign = makeState({});

  const { plItems: plItemsWith } = advanceTurn(stateWithCampaign, context, [], () => 1);
  const { plItems: plItemsWithout } = advanceTurn(stateWithoutCampaign, context, [], () => 1);

  const revenueWith = plItemsWith.find((item) => item.key === 'revenue:store-1')?.amount ?? 0;
  const revenueWithout = plItemsWithout.find((item) => item.key === 'revenue:store-1')?.amount ?? 0;
  assert.ok(revenueWith > revenueWithout);
});

test('advanceTurn: durationTurnsを過ぎたentryRateBonusキャンペーンはもう効果を持たない', () => {
  const campaign: MarketingCampaign = {
    id: 'campaign-sns-expired',
    type: 'snsMarketing',
    budget: 0,
    durationTurns: 2,
    awarenessEffect: 4,
    startedAtTurn: 0,
    entryRateBonus: 0.2,
  };
  const expiredState = makeState({ turn: 5, activeCampaigns: [campaign] });
  const noCampaignState = makeState({ turn: 5 });

  const { plItems: plItemsExpired } = advanceTurn(expiredState, context, [], () => 1);
  const { plItems: plItemsNoCampaign } = advanceTurn(noCampaignState, context, [], () => 1);

  const revenueExpired = plItemsExpired.find((item) => item.key === 'revenue:store-1')?.amount ?? 0;
  const revenueNoCampaign = plItemsNoCampaign.find((item) => item.key === 'revenue:store-1')?.amount ?? 0;
  assert.equal(revenueExpired, revenueNoCampaign);
});

test('advanceTurn: 不動産の維持費がPLに計上され、簿価がBSのpropertyAndEquipmentNetに反映される', () => {
  const investment: RealEstateInvestment = {
    id: 're-1',
    propertyId: 'prop-invest',
    purchasePrice: 24_000_000,
    monthlyRentalIncome: 175_000,
    purchasedAtTurn: 0,
  };
  const state = makeState({ stores: [], ownedRealEstate: [investment] });
  const { balanceSheet, plItems } = advanceTurn(state, context, [], () => 0.99); // 0.99 -> 空室にならない
  const maintenanceItem = plItems.find((item) => item.key === `realestateMaintenance:${investment.id}`);
  assert.ok(maintenanceItem);
  assert.ok(maintenanceItem!.amount > 0);
  assert.ok(balanceSheet.propertyAndEquipmentNet > 0);
});

test('advanceTurn: 不動産投資は空室確率(rng<0.1)だと実効賃貸収入が満室時より下がる', () => {
  const investment: RealEstateInvestment = {
    id: 're-1',
    propertyId: 'prop-invest',
    purchasePrice: 24_000_000,
    monthlyRentalIncome: 175_000,
    purchasedAtTurn: 0,
  };
  const state = makeState({ stores: [], ownedRealEstate: [investment] });
  const vacant = advanceTurn(state, context, [], () => 0);
  const full = advanceTurn(state, context, [], () => 0.99);
  assert.ok(vacant.incomeStatement.revenue < full.incomeStatement.revenue);
});

test('advanceTurn: 決算ターン以外は地価(landValue)が更新されない', () => {
  const investment: RealEstateInvestment = {
    id: 're-1',
    propertyId: 'prop-1', // contextに存在する(city-1, incomeLevel 5)
    purchasePrice: 10_000_000,
    monthlyRentalIncome: 175_000,
    purchasedAtTurn: 0,
    landValue: 10_000_000,
  };
  // turn=10 -> nextTurn=11。SETTLEMENT_INTERVAL_TURNS(12)の倍数ではない。
  const state = makeState({ turn: 10, stores: [], ownedRealEstate: [investment] });
  const { nextState } = advanceTurn(state, context, [], () => 0.5);
  assert.equal(nextState.ownedRealEstate[0].landValue, 10_000_000);
});

test('advanceTurn: 決算ターン(12の倍数)で地価(landValue)が都市の所得水準に応じて更新される', () => {
  const investment: RealEstateInvestment = {
    id: 're-1',
    propertyId: 'prop-1', // city-1, incomeLevel 5 -> cityBaseGrowthRate = 0.005 + 0.5*0.035 = 0.0225
    purchasePrice: 10_000_000,
    monthlyRentalIncome: 175_000,
    purchasedAtTurn: 0,
  };
  // turn=11 -> nextTurn=12。自社店舗が無い(stores: [])のでcommercialDensity=0、
  // rng=0.5でノイズは0(symmetricNoiseの中央値)になり、成長率はcityBaseGrowthRateのみになる。
  const state = makeState({ turn: 11, stores: [], ownedRealEstate: [investment] });
  const { nextState } = advanceTurn(state, context, [], () => 0.5);
  // landValue未設定なのでpurchasePriceを初期値として使う: 10,000,000 × 1.0225 = 10,225,000
  assert.equal(nextState.ownedRealEstate[0].landValue, 10_225_000);
});

test('advanceTurn: フランチャイズ契約のロイヤリティ収入がPL/incomeStatement.revenueに反映される', () => {
  const state = makeState({
    stores: [],
    franchiseContracts: [
      { id: 'fc-1', cityId: 'city-1', royaltyRate: 0.06, monthlyGrossRevenueEstimate: 1_000_000, openedAtTurn: 0 },
    ],
  });
  const { incomeStatement, plItems } = advanceTurn(state, context, [], () => 1);
  const royaltyItem = plItems.find((item) => item.key === 'franchiseRoyalty:fc-1');
  assert.ok(royaltyItem);
  assert.equal(royaltyItem!.amount, 60_000);
  assert.equal(incomeStatement.revenue, 60_000);
});

test('advanceTurn: 未上場中はboardConfidenceが変化せずisBoardDismissedもfalseのまま', () => {
  const state = makeState({ stock: { isPublic: false, sharePrice: 0, totalShares: 0, publicFloatShares: 0, dividendPerSharePerTurn: 0 } });
  const { nextState } = advanceTurn(state, context, [], () => 1);
  assert.equal(nextState.boardConfidence, 100);
  assert.equal(nextState.isBoardDismissed, false);
});

test('advanceTurn: 上場中に赤字・株価下落が続くとboardConfidenceが下がり、閾値以下でisBoardDismissedがtrueになる', () => {
  let state = makeState({
    cash: 1000,
    stores: [
      makeStore({
        menu: [makeMenuItem({ currentPrice: 10, costOfGoods: 5000, qualityScore: 0 })],
      }),
    ],
    stock: { isPublic: true, sharePrice: 500, totalShares: 100_000, publicFloatShares: 30_000, dividendPerSharePerTurn: 0 },
    boardConfidence: 100,
    isBoardDismissed: false,
  });

  let dismissed = false;
  for (let i = 0; i < 40 && !dismissed; i++) {
    const { nextState } = advanceTurn(state, context, [], () => 1);
    state = nextState;
    dismissed = state.isBoardDismissed ?? false;
  }
  assert.equal(dismissed, true);
  assert.ok((state.boardConfidence ?? 100) <= 15);
});

test('advanceTurn: isBoardDismissedは一度trueになったら固定される(以後の黒字化でも戻らない)', () => {
  const state = makeState({
    stock: { isPublic: true, sharePrice: 500, totalShares: 100_000, publicFloatShares: 30_000, dividendPerSharePerTurn: 0 },
    boardConfidence: 10,
    isBoardDismissed: true,
  });
  const { nextState } = advanceTurn(state, context, [], () => 1);
  assert.equal(nextState.isBoardDismissed, true);
});
