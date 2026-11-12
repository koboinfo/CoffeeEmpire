import type { Store } from './store.js';
import type { Employee } from './employee.js';
import type { GreenBeanLot, RoastBatch, Roastery, OwnedFarm } from './supplyChain.js';
import type {
  HeadquartersOffice,
  MarketingCampaign,
  StockListing,
  RealEstateInvestment,
  CompetitorBrand,
  Acquisition,
  ExecutiveAutomation,
  Loan,
  EntityType,
  EntityStatus,
} from './corporate.js';
import type { TaxRule, IncomeStatement, BalanceSheet, CashFlowStatement, SettlementResult } from './finance.js';
import type { FranchiseContract } from './franchise.js';
import type { Startup, StartupInvestment } from './startup.js';

/**
 * 基盤④(Sim Core Engine)のAPI概形(~/CoreEngines/core/04-sim-core/README.md)に準拠。
 * パッケージ実装が未着手のため、このアプリではローカルに型を定義する。
 * 将来~/CoreEngines/core/04-sim-core/にパッケージ化する際はここを汎用部分の抽出元とする。
 */
export type TurnUnit = 'month';

export interface StatusValue {
  key: string;
  value: number;
  min?: number;
  max?: number;
}

export interface SimState {
  turn: number;
  turnUnit: TurnUnit;
  statuses: Record<string, StatusValue>;
  cash: number;
}

export interface PLLineItem {
  key: string;
  label: string;
  amount: number;
  kind: 'revenue' | 'fixedCost' | 'variableCost';
}

export interface SimEvent<TEffect = Record<string, number>> {
  id: string;
  probability: number;
  condition?: (state: SimState) => boolean;
  effect: TEffect;
}

/**
 * ステータスキーの意味づけ(アプリ側の責務):
 * - brandAwareness: 認知度 0-100
 * - avgQuality: 提供品質の平均 0-100
 * - employeeMorale: 従業員モチベーションの平均 0-100
 */
/** 決算(年1回)までの累計税引前利益。決算ターンで清算されゼロに戻る。 */
export interface FiscalPeriodState {
  accumulatedPretaxIncome: number;
}

export interface CoffeeEmpireState extends SimState {
  entityType: EntityType;
  entityStatus: EntityStatus;
  fiscalPeriod: FiscalPeriodState;
  isBankrupt: boolean; // 決算等でcashが一度でもマイナスになったら黒字倒産としてtrueになる(以後復帰しない)
  isVictoryAchieved: boolean; // クリア条件(checkVictoryCondition)を一度満たしたらtrueで固定(以後の縮小では戻らない)
  unlockedAchievementIds: string[]; // 解除済み実績(logic/achievements.ts参照)。付与順を保持するため配列。
  stores: Store[];
  employees: Employee[];
  greenBeanInventory: GreenBeanLot[];
  roastedInventory: RoastBatch[];
  roasteries: Roastery[];
  ownedFarms: OwnedFarm[];
  headquarters?: HeadquartersOffice;
  activeCampaigns: MarketingCampaign[];
  stock: StockListing;
  ownedRealEstate: RealEstateInvestment[];
  competitorBrands: CompetitorBrand[];
  acquisitions: Acquisition[];
  taxRule: TaxRule;
  executiveAutomation: ExecutiveAutomation;
  loans: Loan[];
  researchUnlockedIds: string[];
  /**
   * Phase C追加のadditiveフィールド。都市ごとのブランド認知度(0-100、cityId -> 値)。
   * 既存のグローバルなstatuses.brandAwarenessとは別軸で並存させる(後方互換のため既存は無変更)。
   * 未設定(旧セーブ含む)のキーはgetCityBrandAwarenessのデフォルト値(baseline)として扱う。
   */
  brandAwarenessByCity?: Record<string, number>;
  /**
   * 取締役会/株主総会機構の追加フィールド。上場企業(stock.isPublic)にのみ意味を持つ
   * (未上場中は評価対象外・値が変化しない)。未設定(旧セーブ含む)はboardLogic.ts側の
   * デフォルト値(満額信任=100/未解任)として扱う。isBankruptと同じ「一度trueになったら固定」方式。
   */
  boardConfidence?: number; // 0-100
  isBoardDismissed?: boolean;
  /**
   * フランチャイズ契約(logic/franchiseLogic.ts参照)。未設定(旧セーブ含む)は空配列として扱う。
   */
  franchiseContracts?: FranchiseContract[];
  /**
   * Phase G追加のadditiveフィールド。会社全体で開発済み(=unlockCostを支払い済み)のメニュー
   * テンプレートid(data/menuCatalog.tsのtemplateId)。ここに含まれるテンプレートのみ、
   * 各店舗のメニューに追加できる。未設定(旧セーブ含む)は空配列として扱う。
   */
  unlockedMenuItemIds?: string[];
  /**
   * VC/スタートアップ投資(logic/startupInvestment.ts参照)。seed/seriesA/.../exited/failedの
   * 全ステージを含む(投資候補プール兼、出資後の追跡)。未設定(旧セーブ含む)は空配列として扱う。
   * 四半期(3ターン)ごとにturnEngine.advanceTurnが進行・新規案件の追加を行う。
   */
  startups?: Startup[];
  /** 自社の出資履歴。startupIdでstartupsと対応する。未設定(旧セーブ含む)は空配列として扱う。 */
  vcPortfolio?: StartupInvestment[];
  history: {
    incomeStatements: IncomeStatement[];
    balanceSheets: BalanceSheet[];
    cashFlowStatements: CashFlowStatement[];
    stockPrices: StockPricePoint[];
    newsFeed: NewsFeedEntry[];
    settlements: SettlementResult[];
  };
}

export interface StockPricePoint {
  turn: number;
  sharePrice: number;
}

export interface NewsFeedEntry {
  turn: number;
  eventId: string;
  storeId?: string; // 店舗ごとイベントの場合のみ設定される
}
