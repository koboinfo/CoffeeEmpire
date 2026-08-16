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

export const equipmentCatalog: EquipmentTemplate[] = [
  {
    templateId: 'espresso-basic',
    name: 'エスプレッソマシン(ベーシック)',
    category: 'espressoMachine',
    tier: 1,
    purchaseCost: 4000,
    maintenanceCostPerMonth: 80,
    depreciationMonths: 24,
  },
  {
    templateId: 'espresso-pro',
    name: 'エスプレッソマシン(プロ)',
    category: 'espressoMachine',
    tier: 3,
    purchaseCost: 12000,
    maintenanceCostPerMonth: 150,
    depreciationMonths: 36,
  },
  {
    templateId: 'grinder-standard',
    name: 'グラインダー',
    category: 'grinder',
    tier: 2,
    purchaseCost: 1500,
    maintenanceCostPerMonth: 30,
    depreciationMonths: 24,
  },
  {
    templateId: 'pos-standard',
    name: 'POSレジ',
    category: 'pos',
    tier: 2,
    purchaseCost: 800,
    maintenanceCostPerMonth: 20,
    depreciationMonths: 36,
  },
  {
    templateId: 'furniture-basic',
    name: '座席・内装(シンプル)',
    category: 'furniture',
    tier: 1,
    purchaseCost: 1200,
    maintenanceCostPerMonth: 20,
    depreciationMonths: 60,
  },
  {
    templateId: 'furniture-set',
    name: '座席・内装(スタンダード)',
    category: 'furniture',
    tier: 2,
    purchaseCost: 3000,
    maintenanceCostPerMonth: 40,
    depreciationMonths: 60,
  },
  {
    templateId: 'furniture-premium',
    name: '座席・内装(プレミアム)',
    category: 'furniture',
    tier: 4,
    purchaseCost: 9000,
    maintenanceCostPerMonth: 90,
    depreciationMonths: 60,
  },
];
