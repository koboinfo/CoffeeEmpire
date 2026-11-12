import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CompetitorBrand } from '../types/corporate.js';
import {
  decideCompetitorAction,
  applyCompetitorAction,
  simulateCompetitorTurn,
  calculateCityMarketShare,
  calculateCompetitivePressure,
} from './competitorAI.js';

function makeCompetitor(overrides: Partial<CompetitorBrand> = {}): CompetitorBrand {
  return {
    id: 'comp-1',
    name: 'Rival Beans',
    valuation: 1_500_000,
    isAcquirable: true,
    cash: 500_000,
    storesByCity: {},
    avgPrice: 500,
    ...overrides,
  };
}

const cityContext = { playerAvgQuality: 50, playerAvgPrice: 500, cityIds: ['city-1', 'city-2'] };

test('decideCompetitorAction: 資金力が乏しい競合は値下げする', () => {
  const competitor = makeCompetitor({ valuation: 100_000 });
  const action = decideCompetitorAction(competitor, { ...cityContext }, () => 0.9);
  assert.equal(action.type, 'priceCut');
});

test('decideCompetitorAction: プレイヤー品質が高くかつ競合が資金潤沢なら値上げする', () => {
  const competitor = makeCompetitor({ valuation: 3_000_000 });
  const action = decideCompetitorAction(competitor, { ...cityContext, playerAvgQuality: 80 }, () => 0.9);
  assert.equal(action.type, 'priceHike');
});

test('decideCompetitorAction: 資金潤沢かつrngが閾値未満なら出店拡大し都市を選ぶ', () => {
  const competitor = makeCompetitor({ valuation: 1_500_000, cash: 500_000 });
  const action = decideCompetitorAction(competitor, { ...cityContext }, () => 0.1);
  assert.equal(action.type, 'expand');
  if (action.type === 'expand') {
    assert.ok(cityContext.cityIds.includes(action.cityId));
  }
});

test('decideCompetitorAction: playerGrowthRateが高いと、通常なら発生しないrng値でも出店拡大する(ラバーバンド)', () => {
  const competitor = makeCompetitor({ valuation: 1_500_000, cash: 500_000 });
  // rng=0.32は素のEXPANSION_PROBABILITY(0.3)未満ではないため、本来はholdPriceになるはず。
  const withoutGrowth = decideCompetitorAction(competitor, { ...cityContext }, () => 0.32);
  assert.equal(withoutGrowth.type, 'holdPrice');

  // playerGrowthRate=1.0(直近で店舗数が倍増)なら、有効な出店拡大確率が0.3×1.5=0.45まで
  // 引き上げられ、同じrng=0.32でも出店拡大が発生する。
  const withGrowth = decideCompetitorAction(competitor, { ...cityContext, playerGrowthRate: 1.0 }, () => 0.32);
  assert.equal(withGrowth.type, 'expand');
});

test('decideCompetitorAction: playerStoresByCityがあれば自社が強い都市が出店拡大先に選ばれやすい', () => {
  const competitor = makeCompetitor({ valuation: 1_500_000, cash: 500_000 });
  // 1回目のrng()は出店拡大の発生判定(<0.3で発生)、2回目は都市の加重抽選に使われる。
  // city-2に自社出店が集中している(重み: city-1=1, city-2=10)ため、大きめの値を返すと
  // 重みの大きいcity-2が選ばれるはず。
  const rngValues = [0.1, 0.99];
  let call = 0;
  const rng = () => rngValues[Math.min(call++, rngValues.length - 1)];

  const action = decideCompetitorAction(
    competitor,
    { ...cityContext, cityIds: ['city-1', 'city-2'], playerStoresByCity: { 'city-1': 0, 'city-2': 9 } },
    rng
  );
  assert.equal(action.type, 'expand');
  if (action.type === 'expand') {
    assert.equal(action.cityId, 'city-2');
  }
});

test('decideCompetitorAction: 出店拡大の条件を満たしても候補都市が無ければholdPriceにフォールバックする', () => {
  const competitor = makeCompetitor({ valuation: 1_500_000, cash: 500_000 });
  const action = decideCompetitorAction(competitor, { ...cityContext, cityIds: [] }, () => 0.1);
  assert.equal(action.type, 'holdPrice');
});

test('decideCompetitorAction: 出店拡大の条件を満たしても現金が足りなければholdPriceにフォールバックする', () => {
  const competitor = makeCompetitor({ valuation: 1_500_000, cash: 100 });
  const action = decideCompetitorAction(competitor, { ...cityContext }, () => 0.1);
  assert.equal(action.type, 'holdPrice');
});

test('decideCompetitorAction: どの条件にも合致しなければholdPriceする', () => {
  const competitor = makeCompetitor({ valuation: 1_500_000 });
  const action = decideCompetitorAction(competitor, { ...cityContext }, () => 0.9);
  assert.equal(action.type, 'holdPrice');
});

test('applyCompetitorAction: priceCutはvaluationとavgPriceを減少させる', () => {
  const competitor = makeCompetitor({ valuation: 1_000_000, avgPrice: 500 });
  const next = applyCompetitorAction(competitor, { type: 'priceCut', magnitude: 0.1 });
  assert.equal(next.valuation, 950_000);
  assert.equal(next.avgPrice, 450);
});

test('applyCompetitorAction: expandはvaluation増加・cash減少・storesByCity加算を行う', () => {
  const competitor = makeCompetitor({ valuation: 1_000_000, cash: 100_000, storesByCity: { 'city-1': 1 } });
  const next = applyCompetitorAction(competitor, { type: 'expand', investedAmount: 50_000, cityId: 'city-1' });
  assert.equal(next.valuation, 1_050_000);
  assert.equal(next.cash, 50_000);
  assert.equal(next.storesByCity['city-1'], 2);
});

test('applyCompetitorAction: expandは未出店都市ならstoresByCityを1で新規作成する', () => {
  const competitor = makeCompetitor({ storesByCity: {} });
  const next = applyCompetitorAction(competitor, { type: 'expand', investedAmount: 10_000, cityId: 'city-2' });
  assert.equal(next.storesByCity['city-2'], 1);
});

test('simulateCompetitorTurn: 全競合分のactionsとnextCompetitorsを返す', () => {
  const competitors = [makeCompetitor({ id: 'a', valuation: 100_000 }), makeCompetitor({ id: 'b', valuation: 3_000_000 })];
  const result = simulateCompetitorTurn(competitors, { ...cityContext, playerAvgQuality: 80 }, () => 0.9);

  assert.equal(result.actions.a.type, 'priceCut');
  assert.equal(result.actions.b.type, 'priceHike');
  assert.equal(result.competitors.length, 2);
});

test('calculateCityMarketShare: 出店数の比率でシェアを算出する(自社が先頭)', () => {
  const competitors = [
    makeCompetitor({ id: 'a', name: 'A', storesByCity: { 'city-1': 3 } }),
    makeCompetitor({ id: 'b', name: 'B', storesByCity: { 'city-1': 1 } }),
  ];
  const result = calculateCityMarketShare('city-1', 4, competitors);
  assert.equal(result[0].id, 'player');
  assert.equal(result[0].share, 0.5); // 4 / (4+3+1)
  assert.equal(result[1].share, 0.375); // 3/8
  assert.equal(result[2].share, 0.125); // 1/8
});

test('calculateCityMarketShare: 誰も出店していなければ全てshare=0', () => {
  const result = calculateCityMarketShare('city-1', 0, []);
  assert.equal(result[0].share, 0);
});

test('calculateCompetitivePressure: 競合店舗が無ければ1.0(干渉なし)', () => {
  assert.equal(calculateCompetitivePressure('city-1', []), 1);
});

test('calculateCompetitivePressure: 競合店舗1つにつき5%減、最大50%減でクランプ', () => {
  const competitors = [makeCompetitor({ storesByCity: { 'city-1': 3 } })];
  assert.equal(calculateCompetitivePressure('city-1', competitors), 0.85); // 1 - 3*0.05

  const manyCompetitors = [makeCompetitor({ storesByCity: { 'city-1': 20 } })];
  assert.equal(calculateCompetitivePressure('city-1', manyCompetitors), 0.5); // clamp
});
