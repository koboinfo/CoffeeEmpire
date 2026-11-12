/**
 * Coffee Inc 2 Teardownレポート §3-2(VC・スタートアップ投資)に基づく型定義。
 * このモジュールはpackages/core側の純粋ロジックのみで、simState.tsへのフィールド追加や
 * turnEngine.tsへの統合(四半期ごとのadvanceStartup呼び出し配線)は未着手。
 * 次回セッションでの統合を前提に、独立して動作・テスト可能な形にしている。
 */

export type StartupStage = 'seed' | 'seriesA' | 'seriesB' | 'growth' | 'exited' | 'failed';

export type StartupSector =
  | 'coffeeTech'
  | 'retailSaas'
  | 'logistics'
  | 'fintech'
  | 'consumerApp'
  | 'other';

/** synergyBonus(logic/startupInvestment.ts)で優遇される、本業(カフェチェーン経営)とのシナジーが強い業種。 */
export const SYNERGY_SECTORS: readonly StartupSector[] = ['coffeeTech', 'retailSaas', 'logistics'];

export type StartupExitType = 'ipo' | 'acquisition';

export interface Startup {
  id: string;
  name: string;
  sector: StartupSector;
  stage: StartupStage;
  valuation: number;
  /** そのステージに何ターン(四半期)留まっているか。停滞の観測用。 */
  quartersInStage: number;
  exitType?: StartupExitType;
}

/** プレイヤー企業が保有する、ある投資先への出資1件分。 */
export interface StartupInvestment {
  startupId: string;
  investedAmount: number;
  /** 出資時点でのownershipByCompany相当。valuation上昇/下落がリターンにそのまま反映される。 */
  ownershipStake: number;
  investedAtTurn: number;
}

/** ステージごとの四半期遷移確率(レポート§3-2の表に準拠)。fail+advance+exit+stagnant=1になるよう構成する。 */
export interface StageTransitionRates {
  fail: number;
  advance: number;
  exit: number;
  /** 次ステージへ進んだ際の評価額倍率(中心値)。実際の適用時は±30%のランダムブレを掛ける。 */
  valuationStepUp: number;
}
