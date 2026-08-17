import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CoffeeEmpireState } from '../types/simState.js';
import { defaultTaxRule } from '../data/taxConstants.js';
import {
  canIncorporate,
  incorporateCompany,
  canEstablishHolding,
  establishHolding,
  INCORPORATION_COST,
  HOLDING_ESTABLISHMENT_COST,
  HOLDING_MIN_STORE_COUNT,
} from './incorporation.js';

function makeState(overrides: Partial<CoffeeEmpireState> = {}): CoffeeEmpireState {
  return {
    turn: 5,
    turnUnit: 'month',
    statuses: {},
    cash: 10_000_000,
    entityType: 'soleProprietorship',
    entityStatus: {},
    fiscalPeriod: { accumulatedPretaxIncome: 2_000_000 },
    isBankrupt: false,
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

test('canIncorporate: 個人事業主かつ現金が手続き費用以上なら法人成り可能', () => {
  assert.equal(canIncorporate(makeState()), true);
});

test('canIncorporate: 既に法人成りしていれば不可', () => {
  assert.equal(canIncorporate(makeState({ entityType: 'corporation' })), false);
});

test('canIncorporate: 現金が手続き費用未満なら不可', () => {
  assert.equal(canIncorporate(makeState({ cash: INCORPORATION_COST - 1 })), false);
});

test('incorporateCompany: entityTypeがcorporationになり手続き費用が引かれ、fiscalPeriodがリセットされる', () => {
  const state = makeState();
  const next = incorporateCompany(state);
  assert.equal(next.entityType, 'corporation');
  assert.equal(next.entityStatus.incorporatedAtTurn, 5);
  assert.equal(next.cash, state.cash - INCORPORATION_COST);
  assert.equal(next.fiscalPeriod.accumulatedPretaxIncome, 0);
});

test('incorporateCompany: 条件を満たさなければstateをそのまま返す', () => {
  const state = makeState({ cash: 0 });
  const next = incorporateCompany(state);
  assert.equal(next, state);
});

function makeStore(id: string, propertyId: string) {
  return {
    id,
    propertyId,
    name: id,
    equipment: [],
    menu: [],
    employeeIds: [],
    openedAtTurn: 0,
    cumulativeCustomerSatisfaction: 60,
    operatingHours: { open: 7, close: 21 },
  };
}

test('canEstablishHolding: 法人・店舗数・都市数・現金の全条件を満たせば可能', () => {
  const stores = Array.from({ length: HOLDING_MIN_STORE_COUNT }, (_, i) => makeStore(`store-${i}`, `prop-${i}`));
  const state = makeState({ entityType: 'corporation', cash: HOLDING_ESTABLISHMENT_COST, stores });
  assert.equal(canEstablishHolding(state, 3), true);
});

test('canEstablishHolding: 店舗数が足りなければ不可', () => {
  const state = makeState({ entityType: 'corporation', cash: HOLDING_ESTABLISHMENT_COST, stores: [makeStore('s1', 'p1')] });
  assert.equal(canEstablishHolding(state, 3), false);
});

test('canEstablishHolding: 個人事業主のままでは不可(法人成りが先)', () => {
  const stores = Array.from({ length: HOLDING_MIN_STORE_COUNT }, (_, i) => makeStore(`store-${i}`, `prop-${i}`));
  const state = makeState({ entityType: 'soleProprietorship', cash: HOLDING_ESTABLISHMENT_COST, stores });
  assert.equal(canEstablishHolding(state, 3), false);
});

test('establishHolding: entityTypeがholdingになり設立費用が引かれる', () => {
  const stores = Array.from({ length: HOLDING_MIN_STORE_COUNT }, (_, i) => makeStore(`store-${i}`, `prop-${i}`));
  const state = makeState({ entityType: 'corporation', cash: HOLDING_ESTABLISHMENT_COST, stores });
  const next = establishHolding(state, 3);
  assert.equal(next.entityType, 'holding');
  assert.equal(next.entityStatus.holdingEstablishedAtTurn, 5);
  assert.equal(next.cash, 0);
});
