function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 取締役会/株主総会機構。ARCHITECTURE.mdの既知の簡略化と同じ方針: 精緻な株主投票シミュレーションは
 * 行わず、「黒字/赤字」「配当有無」「株価トレンド」の3シグナルを毎ターン加減点し、
 * 信任スコア(0-100)が閾値を下回った状態が続くと解任される、という単純なモデルにする。
 *
 * 適用範囲: 取締役会・株主総会は制度上「上場企業」の概念であり、本アプリのEntityType
 * (個人事業主/株式会社/HD)は非上場でも取り得るステージのため、entityTypeではなく
 * state.stock.isPublic(上場中)を適用条件とする(未上場中はスコアが変化しない=解任リスクも無い)。
 */
export const BOARD_CONFIDENCE_DEFAULT = 100;
export const BOARD_CONFIDENCE_MIN = 0;
export const BOARD_CONFIDENCE_MAX = 100;
export const BOARD_DISMISSAL_THRESHOLD = 15; // これ以下が続くと解任

export interface BoardConfidenceInputs {
  pretaxIncome: number; // 当ターンの税引前利益(赤字ならマイナス)
  dividendPerSharePerTurn: number; // 配当の有無(1株あたり、0なら無配)
  previousSharePrice: number;
  currentSharePrice: number;
}

/**
 * 1ターン分の信任スコア変動量。黒字/配当/株価上昇は加点、赤字/無配/株価下落は減点する
 * (減点の方を大きくし、赤字が続くと着実に悪化していく設計)。
 */
export function calculateBoardConfidenceDelta(inputs: BoardConfidenceInputs): number {
  let delta = 0;
  delta += inputs.pretaxIncome > 0 ? 3 : -5;
  delta += inputs.dividendPerSharePerTurn > 0 ? 2 : -1;

  if (inputs.previousSharePrice > 0) {
    const priceChangeRatio = (inputs.currentSharePrice - inputs.previousSharePrice) / inputs.previousSharePrice;
    delta += clamp(priceChangeRatio * 20, -5, 5);
  }

  return delta;
}

export function applyBoardConfidenceDelta(current: number, delta: number): number {
  return clamp(current + delta, BOARD_CONFIDENCE_MIN, BOARD_CONFIDENCE_MAX);
}

/** 信任スコアが閾値以下まで下がりきったら解任(以後の回復では復帰しない。isBankruptと同じ方式)。 */
export function shouldDismissBoard(confidence: number): boolean {
  return confidence <= BOARD_DISMISSAL_THRESHOLD;
}
