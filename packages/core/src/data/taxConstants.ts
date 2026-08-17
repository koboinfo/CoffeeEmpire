import type { TaxRule } from '../types/finance.js';

/**
 * 実際の日本の税制(2020年代の制度)に概ね準拠した既定値。個人事業税は業種によって
 * 税率・控除額が異なるが、本アプリは飲食業(第一種事業・税率5%)を想定して固定する。
 */
export const defaultTaxRule: TaxRule = {
  corporateTaxRate: 0.3,
  corporateTaxRateLow: 0.15,
  corporateTaxRateHigh: 0.232,
  corporateTaxLowRateThreshold: 8_000_000,
  corporateInhabitantTaxMinimumPerYear: 70_000,
  employerSocialInsuranceRate: 0.15,
  personalIncomeTaxBrackets: [
    { upTo: 1_950_000, rate: 0.05 },
    { upTo: 3_300_000, rate: 0.1 },
    { upTo: 6_950_000, rate: 0.2 },
    { upTo: 9_000_000, rate: 0.23 },
    { upTo: 18_000_000, rate: 0.33 },
    { upTo: 40_000_000, rate: 0.4 },
    { upTo: Infinity, rate: 0.45 },
  ],
  residentTaxRate: 0.1,
  businessTaxRate: 0.05,
  businessTaxDeduction: 2_900_000,
  consumptionTaxRate: 0.1,
  consumptionTaxRevenueThreshold: 10_000_000,
};
