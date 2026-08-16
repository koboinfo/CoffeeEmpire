import type { ResearchNodeDefinition } from '../types/research.js';

/**
 * 3ブランチ(app/eco/machine)×2ティアのR&Dツリー。tier2はtier1が前提(prerequisiteId)。
 * app: モバイルオーダー&自社アプリ(売上バフ中心)
 * eco: エコ対応パッケージ・サプライチェーン(原価低減中心)
 * machine: 新型エスプレッソマシン・AIバリスタ(品質向上→売上バフとして近似)
 */
export const researchTree: ResearchNodeDefinition[] = [
  {
    id: 'mobileOrderingApp',
    label: 'モバイルオーダーアプリ',
    description: '事前注文・キャッシュレス決済に対応した自社アプリを開発する。全店舗の売上高に+5%のバフがかかる。',
    cost: 30_000,
    branch: 'app',
    tier: 1,
    effects: { revenueMultiplier: 1.05 },
  },
  {
    id: 'appRecommendation',
    label: 'AIおすすめ機能',
    description: '購買履歴に基づくレコメンド機能をアプリに追加し、客単価を底上げする。全店舗売上にさらに+10%。',
    cost: 80_000,
    branch: 'app',
    tier: 2,
    prerequisiteId: 'mobileOrderingApp',
    effects: { revenueMultiplier: 1.1 },
  },
  {
    id: 'ecoPackaging',
    label: 'エコ対応パッケージ',
    description: '生分解性カップ・包装材へ切り替える。廃棄コスト削減により全店舗の原価-3%。',
    cost: 20_000,
    branch: 'eco',
    tier: 1,
    effects: { costMultiplier: 0.97 },
  },
  {
    id: 'ecoSupplyChain',
    label: 'サプライチェーン最適化',
    description: '物流・在庫管理をデジタル化し無駄を削減する。原価にさらに-5%。',
    cost: 60_000,
    branch: 'eco',
    tier: 2,
    prerequisiteId: 'ecoPackaging',
    effects: { costMultiplier: 0.95 },
  },
  {
    id: 'nextGenEspressoMachine',
    label: '新型エスプレッソマシン開発',
    description: '抽出精度・提供速度を向上させる新型マシンを開発する。品質向上により全店舗売上+6%。',
    cost: 40_000,
    branch: 'machine',
    tier: 1,
    effects: { revenueMultiplier: 1.06 },
  },
  {
    id: 'baristaAiAssist',
    label: 'AIバリスタアシスト',
    description: 'マシンにAI抽出アシスト機能を統合し、品質のばらつきを抑える。売上にさらに+8%。',
    cost: 100_000,
    branch: 'machine',
    tier: 2,
    prerequisiteId: 'nextGenEspressoMachine',
    effects: { revenueMultiplier: 1.08 },
  },
];
