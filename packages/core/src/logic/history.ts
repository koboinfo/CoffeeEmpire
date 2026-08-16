/**
 * 履歴配列を直近maxLength件に切り詰める(先頭=古い要素から削除する)。
 * ローカル永続化のストレージ肥大やグラフ描画コストの増大を防ぐために使う。
 */
export function capHistory<T>(items: T[], maxLength: number): T[] {
  if (items.length <= maxLength) return items;
  return items.slice(items.length - maxLength);
}
