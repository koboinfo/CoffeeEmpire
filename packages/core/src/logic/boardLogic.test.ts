import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_CONFIDENCE_MAX,
  BOARD_CONFIDENCE_MIN,
  BOARD_DISMISSAL_THRESHOLD,
  applyBoardConfidenceDelta,
  calculateBoardConfidenceDelta,
  shouldDismissBoard,
} from './boardLogic.js';

test('calculateBoardConfidenceDelta: 黒字・配当あり・株価上昇なら正のデルタになる', () => {
  const delta = calculateBoardConfidenceDelta({
    pretaxIncome: 1_000_000,
    dividendPerSharePerTurn: 5,
    previousSharePrice: 500,
    currentSharePrice: 550,
  });
  assert.ok(delta > 0);
});

test('calculateBoardConfidenceDelta: 赤字・無配・株価下落なら負のデルタになる', () => {
  const delta = calculateBoardConfidenceDelta({
    pretaxIncome: -1_000_000,
    dividendPerSharePerTurn: 0,
    previousSharePrice: 500,
    currentSharePrice: 400,
  });
  assert.ok(delta < 0);
});

test('calculateBoardConfidenceDelta: previousSharePriceが0(未上場からの遷移直後等)なら株価要因を無視する', () => {
  const delta = calculateBoardConfidenceDelta({
    pretaxIncome: 100,
    dividendPerSharePerTurn: 0,
    previousSharePrice: 0,
    currentSharePrice: 500,
  });
  // 黒字(+3)+無配(-1) = +2、株価要因は加算されない
  assert.equal(delta, 2);
});

test('applyBoardConfidenceDelta: 0-100の範囲にクランプされる', () => {
  assert.equal(applyBoardConfidenceDelta(2, -10), BOARD_CONFIDENCE_MIN);
  assert.equal(applyBoardConfidenceDelta(98, 10), BOARD_CONFIDENCE_MAX);
});

test('shouldDismissBoard: 閾値以下なら解任、閾値超なら解任されない', () => {
  assert.equal(shouldDismissBoard(BOARD_DISMISSAL_THRESHOLD), true);
  assert.equal(shouldDismissBoard(BOARD_DISMISSAL_THRESHOLD + 1), false);
  assert.equal(shouldDismissBoard(0), true);
});

test('信任スコアは赤字が続くと閾値まで下がりきる(累積シミュレーション)', () => {
  let confidence = 100;
  for (let i = 0; i < 30; i++) {
    const delta = calculateBoardConfidenceDelta({
      pretaxIncome: -1,
      dividendPerSharePerTurn: 0,
      previousSharePrice: 500,
      currentSharePrice: 480, // 継続的な株価下落
    });
    confidence = applyBoardConfidenceDelta(confidence, delta);
  }
  assert.equal(shouldDismissBoard(confidence), true);
});
