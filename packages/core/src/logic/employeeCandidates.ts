import type { Employee, EmployeeRole, ExecutiveTitle } from '../types/employee.js';

const NAME_POOL = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Sam', 'Jamie', 'Drew', 'Avery'];

const BASE_SALARY_BY_ROLE: Record<EmployeeRole, number> = {
  barista: 1800,
  storeManager: 3000,
  executive: 8000,
};

/**
 * 採用候補者をランダム生成する。skillLevelが高いほどsalaryPerMonthも高くなる
 * (0.8〜1.4倍のレンジ)よう連動させ、闇雲に強いだけの候補が出ないようにする。
 */
export function generateEmployeeCandidates(
  role: EmployeeRole,
  count: number,
  currentTurn: number,
  rng: () => number = Math.random,
  executiveTitle?: ExecutiveTitle
): Employee[] {
  const candidates: Employee[] = [];

  for (let i = 0; i < count; i++) {
    const skillLevel = Math.round(30 + rng() * 60); // 30-90
    const salaryMultiplier = 0.8 + (skillLevel / 100) * 0.6; // 0.8-1.4
    const salaryPerMonth = Math.round(BASE_SALARY_BY_ROLE[role] * salaryMultiplier);
    const motivation = Math.round(50 + rng() * 40); // 50-90
    const name = NAME_POOL[Math.min(NAME_POOL.length - 1, Math.floor(rng() * NAME_POOL.length))];

    candidates.push({
      id: `candidate-${role}-${executiveTitle ?? 'none'}-t${currentTurn}-${i}`,
      name,
      role,
      executiveTitle: role === 'executive' ? executiveTitle : undefined,
      skillLevel,
      salaryPerMonth,
      motivation,
      hiredAtTurn: currentTurn,
    });
  }

  return candidates;
}
