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
} from './corporate.js';
import type { TaxRule, IncomeStatement, BalanceSheet, CashFlowStatement } from './finance.js';

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
export interface CoffeeEmpireState extends SimState {
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
  history: {
    incomeStatements: IncomeStatement[];
    balanceSheets: BalanceSheet[];
    cashFlowStatements: CashFlowStatement[];
    stockPrices: StockPricePoint[];
    newsFeed: NewsFeedEntry[];
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
