export type DepartmentType = 'it' | 'marketing' | 'hr' | 'finance';

/**
 * 企業成長ステージ。soleProprietorship(個人事業主)→corporation(株式会社)→holding(HD化)の順に
 * 一方向へのみ遷移する(降格は無い)。IPO(株式公開)自体はcorporation/holding到達後に
 * 既存のStockListingで扱う(別軸のフラグのため、entityTypeには含めない)。
 */
export type EntityType = 'soleProprietorship' | 'corporation' | 'holding';

export interface EntityStatus {
  incorporatedAtTurn?: number; // 法人成りしたターン(個人事業主のままなら未設定)
  holdingEstablishedAtTurn?: number; // HD体制へ移行したターン
}

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
  /**
   * Phase A追加のadditiveフィールド。部門ごとの自動化に「1ターンあたりの支出上限」を設ける。
   * 未設定(旧セーブ含む)の項目は上限なし=既存の挙動(cashバッファ判定のみ)のまま後方互換。
   */
  departmentBudgets?: DepartmentAutomationBudgets;
}

export interface DepartmentAutomationBudgets {
  hiringMonthlyBudget?: number; // COO自動採用: このターンに新規採用へ支出できる給与総額の上限
  marketingMonthlyBudget?: number; // CMO自動宣伝: 自動起動して良いキャンペーンの予算上限
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
  /**
   * Phase C追加のadditiveフィールド。設定時はこの都市のbrandAwarenessByCityのみを対象にする
   * (グローバルなstatuses.brandAwarenessには影響しない)。未設定なら従来通りグローバル扱い(後方互換)。
   */
  cityId?: string;
}

export interface StockListing {
  isPublic: boolean;
  ipoTurn?: number;
  sharePrice: number;
  totalShares: number;
  publicFloatShares: number;
  dividendPerSharePerTurn: number;
  /**
   * Phase B追加のadditiveフィールド。publicFloatSharesの内訳のうち機関投資家保有分。
   * 未設定(旧セーブ含む)は0として扱う(calculateOwnershipComposition参照)。
   * founder保有分はtotalShares - publicFloatSharesの差分として暗黙的に扱う(既存設計を踏襲)。
   */
  institutionalFloatShares?: number;
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
  /**
   * Phase D(M&A統合)追加のadditiveフィールド。integrateAcquisition(logic/corporate.ts)の結果を
   * 記録用に保持する(UI表示用。再計算のロジック自体はintegrateAcquisition側にある)。
   * 未設定(旧セーブ含む)は統合処理が無かった買収として扱う。
   */
  absorbedStoreCount?: number;
  integrationCashBonus?: number;
}

export interface RealEstateInvestment {
  id: string;
  propertyId: string; // 賃貸収入を生む保有不動産(自社店舗以外)
  purchasePrice: number;
  monthlyRentalIncome: number;
  purchasedAtTurn: number;
}
