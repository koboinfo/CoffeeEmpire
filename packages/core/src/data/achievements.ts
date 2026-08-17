import type { CoffeeEmpireState } from '../types/simState.js';
import type { IncomeStatement } from '../types/finance.js';

export interface AchievementCheckContext {
  state: CoffeeEmpireState;
  latestIncomeStatement?: IncomeStatement;
}

export interface AchievementDefinition {
  id: string;
  label: string;
  description: string;
  rewardCash: number;
  isUnlocked: (context: AchievementCheckContext) => boolean;
}

/**
 * 経営マイルストーン一覧。判定は毎ターンstate全体に対して行う(差分ではなく現在の状態のスナップショット判定)。
 * 呼び出し側(logic/achievements.ts)がunlockedAchievementIdsとの差分を取り、新規解除分のみ通知・報酬付与する。
 */
export const achievements: AchievementDefinition[] = [
  {
    id: 'first-incorporation',
    label: '初めての法人成り',
    description: '個人事業主から株式会社へ組織変更した',
    rewardCash: 200_000,
    isUnlocked: ({ state }) => state.entityType !== 'soleProprietorship',
  },
  {
    id: 'first-holding',
    label: 'ホールディングス化',
    description: '持株会社体制へ移行した',
    rewardCash: 1_000_000,
    isUnlocked: ({ state }) => state.entityType === 'holding',
  },
  {
    id: 'stores-5',
    label: '5店舗展開',
    description: '5店舗を同時に運営した',
    rewardCash: 300_000,
    isUnlocked: ({ state }) => state.stores.length >= 5,
  },
  {
    id: 'stores-10',
    label: '10店舗展開',
    description: '10店舗を同時に運営した',
    rewardCash: 800_000,
    isUnlocked: ({ state }) => state.stores.length >= 10,
  },
  {
    id: 'stores-20',
    label: '20店舗展開(メガチェーン)',
    description: '20店舗を同時に運営した',
    rewardCash: 2_000_000,
    isUnlocked: ({ state }) => state.stores.length >= 20,
  },
  {
    id: 'monthly-revenue-1m',
    label: '月商100万円達成',
    description: '単月の売上高が100万円を超えた',
    rewardCash: 300_000,
    isUnlocked: ({ latestIncomeStatement }) => (latestIncomeStatement?.revenue ?? 0) >= 1_000_000,
  },
  {
    id: 'monthly-revenue-10m',
    label: '月商1,000万円達成',
    description: '単月の売上高が1,000万円を超えた',
    rewardCash: 2_000_000,
    isUnlocked: ({ latestIncomeStatement }) => (latestIncomeStatement?.revenue ?? 0) >= 10_000_000,
  },
  {
    id: 'ipo',
    label: 'IPO成功',
    description: '株式を公開した',
    rewardCash: 1_500_000,
    isUnlocked: ({ state }) => state.stock.isPublic,
  },
];
