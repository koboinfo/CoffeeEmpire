/**
 * 都市ごとの実勢家賃(円/坪/月)。カフェが実際に出店する「一般的な良い立地」の相場に合わせて較正した値。
 *
 * 算出方法: Cushman & Wakefield「Main Streets Across the World 2025」等が公表する各都市トップクラスの
 * 商業ストリート賃料(高級ブランド旗艦店向けの世界最高値。例: 東京・銀座下限で坪25万円/月)を都市間の
 * 相対比としてそのまま採用し、東京の実勢カフェ賃料相場(坪1.5〜2万円/月、業界で一般的に言われる水準)を
 * 基準点として一律係数(×0.072)でスケールダウンした。「フラッグシップ通りの絶対額」ではなく
 * 「フラッグシップ通り同士の相対比」を実データとして信頼し、絶対水準だけ現実的なカフェ立地に合わせている。
 *
 * 出典(2025年時点、直接の小売データがある都市):
 * - Tokyo: Cushman & Wakefield Japan Retail MarketBeat Q4 2025(銀座 下限¥250,000/坪/月)
 * - New York: C&W Main Streets(Upper Fifth Ave $21,520/㎡/年)
 * - London: C&W Main Streets(New Bond St $2,231/sqft/年、世界1位)
 * - Seoul: C&W Main Streets(明洞 $653,000/1000sqft/年)
 * - Singapore: C&W(Orchard Road $431/sqft/年。2023年データのため他都市よりやや古い)
 * - Shanghai: C&W Main Streets(南京東路 $517,000/1000sqft/年)
 * - São Paulo: C&W Main Streets(Rua Oscar Freire $120/㎡/月)
 * - Sydney: C&W Main Streets(Pitt Street Mall $8,552/㎡/年)
 * - Nairobi: Knight Frank East Africa Retail Market Update H2 2025(プライム区画 $20-28/㎡/月の中央値。
 *   フラッグシップ通り単体の統計ではないため上記スケールダウン係数は適用せず、そのままの水準を採用)
 * - Jakarta: Colliers Jakarta Quarterly Q3 2025(モール平均賃料 IDR 570,000/㎡/月。Nairobiと同様、
 *   フラッグシップ通り単体ではなく市場平均のため軽い調整のみ)
 *
 * 精度が低い(直接の小売データが見つからず、オフィス賃料相場から推定した)都市:
 * - Mexico City: JLLオフィス賃料($24.4/㎡/月)に小売の一般的なプレミアム倍率を掛けた推定値
 * - Addis Ababa: Bole地区オフィス賃料相場($14-25/㎡/月)を小売の代理指標として採用した推定値
 */
export const RENT_PER_TSUBO_JPY: Record<string, number> = {
  'city-tokyo': 18_000,
  'city-newyork': 64_000,
  'city-london': 71_400,
  'city-seoul': 20_900,
  'city-singapore': 13_800,
  'city-shanghai': 16_600,
  'city-saopaulo': 4_300,
  'city-mexicocity': 11_900,
  'city-addisababa': 5_800,
  'city-nairobi': 7_100,
  'city-jakarta': 10_700,
  'city-sydney': 16_600,
};
