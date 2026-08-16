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
    templateId: 'furniture-set',
    name: '什器・内装セット',
    category: 'furniture',
    tier: 2,
    purchaseCost: 3000,
    maintenanceCostPerMonth: 40,
    depreciationMonths: 60,
  },
];
