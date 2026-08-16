export type ResearchBranch = 'app' | 'eco' | 'machine';

/**
 * 乗数効果のみ(加算のqualityBonus等は持たない)。品質向上系ノードも「客単価/客数への
 * 効果」として売上乗数に近似する(既知の簡略化。calculateStoreRevenueの内部係数には
 * 手を入れず、advanceTurn側で売上・原価に事後適用する)。
 */
export interface ResearchNodeEffects {
  revenueMultiplier?: number; // 例: 1.05 = 全店舗売上+5%
  costMultiplier?: number; // 例: 0.97 = 全店舗原価-3%
}

export interface ResearchNodeDefinition {
  id: string;
  label: string;
  description: string;
  cost: number;
  branch: ResearchBranch;
  tier: 1 | 2;
  prerequisiteId?: string; // 同一branch内の前提ノードid(ツリー構造)
  effects: ResearchNodeEffects;
}

export interface ResearchEffects {
  revenueMultiplier: number;
  costMultiplier: number;
}
