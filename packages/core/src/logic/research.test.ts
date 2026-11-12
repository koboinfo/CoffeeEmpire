import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ResearchNodeDefinition } from '../types/research.js';
import { canUnlockResearchNode, calculateResearchEffects } from './research.js';

const tree: ResearchNodeDefinition[] = [
  {
    id: 'app1',
    label: 'App Tier1',
    description: '',
    cost: 30_000,
    branch: 'app',
    tier: 1,
    effects: { revenueMultiplier: 1.05 },
  },
  {
    id: 'app2',
    label: 'App Tier2',
    description: '',
    cost: 80_000,
    branch: 'app',
    tier: 2,
    prerequisiteId: 'app1',
    effects: { revenueMultiplier: 1.1 },
  },
  {
    id: 'eco1',
    label: 'Eco Tier1',
    description: '',
    cost: 20_000,
    branch: 'eco',
    tier: 1,
    effects: { costMultiplier: 0.97 },
  },
  {
    id: 'marketing1',
    label: 'Marketing Tier1',
    description: '',
    cost: 25_000,
    branch: 'marketing',
    tier: 1,
    effects: { entryRateBonus: 0.05 },
  },
  {
    id: 'staff1',
    label: 'Staff Tier1',
    description: '',
    cost: 20_000,
    branch: 'staff',
    tier: 1,
    effects: { repeatRateBonus: 0.05 },
  },
];

test('canUnlockResearchNode: 前提条件がなければアンロック可能', () => {
  assert.equal(canUnlockResearchNode(tree[0], []), true);
});

test('canUnlockResearchNode: 前提ノード未アンロックならfalse', () => {
  assert.equal(canUnlockResearchNode(tree[1], []), false);
});

test('canUnlockResearchNode: 前提ノードがアンロック済みならtrue', () => {
  assert.equal(canUnlockResearchNode(tree[1], ['app1']), true);
});

test('canUnlockResearchNode: 既にアンロック済みならfalse(重複アンロック防止)', () => {
  assert.equal(canUnlockResearchNode(tree[0], ['app1']), false);
});

test('calculateResearchEffects: 何もアンロックしていなければ乗数1', () => {
  const effects = calculateResearchEffects([], tree);
  assert.equal(effects.revenueMultiplier, 1);
  assert.equal(effects.costMultiplier, 1);
});

test('calculateResearchEffects: 単一ノードの効果がそのまま反映される', () => {
  const effects = calculateResearchEffects(['app1'], tree);
  assert.equal(effects.revenueMultiplier, 1.05);
  assert.equal(effects.costMultiplier, 1);
});

test('calculateResearchEffects: 複数ノードの効果は乗算で積み上がる', () => {
  const effects = calculateResearchEffects(['app1', 'app2'], tree);
  assert.ok(Math.abs(effects.revenueMultiplier - 1.05 * 1.1) < 1e-9);
});

test('calculateResearchEffects: revenue系とcost系は独立して集計される', () => {
  const effects = calculateResearchEffects(['app1', 'eco1'], tree);
  assert.equal(effects.revenueMultiplier, 1.05);
  assert.equal(effects.costMultiplier, 0.97);
});

test('calculateResearchEffects: 何もアンロックしていなければentryRateBonus/repeatRateBonusは0', () => {
  const effects = calculateResearchEffects([], tree);
  assert.equal(effects.entryRateBonus, 0);
  assert.equal(effects.repeatRateBonus, 0);
});

test('calculateResearchEffects: entryRateBonus/repeatRateBonusは乗算ではなく加算で積み上がる', () => {
  const effects = calculateResearchEffects(['marketing1', 'staff1'], tree);
  assert.equal(effects.entryRateBonus, 0.05);
  assert.equal(effects.repeatRateBonus, 0.05);
});
