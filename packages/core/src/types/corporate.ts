export type DepartmentType = 'it' | 'marketing' | 'hr' | 'finance';

export interface HeadquartersOffice {
  id: string;
  cityId: string;
  sizeTier: number; // 拡張レベル、役員採用上限や本社効率に影響
  rentPerMonth: number;
  departments: Partial<Record<DepartmentType, { level: number }>>;
}

/**
 * 役員への権限委譲フラグ。該当役職(CFO/COO/CMO)が実際に雇用されている場合のみ
 * advanceTurn内で効果を発揮する(未雇用ならフラグがtrueでも何も起きない)。
 */
export interface ExecutiveAutomation {
  autoPricing: boolean; // CFO: 各店舗のメニュー価格を都市所得水準・品質に合わせて自動調整
  autoHiring: boolean; // COO: 無人店舗にバリスタを自動採用
  autoMarketing: boolean; // CMO: キャンペーンが無い時に最安プリセットを自動起動
}

export interface Loan {
  id: string;
  principal: number;
  remainingPrincipal: number;
  annualInterestRate: number; // 例: 0.08
  originatedAtTurn: number;
  termTurns: number;
  monthlyPayment: number; // 元利均等返済額(毎ターン一定)
}

export interface MarketingCampaign {
  id: string;
  type: 'localAd' | 'digitalAd' | 'brandSponsorship' | 'loyaltyProgram';
  budget: number;
  durationTurns: number;
  awarenessEffect: number; // 認知度ステータスへの効果量
  startedAtTurn: number;
}

export interface StockListing {
  isPublic: boolean;
  ipoTurn?: number;
  sharePrice: number;
  totalShares: number;
  publicFloatShares: number;
  dividendPerSharePerTurn: number;
}

export interface CompetitorBrand {
  id: string;
  name: string;
  valuation: number;
  isAcquirable: boolean;
  cash: number; // 出店拡大(expand)の原資。investedAmount分だけvaluationへ転化する
  storesByCity: Record<string, number>; // cityId -> 出店数。市場シェア算出・自店舗への需要干渉に使う
  avgPrice: number; // 価格戦略(priceCut/priceHike)で増減する平均価格
}

export interface Acquisition {
  id: string;
  targetBrandId: string;
  price: number;
  acquiredAtTurn: number;
}

export interface RealEstateInvestment {
  id: string;
  propertyId: string; // 賃貸収入を生む保有不動産(自社店舗以外)
  purchasePrice: number;
  monthlyRentalIncome: number;
  purchasedAtTurn: number;
}
