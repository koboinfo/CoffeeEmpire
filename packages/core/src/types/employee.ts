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
}
