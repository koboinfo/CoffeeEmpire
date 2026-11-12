import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cities } from './cities.js';
import { farms } from './farms.js';
import { events } from './events.js';
import { menuCatalog } from './menuCatalog.js';
import { researchTree } from './researchTree.js';
import { canUnlockResearchNode } from '../logic/research.js';

function assertUniqueIds(items: { id: string }[], label: string) {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${label}にID重複がある`);
}

test('cities: IDが重複しない', () => {
  assertUniqueIds(cities, 'cities');
});

test('cities: incomeLevelは1-10の範囲内', () => {
  for (const city of cities) {
    assert.ok(city.incomeLevel >= 1 && city.incomeLevel <= 10, `${city.id}のincomeLevelが範囲外: ${city.incomeLevel}`);
  }
});

test('cities: populationとfootTrafficIndexは正の値', () => {
  for (const city of cities) {
    assert.ok(city.population > 0, `${city.id}のpopulationが0以下`);
    assert.ok(city.footTrafficIndex > 0, `${city.id}のfootTrafficIndexが0以下`);
  }
});

test('farms: IDが重複しない', () => {
  assertUniqueIds(farms, 'farms');
});

test('farms: qGradeは0-100の範囲内', () => {
  for (const farm of farms) {
    assert.ok(farm.qGrade >= 0 && farm.qGrade <= 100, `${farm.id}のqGradeが範囲外: ${farm.qGrade}`);
  }
});

test('farms: reliabilityは0-100の範囲内', () => {
  for (const farm of farms) {
    assert.ok(farm.reliability >= 0 && farm.reliability <= 100, `${farm.id}のreliabilityが範囲外: ${farm.reliability}`);
  }
});

test('farms: pricePerKgとavailableKgPerMonthは正の値', () => {
  for (const farm of farms) {
    assert.ok(farm.pricePerKg > 0, `${farm.id}のpricePerKgが0以下`);
    assert.ok(farm.availableKgPerMonth > 0, `${farm.id}のavailableKgPerMonthが0以下`);
  }
});

test('events: IDが重複しない', () => {
  assertUniqueIds(events, 'events');
});

test('events: probabilityは0-1の範囲内', () => {
  for (const event of events) {
    assert.ok(event.probability >= 0 && event.probability <= 1, `${event.id}のprobabilityが範囲外: ${event.probability}`);
  }
});

test('menuCatalog: 全50種類が定義されている', () => {
  assert.equal(menuCatalog.length, 50);
});

test('menuCatalog: templateIdが重複しない', () => {
  const ids = menuCatalog.map((item) => item.templateId);
  assert.equal(new Set(ids).size, ids.length, 'menuCatalogにtemplateId重複がある');
});

test('menuCatalog: 原価率は健全な範囲(20-30%)に収まる', () => {
  for (const item of menuCatalog) {
    const cogsRatio = item.costOfGoods / item.basePrice;
    assert.ok(cogsRatio >= 0.2 && cogsRatio <= 0.3, `${item.templateId}の原価率が範囲外: ${Math.round(cogsRatio * 100)}%`);
  }
});

test('menuCatalog: basePrice/unlockCostは負の値を持たない', () => {
  for (const item of menuCatalog) {
    assert.ok(item.basePrice > 0, `${item.templateId}のbasePriceが0以下`);
    assert.ok(item.unlockCost >= 0, `${item.templateId}のunlockCostが負`);
  }
});

test('researchTree: 全25ノードが定義されている', () => {
  assert.equal(researchTree.length, 25);
});

test('researchTree: idが重複しない', () => {
  assertUniqueIds(researchTree, 'researchTree');
});

test('researchTree: prerequisiteIdは同一ツリー内の実在するノードを指す', () => {
  const ids = new Set(researchTree.map((node) => node.id));
  for (const node of researchTree) {
    if (!node.prerequisiteId) continue;
    assert.ok(ids.has(node.prerequisiteId), `${node.id}のprerequisiteId(${node.prerequisiteId})が存在しない`);
  }
});

test('researchTree: 各ブランチはtier1から順に前提関係が連結されている(いきなりtier2以降から始まらない)', () => {
  for (const node of researchTree) {
    if (node.tier === 1) {
      assert.equal(node.prerequisiteId, undefined, `${node.id}はtier1なのにprerequisiteIdを持つ`);
    } else {
      assert.ok(node.prerequisiteId, `${node.id}はtier${node.tier}なのにprerequisiteIdが無い`);
    }
  }
});

test('researchTree: tier1ノードは全てcanUnlockResearchNodeでアンロック可能', () => {
  const tier1Nodes = researchTree.filter((node) => node.tier === 1);
  assert.ok(tier1Nodes.length > 0);
  for (const node of tier1Nodes) {
    assert.equal(canUnlockResearchNode(node, []), true, `${node.id}が初期状態でアンロックできない`);
  }
});
