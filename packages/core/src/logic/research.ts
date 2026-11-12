import type { ResearchNodeDefinition, ResearchEffects } from '../types/research.js';

/**
 * ノードをアンロック可能か判定する: 既にアンロック済みでなく、前提ノード(あれば)が
 * アンロック済みであること。
 */
export function canUnlockResearchNode(node: ResearchNodeDefinition, unlockedIds: string[]): boolean {
  if (unlockedIds.includes(node.id)) return false;
  if (node.prerequisiteId && !unlockedIds.includes(node.prerequisiteId)) return false;
  return true;
}

/**
 * アンロック済みノードの効果を集計する。revenueMultiplier/costMultiplierは
 * 乗算で積み上げる(例: +5%と+10%のノードを両方アンロックすると1.05*1.10=1.155倍)。
 * entryRateBonus/repeatRateBonusはStoreMarketingEffectsと同じ加算ボーナスとして積み上げる。
 */
export function calculateResearchEffects(unlockedIds: string[], tree: ResearchNodeDefinition[]): ResearchEffects {
  let revenueMultiplier = 1;
  let costMultiplier = 1;
  let entryRateBonus = 0;
  let repeatRateBonus = 0;

  for (const node of tree) {
    if (!unlockedIds.includes(node.id)) continue;
    revenueMultiplier *= node.effects.revenueMultiplier ?? 1;
    costMultiplier *= node.effects.costMultiplier ?? 1;
    entryRateBonus += node.effects.entryRateBonus ?? 0;
    repeatRateBonus += node.effects.repeatRateBonus ?? 0;
  }

  return { revenueMultiplier, costMultiplier, entryRateBonus, repeatRateBonus };
}
