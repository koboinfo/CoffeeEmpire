export type EmployeeRole = 'barista' | 'storeManager' | 'executive';
export type ExecutiveTitle = 'CMO' | 'CFO' | 'COO' | 'CTO';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  executiveTitle?: ExecutiveTitle; // roleがexecutiveの場合のみ
  skillLevel: number; // 0-100
  salaryPerMonth: number;
  motivation: number; // 0-100、離職・生産性に影響
  hiredAtTurn: number;
  assignedStoreId?: string; // バリスタ/店長のみ
  /**
   * ストックオプション/RSU相当の株式報酬(月額換算、円)。Phase A追加のadditiveフィールド。
   * 主に役員(executive)への権限委譲・リテンション施策として付与する想定だが、型上は誰でも設定可能。
   * 未設定(旧セーブ含む)は0として扱う(calculateEquityCompensationExpense参照)。
   */
  equityCompensationPerMonth?: number;
}
