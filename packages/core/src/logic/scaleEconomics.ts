/**
 * Coffee Inc 2 Teardownレポート §6-1(スノーボール効果の抑制機構)の実装。
 * 累進課税・年次一括課税は既存実装済み。「本社費の超線形化」「独占禁止規制」は
 * 別セッションと同時期に実装が重複したため、`financials.calculateManagementOverheadCost`
 * (部門投資による割引つき)・`corporate.wouldExceedAntitrustCap`(都市の店舗総数が
 * 少ないうちは規制対象外にするフロアつき)へ統合済み。このファイルには重複しない
 * 「市場飽和(カニバリゼーション)」「競合AIのラバーバンド」のみを残す。
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 都市内の自社店舗同士のカニバリゼーション(市場飽和)。同一都市の自社店舗数が増えるほど、
 * 1店舗あたりの実効需要係数が逓減する(都市の需要プールは有限であるため)。
 * storeCountInCity=1 → 1.0、storeCountInCity=6(飽和目安) → 約0.53、以降も緩やかに逓減し続ける。
 */
export function calculateMarketSaturationFactor(storeCountInCity: number): number {
  const n = Math.max(0, storeCountInCity);
  if (n <= 1) return 1;
  return clamp(1 / Math.pow(n, 0.35), 0.15, 1);
}

/**
 * 競合AIの拡張速度に対するラバーバンドの上限倍率(レポート§6-1 note)。
 * 「プレイヤーの成長を無効化しない」ため、競合の成長率はプレイヤーの成長率の0.4〜0.6倍を上限とする。
 * playerGrowthRateが負(縮小)の場合は競合への影響なし(0)を返す。
 */
export function calculateCompetitorRubberBandGrowthRate(
  playerGrowthRate: number,
  rubberBandFactor = 0.5
): number {
  if (playerGrowthRate <= 0) return 0;
  return playerGrowthRate * clamp(rubberBandFactor, 0.4, 0.6);
}
