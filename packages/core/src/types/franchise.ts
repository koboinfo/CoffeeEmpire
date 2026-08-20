/**
 * フランチャイズ契約。既存の「本社経営シミュレーション」を丸ごと複製する重い実装は避け、
 * evaluateRealEstateInvestment(logic/corporate.ts)と同じ「post-hoc見積もり」スタイルで、
 * フランチャイジー側の月間総売上見積もり(monthlyGrossRevenueEstimate)に対して
 * ロイヤリティ率(royaltyRate)を乗じた分だけプレイヤーの収益になる、という単純化を取る。
 * 自社が直接運営するStoreとは別エンティティであり、Employee/Equipment等は一切持たない。
 */
export interface FranchiseContract {
  id: string;
  cityId: string;
  royaltyRate: number; // 例: 0.06(6%)。フランチャイジーの月間総売上に対する取り分
  monthlyGrossRevenueEstimate: number; // フランチャイジー側の月間総売上見積もり(変動しない固定見積もり)
  openedAtTurn: number;
}
