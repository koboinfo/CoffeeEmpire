import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CoffeeEmpireState } from '../types/simState.js';
import type { IncomeStatement } from '../types/finance.js';
import { evaluateNewAchievements } from './achievements.js';
import { achievements } from '../data/achievements.js';

function makeState(overrides: Partial<CoffeeEmpireState> = {}): CoffeeEmpireState {
  return {
    turn: 1,
    turnUnit: 'month',
    statuses: {},
    cash: 0,
    entityType: 'soleProprietorship',
    entityStatus: {},
    fiscalPeriod: { accumulatedPretaxIncome: 0 },
    isBankrupt: false,
    isVictoryAchieved: false,
    unlockedAchievementIds: [],
    stores: [],
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
    taxRule: {} as CoffeeEmpireState['taxRule'],
    executiveAutomation: { autoPricing: false, autoHiring: false, autoMarketing: false },
    loans: [],
    researchUnlockedIds: [],
    history: { incomeStatements: [], balanceSheets: [], cashFlowStatements: [], stockPrices: [], newsFeed: [], settlements: [] },
    ...overrides,
  };
}

function makeStore(id: string) {
  return {
    id,
    propertyId: `prop-${id}`,
    name: id,
    equipment: [],
    menu: [],
    employeeIds: [],
    openedAtTurn: 0,
    cumulativeCustomerSatisfaction: 60,
    operatingHours: { open: 7, close: 21 },
  };
}

test('evaluateNewAchievements: 条件を満たしていても既に解除済みのものは返さない', () => {
  const state = makeState({ entityType: 'corporation' });
  const result = evaluateNewAchievements({ state }, achievements, ['first-incorporation']);
  assert.equal(result.some((a) => a.id === 'first-incorporation'), false);
});

test('evaluateNewAchievements: 未解除で条件を満たすものだけを新規解除として返す', () => {
  const state = makeState({ entityType: 'corporation', stores: [makeStore('s1'), makeStore('s2')] });
  const result = evaluateNewAchievements({ state }, achievements, []);
  const ids = result.map((a) => a.id);
  assert.ok(ids.includes('first-incorporation'));
  assert.ok(!ids.includes('stores-5')); // 店舗2件なので5店舗達成は未解除
});

test('evaluateNewAchievements: 月商実績はlatestIncomeStatementのrevenueで判定する', () => {
  const state = makeState();
  const incomeStatement = { revenue: 1_000_000 } as IncomeStatement;
  const result = evaluateNewAchievements({ state, latestIncomeStatement: incomeStatement }, achievements, []);
  assert.ok(result.some((a) => a.id === 'monthly-revenue-1m'));
  assert.ok(!result.some((a) => a.id === 'monthly-revenue-10m'));
});
