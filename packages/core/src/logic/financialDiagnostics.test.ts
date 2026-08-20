import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ExpenseBreakdown, ExpenseCategory } from './financials.js';
import { calculateCostRatios, diagnoseFinancials, type MonthlyPLSummary } from './financialDiagnostics.js';

function makeExpenses(amounts: Partial<Record<ExpenseCategory['key'], number>>): ExpenseBreakdown {
  const categories: ExpenseCategory[] = [
    { key: 'rent', label: '家賃', amount: amounts.rent ?? 0 },
    { key: 'labor', label: '人件費', amount: amounts.labor ?? 0 },
    { key: 'utilities', label: '水道光熱費', amount: amounts.utilities ?? 0 },
    { key: 'cogs', label: '豆の仕入れ原価', amount: amounts.cogs ?? 0 },
    { key: 'other', label: '税金・その他', amount: amounts.other ?? 0 },
  ];
  return { categories, total: categories.reduce((sum, c) => sum + c.amount, 0) };
}

function makePL(overrides: Partial<MonthlyPLSummary> = {}): MonthlyPLSummary {
  return {
    turn: 12,
    revenue: 1_000_000,
    expenses: makeExpenses({}),
    netIncome: 0,
    ...overrides,
  };
}

test('calculateCostRatios: revenue=0のとき全比率が0でベンチマーク超過にならない', () => {
  const ratios = calculateCostRatios(0, makeExpenses({ labor: 500_000 }));
  for (const ratio of ratios) {
    assert.equal(ratio.ratio, 0);
    assert.equal(ratio.isOverBenchmark, false);
  }
});

test('calculateCostRatios: ベンチマーク超過を正しく判定する', () => {
  const ratios = calculateCostRatios(1_000_000, makeExpenses({ labor: 480_000, rent: 100_000 }));
  const labor = ratios.find((r) => r.key === 'labor')!;
  const rent = ratios.find((r) => r.key === 'rent')!;
  assert.equal(labor.ratio, 0.48);
  assert.equal(labor.isOverBenchmark, true);
  assert.equal(rent.ratio, 0.1);
  assert.equal(rent.isOverBenchmark, false);
});

test('diagnoseFinancials: 人件費超過が赤字の主因として特定される(基盤①のダミー例に対応)', () => {
  const pl = makePL({
    expenses: makeExpenses({ labor: 480_000, rent: 100_000, cogs: 300_000, utilities: 50_000 }),
    netIncome: -50_000,
  });
  const diagnosis = diagnoseFinancials({ stores: [{ id: 's1' }] }, pl);

  assert.equal(diagnosis.isDeficit, true);
  assert.equal(diagnosis.primaryIssue.key, 'labor');
  assert.equal(diagnosis.primaryIssue.severity, 'critical');
  assert.match(diagnosis.primaryIssue.message, /人件費/);
  assert.match(diagnosis.primaryIssue.message, /48%/);
});

test('diagnoseFinancials: 家賃負担過多パターン', () => {
  const pl = makePL({
    expenses: makeExpenses({ rent: 250_000, labor: 300_000, cogs: 300_000, utilities: 40_000 }),
    netIncome: -20_000,
  });
  const diagnosis = diagnoseFinancials({ stores: [{ id: 's1' }] }, pl);

  assert.equal(diagnosis.primaryIssue.key, 'rent');
  assert.equal(diagnosis.primaryIssue.actionTarget, 'stores');
});

test('diagnoseFinancials: 原価高騰パターン', () => {
  const pl = makePL({
    expenses: makeExpenses({ cogs: 450_000, labor: 300_000, rent: 100_000, utilities: 40_000 }),
    netIncome: -10_000,
  });
  const diagnosis = diagnoseFinancials({ stores: [{ id: 's1' }] }, pl);

  assert.equal(diagnosis.primaryIssue.key, 'cogs');
  assert.equal(diagnosis.primaryIssue.actionTarget, 'menu');
});

test('diagnoseFinancials: 複数超過時はベンチマーク超過幅が最大のものをprimaryIssueにする', () => {
  const pl = makePL({
    // labor: overBy = 0.40 - 0.33 = 0.07 / cogs: overBy = 0.50 - 0.35 = 0.15 (こちらが最大)
    expenses: makeExpenses({ labor: 400_000, cogs: 500_000, rent: 100_000, utilities: 40_000 }),
    netIncome: -40_000,
  });
  const diagnosis = diagnoseFinancials({ stores: [{ id: 's1' }] }, pl);

  assert.equal(diagnosis.primaryIssue.key, 'cogs');
  assert.equal(diagnosis.insights.length, 2);
  assert.equal(diagnosis.insights[0].key, 'cogs');
  assert.equal(diagnosis.insights[1].key, 'labor');
});

test('diagnoseFinancials: どのコストも目安内なのに赤字の場合はnetLossにフォールバックする', () => {
  const pl = makePL({
    expenses: makeExpenses({ labor: 300_000, rent: 100_000, cogs: 300_000, utilities: 40_000 }),
    netIncome: -5_000,
  });
  const diagnosis = diagnoseFinancials({ stores: [{ id: 's1' }, { id: 's2' }] }, pl);

  assert.equal(diagnosis.primaryIssue.key, 'netLoss');
  assert.equal(diagnosis.primaryIssue.severity, 'critical');
  assert.match(diagnosis.primaryIssue.message, /全2店舗合計/);
});

test('diagnoseFinancials: 黒字かつ全コストが目安内ならhealthyインサイトを返す', () => {
  const pl = makePL({
    expenses: makeExpenses({ labor: 300_000, rent: 100_000, cogs: 300_000, utilities: 40_000 }),
    netIncome: 260_000,
  });
  const diagnosis = diagnoseFinancials({ stores: [{ id: 's1' }] }, pl);

  assert.equal(diagnosis.isDeficit, false);
  assert.equal(diagnosis.primaryIssue.key, 'healthy');
  assert.equal(diagnosis.insights.length, 1);
});

test('diagnoseFinancials: ベンチマークをわずかに超えただけならseverityはwarning(criticalではない)', () => {
  const pl = makePL({
    // labor ratio = 0.35, idealMax = 0.33, overBy = 0.02 (< 0.1のcritical閾値)
    expenses: makeExpenses({ labor: 350_000, rent: 100_000, cogs: 300_000, utilities: 40_000 }),
    netIncome: 100_000,
  });
  const diagnosis = diagnoseFinancials({ stores: [{ id: 's1' }] }, pl);

  assert.equal(diagnosis.primaryIssue.key, 'labor');
  assert.equal(diagnosis.primaryIssue.severity, 'warning');
});
