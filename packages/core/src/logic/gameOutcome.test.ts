import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CoffeeEmpireState } from '../types/simState.js';
import { checkVictoryCondition, VICTORY_MIN_STORE_COUNT } from './gameOutcome.js';

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

function makeState(overrides: Partial<CoffeeEmpireState> = {}): CoffeeEmpireState {
  return {
    turn: 1,
    turnUnit: 'month',
    statuses: {},
    cash: 0,
    entityType: 'holding',
    entityStatus: {},
    fiscalPeriod: { accumulatedPretaxIncome: 0 },
    isBankrupt: false,
    isVictoryAchieved: false,
    unlockedAchievementIds: [],
    stores: Array.from({ length: VICTORY_MIN_STORE_COUNT }, (_, i) => makeStore(`s${i}`)),
    employees: [],
    greenBeanInventory: [],
    roastedInventory: [],
    roasteries: [],
    ownedFarms: [],
    activeCampaigns: [],
    stock: { isPublic: true, sharePrice: 500, totalShares: 100_000, publicFloatShares: 30_000, dividendPerSharePerTurn: 0 },
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

test('checkVictoryCondition: HD化+IPO済み+店舗数がしきい値以上ならtrue', () => {
  assert.equal(checkVictoryCondition(makeState()), true);
});

test('checkVictoryCondition: HD化していなければfalse', () => {
  assert.equal(checkVictoryCondition(makeState({ entityType: 'corporation' })), false);
});

test('checkVictoryCondition: IPOしていなければfalse', () => {
  assert.equal(
    checkVictoryCondition(makeState({ stock: { isPublic: false, sharePrice: 0, totalShares: 0, publicFloatShares: 0, dividendPerSharePerTurn: 0 } })),
    false
  );
});

test('checkVictoryCondition: 店舗数がしきい値未満ならfalse', () => {
  assert.equal(checkVictoryCondition(makeState({ stores: [makeStore('only-one')] })), false);
});
