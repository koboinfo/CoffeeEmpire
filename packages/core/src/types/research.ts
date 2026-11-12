export type ResearchBranch = 'app' | 'eco' | 'machine' | 'marketing' | 'staff';

/**
 * revenueMultiplier/costMultiplierは乗算効果(品質向上系ノードも「客単価/客数への効果」として
 * 売上乗数に近似する既知の簡略化)。entryRateBonus/repeatRateBonusはStoreMarketingEffects
 * (logic/financials.ts)と同じ意味論の加算ボーナスで、マーケティング施策(SNS/ロイヤルティ等)と
 * 同じ「需要側(座席キャパシティに達する前)」計算に効く(Phase G追加)。
 */
export interface ResearchNodeEffects {
  revenueMultiplier?: number; // 例: 1.05 = 全店舗売上+5%
  costMultiplier?: number; // 例: 0.97 = 全店舗原価-3%
  entryRateBonus?: number; // 例: 0.1 = 全店舗の入店率(来客数)+10%相当
  repeatRateBonus?: number; // 例: 0.1 = 全店舗のリピート率+10%相当
}

export interface ResearchNodeDefinition {
  id: string;
  label: string;
  description: string;
  cost: number;
  branch: ResearchBranch;
  tier: 1 | 2 | 3 | 4 | 5;
  prerequisiteId?: string; // 同一branch内の前提ノードid(ツリー構造)
  effects: ResearchNodeEffects;
}

export interface ResearchEffects {
  revenueMultiplier: number;
  costMultiplier: number;
  entryRateBonus: number;
  repeatRateBonus: number;
}
