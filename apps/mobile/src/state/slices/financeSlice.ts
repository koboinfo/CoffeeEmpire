import type { StateCreator } from 'zustand';
import {
  calculateAcquisitionPrice,
  createLoan,
  type Acquisition,
  type CompetitorBrand,
  type Property,
  type RealEstateInvestment,
} from '@coffee-empire/core';
import type { GameStore } from '../gameStore';

interface RealEstateEvaluation {
  purchasePrice: number;
  monthlyRentalIncome: number;
}

// IPO時の浮動株のうち機関投資家が引き受ける割合の目安(実際のIPOでの機関投資家配分の一般的な傾向を簡易反映)。
const DEFAULT_INSTITUTIONAL_RATIO = 0.6;

export interface FinanceSlice {
  executeIPO: (sharePrice: number, totalShares: number, publicFloatShares: number, institutionalRatio?: number) => void;
  setDividendPerShare: (value: number) => void;
  acquireCompetitor: (competitorId: string) => void;
  investInRealEstate: (property: Property, evaluation: RealEstateEvaluation) => void;
  takeLoan: (principal: number, annualInterestRate: number, termTurns: number) => void;
  buyBackShares: (shareCount: number) => void;
  /** 上場後の追加株式発行(公募増資)。既存株主の持株比率が希薄化する代わりに資金調達できる。Phase B追加。 */
  issueAdditionalShares: (shareCount: number, sharePrice: number, institutionalRatio?: number) => void;
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

  acquireCompetitor: (competitorId) => {
    const { state } = get();
    const competitor = state.competitorBrands.find((c: CompetitorBrand) => c.id === competitorId);
    if (!competitor) return;

    const price = calculateAcquisitionPrice(competitor);
    if (state.cash < price) return;

    const acquisition: Acquisition = {
      id: `acq-${competitor.id}-${state.turn}`,
      targetBrandId: competitor.id,
      price,
      acquiredAtTurn: state.turn,
    };

    set({
      state: {
        ...state,
        cash: state.cash - price,
        competitorBrands: state.competitorBrands.filter((c: CompetitorBrand) => c.id !== competitorId),
        acquisitions: [...state.acquisitions, acquisition],
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
    };

    set({
      state: {
        ...state,
        cash: state.cash - evaluation.purchasePrice,
        ownedRealEstate: [...state.ownedRealEstate, investment],
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
