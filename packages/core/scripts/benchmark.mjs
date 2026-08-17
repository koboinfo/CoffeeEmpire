// Phase6 パフォーマンス確認用ベンチマーク。npm testには含めない(実行時間はマシン依存で
// 厳密なassertには不向きなため)。`node scripts/benchmark.mjs`(distビルド後)で手動実行する。
import {
  advanceTurn,
  cities,
  farms,
  events,
  storeEvents,
  marketingCampaignPresets,
  researchTree,
  defaultTaxRule,
} from '../dist/index.js';

const STORE_COUNT = 25;
const TURNS_TO_SIMULATE = 60; // 5年分

const city = cities[0];

const properties = {};
const stores = [];
for (let i = 0; i < STORE_COUNT; i += 1) {
  const propertyId = `bench-prop-${i}`;
  properties[propertyId] = {
    id: propertyId,
    cityId: city.id,
    size: 'medium',
    footTraffic: 1000 + i * 10,
    rentPerMonth: 300_000,
    ownership: 'leased',
  };
  stores.push({
    id: `bench-store-${i}`,
    propertyId,
    name: `Store ${i}`,
    equipment: [],
    menu: [
      { id: 'm1', name: 'Latte', category: 'coffee', basePrice: 500, currentPrice: 500, costOfGoods: 150, qualityScore: 70 },
    ],
    employeeIds: [],
    openedAtTurn: 0,
    cumulativeCustomerSatisfaction: 60,
    operatingHours: { open: 7, close: 21 },
  });
}

const context = {
  properties,
  cities: Object.fromEntries(cities.map((c) => [c.id, c])),
  farms: Object.fromEntries(farms.map((f) => [f.id, f])),
};

let state = {
  turn: 0,
  turnUnit: 'month',
  statuses: {},
  cash: 50_000_000,
  entityType: 'corporation',
  entityStatus: {},
  fiscalPeriod: { accumulatedPretaxIncome: 0 },
  isBankrupt: false,
  isVictoryAchieved: false,
  unlockedAchievementIds: [],
  stores,
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
  history: { incomeStatements: [], balanceSheets: [], cashFlowStatements: [], stockPrices: [], newsFeed: [], settlements: [] },
};

const rng = () => 0.5; // 決定的(乱数によるブレを除いて純粋な計算コストを測る)

const start = process.hrtime.bigint();
for (let i = 0; i < TURNS_TO_SIMULATE; i += 1) {
  const result = advanceTurn(state, context, events, rng, 0, marketingCampaignPresets, researchTree, storeEvents);
  state = result.nextState;
}
const end = process.hrtime.bigint();

const totalMs = Number(end - start) / 1_000_000;
console.log(`店舗数: ${STORE_COUNT}`);
console.log(`シミュレートしたターン数: ${TURNS_TO_SIMULATE}`);
console.log(`合計時間: ${totalMs.toFixed(2)}ms`);
console.log(`1ターンあたり平均: ${(totalMs / TURNS_TO_SIMULATE).toFixed(3)}ms`);
console.log(`最終cash: ${Math.round(state.cash).toLocaleString('ja-JP')}`);
