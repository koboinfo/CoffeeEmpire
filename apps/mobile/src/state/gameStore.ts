import { create } from 'zustand';
import { createCoreSlice, type CoreSlice } from './slices/coreSlice';
import { createStoreSlice, type StoreSlice } from './slices/storeSlice';
import { createSupplyChainSlice, type SupplyChainSlice } from './slices/supplyChainSlice';
import { createCorporateSlice, type CorporateSlice } from './slices/corporateSlice';
import { createFinanceSlice, type FinanceSlice } from './slices/financeSlice';
import { createResearchSlice, type ResearchSlice } from './slices/researchSlice';
import { createMenuSlice, type MenuSlice } from './slices/menuSlice';

/**
 * Zustand Sliceパターン(公式ガイド準拠)。各Sliceは`state`(CoffeeEmpireState)を
 * 共有しつつ、関心事(コア進行/店舗運営/サプライチェーン/企業統治/財務/研究開発/メニュー開発)ごとに
 * アクションを分割する。設計の詳細は`ARCHITECTURE.md`を参照。
 */
export type GameStore = CoreSlice &
  StoreSlice &
  SupplyChainSlice &
  CorporateSlice &
  FinanceSlice &
  ResearchSlice &
  MenuSlice;

export const useGameStore = create<GameStore>()((...a) => ({
  ...createCoreSlice(...a),
  ...createStoreSlice(...a),
  ...createSupplyChainSlice(...a),
  ...createCorporateSlice(...a),
  ...createFinanceSlice(...a),
  ...createResearchSlice(...a),
  ...createMenuSlice(...a),
}));
