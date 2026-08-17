import type { AchievementCheckContext, AchievementDefinition } from '../data/achievements.js';

/**
 * 現在のstateで新たに条件を満たした実績のみを返す(既にunlockedAchievementIdsに
 * 含まれるものは除外)。呼び出し側がcashへの報酬加算とunlockedAchievementIdsの更新を行う。
 */
export function evaluateNewAchievements(
  context: AchievementCheckContext,
  definitions: AchievementDefinition[],
  unlockedAchievementIds: string[]
): AchievementDefinition[] {
  const alreadyUnlocked = new Set(unlockedAchievementIds);
  return definitions.filter((achievement) => !alreadyUnlocked.has(achievement.id) && achievement.isUnlocked(context));
}
