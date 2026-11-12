/**
 * Coffee Inc 2 Teardownレポート §2-1(需要=Huffモデルによる按分)の実装。
 *
 * 既存のcalculateStoreRevenue(financials.ts、進行中の別セッションが編集中)は店舗単位で
 * 売上係数を積算する方式であり、競合店の存在が需要の奪い合いにならない
 * (=市場シェアの概念が成立しない)。このモジュールは、それを置き換える候補として
 * 「都市の総需要プールを、各店舗の引力スコアで按分する」方式を独立実装したもの。
 * financials.ts/turnEngine.tsへの統合(既存ロジックの置き換え)は未着手で、
 * 次回セッションでの統合を前提にしている。
 */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 立地の人流の寄与(レポート§2-1)。8,000未満を強く罰する非線形カーブ。
 * t=6000 → 0.49、t=8000 → 1.0、t=12000 → 1.5。
 */
export function trafficWeight(footTraffic: number): number {
  const t = Math.max(0, footTraffic);
  if (t < 8000) return Math.pow(t / 8000, 2.5);
  return 1.0 + (t - 8000) / 8000;
}

/**
 * 価格弾力性による寄与。絶対価格ではなく「参照価格からの乖離率」で評価する。
 * elasticityは1.2(高所得都市・価格非弾力的)〜2.2(価格敏感)を想定。
 * r=1.0(参照価格通り) → 1.00、r=1.2(2割高い) → elasticity=1.6なら0.74。
 */
export function priceFactorElastic(price: number, referencePrice: number, elasticity = 1.6): number {
  if (referencePrice <= 0) return 1;
  const r = Math.max(price, 0) / referencePrice;
  if (r <= 0) return 2.0;
  return clamp(Math.pow(r, -elasticity), 0.15, 2.0);
}

/**
 * 品質の飽和カーブ。指数0.7により、品質へ投資し続けても需要は青天井にならない
 * (レポート§6-1「品質の逓減」がスノーボール抑制機構の1つとして機能する)。
 * q=30 → 0.95、q=60 → 1.17、q=100 → 1.45。
 */
export function qualityFactorSaturating(quality: number): number {
  const q = clamp(quality, 0, 100);
  return 0.55 + 0.9 * Math.pow(q / 100, 0.7);
}

/** ブランド: 認知度(新規来店の確率)とロイヤルティ(再来店の確率)をそれぞれ独立に加点する。 */
export function brandFactor(awareness: number, loyalty: number): number {
  return 1.0 + 0.6 * clamp(awareness, 0, 1) + 0.5 * clamp(loyalty, 0, 1);
}

/** 内外装。投資額に対して逓減させ、序盤の過剰投資を報わせすぎない設計。 */
export function ambianceFactor(interiorTier: number, maxTier: number): number {
  if (maxTier <= 0) return 1;
  return 1.0 + 0.3 * Math.pow(clamp(interiorTier, 0, maxTier) / maxTier, 0.8);
}

export interface AttractionFactors {
  footTraffic: number;
  price: number;
  referencePrice: number;
  quality: number; // 0-100
  awareness: number; // 0-1
  loyalty: number; // 0-1
  interiorTier: number;
  maxInteriorTier: number;
  priceElasticity?: number;
}

/** 各係数を掛け合わせた、店舗の「選ばれやすさ」の合成スコア。 */
export function calculateAttractionScore(factors: AttractionFactors): number {
  return (
    trafficWeight(factors.footTraffic) *
    priceFactorElastic(factors.price, factors.referencePrice, factors.priceElasticity) *
    qualityFactorSaturating(factors.quality) *
    brandFactor(factors.awareness, factors.loyalty) *
    ambianceFactor(factors.interiorTier, factors.maxInteriorTier)
  );
}

export interface DemandAllocationInput {
  storeId: string;
  attraction: number;
}

export interface DemandAllocationResult {
  storeId: string;
  customers: number;
}

/**
 * 都市の需要プールを、Huffモデル(引力スコアの比率)で各店舗へ按分する。
 * 競合が同一都市に増えるほど分母(Σattraction)が増え、自社の取り分が自動的に減る。
 * これにより「競合密度」を独立のペナルティ変数として別途持つ必要が無くなる(レポート§2-1)。
 */
export function allocateCityDemand(
  cityDemandPool: number,
  stores: readonly DemandAllocationInput[]
): DemandAllocationResult[] {
  const totalAttraction = stores.reduce((sum, s) => sum + Math.max(0, s.attraction), 0);
  if (totalAttraction <= 0 || cityDemandPool <= 0) {
    return stores.map((s) => ({ storeId: s.storeId, customers: 0 }));
  }
  return stores.map((s) => ({
    storeId: s.storeId,
    customers: Math.round((cityDemandPool * Math.max(0, s.attraction)) / totalAttraction),
  }));
}
