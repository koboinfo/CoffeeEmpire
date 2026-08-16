import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateEmployeeCandidates } from './employeeCandidates.js';

test('generateEmployeeCandidates: 指定件数を生成しIDが重複しない', () => {
  const candidates = generateEmployeeCandidates('barista', 3, 0, () => 0.5);
  assert.equal(candidates.length, 3);
  assert.equal(new Set(candidates.map((c) => c.id)).size, 3);
});

test('generateEmployeeCandidates: skillLevel/motivationは想定範囲内', () => {
  const candidates = generateEmployeeCandidates('storeManager', 5, 0, () => Math.random());
  for (const candidate of candidates) {
    assert.ok(candidate.skillLevel >= 30 && candidate.skillLevel <= 90);
    assert.ok(candidate.motivation >= 50 && candidate.motivation <= 90);
    assert.equal(candidate.role, 'storeManager');
  }
});

test('generateEmployeeCandidates: skillLevelが高いほど給与も高くなる', () => {
  const lowSkill = generateEmployeeCandidates('barista', 1, 0, () => 0)[0]; // skillLevel=30
  const highSkill = generateEmployeeCandidates('barista', 1, 0, () => 1)[0]; // skillLevel=90(名前選択のrngにも1が使われるが給与ロジックには影響しない)
  assert.ok(highSkill.salaryPerMonth > lowSkill.salaryPerMonth);
});

test('generateEmployeeCandidates: roleによって基準給与が異なる(storeManager > barista)', () => {
  const barista = generateEmployeeCandidates('barista', 1, 0, () => 0.5)[0];
  const manager = generateEmployeeCandidates('storeManager', 1, 0, () => 0.5)[0];
  assert.ok(manager.salaryPerMonth > barista.salaryPerMonth);
});

test('generateEmployeeCandidates: executiveTitleを指定するとexecutive候補に設定される', () => {
  const candidates = generateEmployeeCandidates('executive', 2, 0, () => 0.5, 'CFO');
  for (const candidate of candidates) {
    assert.equal(candidate.executiveTitle, 'CFO');
  }
});

test('generateEmployeeCandidates: executive以外にはexecutiveTitleを設定しない', () => {
  const candidates = generateEmployeeCandidates('barista', 1, 0, () => 0.5, 'CFO');
  assert.equal(candidates[0].executiveTitle, undefined);
});
