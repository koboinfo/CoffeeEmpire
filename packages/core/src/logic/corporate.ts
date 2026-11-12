import type { HeadquartersOffice, CompetitorBrand, DepartmentType, StockListing } from '../types/corporate.js';
import type { Property, City } from '../types/store.js';
import type { CoffeeEmpireState } from '../types/simState.js';
import type { MarketingCampaignPreset } from '../data/marketingCampaignPresets.js';
import { generateEmployeeCandidates } from './employeeCandidates.js';
import { bumpCityBrandAwareness } from './branding.js';

/**
 * 本社を1段階拡張する。sizeTierを+1、rentPerMonthを30%増加させる。
 */
export function upgradeHeadquarters(headquarters: HeadquartersOffice): HeadquartersOffice {
  return {
    ...headquarters,
    sizeTier: headquarters.sizeTier + 1,
    rentPerMonth: Math.round(headquarters.rentPerMonth * 1.3),
  };
}

/**
 * 部門フロアの拡張コスト。現在レベル(未設置なら0)が高いほど次のレベルアップが高くつく。
 */
export function calculateDepartmentUpgradeCost(currentLevel: number): number {
  return 400_000 * (currentLevel + 1);
}

/**
 * 部門フロアを1段階拡張する(未設置ならlevel1で新設)。
 */
export function upgradeDepartment(headquarters: HeadquartersOffice, department: DepartmentType): HeadquartersOffice {
  const currentLevel = headquarters.departments[department]?.level ?? 0;
  return {
    ...headquarters,
    departments: {
      ...headquarters.departments,
      [department]: { level: currentLevel + 1 },
    },
  };
}

/**
 * M&A買収額を算定する。valuationにプレミアム(交渉コスト・のれん代)を上乗せする。
 */
export function calculateAcquisitionPrice(competitor: CompetitorBrand, premiumRate = 0.2): number {
  return Math.round(competitor.valuation * (1 + premiumRate));
}

const ACQUISITION_AWARENESS_BONUS_PER_STORE = 5; // 買収先の店舗1店につき当該都市の認知度+5(clamp 0-100)
const ACQUISITION_CASH_BONUS_PER_STORE = 300_000; // 吸収した既存顧客基盤を即時収益化する一時金(店舗1店あたり)

export interface AcquisitionIntegrationResult {
  brandAwarenessByCity: Record<string, number>;
  absorbedStoreCount: number;
  cashBonus: number;
}

/**
 * M&A実行後の統合処理(店舗統合およびブランド価値の吸収)。買収した競合ブランドの
 * storesByCity(都市ごとの出店数)を、新規のStore実体を作らずに「都市別ブランド認知度への
 * 一括加点」+「吸収した店舗数に応じた一時金」として自社へ反映する(既知の簡略化: 買収先の
 * 店舗をStoreとして個別運営することはしない。既存の"post-hoc乗数/見積もり"スタイルに合わせた設計)。
 * 呼び出し側(mobile financeSlice.acquireCompetitor)がcashBonusをcashへ加算し、
 * brandAwarenessByCityをstateへ反映する。
 */
export function integrateAcquisition(
  brandAwarenessByCity: Record<string, number> | undefined,
  competitor: CompetitorBrand
): AcquisitionIntegrationResult {
  let nextAwareness = brandAwarenessByCity ?? {};
  let absorbedStoreCount = 0;

  for (const [cityId, count] of Object.entries(competitor.storesByCity)) {
    if (count <= 0) continue;
    absorbedStoreCount += count;
    nextAwareness = bumpCityBrandAwareness(nextAwareness, cityId, count * ACQUISITION_AWARENESS_BONUS_PER_STORE);
  }

  return {
    brandAwarenessByCity: nextAwareness,
    absorbedStoreCount,
    cashBonus: absorbedStoreCount * ACQUISITION_CASH_BONUS_PER_STORE,
  };
}

export interface RealEstateInvestmentEvaluation {
  purchasePrice: number;
  monthlyRentalIncome: number;
}

/**
 * 不動産投資の購入額・月次賃料収入を見積もる。
 * purchasePriceは月額賃料相場の96ヶ月分(8年分)を目安に算定し、
 * 賃貸収入(monthlyRentalIncome)は諸経費控除後として賃料相場の70%とする。
 */
export function evaluateRealEstateInvestment(property: Property, rng: () => number = Math.random): RealEstateInvestmentEvaluation {
  const variance = 0.9 + rng() * 0.2; // 0.9-1.1
  const purchasePrice = Math.round(property.rentPerMonth * 96 * variance);
  const monthlyRentalIncome = Math.round(property.rentPerMonth * 0.7 * variance);
  return { purchasePrice, monthlyRentalIncome };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * CFO自動価格調整: 都市所得水準・品質から適正価格を算出し、現在価格からの乖離を
 * 半分だけ埋める(急激な値付け変更を避けるための緩和)。
 */
export function autoAdjustPrice(currentPrice: number, qualityScore: number, incomeLevel: number): number {
  const referencePrice = Math.max(1, incomeLevel) * 200;
  const targetPrice = referencePrice * (0.5 + qualityScore / 200); // 0.5-1.0倍
  const adjusted = currentPrice + (targetPrice - currentPrice) * 0.5;
  return Math.round(adjusted);
}

/**
 * 自社の市場シェア(0-1)。valuationの単位が異なる自社/競合を同一軸で比較するための簡易近似で、
 * 精緻な市場シミュレーションではなく「経営規模が大きいほどシェアが伸びる」体験を優先する。
 */
export function calculateMarketShareRatio(ownValuation: number, competitorValuations: number[]): number {
  const total = ownValuation + competitorValuations.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;
  return clamp(ownValuation / total, 0, 1);
}

// 独占禁止規制: 1都市内でのシェアがこれを超えることを許さない(超えそうな新規出店をブロックする)。
export const ANTITRUST_MARKET_SHARE_CAP = 0.8;
// 都市の店舗総数(自社+競合)がこれ未満の場合は規制の対象外とする。新規参入初期の
// 「競合がまだ1店も無い都市の1店舗目」がシェア100%として即ブロックされる理不尽を避けるため
// (=独占禁止規制は「市場」と呼べる規模になって初めて意味を持つ)。
const ANTITRUST_MIN_CITY_STORES = 5;

/**
 * 1都市内での自社シェア(0-1)。playerStoreCount/(playerStoreCount+competitorStoreCount)。
 * calculateMarketShareRatio(全社valuationベースの近似)とは別軸で、都市単位の店舗数で見る。
 */
export function calculatePlayerCityShareRatio(playerStoreCount: number, competitorStoreCount: number): number {
  const total = playerStoreCount + competitorStoreCount;
  if (total <= 0) return 0;
  return clamp(playerStoreCount / total, 0, 1);
}

/**
 * この都市に自社店舗を1店追加した場合、独占禁止規制の上限(80%)を超えるかどうかを判定する。
 * 出店確定前のガード(NewStoreScreen等)で使う想定。
 */
export function wouldExceedAntitrustCap(playerStoreCount: number, competitorStoreCount: number): boolean {
  const totalAfterNewStore = playerStoreCount + competitorStoreCount + 1;
  if (totalAfterNewStore < ANTITRUST_MIN_CITY_STORES) return false;
  const shareAfterNewStore = (playerStoreCount + 1) / totalAfterNewStore;
  return shareAfterNewStore > ANTITRUST_MARKET_SHARE_CAP;
}

export interface StockPriceInputs {
  revenue: number;
  netIncome: number;
}

/**
 * 動的株価。直近ターンの利益率(-50%〜+50%にクランプ)と市場シェアから成長率を算出し、
 * 前回株価に乗算する。正確な金融モデルではなく「経営判断が株価に跳ね返る」体験を優先した単純モデル。
 */
export function calculateDynamicStockPrice(
  previousSharePrice: number,
  incomeStatement: StockPriceInputs,
  marketShareRatio: number
): number {
  const profitMargin = incomeStatement.revenue > 0 ? incomeStatement.netIncome / incomeStatement.revenue : 0;
  const clampedMargin = clamp(profitMargin, -0.5, 0.5);
  const clampedShare = clamp(marketShareRatio, 0, 1);
  const growthRate = clampedMargin * 0.15 + clampedShare * 0.05;
  const nextPrice = previousSharePrice * (1 + growthRate);
  return Math.max(1, Math.round(nextPrice * 100) / 100);
}

export interface AutomationContext {
  properties: Record<string, Property>;
  cities: Record<string, City>;
}

const AUTO_HIRE_CASH_BUFFER_MONTHS = 6;
const AUTO_MARKETING_CASH_BUFFER_MONTHS = 6;

/**
 * 役員への権限委譲(CFO=自動価格調整/COO=自動採用/CMO=自動宣伝)を1ターン分適用する。
 * 該当フラグがONでも対応する役職の役員が未雇用なら何もしない。
 * advanceTurn冒頭で(収益計算より前に)呼び出すことで、当ターンの損益に効果が反映される。
 */
export function applyExecutiveAutomation(
  state: CoffeeEmpireState,
  context: AutomationContext,
  marketingPresets: MarketingCampaignPreset[],
  rng: () => number = Math.random
): CoffeeEmpireState {
  const hasExecutive = (title: string) =>
    state.employees.some((employee) => employee.role === 'executive' && employee.executiveTitle === title);

  let stores = state.stores;
  let employees = state.employees;
  let activeCampaigns = state.activeCampaigns;

  if (state.executiveAutomation.autoPricing && hasExecutive('CFO')) {
    stores = stores.map((store) => {
      const property = context.properties[store.propertyId];
      const city = property ? context.cities[property.cityId] : undefined;
      if (!city) return store;
      return {
        ...store,
        menu: store.menu.map((item) => ({
          ...item,
          currentPrice: autoAdjustPrice(item.currentPrice, item.qualityScore, city.incomeLevel),
        })),
      };
    });
  }

  if (state.executiveAutomation.autoHiring && hasExecutive('COO')) {
    const cashBuffer = (candidateSalary: number) => state.cash > candidateSalary * AUTO_HIRE_CASH_BUFFER_MONTHS;
    // Phase A追加: 部門予算上限(未設定なら従来通り無制限、cashバッファ判定のみで採用可否を決める)。
    const hiringBudget = state.executiveAutomation.departmentBudgets?.hiringMonthlyBudget;
    let hiringSpent = 0;
    const newHires: typeof employees = [];

    stores = stores.map((store) => {
      if (store.employeeIds.length > 0) return store;
      const [candidate] = generateEmployeeCandidates('barista', 1, state.turn, rng);
      if (!candidate || !cashBuffer(candidate.salaryPerMonth)) return store;
      if (hiringBudget !== undefined && hiringSpent + candidate.salaryPerMonth > hiringBudget) return store;

      const hired = { ...candidate, assignedStoreId: store.id };
      newHires.push(hired);
      hiringSpent += candidate.salaryPerMonth;
      return { ...store, employeeIds: [...store.employeeIds, hired.id] };
    });

    if (newHires.length > 0) {
      employees = [...employees, ...newHires];
    }
  }

  if (state.executiveAutomation.autoMarketing && hasExecutive('CMO') && activeCampaigns.length === 0) {
    // Phase A追加: 部門予算上限が設定されていれば、その上限以下のプリセットの中で最安を選ぶ
    // (未設定なら従来通り全プリセットから最安を選ぶ=後方互換)。
    const marketingBudget = state.executiveAutomation.departmentBudgets?.marketingMonthlyBudget;
    const eligiblePresets =
      marketingBudget !== undefined
        ? marketingPresets.filter((preset) => preset.budget <= marketingBudget)
        : marketingPresets;
    const cheapestPreset = eligiblePresets.reduce<MarketingCampaignPreset | undefined>(
      (cheapest, preset) => (!cheapest || preset.budget < cheapest.budget ? preset : cheapest),
      undefined
    );
    if (cheapestPreset && state.cash > cheapestPreset.budget * AUTO_MARKETING_CASH_BUFFER_MONTHS) {
      activeCampaigns = [
        ...activeCampaigns,
        {
          id: `campaign-auto-${cheapestPreset.type}-${state.turn}`,
          type: cheapestPreset.type,
          budget: cheapestPreset.budget,
          durationTurns: cheapestPreset.durationTurns,
          awarenessEffect: cheapestPreset.awarenessEffect,
          startedAtTurn: state.turn,
          ...(cheapestPreset.entryRateBonus !== undefined ? { entryRateBonus: cheapestPreset.entryRateBonus } : {}),
          ...(cheapestPreset.repeatRateBonus !== undefined ? { repeatRateBonus: cheapestPreset.repeatRateBonus } : {}),
        },
      ];
    }
  }

  return { ...state, stores, employees, activeCampaigns };
}

export interface OwnershipComposition {
  founderShares: number;
  institutionalShares: number;
  retailPublicShares: number;
  founderPercent: number;
  institutionalPercent: number;
  retailPublicPercent: number;
}

/**
 * 株主構成(創業者/機関投資家/個人投資家)の内訳。founderSharesは
 * totalShares - publicFloatSharesの差分として暗黙的に扱う(既存のStockListing設計を踏襲、
 * 新規フィールドを追加しない)。institutionalFloatSharesは未設定なら0(全て個人投資家保有)扱い。
 */
export function calculateOwnershipComposition(stock: StockListing): OwnershipComposition {
  const totalShares = Math.max(0, stock.totalShares);
  const publicFloatShares = clamp(stock.publicFloatShares, 0, totalShares);
  const institutionalShares = clamp(stock.institutionalFloatShares ?? 0, 0, publicFloatShares);
  const retailPublicShares = publicFloatShares - institutionalShares;
  const founderShares = totalShares - publicFloatShares;

  const percentOf = (shares: number) => (totalShares > 0 ? Math.round((shares / totalShares) * 1000) / 10 : 0);

  return {
    founderShares,
    institutionalShares,
    retailPublicShares,
    founderPercent: percentOf(founderShares),
    institutionalPercent: percentOf(institutionalShares),
    retailPublicPercent: percentOf(retailPublicShares),
  };
}
