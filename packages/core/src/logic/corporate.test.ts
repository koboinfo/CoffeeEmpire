import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { HeadquartersOffice, CompetitorBrand } from '../types/corporate.js';
import type { Property, City } from '../types/store.js';
import type { CoffeeEmpireState } from '../types/simState.js';
import type { MarketingCampaignPreset } from '../data/marketingCampaignPresets.js';
import { defaultTaxRule } from '../data/taxConstants.js';
import {
  upgradeHeadquarters,
  calculateAcquisitionPrice,
  evaluateRealEstateInvestment,
  calculateDepartmentUpgradeCost,
  upgradeDepartment,
  autoAdjustPrice,
  calculateMarketShareRatio,
  calculateDynamicStockPrice,
  applyExecutiveAutomation,
  calculateOwnershipComposition,
  integrateAcquisition,
  calculatePlayerCityShareRatio,
  wouldExceedAntitrustCap,
} from './corporate.js';
import type { StockListing } from '../types/corporate.js';

test('upgradeHeadquarters: sizeTierが+1、rentPerMonthが1.3倍になる', () => {
  const hq: HeadquartersOffice = { id: 'hq-1', cityId: 'city-1', sizeTier: 1, rentPerMonth: 10000, departments: {} };
  const upgraded = upgradeHeadquarters(hq);
  assert.equal(upgraded.sizeTier, 2);
  assert.equal(upgraded.rentPerMonth, 13000);
});

test('calculateAcquisitionPrice: デフォルトでvaluationの1.2倍', () => {
  const competitor: CompetitorBrand = {
    id: 'c1',
    name: 'Rival',
    valuation: 1_000_000,
    isAcquirable: true,
    cash: 200_000,
    storesByCity: {},
    avgPrice: 500,
  };
  assert.equal(calculateAcquisitionPrice(competitor), 1_200_000);
});

test('calculateAcquisitionPrice: premiumRateを指定できる', () => {
  const competitor: CompetitorBrand = {
    id: 'c1',
    name: 'Rival',
    valuation: 1_000_000,
    isAcquirable: true,
    cash: 200_000,
    storesByCity: {},
    avgPrice: 500,
  };
  assert.equal(calculateAcquisitionPrice(competitor, 0.5), 1_500_000);
});

test('evaluateRealEstateInvestment: purchasePriceとmonthlyRentalIncomeが正の値', () => {
  const property: Property = {
    id: 'prop-1',
    cityId: 'city-1',
    size: 'medium',
    footTraffic: 1000,
    rentPerMonth: 5000,
    ownership: 'unowned',
  };
  const result = evaluateRealEstateInvestment(property, () => 0.5);
  assert.ok(result.purchasePrice > 0);
  assert.ok(result.monthlyRentalIncome > 0);
  assert.equal(result.purchasePrice, 5000 * 96); // variance=1.0 when rng=0.5
  assert.equal(result.monthlyRentalIncome, 5000 * 0.7);
});

test('calculateDepartmentUpgradeCost: レベルが上がるほど高くなる', () => {
  assert.equal(calculateDepartmentUpgradeCost(0), 400_000);
  assert.equal(calculateDepartmentUpgradeCost(2), 1_200_000);
});

test('upgradeDepartment: 未設置部門はlevel1で新設される', () => {
  const hq: HeadquartersOffice = { id: 'hq-1', cityId: 'city-1', sizeTier: 1, rentPerMonth: 2000, departments: {} };
  const upgraded = upgradeDepartment(hq, 'it');
  assert.equal(upgraded.departments.it?.level, 1);
});

test('upgradeDepartment: 既存部門はlevelが+1される(他部門は変化しない)', () => {
  const hq: HeadquartersOffice = {
    id: 'hq-1',
    cityId: 'city-1',
    sizeTier: 1,
    rentPerMonth: 2000,
    departments: { it: { level: 2 }, finance: { level: 1 } },
  };
  const upgraded = upgradeDepartment(hq, 'it');
  assert.equal(upgraded.departments.it?.level, 3);
  assert.equal(upgraded.departments.finance?.level, 1);
});

test('autoAdjustPrice: 現在価格と目標価格の中間へ寄せる', () => {
  // referencePrice = incomeLevel(5)*200 = 1000, targetPrice = 1000*(0.5+70/200) = 850
  const next = autoAdjustPrice(400, 70, 5);
  assert.equal(next, Math.round(400 + (850 - 400) * 0.5));
});

test('calculateMarketShareRatio: 自社と競合の評価額比率を返す', () => {
  assert.equal(calculateMarketShareRatio(1_000_000, [1_000_000, 2_000_000]), 0.25);
});

test('calculateMarketShareRatio: 合計0なら0を返す', () => {
  assert.equal(calculateMarketShareRatio(0, []), 0);
});

test('calculatePlayerCityShareRatio: 自社/(自社+競合)の店舗数比率を返す', () => {
  assert.equal(calculatePlayerCityShareRatio(3, 1), 0.75);
});

test('calculatePlayerCityShareRatio: 都市に店舗が1つも無ければ0を返す', () => {
  assert.equal(calculatePlayerCityShareRatio(0, 0), 0);
});

test('wouldExceedAntitrustCap: 都市の店舗総数が少ないうち(5店未満)は規制対象外', () => {
  // 競合0・自社0の都市に1店舗目を出すと理論上シェア100%だが、まだ「市場」と呼べる規模ではないためブロックしない
  assert.equal(wouldExceedAntitrustCap(0, 0), false);
  assert.equal(wouldExceedAntitrustCap(3, 0), false); // 出店後合計4店 < 5
});

test('wouldExceedAntitrustCap: 都市の店舗総数が規制対象規模で、出店後シェアが80%を超えるならtrue', () => {
  // 自社4+競合1(計5) → 出店後は自社5/計6 ≈ 83.3% > 80%
  assert.equal(wouldExceedAntitrustCap(4, 1), true);
});

test('wouldExceedAntitrustCap: 出店後シェアが80%以下ならfalse', () => {
  // 自社2+競合3(計5) → 出店後は自社3/計6 = 50%
  assert.equal(wouldExceedAntitrustCap(2, 3), false);
});

test('calculateDynamicStockPrice: 黒字・高シェアなら株価が上昇する', () => {
  const next = calculateDynamicStockPrice(100, { revenue: 100_000, netIncome: 20_000 }, 0.5);
  assert.ok(next > 100);
});

test('calculateDynamicStockPrice: 赤字なら株価が下落する', () => {
  const next = calculateDynamicStockPrice(100, { revenue: 100_000, netIncome: -50_000 }, 0);
  assert.ok(next < 100);
});

test('calculateDynamicStockPrice: 最低でも1を下回らない', () => {
  const next = calculateDynamicStockPrice(1, { revenue: 100_000, netIncome: -100_000 }, 0);
  assert.ok(next >= 1);
});

function makeAutomationState(overrides: Partial<CoffeeEmpireState> = {}): CoffeeEmpireState {
  return {
    turn: 3,
    turnUnit: 'month',
    statuses: {},
    cash: 10_000_000,
    entityType: 'corporation',
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

const automationCity: City = {
  id: 'city-1',
  name: 'Tokyo',
  country: 'Japan',
  population: 1_000_000,
  incomeLevel: 5,
  footTrafficIndex: 1,
};
const automationProperty: Property = {
  id: 'prop-1',
  cityId: 'city-1',
  size: 'medium',
  footTraffic: 1000,
  rentPerMonth: 3000,
  ownership: 'leased',
};
const automationContext = { properties: { 'prop-1': automationProperty }, cities: { 'city-1': automationCity } };
const noPresets: MarketingCampaignPreset[] = [];

test('applyExecutiveAutomation: autoPricingがOFFなら価格は変わらない', () => {
  const state = makeAutomationState({
    executiveAutomation: { autoPricing: true, autoHiring: false, autoMarketing: false },
    employees: [], // CFO未雇用
    stores: [
      {
        id: 'store-1',
        propertyId: 'prop-1',
        name: 'Store',
        equipment: [],
        menu: [{ id: 'm1', name: 'Latte', category: 'coffee', basePrice: 400, currentPrice: 400, costOfGoods: 100, qualityScore: 70 }],
        employeeIds: [],
        openedAtTurn: 0,
        cumulativeCustomerSatisfaction: 60, operatingHours: { open: 7, close: 21 },
      },
    ],
  });
  const result = applyExecutiveAutomation(state, automationContext, noPresets, () => 0.5);
  assert.equal(result.stores[0].menu[0].currentPrice, 400);
});

test('applyExecutiveAutomation: CFOが居てautoPricing=trueなら価格が調整される', () => {
  const state = makeAutomationState({
    executiveAutomation: { autoPricing: true, autoHiring: false, autoMarketing: false },
    employees: [
      {
        id: 'exec-cfo',
        name: 'CFO Taro',
        role: 'executive',
        executiveTitle: 'CFO',
        skillLevel: 80,
        salaryPerMonth: 9000,
        motivation: 70,
        hiredAtTurn: 0,
      },
    ],
    stores: [
      {
        id: 'store-1',
        propertyId: 'prop-1',
        name: 'Store',
        equipment: [],
        menu: [{ id: 'm1', name: 'Latte', category: 'coffee', basePrice: 400, currentPrice: 400, costOfGoods: 100, qualityScore: 70 }],
        employeeIds: [],
        openedAtTurn: 0,
        cumulativeCustomerSatisfaction: 60, operatingHours: { open: 7, close: 21 },
      },
    ],
  });
  const result = applyExecutiveAutomation(state, automationContext, noPresets, () => 0.5);
  assert.notEqual(result.stores[0].menu[0].currentPrice, 400);
});

test('applyExecutiveAutomation: COOが居てautoHiring=trueなら無人店舗にバリスタが自動採用される', () => {
  const state = makeAutomationState({
    executiveAutomation: { autoPricing: false, autoHiring: true, autoMarketing: false },
    employees: [
      {
        id: 'exec-coo',
        name: 'COO Jiro',
        role: 'executive',
        executiveTitle: 'COO',
        skillLevel: 80,
        salaryPerMonth: 9000,
        motivation: 70,
        hiredAtTurn: 0,
      },
    ],
    stores: [
      {
        id: 'store-1',
        propertyId: 'prop-1',
        name: 'Store',
        equipment: [],
        menu: [],
        employeeIds: [],
        openedAtTurn: 0,
        cumulativeCustomerSatisfaction: 60, operatingHours: { open: 7, close: 21 },
      },
    ],
  });
  const result = applyExecutiveAutomation(state, automationContext, noPresets, () => 0.5);
  assert.equal(result.stores[0].employeeIds.length, 1);
  assert.equal(result.employees.length, 2);
});

test('applyExecutiveAutomation: CMOが居てautoMarketing=trueなら最安プリセットが自動起動される', () => {
  const presets: MarketingCampaignPreset[] = [
    { type: 'localAd', label: '地域広告', budget: 2000, durationTurns: 3, awarenessEffect: 5 },
    { type: 'digitalAd', label: 'デジタル広告', budget: 5000, durationTurns: 3, awarenessEffect: 10 },
  ];
  const state = makeAutomationState({
    executiveAutomation: { autoPricing: false, autoHiring: false, autoMarketing: true },
    employees: [
      {
        id: 'exec-cmo',
        name: 'CMO Hanako',
        role: 'executive',
        executiveTitle: 'CMO',
        skillLevel: 80,
        salaryPerMonth: 9000,
        motivation: 70,
        hiredAtTurn: 0,
      },
    ],
  });
  const result = applyExecutiveAutomation(state, automationContext, presets, () => 0.5);
  assert.equal(result.activeCampaigns.length, 1);
  assert.equal(result.activeCampaigns[0].type, 'localAd');
});

test('applyExecutiveAutomation: hiringMonthlyBudgetを超える採用は行われない(予算内のみ採用)', () => {
  const state = makeAutomationState({
    executiveAutomation: {
      autoPricing: false,
      autoHiring: true,
      autoMarketing: false,
      departmentBudgets: { hiringMonthlyBudget: 1 }, // どんな候補の給与よりも小さい上限
    },
    employees: [
      {
        id: 'exec-coo',
        name: 'COO Jiro',
        role: 'executive',
        executiveTitle: 'COO',
        skillLevel: 80,
        salaryPerMonth: 9000,
        motivation: 70,
        hiredAtTurn: 0,
      },
    ],
    stores: [
      {
        id: 'store-1',
        propertyId: 'prop-1',
        name: 'Store',
        equipment: [],
        menu: [],
        employeeIds: [],
        openedAtTurn: 0,
        cumulativeCustomerSatisfaction: 60,
        operatingHours: { open: 7, close: 21 },
      },
    ],
  });
  const result = applyExecutiveAutomation(state, automationContext, noPresets, () => 0.5);
  assert.equal(result.stores[0].employeeIds.length, 0);
  assert.equal(result.employees.length, 1);
});

test('applyExecutiveAutomation: marketingMonthlyBudget以下のプリセットのみ自動起動候補になる', () => {
  const presets: MarketingCampaignPreset[] = [
    { type: 'localAd', label: '地域広告', budget: 2000, durationTurns: 3, awarenessEffect: 5 },
    { type: 'digitalAd', label: 'デジタル広告', budget: 500, durationTurns: 3, awarenessEffect: 10 },
  ];
  const state = makeAutomationState({
    executiveAutomation: {
      autoPricing: false,
      autoHiring: false,
      autoMarketing: true,
      departmentBudgets: { marketingMonthlyBudget: 1000 }, // localAd(2000)は対象外、digitalAd(500)のみ対象
    },
    employees: [
      {
        id: 'exec-cmo',
        name: 'CMO Hanako',
        role: 'executive',
        executiveTitle: 'CMO',
        skillLevel: 80,
        salaryPerMonth: 9000,
        motivation: 70,
        hiredAtTurn: 0,
      },
    ],
  });
  const result = applyExecutiveAutomation(state, automationContext, presets, () => 0.5);
  assert.equal(result.activeCampaigns.length, 1);
  assert.equal(result.activeCampaigns[0].type, 'digitalAd');
});

function makeStock(overrides: Partial<StockListing> = {}): StockListing {
  return { isPublic: true, sharePrice: 500, totalShares: 100_000, publicFloatShares: 30_000, dividendPerSharePerTurn: 0, ...overrides };
}

test('calculateOwnershipComposition: institutionalFloatShares未設定なら機関投資家保有0%', () => {
  const result = calculateOwnershipComposition(makeStock());
  assert.equal(result.founderShares, 70_000);
  assert.equal(result.institutionalShares, 0);
  assert.equal(result.retailPublicShares, 30_000);
  assert.equal(result.founderPercent, 70);
  assert.equal(result.retailPublicPercent, 30);
});

test('calculateOwnershipComposition: institutionalFloatSharesがpublicFloatSharesの内訳として按分される', () => {
  const result = calculateOwnershipComposition(makeStock({ institutionalFloatShares: 18_000 }));
  assert.equal(result.institutionalShares, 18_000);
  assert.equal(result.retailPublicShares, 12_000);
  assert.equal(result.institutionalPercent, 18);
  assert.equal(result.retailPublicPercent, 12);
});

test('calculateOwnershipComposition: totalShares=0なら全て0%', () => {
  const result = calculateOwnershipComposition(makeStock({ totalShares: 0, publicFloatShares: 0 }));
  assert.equal(result.founderPercent, 0);
  assert.equal(result.institutionalPercent, 0);
  assert.equal(result.retailPublicPercent, 0);
});

function makeCompetitor(overrides: Partial<CompetitorBrand> = {}): CompetitorBrand {
  return {
    id: 'comp-1',
    name: 'Rival Beans',
    valuation: 10_000_000,
    isAcquirable: true,
    cash: 1_000_000,
    storesByCity: { 'city-tokyo': 3, 'city-osaka': 2 },
    avgPrice: 450,
    ...overrides,
  };
}

test('integrateAcquisition: 買収先の都市別出店数に応じて認知度が加点される', () => {
  const result = integrateAcquisition(undefined, makeCompetitor());
  assert.equal(result.brandAwarenessByCity['city-tokyo'], 20 + 3 * 5); // baseline20 + 3店舗×5
  assert.equal(result.brandAwarenessByCity['city-osaka'], 20 + 2 * 5);
});

test('integrateAcquisition: 吸収した店舗数の合計・一時金が算出される', () => {
  const result = integrateAcquisition(undefined, makeCompetitor());
  assert.equal(result.absorbedStoreCount, 5);
  assert.equal(result.cashBonus, 5 * 300_000);
});

test('integrateAcquisition: 出店数0の競合は認知度・一時金に影響しない', () => {
  const result = integrateAcquisition({ 'city-tokyo': 40 }, makeCompetitor({ storesByCity: {} }));
  assert.equal(result.brandAwarenessByCity['city-tokyo'], 40);
  assert.equal(result.absorbedStoreCount, 0);
  assert.equal(result.cashBonus, 0);
});

test('integrateAcquisition: 既存の認知度に加点する形で積み上がる(上書きしない)', () => {
  const result = integrateAcquisition({ 'city-tokyo': 50 }, makeCompetitor({ storesByCity: { 'city-tokyo': 1 } }));
  assert.equal(result.brandAwarenessByCity['city-tokyo'], 55);
});
