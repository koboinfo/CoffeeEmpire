import type { StateCreator } from 'zustand';
import {
  calculateAcquisitionPrice,
  createLoan,
  integrateAcquisition,
  investInStartup as createStartupInvestment,
  type Acquisition,
  type City,
  type CompetitorBrand,
  type FranchiseContract,
  type Property,
  type RealEstateInvestment,
  type Startup,
} from '@coffee-empire/core';
import type { GameStore } from '../gameStore';

interface RealEstateEvaluation {
  purchasePrice: number;
  monthlyRentalIncome: number;
}

interface FranchiseEvaluation {
  royaltyRate: number;
  monthlyGrossRevenueEstimate: number;
}

// IPO時の浮動株のうち機関投資家が引き受ける割合の目安(実際のIPOでの機関投資家配分の一般的な傾向を簡易反映)。
const DEFAULT_INSTITUTIONAL_RATIO = 0.6;

export interface FinanceSlice {
  executeIPO: (sharePrice: number, totalShares: number, publicFloatShares: number, institutionalRatio?: number) => void;
  setDividendPerShare: (value: number) => void;
  acquireCompetitor: (competitorId: string) => void;
  investInRealEstate: (property: Property, evaluation: RealEstateEvaluation) => void;
  sellRealEstate: (investmentId: string) => void;
  investInStartup: (startup: Startup, amount: number) => void;
  takeLoan: (principal: number, annualInterestRate: number, termTurns: number) => void;
  buyBackShares: (shareCount: number) => void;
  /** 上場後の追加株式発行(公募増資)。既存株主の持株比率が希薄化する代わりに資金調達できる。Phase B追加。 */
  issueAdditionalShares: (shareCount: number, sharePrice: number, institutionalRatio?: number) => void;
  /** フランチャイズ契約を新規に結ぶ(自社運営店舗のStoreとは別エンティティ)。Phase D追加。 */
  openFranchise: (city: City, evaluation: FranchiseEvaluation) => void;
}

export const createFinanceSlice: StateCreator<GameStore, [], [], FinanceSlice> = (set, get) => ({
  executeIPO: (sharePrice, totalShares, publicFloatShares, institutionalRatio = DEFAULT_INSTITUTIONAL_RATIO) => {
    const { state } = get();
    if (state.stock.isPublic) return;

    set({
      state: {
        ...state,
        stock: {
          isPublic: true,
          ipoTurn: state.turn,
          sharePrice,
          totalShares,
          publicFloatShares,
          dividendPerSharePerTurn: 0,
          institutionalFloatShares: Math.round(publicFloatShares * institutionalRatio),
        },
      },
      // IPO調達額はcashへ即時反映せず、次回advance()時にcapitalInjectionとして計上する(BS整合性のため)
      pendingCapitalInjection: sharePrice * publicFloatShares,
    });
  },

  setDividendPerShare: (value) => {
    const { state } = get();
    if (!state.stock.isPublic) return;
    set({ state: { ...state, stock: { ...state.stock, dividendPerSharePerTurn: Math.max(0, value) } } });
  },

  // M&A実行: 買収額をcashから引き競合を除外するだけでなく、integrateAcquisition経由で
  // 買収先の店舗網を都市別ブランド認知度への加点+一時金として吸収する(店舗統合およびブランド価値の吸収)。
  acquireCompetitor: (competitorId) => {
    const { state } = get();
    const competitor = state.competitorBrands.find((c: CompetitorBrand) => c.id === competitorId);
    if (!competitor) return;

    const price = calculateAcquisitionPrice(competitor);
    if (state.cash < price) return;

    const integration = integrateAcquisition(state.brandAwarenessByCity, competitor);

    const acquisition: Acquisition = {
      id: `acq-${competitor.id}-${state.turn}`,
      targetBrandId: competitor.id,
      price,
      acquiredAtTurn: state.turn,
      absorbedStoreCount: integration.absorbedStoreCount,
      integrationCashBonus: integration.cashBonus,
    };

    set({
      state: {
        ...state,
        cash: state.cash - price + integration.cashBonus,
        competitorBrands: state.competitorBrands.filter((c: CompetitorBrand) => c.id !== competitorId),
        acquisitions: [...state.acquisitions, acquisition],
        brandAwarenessByCity: integration.brandAwarenessByCity,
      },
    });
  },

  investInRealEstate: (property, evaluation) => {
    const { state } = get();
    if (state.cash < evaluation.purchasePrice) return;

    const investment: RealEstateInvestment = {
      id: `re-${property.id}-${state.turn}`,
      propertyId: property.id,
      purchasePrice: evaluation.purchasePrice,
      monthlyRentalIncome: evaluation.monthlyRentalIncome,
      purchasedAtTurn: state.turn,
      landValue: evaluation.purchasePrice, // 初期値は購入額(以後advanceTurnの年次更新で変動する)
    };

    set({
      state: {
        ...state,
        cash: state.cash - evaluation.purchasePrice,
        ownedRealEstate: [...state.ownedRealEstate, investment],
      },
    });
  },

  // VC投資: 出資1件を実行する。イグジット(exited)時の払戻・破綻(failed)時の全損判定は
  // advanceTurn(turnEngine.ts、四半期ごと)側で自動処理されるため、ここでは出資の記録のみ行う。
  investInStartup: (startup, amount) => {
    const { state } = get();
    if (state.cash < amount || amount <= 0) return;

    const investment = createStartupInvestment(startup, amount, state.turn);

    set({
      state: {
        ...state,
        cash: state.cash - amount,
        vcPortfolio: [...(state.vcPortfolio ?? []), investment],
      },
    });
  },

  // 不動産投資の売却: 売却損益は損益計算書に反映しない既知の簡略化。
  // 地価(landValue、年次更新される)から取引コスト10%を差し引いた額を即座にcashへ加算する
  // (地価が購入時より上がっていればキャピタルゲインとして反映される)。
  sellRealEstate: (investmentId) => {
    const { state } = get();
    const investment = state.ownedRealEstate.find((entry) => entry.id === investmentId);
    if (!investment) return;

    // 売却額は地価(landValue、年次更新される)ベース。未設定(旧セーブ)ならpurchasePriceにフォールバックする。
    // 取引コスト分として10%を差し引く点はこれまでと同じ。
    const refund = Math.round((investment.landValue ?? investment.purchasePrice) * 0.9);
    set({
      state: {
        ...state,
        cash: state.cash + refund,
        ownedRealEstate: state.ownedRealEstate.filter((entry) => entry.id !== investmentId),
      },
    });
  },

  // 銀行融資: 元本を即座にcashへ加算し、毎ターンの元利返済はadvanceTurn(serviceLoans)側で処理する。
  takeLoan: (principal, annualInterestRate, termTurns) => {
    const { state } = get();
    if (principal <= 0 || termTurns <= 0) return;

    const loan = createLoan(
      `loan-${state.turn}-${Math.floor(Math.random() * 100000)}`,
      principal,
      annualInterestRate,
      termTurns,
      state.turn
    );

    set({ state: { ...state, cash: state.cash + principal, loans: [...state.loans, loan] } });
  },

  // 公募増資: 新株を発行して資金調達する代わりに既存株主の持株比率が希薄化する(dilution)。
  // IPOと同様、調達額は即座にcashへ加算せず次回advance()でcapitalInjectionとして計上する。
  issueAdditionalShares: (shareCount, sharePrice, institutionalRatio = DEFAULT_INSTITUTIONAL_RATIO) => {
    const { state, pendingCapitalInjection } = get();
    if (!state.stock.isPublic || shareCount <= 0 || sharePrice <= 0) return;

    const newInstitutionalShares = Math.round(shareCount * institutionalRatio);
    set({
      state: {
        ...state,
        stock: {
          ...state.stock,
          totalShares: state.stock.totalShares + shareCount,
          publicFloatShares: state.stock.publicFloatShares + shareCount,
          institutionalFloatShares: (state.stock.institutionalFloatShares ?? 0) + newInstitutionalShares,
        },
      },
      pendingCapitalInjection: pendingCapitalInjection + sharePrice * shareCount,
    });
  },

  // フランチャイズ契約を新規に結ぶ。自社出店(openStore)とは別に、都市単位のロイヤリティ収益権のみを
  // 得る軽量なエンティティを追加する(Employee/Equipment等は持たない。franchiseLogic.ts参照)。
  openFranchise: (city, evaluation) => {
    const { state } = get();
    const contract: FranchiseContract = {
      id: `fc-${city.id}-${state.turn}-${Math.floor(Math.random() * 100000)}`,
      cityId: city.id,
      royaltyRate: evaluation.royaltyRate,
      monthlyGrossRevenueEstimate: evaluation.monthlyGrossRevenueEstimate,
      openedAtTurn: state.turn,
    };

    set({
      state: {
        ...state,
        franchiseContracts: [...(state.franchiseContracts ?? []), contract],
      },
    });
  },

  // 自社株買い: 発行済株式数・浮動株数を減らしcashを消費する。
  // paidInCapital等のBS項目への反映は行わない(既知の簡略化)。
  buyBackShares: (shareCount) => {
    const { state } = get();
    if (!state.stock.isPublic || shareCount <= 0 || shareCount > state.stock.publicFloatShares) return;
    const cost = shareCount * state.stock.sharePrice;
    if (state.cash < cost) return;

    set({
      state: {
        ...state,
        cash: state.cash - cost,
        stock: {
          ...state.stock,
          totalShares: state.stock.totalShares - shareCount,
          publicFloatShares: state.stock.publicFloatShares - shareCount,
        },
      },
    });
  },
});
