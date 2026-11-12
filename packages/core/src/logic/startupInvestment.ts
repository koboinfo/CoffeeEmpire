import { STAGE_TRANSITION_TABLE, STARTUP_SEED_POOL, nextStartupStage } from '../data/startupCatalog.js';
import { SYNERGY_SECTORS } from '../types/startup.js';
import type { Startup, StartupInvestment, StartupSector } from '../types/startup.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

let seedCounter = 0;

/** STARTUP_SEED_POOLから1社をid付きのStartup(seedステージ)として生成する。 */
export function createStartupFromSeed(seedIndex: number, turn: number): Startup {
  const seed = STARTUP_SEED_POOL[seedIndex % STARTUP_SEED_POOL.length];
  seedCounter += 1;
  return {
    id: `startup-${turn}-${seedCounter}`,
    name: seed.name,
    sector: seed.sector,
    stage: 'seed',
    valuation: seed.initialValuation,
    quartersInStage: 0,
  };
}

export interface SynergyEffect {
  failMult: number;
  advanceMult: number;
}

/**
 * 本業(カフェチェーン)とのシナジーが強い業種(coffeeTech/retailSaas/logistics)は
 * 破綻確率を下げ、次ステージへの進行確率を上げる(レポート§3-2)。
 */
export function synergyBonus(sector: StartupSector): SynergyEffect {
  if (SYNERGY_SECTORS.includes(sector)) {
    return { failMult: 0.75, advanceMult: 1.2 };
  }
  return { failMult: 1, advanceMult: 1 };
}

/**
 * スタートアップ1社分の四半期ごとのステージ遷移を1回進める。rngは呼び出し側が注入する
 * (packages/core全体の規約: 裸のMath.random()を呼ばない)。
 * GROWTHは最終段階(advance確率0)であり、それ以降は毎四半期exit判定のみを繰り返す。
 */
export function advanceStartup(startup: Startup, rng: () => number = Math.random): Startup {
  if (startup.stage === 'exited' || startup.stage === 'failed') return startup;

  const base = STAGE_TRANSITION_TABLE[startup.stage];
  const synergy = synergyBonus(startup.sector);
  const fail = clamp(base.fail * synergy.failMult, 0, 1);
  const advance = clamp(base.advance * synergy.advanceMult, 0, 1 - fail);
  const exit = clamp(base.exit, 0, 1 - fail - advance);

  const r = rng();

  if (r < fail) {
    return { ...startup, stage: 'failed', quartersInStage: startup.quartersInStage + 1 };
  }
  if (r < fail + advance) {
    const stepUpNoise = 0.7 + 0.6 * rng(); // レポート§3-2: valuationStepUp × (0.7〜1.3)
    return {
      ...startup,
      stage: nextStartupStage(startup.stage),
      valuation: Math.round(startup.valuation * base.valuationStepUp * stepUpNoise),
      quartersInStage: 0,
    };
  }
  if (r < fail + advance + exit) {
    const exitType = rng() < 0.3 ? 'ipo' : 'acquisition';
    const exitMultiplier = exitType === 'ipo' ? 2.4 : 1.5;
    return {
      ...startup,
      stage: 'exited',
      exitType,
      valuation: Math.round(startup.valuation * exitMultiplier),
      quartersInStage: startup.quartersInStage + 1,
    };
  }
  // 停滞: 評価額はほぼ据え置き
  return { ...startup, quartersInStage: startup.quartersInStage + 1 };
}

/** 出資1件を実行する。ownershipStakeは投資額/評価額で単純化して算出する。 */
export function investInStartup(
  startup: Startup,
  amount: number,
  turn: number
): StartupInvestment {
  return {
    startupId: startup.id,
    investedAmount: amount,
    ownershipStake: startup.valuation > 0 ? amount / startup.valuation : 0,
    investedAtTurn: turn,
  };
}

/**
 * 保有ポートフォリオの現在評価額を合算する。failedになった投資先はゼロ評価
 * (レポート§3-2: 「破綻した投資額は全損」)。
 */
export function calculatePortfolioValue(
  investments: readonly StartupInvestment[],
  startupsById: ReadonlyMap<string, Startup>
): number {
  return investments.reduce((sum, inv) => {
    const startup = startupsById.get(inv.startupId);
    if (!startup || startup.stage === 'failed') return sum;
    return sum + startup.valuation * inv.ownershipStake;
  }, 0);
}
