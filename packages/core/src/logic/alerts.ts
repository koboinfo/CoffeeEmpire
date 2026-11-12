/**
 * Coffee Inc 2 Teardownレポート §5-2(Management by Exception)の実装。
 * 店舗数が増えた終盤でも破綻しないUIのための土台として、「閾値を割った項目だけを
 * アラートとして返す」純粋関数を用意する。実際の画面配線(通知フィード・バッジ表示)は
 * apps/mobile側の対応screenが進行中の別セッションでロックされているため未着手。
 */

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  severity: AlertSeverity;
  code: string;
  message: string;
}

export interface StoreAlertInput {
  storeId: string;
  storeName: string;
  utilization?: number; // customers/capacity。稼働率
  morale?: number; // 0-100
  weeksOfInventoryRemaining?: number;
  cityMarketShareRatio?: number; // 0-1
}

const UTILIZATION_WARNING_THRESHOLD = 0.9;
const MORALE_WARNING_THRESHOLD = 40;
const INVENTORY_WARNING_WEEKS = 2;
const MARKET_SHARE_WARNING_RATIO = 0.75;

/**
 * 店舗1件分のWarningアラートを評価する(レポート§5-2の表のWarning行)。
 * Criticalは全社レベル(現金・TOB等)の判定であり店舗単位では発生しない前提のため、
 * このモジュールではwarning/infoのみを扱う。
 */
export function evaluateStoreAlerts(input: StoreAlertInput): Alert[] {
  const alerts: Alert[] = [];

  if (input.utilization !== undefined && input.utilization > UTILIZATION_WARNING_THRESHOLD) {
    alerts.push({
      severity: 'warning',
      code: 'high-utilization',
      message: `${input.storeName}: 稼働率が${Math.round(input.utilization * 100)}%に達しています`,
    });
  }
  if (input.morale !== undefined && input.morale < MORALE_WARNING_THRESHOLD) {
    alerts.push({
      severity: 'warning',
      code: 'low-morale',
      message: `${input.storeName}: 従業員の士気が${Math.round(input.morale)}まで低下しています`,
    });
  }
  if (
    input.weeksOfInventoryRemaining !== undefined &&
    input.weeksOfInventoryRemaining < INVENTORY_WARNING_WEEKS
  ) {
    alerts.push({
      severity: 'warning',
      code: 'low-inventory',
      message: `${input.storeName}: 在庫が${input.weeksOfInventoryRemaining.toFixed(1)}週分を切っています`,
    });
  }
  if (
    input.cityMarketShareRatio !== undefined &&
    input.cityMarketShareRatio > MARKET_SHARE_WARNING_RATIO
  ) {
    alerts.push({
      severity: 'warning',
      code: 'high-market-share',
      message: `${input.storeName}: 都市シェアが${Math.round(input.cityMarketShareRatio * 100)}%です(独占禁止規制の上限80%に接近)`,
    });
  }

  return alerts;
}

export interface CompanyAlertInput {
  cash: number;
  monthlyFixedCosts: number;
  isTobPending?: boolean;
  turnsUntilBankruptcy?: number;
}

const CASH_CRITICAL_WEEKS_OF_FIXED_COSTS = 4;

/**
 * 全社レベルのCriticalアラート(レポート§5-2表のCritical行)。
 * 「現金が固定費の4週間分を割った」等、店舗数に依存しない比率ベースの閾値で判定する。
 */
export function evaluateCompanyAlerts(input: CompanyAlertInput): Alert[] {
  const alerts: Alert[] = [];

  if (input.monthlyFixedCosts > 0) {
    const monthsOfRunway = input.cash / input.monthlyFixedCosts;
    const weeksOfRunway = monthsOfRunway * 4;
    if (weeksOfRunway < CASH_CRITICAL_WEEKS_OF_FIXED_COSTS) {
      alerts.push({
        severity: 'critical',
        code: 'cash-runway-critical',
        message: `現金残高が固定費の${weeksOfRunway.toFixed(1)}週間分しかありません`,
      });
    }
  }
  if (input.isTobPending) {
    alerts.push({ severity: 'critical', code: 'tob-pending', message: '敵対的買収(TOB)が予告されています' });
  }
  if (input.turnsUntilBankruptcy !== undefined && input.turnsUntilBankruptcy <= 1) {
    alerts.push({ severity: 'critical', code: 'bankruptcy-imminent', message: '破産まで残りわずかです' });
  }

  return alerts;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };

/** critical→warning→infoの順に並べ替える。UI側でそのままリスト表示できるようにする。 */
export function sortAlertsBySeverity(alerts: readonly Alert[]): Alert[] {
  return [...alerts].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
