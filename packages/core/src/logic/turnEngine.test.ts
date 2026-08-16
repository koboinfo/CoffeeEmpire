import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Property, City, Store, MenuItem, Equipment } from '../types/store.js';
import type { GreenBeanLot } from '../types/supplyChain.js';
import type { MarketingCampaign, RealEstateInvestment } from '../types/corporate.js';
import type { CoffeeEmpireState, SimEvent } from '../types/simState.js';
import { advanceTurn } from './turnEngine.js';

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
    taxRule: { corporateTaxRate: 0.3 },
    executiveAutomation: { autoPricing: false, autoHiring: false, autoMarketing: false },
    loans: [],
    researchUnlockedIds: [],
    history: { incomeStatements: [], balanceSheets: [], cashFlowStatements: [], stockPrices: [], newsFeed: [] },
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
  // 人件費0でもoperatingExpensesはrent分のみ含む(payroll項目は追加されない設計)
  assert.equal(incomeStatement.operatingExpenses, 3000);
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
  // rent(3000) + maintenance(30)
  assert.equal(incomeStatement.operatingExpenses, 3030);
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
