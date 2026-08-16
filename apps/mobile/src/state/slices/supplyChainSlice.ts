import type { StateCreator } from 'zustand';
import {
  calculateFarmAcquisitionPrice,
  calculateGreenBeanPurchase,
  calculateRoastOutput,
  farms,
  type GreenBeanLot,
  type OwnedFarm,
  type RoastBatch,
  type RoastLevel,
  type Roastery,
} from '@coffee-empire/core';
import type { GameStore } from '../gameStore';

const ROASTERY_ESTABLISHMENT_COST = 15000;
// 本社と同様、設立先は東京固定(MVPの簡略化)。
const ROASTERY_CITY_ID = 'city-tokyo';
// 1杯あたりの豆使用量(コーヒー1杯≒20g換算)。
const CUP_WEIGHT_KG = 0.02;

export interface SupplyChainSlice {
  establishRoastery: () => void;
  purchaseBeans: (farmId: string, kg: number) => void;
  roastLot: (roasteryId: string, lotId: string, roastLevel: RoastLevel) => void;
  applyRoastedBatchToMenuItem: (storeId: string, menuItemId: string, batchId: string) => void;
  acquireFarm: (farmId: string) => void;
  roastBlend: (
    roasteryId: string,
    inputs: { lotId: string; kg: number }[],
    roastLevel: RoastLevel,
    blendName: string
  ) => void;
}

export const createSupplyChainSlice: StateCreator<GameStore, [], [], SupplyChainSlice> = (set, get) => ({
  establishRoastery: () => {
    const { state } = get();
    if (state.roasteries.length > 0 || state.cash < ROASTERY_ESTABLISHMENT_COST) return;

    const roastery: Roastery = {
      id: `roastery-${ROASTERY_CITY_ID}`,
      cityId: ROASTERY_CITY_ID,
      capacityKgPerMonth: 500,
      equipmentTier: 1,
    };

    set({ state: { ...state, roasteries: [roastery], cash: state.cash - ROASTERY_ESTABLISHMENT_COST } });
  },

  purchaseBeans: (farmId, kg) => {
    const { state } = get();
    const farm = farms.find((f) => f.id === farmId);
    if (!farm) return;

    const { deliveredKg, cost } = calculateGreenBeanPurchase(farm, kg);
    if (deliveredKg <= 0 || state.cash < cost) return;

    const lot: GreenBeanLot = {
      id: `lot-${farmId}-${state.turn}-${Math.floor(Math.random() * 10000)}`,
      farmId,
      qGrade: farm.qGrade,
      kg: deliveredKg,
      pricePerKg: farm.pricePerKg,
      purchasedAtTurn: state.turn,
    };

    set({
      state: { ...state, cash: state.cash - cost, greenBeanInventory: [...state.greenBeanInventory, lot] },
    });
  },

  roastLot: (roasteryId, lotId, roastLevel) => {
    const { state } = get();
    const roastery = state.roasteries.find((r) => r.id === roasteryId);
    const lot = state.greenBeanInventory.find((l) => l.id === lotId);
    if (!roastery || !lot || lot.kg > roastery.capacityKgPerMonth) return;

    const { outputKg, qualityScore, costPerKg } = calculateRoastOutput([lot], roastLevel);

    const batch: RoastBatch = {
      id: `batch-${lotId}-${state.turn}`,
      roasteryId,
      roastLevel,
      blend: [{ greenBeanLotId: lot.id, ratio: 1 }],
      outputKg,
      qualityScore,
      costPerKg,
      roastedAtTurn: state.turn,
    };

    set({
      state: {
        ...state,
        greenBeanInventory: state.greenBeanInventory.filter((l) => l.id !== lotId),
        roastedInventory: [...state.roastedInventory, batch],
      },
    });
  },

  applyRoastedBatchToMenuItem: (storeId, menuItemId, batchId) => {
    const { state } = get();
    const batch = state.roastedInventory.find((b) => b.id === batchId);
    if (!batch) return;

    // 1杯あたり20g使用する想定でコスト換算する(MVPの簡略化。実際の消費量トラッキングは未実装)。
    const costOfGoods = Math.round(batch.costPerKg * CUP_WEIGHT_KG);

    const stores = state.stores.map((store) => {
      if (store.id !== storeId) return store;
      return {
        ...store,
        menu: store.menu.map((item) =>
          item.id === menuItemId ? { ...item, costOfGoods, qualityScore: batch.qualityScore } : item
        ),
      };
    });

    set({
      state: {
        ...state,
        stores,
        roastedInventory: state.roastedInventory.filter((b) => b.id !== batchId),
      },
    });
  },

  // 自社農園の買収。原資はcashから即時控除し、以降は毎ターンadvanceTurn内で自動収穫される
  // (市場購入よりはるかに低い維持費で生豆を得られる代わりに天候リスクを負う)。
  acquireFarm: (farmId) => {
    const { state } = get();
    if (state.ownedFarms.some((owned) => owned.farmId === farmId)) return; // 同一農園の重複買収を防止
    const farm = farms.find((f) => f.id === farmId);
    if (!farm) return;

    const price = calculateFarmAcquisitionPrice(farm);
    if (state.cash < price) return;

    const ownedFarm: OwnedFarm = {
      id: `owned-${farmId}-${state.turn}`,
      farmId,
      purchasePrice: price,
      purchasedAtTurn: state.turn,
      lastHarvestFailed: false,
    };

    set({
      state: { ...state, cash: state.cash - price, ownedFarms: [...state.ownedFarms, ownedFarm] },
    });
  },

  // 複数の生豆ロットを指定kgずつ配合して焙煎し、「オリジナルブランド豆」として1バッチにまとめる。
  roastBlend: (roasteryId, inputs, roastLevel, blendName) => {
    const { state } = get();
    const roastery = state.roasteries.find((r) => r.id === roasteryId);
    if (!roastery || inputs.length === 0) return;

    const totalKg = inputs.reduce((sum, input) => sum + input.kg, 0);
    if (totalKg <= 0 || totalKg > roastery.capacityKgPerMonth) return;

    const lots = inputs.map((input) => ({
      input,
      lot: state.greenBeanInventory.find((l) => l.id === input.lotId),
    }));
    if (lots.some(({ lot, input }) => !lot || lot.kg < input.kg)) return; // 在庫不足のロットがあれば中止

    const { outputKg, qualityScore, costPerKg } = calculateRoastOutput(
      lots.map(({ lot, input }) => ({ qGrade: lot!.qGrade, kg: input.kg, pricePerKg: lot!.pricePerKg })),
      roastLevel
    );

    const batch: RoastBatch = {
      id: `batch-blend-${roasteryId}-${state.turn}-${Math.floor(Math.random() * 10000)}`,
      roasteryId,
      roastLevel,
      blend: lots.map(({ lot, input }) => ({ greenBeanLotId: lot!.id, ratio: input.kg / totalKg })),
      blendName,
      outputKg,
      qualityScore,
      costPerKg,
      roastedAtTurn: state.turn,
    };

    const consumedKgByLotId = new Map(inputs.map((input) => [input.lotId, input.kg]));
    const greenBeanInventory = state.greenBeanInventory
      .map((lot) => {
        const consumedKg = consumedKgByLotId.get(lot.id);
        return consumedKg ? { ...lot, kg: lot.kg - consumedKg } : lot;
      })
      .filter((lot) => lot.kg > 0);

    set({
      state: {
        ...state,
        greenBeanInventory,
        roastedInventory: [...state.roastedInventory, batch],
      },
    });
  },
});
