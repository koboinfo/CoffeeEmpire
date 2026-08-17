import type { EquipmentCategory } from '../types/store.js';

export interface EquipmentTemplate {
  templateId: string;
  name: string;
  category: EquipmentCategory;
  tier: number;
  purchaseCost: number;
  maintenanceCostPerMonth: number;
  depreciationMonths: number;
}

// purchaseCost/maintenanceCostPerMonthは円ベース(実店舗の業務用機材相場を参考に較正)。
export const equipmentCatalog: EquipmentTemplate[] = [
  {
    templateId: 'espresso-basic',
    name: 'エスプレッソマシン(ベーシック)',
    category: 'espressoMachine',
    tier: 1,
    purchaseCost: 350_000,
    maintenanceCostPerMonth: 8_000,
    depreciationMonths: 24,
  },
  {
    templateId: 'espresso-pro',
    name: 'エスプレッソマシン(プロ)',
    category: 'espressoMachine',
    tier: 3,
    purchaseCost: 1_200_000,
    maintenanceCostPerMonth: 20_000,
    depreciationMonths: 36,
  },
  {
    templateId: 'grinder-standard',
    name: 'グラインダー',
    category: 'grinder',
    tier: 2,
    purchaseCost: 120_000,
    maintenanceCostPerMonth: 3_000,
    depreciationMonths: 24,
  },
  {
    templateId: 'pos-standard',
    name: 'POSレジ',
    category: 'pos',
    tier: 2,
    purchaseCost: 80_000,
    maintenanceCostPerMonth: 2_000,
    depreciationMonths: 36,
  },
  {
    templateId: 'furniture-basic',
    name: '座席・内装(シンプル)',
    category: 'furniture',
    tier: 1,
    purchaseCost: 300_000,
    maintenanceCostPerMonth: 5_000,
    depreciationMonths: 60,
  },
  {
    templateId: 'furniture-set',
    name: '座席・内装(スタンダード)',
    category: 'furniture',
    tier: 2,
    purchaseCost: 800_000,
    maintenanceCostPerMonth: 12_000,
    depreciationMonths: 60,
  },
  {
    templateId: 'furniture-premium',
    name: '座席・内装(プレミアム)',
    category: 'furniture',
    tier: 4,
    purchaseCost: 2_000_000,
    maintenanceCostPerMonth: 25_000,
    depreciationMonths: 60,
  },
];
