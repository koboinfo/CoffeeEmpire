import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Startup } from '../types/startup.js';
import {
  advanceStartup,
  calculatePortfolioValue,
  createStartupFromSeed,
  investInStartup,
  synergyBonus,
} from './startupInvestment.js';

function makeStartup(overrides: Partial<Startup> = {}): Startup {
  return {
    id: 'startup-1',
    name: 'Test Startup',
    sector: 'other',
    stage: 'seed',
    valuation: 10_000_000,
    quartersInStage: 0,
    ...overrides,
  };
}

test('createStartupFromSeed: STARTUP_SEED_POOLからseedステージのStartupを生成する', () => {
  const startup = createStartupFromSeed(0, 5);
  assert.equal(startup.stage, 'seed');
  assert.equal(startup.quartersInStage, 0);
  assert.ok(startup.valuation > 0);
  assert.ok(startup.id.includes('startup-5-'));
});

test('synergyBonus: シナジー業種(coffeeTech等)はfailMultが下がりadvanceMultが上がる', () => {
  const synergy = synergyBonus('coffeeTech');
  const nonSynergy = synergyBonus('fintech');
  assert.ok(synergy.failMult < nonSynergy.failMult);
  assert.ok(synergy.advanceMult > nonSynergy.advanceMult);
});

test('advanceStartup: rngが低い値だとfail確率レンジに入りfailedへ遷移する', () => {
  const startup = makeStartup({ stage: 'seed' });
  const result = advanceStartup(startup, () => 0.01); // seedのfail=0.12を下回る
  assert.equal(result.stage, 'failed');
  assert.equal(result.quartersInStage, 1);
});

test('advanceStartup: fail確率とadvance確率の間の値だとnextStageへ進みvaluationが上昇する', () => {
  const startup = makeStartup({ stage: 'seed', valuation: 10_000_000 });
  // seed: fail=0.12, advance=0.10 → 0.15はfailを超えadvance帯に入る
  const rng = (() => {
    const values = [0.15, 0.5]; // 2回目のrng呼び出しはstepUpNoiseの計算用
    let i = 0;
    return () => values[Math.min(i++, values.length - 1)];
  })();
  const result = advanceStartup(startup, rng);
  assert.equal(result.stage, 'seriesA');
  assert.equal(result.quartersInStage, 0);
  assert.ok(result.valuation > startup.valuation);
});

test('advanceStartup: exit帯に入るとexitedになりexitTypeが設定される', () => {
  const startup = makeStartup({ stage: 'growth', valuation: 10_000_000 });
  // growth: fail=0.02, advance=0, exit=0.08 → 0.05はfailを超えexit帯に入る
  const rng = (() => {
    const values = [0.05, 0.9]; // 2回目 >= 0.3 なのでacquisition
    let i = 0;
    return () => values[Math.min(i++, values.length - 1)];
  })();
  const result = advanceStartup(startup, rng);
  assert.equal(result.stage, 'exited');
  assert.equal(result.exitType, 'acquisition');
  assert.equal(result.valuation, Math.round(startup.valuation * 1.5));
});

test('advanceStartup: exitedやfailedは以後遷移しない(状態が固定される)', () => {
  const failed = makeStartup({ stage: 'failed' });
  const exited = makeStartup({ stage: 'exited', exitType: 'ipo' });
  assert.deepEqual(advanceStartup(failed, () => 0), failed);
  assert.deepEqual(advanceStartup(exited, () => 0), exited);
});

test('advanceStartup: 停滞帯(fail+advance+exitのいずれにも入らない)ではステージ・評価額を維持しquartersInStageのみ増える', () => {
  const startup = makeStartup({ stage: 'seed', valuation: 10_000_000, quartersInStage: 2 });
  // seed: fail=0.12, advance=0.10, exit=0.01 → 累計0.23。0.9は停滞帯
  const result = advanceStartup(startup, () => 0.9);
  assert.equal(result.stage, 'seed');
  assert.equal(result.valuation, startup.valuation);
  assert.equal(result.quartersInStage, 3);
});

test('investInStartup: 出資額と評価額からownershipStakeを算出する', () => {
  const startup = makeStartup({ valuation: 10_000_000 });
  const investment = investInStartup(startup, 1_000_000, 12);
  assert.equal(investment.ownershipStake, 0.1);
  assert.equal(investment.investedAtTurn, 12);
});

test('calculatePortfolioValue: failedになった投資先は評価額ゼロとして扱われる', () => {
  const alive = makeStartup({ id: 'a', stage: 'growth', valuation: 20_000_000 });
  const dead = makeStartup({ id: 'b', stage: 'failed', valuation: 5_000_000 });
  const startupsById = new Map([
    [alive.id, alive],
    [dead.id, dead],
  ]);
  const investments = [
    investInStartup(alive, 2_000_000, 1), // stake = 0.1
    investInStartup(dead, 1_000_000, 1),
  ];
  const total = calculatePortfolioValue(investments, startupsById);
  assert.equal(total, 20_000_000 * 0.1);
});
