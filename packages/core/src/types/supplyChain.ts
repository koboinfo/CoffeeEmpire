export type OriginCountry = 'brazil' | 'ethiopia' | 'colombia' | 'vietnam' | 'guatemala' | string;

export interface Farm {
  id: string;
  country: OriginCountry;
  qGrade: number; // 0-100、SCA品質基準
  pricePerKg: number;
  availableKgPerMonth: number;
  reliability: number; // 0-100、供給安定性
}

export interface GreenBeanLot {
  id: string;
  farmId: string;
  qGrade: number;
  kg: number;
  pricePerKg: number; // 購入時単価(焙煎後の原価算定に使う)
  purchasedAtTurn: number;
}

export interface Roastery {
  id: string;
  cityId: string;
  capacityKgPerMonth: number;
  equipmentTier: number;
}

export type RoastLevel = 'light' | 'medium' | 'darkMedium' | 'dark';

export interface RoastBatch {
  id: string;
  roasteryId: string;
  roastLevel: RoastLevel;
  blend: { greenBeanLotId: string; ratio: number }[]; // ratio合計=1.0
  blendName?: string; // 複数ロットを配合した「オリジナルブランド豆」の名称(単一ロット焙煎では未設定)
  outputKg: number; // 焙煎ロスを反映した歩留まり後
  qualityScore: number; // 元Qグレード×焙煎適合度で算出
  costPerKg: number; // 投入生豆コスト合計÷歩留まり後kg(メニュー原価算定に使う)
  roastedAtTurn: number;
  /** Phase C追加のadditiveフィールド。投入した生豆ロットの原産国(重複除去、表示・preferenceScore算定用)。 */
  originCountries?: string[];
}

/**
 * 自社農園。市場からの都度購入(Farm+GreenBeanLot)とは別に、農園そのものを買収して
 * 毎ターン自動収穫する。市場価格よりはるかに低い原価(維持費のみ)で生豆を得られる代わりに、
 * 天候リスク(不作による収穫量激減)を負う。
 */
export interface OwnedFarm {
  id: string;
  farmId: string; // 参照元Farm(data/farms.ts)のid
  purchasePrice: number;
  purchasedAtTurn: number;
  lastHarvestFailed: boolean; // 直近ターンで不作が発生したか(UI表示用)
}
