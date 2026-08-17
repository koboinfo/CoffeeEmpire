import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultTaxRule } from '../data/taxConstants.js';
import {
  calculatePersonalIncomeTax,
  calculateResidentTax,
  calculateBusinessTax,
  calculateCorporateTax,
  calculateCorporateInhabitantTaxMinimum,
  calculateEmployerSocialInsurance,
  isConsumptionTaxable,
  calculateAnnualSettlement,
} from './taxes.js';

test('calculatePersonalIncomeTax: 課税所得0円なら税額0円', () => {
  assert.equal(calculatePersonalIncomeTax(0, defaultTaxRule), 0);
});

test('calculatePersonalIncomeTax: 最初のブラケット(195万円以下)は5%で計算される', () => {
  assert.equal(calculatePersonalIncomeTax(1_000_000, defaultTaxRule), 50_000);
});

test('calculatePersonalIncomeTax: 複数ブラケットにまたがる場合は各ブラケットの税率で積み上げ計算される', () => {
  // 195万円まで5% + 残り105万円(330万円まで)を10%
  const taxableIncome = 3_000_000;
  const expected = Math.round(1_950_000 * 0.05 + (3_000_000 - 1_950_000) * 0.1);
  assert.equal(calculatePersonalIncomeTax(taxableIncome, defaultTaxRule), expected);
});

test('calculatePersonalIncomeTax: マイナスの課税所得は0円として扱う', () => {
  assert.equal(calculatePersonalIncomeTax(-500_000, defaultTaxRule), 0);
});

test('calculateResidentTax: フラット税率10%で計算される', () => {
  assert.equal(calculateResidentTax(1_000_000, defaultTaxRule), 100_000);
});

test('calculateBusinessTax: 事業主控除290万円以下は非課税', () => {
  assert.equal(calculateBusinessTax(2_000_000, defaultTaxRule), 0);
});

test('calculateBusinessTax: 事業主控除を超えた分にのみ課税される', () => {
  assert.equal(calculateBusinessTax(5_000_000, defaultTaxRule), Math.round((5_000_000 - 2_900_000) * 0.05));
});

test('calculateCorporateTax: 800万円以下は軽減税率15%のみ', () => {
  assert.equal(calculateCorporateTax(5_000_000, defaultTaxRule), Math.round(5_000_000 * 0.15));
});

test('calculateCorporateTax: 800万円超過分は23.2%が上乗せされる', () => {
  const income = 10_000_000;
  const expected = Math.round(8_000_000 * 0.15 + 2_000_000 * 0.232);
  assert.equal(calculateCorporateTax(income, defaultTaxRule), expected);
});

test('calculateCorporateTax: 赤字なら0円', () => {
  assert.equal(calculateCorporateTax(-1_000_000, defaultTaxRule), 0);
});

test('calculateCorporateInhabitantTaxMinimum: 常に定額(taxRule.corporateInhabitantTaxMinimumPerYear)を返す', () => {
  assert.equal(calculateCorporateInhabitantTaxMinimum(defaultTaxRule), 70_000);
});

test('calculateEmployerSocialInsurance: 給与総額×事業主負担率で計算される', () => {
  assert.equal(calculateEmployerSocialInsurance(1_000_000, defaultTaxRule), 150_000);
});

test('isConsumptionTaxable: 基準を超えた売上高で課税事業者判定になる', () => {
  assert.equal(isConsumptionTaxable(9_000_000, defaultTaxRule), false);
  assert.equal(isConsumptionTaxable(11_000_000, defaultTaxRule), true);
});

test('calculateAnnualSettlement: 個人事業主は所得税+住民税+事業税の内訳になる', () => {
  const result = calculateAnnualSettlement({
    turn: 12,
    entityType: 'soleProprietorship',
    accumulatedPretaxIncome: 5_000_000,
    trailing12MonthRevenue: 5_000_000,
    taxRule: defaultTaxRule,
  });
  assert.ok('incomeTax' in result.breakdown);
  assert.ok('residentTax' in result.breakdown);
  assert.ok('businessTax' in result.breakdown);
  assert.ok(!('corporateTax' in result.breakdown));
  assert.equal(
    result.totalTaxDue,
    result.breakdown.incomeTax + result.breakdown.residentTax + result.breakdown.businessTax
  );
});

test('calculateAnnualSettlement: 法人は法人税+均等割の内訳になり、赤字でも均等割は発生する', () => {
  const result = calculateAnnualSettlement({
    turn: 12,
    entityType: 'corporation',
    accumulatedPretaxIncome: -3_000_000,
    trailing12MonthRevenue: 5_000_000,
    taxRule: defaultTaxRule,
  });
  assert.equal(result.breakdown.corporateTax, 0);
  assert.equal(result.breakdown.corporateInhabitantTaxMinimum, 70_000);
  assert.equal(result.totalTaxDue, 70_000);
});

test('calculateAnnualSettlement: isConsumptionTaxableは基準期間の売上高から判定される', () => {
  const result = calculateAnnualSettlement({
    turn: 12,
    entityType: 'corporation',
    accumulatedPretaxIncome: 1_000_000,
    trailing12MonthRevenue: 15_000_000,
    taxRule: defaultTaxRule,
  });
  assert.equal(result.isConsumptionTaxable, true);
});
