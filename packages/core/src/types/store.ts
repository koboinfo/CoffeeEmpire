export interface City {
  id: string;
  name: string;
  country: string;
  population: number;
  incomeLevel: number; // 1-10、賃料・客単価の相場に影響
  footTrafficIndex: number; // 立地評価の基礎値
}

export interface Property {
  id: string;
  cityId: string;
  size: 'kiosk' | 'small' | 'medium' | 'large' | 'flagship';
  /**
   * 物件の坪数(Phase E追加、賃料・座席数の物理的な起点)。未設定時は`resolvePropertyCapacity`
   * (logic/propertyGenerator.ts)が`size`から既定値を推定する(Phase E以前のセーブ・フィクスチャ互換)。
   */
  sizeTsubo?: number;
  /** 座席数(Phase E追加)。未設定時は`resolvePropertyCapacity`がsizeTsubo/sizeから算出する。 */
  seats?: number;
  footTraffic: number;
  rentPerMonth: number;
  purchasePrice?: number; // 購入も可能な物件
  ownership: 'unowned' | 'leased' | 'owned';
}

export type EquipmentCategory = 'espressoMachine' | 'grinder' | 'roaster' | 'pos' | 'furniture';

export interface Equipment {
  id: string;
  category: EquipmentCategory;
  tier: number; // 1-5、品質/速度上限に影響
  purchaseCost: number;
  maintenanceCostPerMonth: number;
  depreciationMonths: number; // 減価償却期間
  purchasedAtTurn: number; // 減価償却の起算ターン
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'coffee' | 'tea' | 'tapioca' | 'cake' | 'sandwich' | 'merchandise';
  basePrice: number;
  currentPrice: number; // 動的に変更可能
  costOfGoods: number; // 原材料原価(ブレンド・仕入コストから算出)
  qualityScore: number; // 0-100
  /**
   * Phase C追加のadditiveフィールド。焙煎バッチ由来の産地・ブレンド情報(applyRoastedBatchToMenuItem経由で設定)。
   * 表示・オリジナルメニュー訴求用のメタデータで、qualityScore自体は既にcalculateMenuItemPreferenceScore
   * (logic/supplyChain.ts)を経由してバッチ作成時に加点済みのため、この情報自体は売上計算には使わない。
   */
  originBlend?: {
    originCountries: string[];
    isOriginalBlend: boolean;
    blendName?: string;
  };
}

export interface OperatingHours {
  open: number; // 0-23
  close: number; // 1-24
}

export interface Store {
  id: string;
  propertyId: string;
  name: string;
  equipment: Equipment[];
  menu: MenuItem[];
  employeeIds: string[];
  managerId?: string;
  openedAtTurn: number;
  cumulativeCustomerSatisfaction: number; // 0-100
  operatingHours: OperatingHours; // 表示・設定のみ。calculateStoreRevenueには未接続(既知の簡略化)
}
