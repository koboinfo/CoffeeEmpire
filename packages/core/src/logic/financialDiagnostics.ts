import type { ExpenseBreakdown, ExpenseCategory } from './financials.js';

/**
 * ExpenseCategory['key']のうち、対売上比率での経営診断対象になるもの('other'は
 * 税金・臨時収支の受け皿でありベンチマークになじまないため対象外)。
 */
export type DiagnosticCostKey = Exclude<ExpenseCategory['key'], 'other'>;

export interface CostRatioBenchmark {
  key: DiagnosticCostKey;
  label: string;
  idealMaxRatio: number; // 対売上比率の上限(これを超えると経営を圧迫していると判定する)
}

/**
 * 一般的な独立系カフェ経営の目安値。厳密な業界統計ではなく、プレイヤーへの
 * 改善アドバイスの閾値として機能すればよいという前提のゲームバランス値。
 */
export const COST_RATIO_BENCHMARKS: CostRatioBenchmark[] = [
  { key: 'cogs', label: '原価率', idealMaxRatio: 0.35 },
  { key: 'labor', label: '人件費率', idealMaxRatio: 0.33 },
  { key: 'rent', label: '賃料負担率', idealMaxRatio: 0.15 },
  { key: 'utilities', label: '水道光熱費率', idealMaxRatio: 0.06 },
];

export interface CostRatioResult {
  key: DiagnosticCostKey;
  label: string;
  amount: number;
  ratio: number; // amount / revenue (revenue<=0のときは0)
  idealMaxRatio: number;
  overBy: number; // ratio - idealMaxRatio。正の値がベンチマーク超過幅
  isOverBenchmark: boolean;
}

/** 月次決算画面が診断ロジックに渡すPLの要約。categorizeExpenses()の出力とrevenue/netIncomeをまとめたもの。 */
export interface MonthlyPLSummary {
  turn: number;
  revenue: number;
  expenses: ExpenseBreakdown;
  netIncome: number;
}

/** diagnoseFinancialsが参照するゲーム状態。CoffeeEmpireStateを直接渡せるよう構造的に互換な最小形にしている。 */
export interface FinancialDiagnosticsGameState {
  stores: { id: string }[];
}

export type FinancialInsightSeverity = 'critical' | 'warning' | 'info';

export interface FinancialInsight {
  severity: FinancialInsightSeverity;
  key: DiagnosticCostKey | 'netLoss' | 'healthy';
  title: string;
  message: string;
  actionLabel: string;
  actionTarget: 'stores' | 'staff' | 'menu' | 'properties' | null;
}

export interface FinancialDiagnosis {
  turn: number;
  isDeficit: boolean;
  netIncome: number;
  costRatios: CostRatioResult[];
  /** 現在の最大の課題。insights[0]と同一(何も問題がなければ'healthy'インサイトが入る)。 */
  primaryIssue: FinancialInsight;
  /** 深刻度の高い順に並んだ全指摘。 */
  insights: FinancialInsight[];
}

function amountByKey(expenses: ExpenseBreakdown, key: DiagnosticCostKey): number {
  return expenses.categories.find((category) => category.key === key)?.amount ?? 0;
}

export function calculateCostRatios(revenue: number, expenses: ExpenseBreakdown): CostRatioResult[] {
  return COST_RATIO_BENCHMARKS.map((benchmark) => {
    const amount = amountByKey(expenses, benchmark.key);
    const ratio = revenue > 0 ? amount / revenue : 0;
    const overBy = ratio - benchmark.idealMaxRatio;
    return {
      key: benchmark.key,
      label: benchmark.label,
      amount,
      ratio,
      idealMaxRatio: benchmark.idealMaxRatio,
      overBy,
      isOverBenchmark: overBy > 0,
    };
  });
}

const CRITICAL_OVER_THRESHOLD = 0.1; // ベンチマークを10ポイント(対売上比率)以上超過していたら'critical'

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

const COST_INSIGHT_COPY: Record<
  DiagnosticCostKey,
  { title: string; buildMessage: (ratio: CostRatioResult) => string; actionLabel: string; actionTarget: FinancialInsight['actionTarget'] }
> = {
  labor: {
    title: '人件費が売上を圧迫しています',
    buildMessage: (r) =>
      `人件費が売上の${formatPercent(r.ratio)}を占めており高騰しています(目安${formatPercent(r.idealMaxRatio)}以内)。シフトの削減または価格改定を検討してください。`,
    actionLabel: 'スタッフ管理画面で人件費を見直す',
    actionTarget: 'staff',
  },
  rent: {
    title: '賃料負担が重くなっています',
    buildMessage: (r) =>
      `賃料が売上の${formatPercent(r.ratio)}を占めており負担が重くなっています(目安${formatPercent(r.idealMaxRatio)}以内)。不採算店舗の閉店・移転を検討してください。`,
    actionLabel: '店舗一覧で不採算店舗を確認する',
    actionTarget: 'stores',
  },
  utilities: {
    title: '水道光熱費が膨らんでいます',
    buildMessage: (r) =>
      `水道光熱費が売上の${formatPercent(r.ratio)}を占めています(目安${formatPercent(r.idealMaxRatio)}以内)。営業時間や稼働設備数を見直してください。`,
    actionLabel: '店舗の営業時間・設備を見直す',
    actionTarget: 'stores',
  },
  cogs: {
    title: '原価率が高騰しています',
    buildMessage: (r) =>
      `原価が売上の${formatPercent(r.ratio)}を占めており高騰しています(目安${formatPercent(r.idealMaxRatio)}以内)。仕入れ先の見直しまたはメニュー価格の改定を検討してください。`,
    actionLabel: 'メニュー価格・仕入れを見直す',
    actionTarget: 'menu',
  },
};

function buildCostInsight(ratio: CostRatioResult): FinancialInsight {
  const copy = COST_INSIGHT_COPY[ratio.key];
  return {
    severity: ratio.overBy >= CRITICAL_OVER_THRESHOLD ? 'critical' : 'warning',
    key: ratio.key,
    title: copy.title,
    message: copy.buildMessage(ratio),
    actionLabel: copy.actionLabel,
    actionTarget: copy.actionTarget,
  };
}

function buildNetLossInsight(netIncome: number, storeCount: number): FinancialInsight {
  const scope = storeCount > 1 ? `全${storeCount}店舗合計で` : '';
  return {
    severity: 'critical',
    key: 'netLoss',
    title: '個別のコストは目安内ですが赤字です',
    message: `${scope}コスト構成比自体は目安の範囲内ですが、売上に対して固定費全体が重く赤字(純損益${Math.round(netIncome).toLocaleString('ja-JP')}円)になっています。集客・マーケティングによる客数増加を検討してください。`,
    actionLabel: 'マーケティング施策を検討する',
    actionTarget: 'stores',
  };
}

function buildHealthyInsight(): FinancialInsight {
  return {
    severity: 'info',
    key: 'healthy',
    title: '経営は健全です',
    message: '主要コストはいずれも目安の比率内に収まっており、黒字を維持しています。現在の運営方針を継続してください。',
    actionLabel: '財務諸表を確認する',
    actionTarget: null,
  };
}

/**
 * 月次決算のPLから赤字・減益の原因を診断し、改善アドバイスを構造化して返す。
 * ベンチマーク超過幅(overBy)が最大のコスト要因を最優先の課題として提示する。
 * どのコストもベンチマーク内なのに赤字の場合は「固定費全体が重い」という診断にフォールバックし、
 * 黒字かつ全コストが目安内なら健全である旨のインサイトを返す(UIが常に1件はハイライトできるようにするため)。
 */
export function diagnoseFinancials(gameState: FinancialDiagnosticsGameState, monthlyPL: MonthlyPLSummary): FinancialDiagnosis {
  const costRatios = calculateCostRatios(monthlyPL.revenue, monthlyPL.expenses);
  const isDeficit = monthlyPL.netIncome < 0;

  const insights = costRatios
    .filter((ratio) => ratio.isOverBenchmark)
    .sort((a, b) => b.overBy - a.overBy)
    .map(buildCostInsight);

  if (insights.length === 0) {
    insights.push(isDeficit ? buildNetLossInsight(monthlyPL.netIncome, gameState.stores.length) : buildHealthyInsight());
  }

  return {
    turn: monthlyPL.turn,
    isDeficit,
    netIncome: monthlyPL.netIncome,
    costRatios,
    primaryIssue: insights[0],
    insights,
  };
}
