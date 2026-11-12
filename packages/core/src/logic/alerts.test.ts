import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCompanyAlerts, evaluateStoreAlerts, sortAlertsBySeverity } from './alerts.js';

test('evaluateStoreAlerts: 稼働率0.9超でwarningが出る、0.9以下では出ない', () => {
  const high = evaluateStoreAlerts({ storeId: 's1', storeName: '店A', utilization: 0.95 });
  const low = evaluateStoreAlerts({ storeId: 's1', storeName: '店A', utilization: 0.85 });
  assert.ok(high.some((a) => a.code === 'high-utilization'));
  assert.ok(!low.some((a) => a.code === 'high-utilization'));
});

test('evaluateStoreAlerts: 士気40未満でwarningが出る', () => {
  const result = evaluateStoreAlerts({ storeId: 's1', storeName: '店A', morale: 35 });
  assert.ok(result.some((a) => a.code === 'low-morale'));
});

test('evaluateStoreAlerts: 在庫2週未満でwarningが出る', () => {
  const result = evaluateStoreAlerts({ storeId: 's1', storeName: '店A', weeksOfInventoryRemaining: 1.5 });
  assert.ok(result.some((a) => a.code === 'low-inventory'));
});

test('evaluateStoreAlerts: 都市シェア75%超でwarningが出る', () => {
  const result = evaluateStoreAlerts({ storeId: 's1', storeName: '店A', cityMarketShareRatio: 0.8 });
  assert.ok(result.some((a) => a.code === 'high-market-share'));
});

test('evaluateStoreAlerts: 未定義のフィールドはアラートを発生させず、全て正常なら空配列', () => {
  const result = evaluateStoreAlerts({ storeId: 's1', storeName: '店A' });
  assert.deepEqual(result, []);
});

test('evaluateCompanyAlerts: 現金が固定費4週分を割るとcriticalが出る', () => {
  const critical = evaluateCompanyAlerts({ cash: 1_000_000, monthlyFixedCosts: 2_000_000 }); // 2週分
  const safe = evaluateCompanyAlerts({ cash: 10_000_000, monthlyFixedCosts: 2_000_000 }); // 20週分
  assert.ok(critical.some((a) => a.code === 'cash-runway-critical'));
  assert.ok(!safe.some((a) => a.code === 'cash-runway-critical'));
});

test('evaluateCompanyAlerts: TOB予告・破産間近もcriticalとして返す', () => {
  const result = evaluateCompanyAlerts({
    cash: 100_000_000,
    monthlyFixedCosts: 1,
    isTobPending: true,
    turnsUntilBankruptcy: 1,
  });
  assert.ok(result.some((a) => a.code === 'tob-pending'));
  assert.ok(result.some((a) => a.code === 'bankruptcy-imminent'));
});

test('sortAlertsBySeverity: critical→warning→infoの順に並ぶ', () => {
  const sorted = sortAlertsBySeverity([
    { severity: 'info', code: 'i', message: '' },
    { severity: 'critical', code: 'c', message: '' },
    { severity: 'warning', code: 'w', message: '' },
  ]);
  assert.deepEqual(
    sorted.map((a) => a.severity),
    ['critical', 'warning', 'info']
  );
});
