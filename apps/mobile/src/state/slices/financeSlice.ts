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

export interface FinanceSlice {
  executeIPO: (sharePrice: number, totalShares: number, publicFloatShares: number) => void;
  setDividendPerShare: (value: number) => void;
  acquireCompetitor: (competitorId: string) => void;
  investInRealEstate: (property: Property, evaluation: RealEstateEvaluation) => void;
  takeLoan: (principal: number, annualInterestRate: number, termTurns: number) => void;
  buyBackShares: (shareCount: number) => void;
}

export const createFinanceSlice: StateCreator<GameStore, [], [], FinanceSlice> = (set, get) => ({
  executeIPO: (sharePrice, totalShares, publicFloatShares) => {
    const { state } = get();
    if (state.stock.isPublic) return;

    set({
      state: {
        ...state,
        stock: { isPublic: true, ipoTurn: state.turn, sharePrice, totalShares, publicFloatShares, dividendPerSharePerTurn: 0 },
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
