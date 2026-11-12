import type { StageTransitionRates, StartupSector, StartupStage } from '../types/startup.js';

/**
 * Coffee Inc 2 Teardownレポート §3-2の「ステージ別 四半期遷移確率」表をそのまま定数化したもの。
 * SEED/SERIES_A/SERIES_Bはfail+advance+exit+stagnant=1。GROWTHはexited/failed/stagnantのみ
 * (advanceは無し=最終段階の1つ手前)。
 */
export const STAGE_TRANSITION_TABLE: Record<Exclude<StartupStage, 'exited' | 'failed'>, StageTransitionRates> = {
  seed: { fail: 0.12, advance: 0.1, exit: 0.01, valuationStepUp: 2.5 },
  seriesA: { fail: 0.07, advance: 0.11, exit: 0.02, valuationStepUp: 2.0 },
  seriesB: { fail: 0.04, advance: 0.1, exit: 0.04, valuationStepUp: 1.7 },
  growth: { fail: 0.02, advance: 0, exit: 0.08, valuationStepUp: 1 },
};

export const STARTUP_STAGE_ORDER: readonly StartupStage[] = ['seed', 'seriesA', 'seriesB', 'growth'];

export function nextStartupStage(stage: StartupStage): StartupStage {
  const index = STARTUP_STAGE_ORDER.indexOf(stage);
  if (index === -1 || index === STARTUP_STAGE_ORDER.length - 1) return stage;
  return STARTUP_STAGE_ORDER[index + 1];
}

export interface StartupSeed {
  name: string;
  sector: StartupSector;
  initialValuation: number;
}

/**
 * 投資候補プールのサンプルデータ。本業とのシナジー業種(coffeeTech/retailSaas/logistics)と
 * それ以外(fintech/consumerApp/other)を混在させ、レポートが推奨する「シナジー集中」と
 * 「純粋分散」の両戦略が選べるようにしている。
 */
export const STARTUP_SEED_POOL: readonly StartupSeed[] = [
  { name: 'RoastLink', sector: 'coffeeTech', initialValuation: 8_000_000 },
  { name: 'BeanTrace', sector: 'coffeeTech', initialValuation: 12_000_000 },
  { name: 'ShelfSense', sector: 'retailSaas', initialValuation: 15_000_000 },
  { name: 'QueueZero', sector: 'retailSaas', initialValuation: 9_000_000 },
  { name: 'ColdChainGo', sector: 'logistics', initialValuation: 20_000_000 },
  { name: 'LastMileCafe', sector: 'logistics', initialValuation: 11_000_000 },
  { name: 'PayCup', sector: 'fintech', initialValuation: 25_000_000 },
  { name: 'MorningApp', sector: 'consumerApp', initialValuation: 6_000_000 },
  { name: 'GreenLeaseAI', sector: 'other', initialValuation: 18_000_000 },
];
