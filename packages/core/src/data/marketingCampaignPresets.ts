import type { MarketingCampaign } from '../types/corporate.js';

export interface MarketingCampaignPreset {
  type: MarketingCampaign['type'];
  label: string;
  budget: number;
  durationTurns: number;
  awarenessEffect: number;
  /** 稼働中、対象店舗のentryRateIndexに効く倍率ボーナス(例: 0.2 = +20%)。未設定は0扱い。 */
  entryRateBonus?: number;
  /** 稼働中、対象店舗のsatisfactionFactorに効く倍率ボーナス(リピート率)。未設定は0扱い。 */
  repeatRateBonus?: number;
}

export const marketingCampaignPresets: MarketingCampaignPreset[] = [
  { type: 'localAd', label: '地域広告', budget: 80_000, durationTurns: 3, awarenessEffect: 5 },
  { type: 'digitalAd', label: 'デジタル広告', budget: 200_000, durationTurns: 3, awarenessEffect: 10 },
  { type: 'brandSponsorship', label: 'ブランドスポンサー', budget: 600_000, durationTurns: 6, awarenessEffect: 20 },
  // SNSは実店舗の運用コスト感を反映して他施策より大幅に安いが、バズりが収まるのも早い(短期間)。
  // 新規客の呼び込み(入店率)に直接効く点が既存の認知度施策と違う。
  { type: 'snsMarketing', label: 'SNSマーケティング', budget: 40_000, durationTurns: 2, awarenessEffect: 4, entryRateBonus: 0.2 },
  // 一般的なロイヤルティ/ポイントプログラムの再来店率アップ効果(10〜20%程度)を参考にrepeatRateBonusを設定。
  { type: 'loyaltyProgram', label: 'ロイヤルティ施策', budget: 120_000, durationTurns: 12, awarenessEffect: 8, repeatRateBonus: 0.15 },
];
