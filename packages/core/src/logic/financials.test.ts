import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Store, Property, City, MenuItem, Equipment } from '../types/store.js';
import type { Farm, GreenBeanLot } from '../types/supplyChain.js';
import type { PLLineItem } from '../types/simState.js';
import { defaultTaxRule } from '../data/taxConstants.js';
import {
  calculateStoreRevenue,
  calculateInteriorQualityFactor,
  calculatePayroll,
  calculatePL,
  categorizeExpenses,
  calculateTax,
  buildIncomeStatement,
  buildBalanceSheet,
  buildCashFlowStatement,
  calculateEquipmentDepreciation,
  calculateStoresDepreciationAndNetBookValue,
  calculateInventoryValue,
} from './financials.js';

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

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'prop-1',
    cityId: 'city-1',
    size: 'medium',
    footTraffic: 1000,
    rentPerMonth: 3000,
    ownership: 'leased',
    ...overrides,
  };
}

function makeCity(overrides: Partial<City> = {}): City {
  return {
    id: 'city-1',
    name: 'Metropolis',
    country: 'USA',
    population: 1_000_000,
    incomeLevel: 5,
    footTrafficIndex: 1,
    ...overrides,
  };
}

test('calculateStoreRevenue: 客数はfootTrafficを超えず、revenue=customers*avgPrice', () => {
  const store = makeStore();
  const property = makeProperty();
  const city = makeCity();

  const result = calculateStoreRevenue(store, property, city);

  assert.ok(result.customers <= property.footTraffic * 1.5);
  assert.ok(result.customers > 0);
  assert.equal(result.revenue, result.customers * 500);
  assert.equal(result.variableCost, result.customers * 150);
});

test('calculateStoreRevenue: メニューが空なら客数・売上ともに0', () => {
  const store = makeStore({ menu: [] });
  const property = makeProperty();
  const city = makeCity();

  const result = calculateStoreRevenue(store, property, city);

  assert.equal(result.revenue, 0);
  assert.equal(result.variableCost, 0);
});

test('calculateStoreRevenue: 高価格は低所得都市で客数を減らす', () => {
  const property = makeProperty();
  const poorCity = makeCity({ incomeLevel: 1 });
  const richCity = makeCity({ incomeLevel: 10 });
  const store = makeStore({ menu: [makeMenuItem({ currentPrice: 800 })] });

  const poorResult = calculateStoreRevenue(store, property, poorCity);
  const richResult = calculateStoreRevenue(store, property, richCity);

  assert.ok(poorResult.customers < richResult.customers);
});

test('calculatePayroll: 給与の単純合計', () => {
  const employees = [
    { id: 'e1', name: 'A', role: 'barista' as const, skillLevel: 50, salaryPerMonth: 2000, motivation: 80, hiredAtTurn: 0 },
    { id: 'e2', name: 'B', role: 'storeManager' as const, skillLevel: 70, salaryPerMonth: 3500, motivation: 80, hiredAtTurn: 0 },
  ];
  assert.equal(calculatePayroll(employees), 5500);
});

test('calculatePL: 基盤④README準拠でrevenue/costs/profitを返す', () => {
  const items: PLLineItem[] = [
    { key: 'r1', label: 'Revenue', amount: 1000, kind: 'revenue' },
    { key: 'c1', label: 'COGS', amount: 300, kind: 'variableCost' },
    { key: 'c2', label: 'Rent', amount: 200, kind: 'fixedCost' },
  ];
  const result = calculatePL(items);
  assert.deepEqual(result, { revenue: 1000, costs: 500, profit: 500 });
});

test('categorizeExpenses: key接頭辞ごとにrent/cogs/utilitiesへ、payroll系はlaborへ、revenueは除外して集計する', () => {
  const items: PLLineItem[] = [
    { key: 'revenue:store-1', label: '売上', amount: 1000, kind: 'revenue' },
    { key: 'rent:store-1', label: '賃料', amount: 100, kind: 'fixedCost' },
    { key: 'rent:store-2', label: '賃料', amount: 150, kind: 'fixedCost' },
    { key: 'cogs:store-1', label: '原材料費', amount: 200, kind: 'variableCost' },
    { key: 'utilities:store-1', label: '水道光熱費', amount: 50, kind: 'fixedCost' },
    { key: 'payroll', label: '人件費', amount: 300, kind: 'fixedCost' },
    { key: 'employerSocialInsurance', label: '社会保険料', amount: 40, kind: 'fixedCost' },
    { key: 'marketing:camp-1', label: 'マーケティング費', amount: 60, kind: 'fixedCost' },
  ];
  const result = categorizeExpenses(items);
  const byKey = Object.fromEntries(result.categories.map((c) => [c.key, c.amount]));
  assert.equal(byKey.rent, 250);
  assert.equal(byKey.labor, 340);
  assert.equal(byKey.utilities, 50);
  assert.equal(byKey.cogs, 200);
  assert.equal(byKey.other, 60);
  assert.equal(result.total, 250 + 340 + 50 + 200 + 60);
});

test('categorizeExpenses: extraOtherは税金・その他に合算される', () => {
  const items: PLLineItem[] = [{ key: 'rent:store-1', label: '賃料', amount: 100, kind: 'fixedCost' }];
  const result = categorizeExpenses(items, 70_000);
  const other = result.categories.find((c) => c.key === 'other');
  assert.equal(other?.amount, 70_000);
});

test('calculateTax: 赤字時は非課税', () => {
  assert.equal(calculateTax(-100, { ...defaultTaxRule, corporateTaxRate: 0.3 }), 0);
  assert.equal(calculateTax(1000, { ...defaultTaxRule, corporateTaxRate: 0.3 }), 300);
});

test('buildIncomeStatement: 減価償却・法人税を反映した純利益を計算する', () => {
  const items: PLLineItem[] = [
    { key: 'r1', label: 'Revenue', amount: 10000, kind: 'revenue' },
    { key: 'c1', label: 'COGS', amount: 3000, kind: 'variableCost' },
    { key: 'c2', label: 'Opex', amount: 2000, kind: 'fixedCost' },
  ];
  const statement = buildIncomeStatement(1, items, 500, 100, { ...defaultTaxRule, corporateTaxRate: 0.3 });

  assert.equal(statement.revenue, 10000);
  assert.equal(statement.costOfGoodsSold, 3000);
  assert.equal(statement.grossProfit, 7000);
  assert.equal(statement.operatingExpenses, 2000);
  assert.equal(statement.operatingIncome, 4500); // 7000 - 2000 - 500
  assert.equal(statement.pretaxIncome, 4400); // 4500 - 100
  assert.equal(statement.corporateTax, 1320); // 4400 * 0.3
  assert.equal(statement.netIncome, 3080);
});

test('buildBalanceSheet: 資産合計=負債合計+資本合計が成立する', () => {
  const bs = buildBalanceSheet({
    turn: 1,
    previous: undefined,
    netIncome: 3080,
    cashChange: 3080,
    inventoryValue: 500,
    propertyAndEquipmentNet: 10000,
    accountsPayable: 200,
    longTermDebt: 1000,
    // PP&E 10000のうち、AP+長期負債(1200)でまかなえない残りを出資でまかなう想定
    paidInCapitalChange: 9300,
  });

  assert.equal(bs.totalAssets, bs.totalLiabilities + bs.totalEquity);
});

test('buildCashFlowStatement: endingCash = previousEndingCash + netCashChange', () => {
  const cf = buildCashFlowStatement(1, 3080, -2000, 0, 5000);
  assert.equal(cf.netCashChange, 1080);
  assert.equal(cf.endingCash, 6080);
});

function makeEquipment(overrides: Partial<Equipment> = {}): Equipment {
  return {
    id: 'eq-1',
    category: 'espressoMachine',
    tier: 3,
    purchaseCost: 12000,
    maintenanceCostPerMonth: 100,
    depreciationMonths: 12,
    purchasedAtTurn: 0,
    ...overrides,
  };
}

test('calculateInteriorQualityFactor: furniture機材がなければ係数1', () => {
  assert.equal(calculateInteriorQualityFactor([]), 1);
  assert.equal(calculateInteriorQualityFactor([makeEquipment({ category: 'espressoMachine', tier: 5 })]), 1);
});

test('calculateInteriorQualityFactor: furniture機材のtierが高いほど係数が上がる', () => {
  const low = calculateInteriorQualityFactor([makeEquipment({ category: 'furniture', tier: 1 })]);
  const high = calculateInteriorQualityFactor([makeEquipment({ category: 'furniture', tier: 4 })]);
  assert.ok(low > 1);
  assert.ok(high > low);
});

test('calculateInteriorQualityFactor: 複数furniture機材があっても最大tierのみ採用する(重ね置きで強化されない)', () => {
  const factor = calculateInteriorQualityFactor([
    makeEquipment({ id: 'eq-a', category: 'furniture', tier: 1 }),
    makeEquipment({ id: 'eq-b', category: 'furniture', tier: 4 }),
  ]);
  assert.equal(factor, calculateInteriorQualityFactor([makeEquipment({ category: 'furniture', tier: 4 })]));
});

test('calculateInteriorQualityFactor: 係数は上限を超えない', () => {
  const factor = calculateInteriorQualityFactor([makeEquipment({ category: 'furniture', tier: 100 })]);
  assert.ok(factor <= 1.3);
});

test('calculateEquipmentDepreciation: 定額法で月次償却費と簿価を計算する', () => {
  const equipment = makeEquipment({ purchaseCost: 12000, depreciationMonths: 12, purchasedAtTurn: 0 });
  const result = calculateEquipmentDepreciation(equipment, 3); // 3ヶ月経過
  assert.equal(result.monthlyDepreciation, 1000);
  assert.equal(result.netBookValue, 9000); // 12000 - 1000*3
});

test('calculateEquipmentDepreciation: 耐用年数を超えたら償却費0・簿価0', () => {
  const equipment = makeEquipment({ purchaseCost: 12000, depreciationMonths: 12, purchasedAtTurn: 0 });
  const result = calculateEquipmentDepreciation(equipment, 20);
  assert.equal(result.monthlyDepreciation, 0);
  assert.equal(result.netBookValue, 0);
});

test('calculateStoresDepreciationAndNetBookValue: 全店舗の設備を合算する', () => {
  const stores: Store[] = [
    makeStore({ equipment: [makeEquipment({ purchaseCost: 12000, depreciationMonths: 12, purchasedAtTurn: 0 })] }),
    makeStore({ id: 'store-2', equipment: [makeEquipment({ id: 'eq-2', purchaseCost: 6000, depreciationMonths: 12, purchasedAtTurn: 0 })] }),
  ];
  const result = calculateStoresDepreciationAndNetBookValue(stores, 1);
  assert.equal(result.totalMonthlyDepreciation, 1500); // 1000 + 500
  assert.equal(result.totalNetBookValue, 16500); // (12000-1000) + (6000-500)
});

test('calculateInventoryValue: 生豆在庫kg×農園単価の合計', () => {
  const farms: Farm[] = [
    { id: 'farm-a', country: 'brazil', qGrade: 78, pricePerKg: 6.5, availableKgPerMonth: 5000, reliability: 85 },
    { id: 'farm-b', country: 'ethiopia', qGrade: 88, pricePerKg: 12.0, availableKgPerMonth: 1200, reliability: 65 },
  ];
  const inventory: GreenBeanLot[] = [
    { id: 'lot-1', farmId: 'farm-a', qGrade: 78, kg: 100, pricePerKg: 6.5, purchasedAtTurn: 0 },
    { id: 'lot-2', farmId: 'farm-b', qGrade: 88, kg: 50, pricePerKg: 12.0, purchasedAtTurn: 0 },
  ];
  assert.equal(calculateInventoryValue(inventory, farms), 100 * 6.5 + 50 * 12.0);
});

test('calculateInventoryValue: 未知のfarmIdは単価0として扱う', () => {
  const inventory: GreenBeanLot[] = [
    { id: 'lot-1', farmId: 'unknown-farm', qGrade: 50, kg: 100, pricePerKg: 5, purchasedAtTurn: 0 },
  ];
  assert.equal(calculateInventoryValue(inventory, []), 0);
});
