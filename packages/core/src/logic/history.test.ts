import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capHistory } from './history.js';

test('capHistory: maxLength以下ならそのまま返す', () => {
  const items = [1, 2, 3];
  assert.deepEqual(capHistory(items, 5), items);
});

test('capHistory: maxLengthちょうどならそのまま返す', () => {
  const items = [1, 2, 3];
  assert.deepEqual(capHistory(items, 3), items);
});

test('capHistory: maxLengthを超えたら先頭(古い要素)から切り詰める', () => {
  const items = [1, 2, 3, 4, 5];
  assert.deepEqual(capHistory(items, 3), [3, 4, 5]);
});

test('capHistory: maxLength=0なら空配列', () => {
  assert.deepEqual(capHistory([1, 2, 3], 0), []);
});
