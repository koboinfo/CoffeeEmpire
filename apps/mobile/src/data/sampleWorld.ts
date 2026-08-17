import {
  cities,
  defaultTaxRule,
  type Property,
  type Store,
  type MenuItem,
  type CoffeeEmpireState,
} from '@coffee-empire/core';

const tokyo = cities.find((city) => city.id === 'city-tokyo');
if (!tokyo) {
  throw new Error('city-tokyo not found in @coffee-empire/core cities dataset');
}

export const sampleProperties: Property[] = [
  { id: 'prop-tokyo-1', cityId: tokyo.id, size: 'medium', footTraffic: 1200, rentPerMonth: 720_000, ownership: 'leased' },
];

const flagshipMenu: MenuItem[] = [
  { id: 'menu-espresso', name: 'Espresso', category: 'coffee', basePrice: 400, currentPrice: 400, costOfGoods: 100, qualityScore: 70 },
  { id: 'menu-latte', name: 'Latte', category: 'coffee', basePrice: 550, currentPrice: 550, costOfGoods: 130, qualityScore: 72 },
];

export const sampleStores: Store[] = [
  {
    id: 'store-tokyo-1',
    propertyId: 'prop-tokyo-1',
    name: 'Shibuya Flagship',
    equipment: [],
    menu: flagshipMenu,
    employeeIds: [],
    openedAtTurn: 0,
    cumulativeCustomerSatisfaction: 65, operatingHours: { open: 7, close: 21 },
  },
];

export function createInitialState(): CoffeeEmpireState {
  return {
    turn: 0,
    turnUnit: 'month',
    statuses: {
      brandAwareness: { key: 'brandAwareness', value: 30, min: 0, max: 100 },
      avgQuality: { key: 'avgQuality', value: 70, min: 0, max: 100 },
      employeeMorale: { key: 'employeeMorale', value: 60, min: 0, max: 100 },
    },
    cash: 10_000_000,
    entityType: 'soleProprietorship',
    entityStatus: {},
    fiscalPeriod: { accumulatedPretaxIncome: 0 },
    isBankrupt: false,
    stores: sampleStores,
    employees: [],
    greenBeanInventory: [],
    roastedInventory: [],
    roasteries: [],
    ownedFarms: [],
    activeCampaigns: [],
    stock: { isPublic: false, sharePrice: 0, totalShares: 0, publicFloatShares: 0, dividendPerSharePerTurn: 0 },
    ownedRealEstate: [],
    competitorBrands: [
      {
        id: 'comp-rivalbeans',
        name: 'Rival Beans',
        valuation: 36_000_000,
        isAcquirable: true,
        cash: 8_000_000,
        storesByCity: { 'city-tokyo': 2 },
        avgPrice: 450,
      },
    ],
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
  };
}
