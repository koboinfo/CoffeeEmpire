import type { MarketingCampaign } from '../types/corporate.js';

export interface MarketingCampaignPreset {
  type: MarketingCampaign['type'];
  label: string;
  budget: number;
  durationTurns: number;
  awarenessEffect: number;
}

export const marketingCampaignPresets: MarketingCampaignPreset[] = [
  { type: 'localAd', label: '地域広告', budget: 2000, durationTurns: 3, awarenessEffect: 5 },
  { type: 'digitalAd', label: 'デジタル広告', budget: 5000, durationTurns: 3, awarenessEffect: 10 },
  { type: 'brandSponsorship', label: 'ブランドスポンサー', budget: 15000, durationTurns: 6, awarenessEffect: 20 },
  { type: 'loyaltyProgram', label: 'ロイヤルティ施策', budget: 3000, durationTurns: 12, awarenessEffect: 8 },
];
