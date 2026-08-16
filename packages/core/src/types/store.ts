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
  category: 'coffee' | 'food' | 'merchandise';
  basePrice: number;
  currentPrice: number; // 動的に変更可能
  costOfGoods: number; // 原材料原価(ブレンド・仕入コストから算出)
  qualityScore: number; // 0-100
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
}
