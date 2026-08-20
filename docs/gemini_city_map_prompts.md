# Coffee Empire — Gemini向け 都市マップ画像プロンプト集

`CityMapScreen`(および`MapScreen`の都市カード)で使う12都市分の背景画像を、Gemini(Nano Banana等の画像生成)で作るためのプロンプト集。
Midjourney向けの`docs/image_prompts.md`とは別に、Geminiでそのままコピー&ペーストして使える**自然文形式**(`--ar`や`--v`のようなパラメータ記法を使わない)でまとめてある。

配色は2026年8月に刷新したアプリの新テーマ(白基調 + スカイブルー + オレンジ + イエロー、`apps/mobile/src/theme/theme.ts`)に合わせてある。構図・ランドマーク要素は`docs/image_prompts.md`§2の旧プロンプトを踏襲しつつ、トーンだけ明るく描き直した。

---

## 1. 使い方

1. Geminiのプロンプト欄に、下記「共通スタイル文」+ 各都市のプロンプトを**そのまま1つのテキストとして**貼り付ける(共通スタイル文は本文の末尾に既に組み込んである。改めて足す必要はない)。
2. GeminiにはMidjourneyのような`--ar 4:3`等のフラグは無いので、アスペクト比は文章内の指示(`in a wide 4:3 landscape composition`)で伝える。UIで縦横比を選べる場合は「横長(4:3程度)」を選ぶ。
3. ネガティブ指定(除外したい要素)もフラグではなく文章に埋め込んである(`avoid ...`の箇所)。
4. 1都市ずつ生成し、まず**Tokyo**を先に確定させてから残り11都市を生成すると、トーンが揃いやすい(Geminiに参照画像を渡せる場合は、確定したTokyo画像を追加で添付し「この画像と同じ画風で」と一言添えると精度が上がる)。
5. 生成した画像は書き出し規約(`docs/image_prompts.md`§1-5と同じ)に従う: WebP形式・q80・長辺1200px、ファイル名は`city-<都市名>.webp`。
6. 保存先は `apps/mobile/src/assets/images/cities/<cityId>.webp`(例: `apps/mobile/src/assets/images/cities/city-tokyo.webp`)。配置後は`apps/mobile/src/assets/images/registry.ts`の`CITY_IMAGES`にある該当行のコメントアウトを解除して有効化する。
7. 受け入れ基準(採用前に必ず確認): `docs/image_prompts.md`§8を参照。配色は「ベースが白〜淡いスカイブルー、アクセントがオレンジまたはイエロー」であることを確認し、暗く沈んだトーンになっていたら再生成する。

---

## 2. 共通スタイル文(全プロンプトの末尾に既に付与済み)

```
Rendered as a bright, cheerful editorial game-art illustration: a clean white
and soft sky-blue color world (like a sunny, high-key mobile game), with vivid
warm-orange and sunny yellow-gold accents placed as focal highlights. High
contrast and high readability even at small size, crisp saturated color
grading, clean vector-adjacent shapes with a little grain for texture, soft
directional daylight, no dark or moody shadows. Absolutely no text, no
letters, no watermark, no logos, no UI overlay, no people's faces in
close-up. Do not copy any real brand, real landmark's exact identifiable
form, or existing game's artwork — keep it an original stylized impression.
Wide 4:3 landscape composition, with the top 30% and bottom 25% of the frame
kept visually quiet (soft sky / soft ground) so a title and status icons can
be overlaid later, and the main landmark weighted toward the center band.
```

---

## 3. 都市別プロンプト(12都市)

### city-tokyo — Tokyo, Japan

```
An aerial three-quarter view of a bright, tidy Japanese metropolis on a clear
sunny day: layered low-rise white and pale-blue building blocks under a
network of elevated rail lines, a single tall communication tower painted in
vivid orange standing at the center of the skyline, small yellow-gold signage
glints scattered through the streets below, a soft sky-blue sky above.
Rendered as a bright, cheerful editorial game-art illustration: a clean white
and soft sky-blue color world (like a sunny, high-key mobile game), with vivid
warm-orange and sunny yellow-gold accents placed as focal highlights. High
contrast and high readability even at small size, crisp saturated color
grading, clean vector-adjacent shapes with a little grain for texture, soft
directional daylight, no dark or moody shadows. Absolutely no text, no
letters, no watermark, no logos, no UI overlay, no people's faces in
close-up. Do not copy any real brand, real landmark's exact identifiable
form, or existing game's artwork — keep it an original stylized impression.
Wide 4:3 landscape composition, with the top 30% and bottom 25% of the frame
kept visually quiet (soft sky / soft ground) so a title and status icons can
be overlaid later, and the main landmark weighted toward the center band.
```

### city-newyork — New York, USA

```
An aerial three-quarter view of a bright, tightly-gridded city of Art Deco
skyscrapers under a fresh blue morning sky, sunlight glinting off white and
pale stone facades, a long avenue running diagonally through the frame like a
sunlit canyon, one stepped-back tower crowned in a warm orange glow at its
spire, small yellow-gold window highlights scattered across the towers.
Rendered as a bright, cheerful editorial game-art illustration: a clean white
and soft sky-blue color world (like a sunny, high-key mobile game), with vivid
warm-orange and sunny yellow-gold accents placed as focal highlights. High
contrast and high readability even at small size, crisp saturated color
grading, clean vector-adjacent shapes with a little grain for texture, soft
directional daylight, no dark or moody shadows. Absolutely no text, no
letters, no watermark, no logos, no UI overlay, no people's faces in
close-up. Do not copy any real brand, real landmark's exact identifiable
form, or existing game's artwork — keep it an original stylized impression.
Wide 4:3 landscape composition, with the top 30% and bottom 25% of the frame
kept visually quiet (soft sky / soft ground) so a title and status icons can
be overlaid later, and the main landmark weighted toward the center band.
```

### city-london — London, UK

```
An aerial three-quarter view of a low, tidy brick city under a bright pastel
sky, a wide sky-blue river gently bending through the frame, a pale stone
clock tower and a soft-white domed building standing in the mid-ground,
sunlit wet pavement giving a fresh just-rained sparkle, small orange and
yellow accent lights on a row of little shopfronts along the riverbank.
Rendered as a bright, cheerful editorial game-art illustration: a clean white
and soft sky-blue color world (like a sunny, high-key mobile game), with vivid
warm-orange and sunny yellow-gold accents placed as focal highlights. High
contrast and high readability even at small size, crisp saturated color
grading, clean vector-adjacent shapes with a little grain for texture, soft
directional daylight, no dark or moody shadows. Absolutely no text, no
letters, no watermark, no logos, no UI overlay, no people's faces in
close-up. Do not copy any real brand, real landmark's exact identifiable
form, or existing game's artwork — keep it an original stylized impression.
Wide 4:3 landscape composition, with the top 30% and bottom 25% of the frame
kept visually quiet (soft sky / soft ground) so a title and status icons can
be overlaid later, and the main landmark weighted toward the center band.
```

### city-seoul — Seoul, South Korea

```
An aerial three-quarter view of a bright modern Asian capital split by a wide
sky-blue river, even rows of pale apartment towers catching clean morning
sun, a forested granite mountain ridge glowing soft green behind the skyline,
slender bridges traced in warm orange light crossing the river, a few golden
sunlit accents on rooftop signage. Rendered as a bright, cheerful editorial
game-art illustration: a clean white and soft sky-blue color world (like a
sunny, high-key mobile game), with vivid warm-orange and sunny yellow-gold
accents placed as focal highlights. High contrast and high readability even
at small size, crisp saturated color grading, clean vector-adjacent shapes
with a little grain for texture, soft directional daylight, no dark or moody
shadows. Absolutely no text, no letters, no watermark, no logos, no UI
overlay, no people's faces in close-up. Do not copy any real brand, real
landmark's exact identifiable form, or existing game's artwork — keep it an
original stylized impression. Wide 4:3 landscape composition, with the top
30% and bottom 25% of the frame kept visually quiet (soft sky / soft ground)
so a title and status icons can be overlaid later, and the main landmark
weighted toward the center band.
```

### city-singapore — Singapore

```
An aerial three-quarter view of a bright equatorial harbour city, glass
towers wrapped in lush tropical greenery under a clear sky-blue sky, a curved
white waterfront promenade lined with palm trees, small orange-and-yellow
festival lights strung along the harbour, tiny container cranes on the far
horizon softened by a light warm haze. Rendered as a bright, cheerful
editorial game-art illustration: a clean white and soft sky-blue color world
(like a sunny, high-key mobile game), with vivid warm-orange and sunny
yellow-gold accents placed as focal highlights. High contrast and high
readability even at small size, crisp saturated color grading, clean
vector-adjacent shapes with a little grain for texture, soft directional
daylight, no dark or moody shadows. Absolutely no text, no letters, no
watermark, no logos, no UI overlay, no people's faces in close-up. Do not
copy any real brand, real landmark's exact identifiable form, or existing
game's artwork — keep it an original stylized impression. Wide 4:3 landscape
composition, with the top 30% and bottom 25% of the frame kept visually quiet
(soft sky / soft ground) so a title and status icons can be overlaid later,
and the main landmark weighted toward the center band.
```

### city-shanghai — Shanghai, China

```
An aerial three-quarter view of a vast riverfront megacity under a bright sky,
a wide pale-blue river separating rows of cream-colored colonial-era stone
facades from a dense cluster of soaring white supertall towers with a single
tower catching a warm orange glow at its crown, small river boats leaving
thin white wakes, a light golden haze softening the far skyline. Rendered as
a bright, cheerful editorial game-art illustration: a clean white and soft
sky-blue color world (like a sunny, high-key mobile game), with vivid
warm-orange and sunny yellow-gold accents placed as focal highlights. High
contrast and high readability even at small size, crisp saturated color
grading, clean vector-adjacent shapes with a little grain for texture, soft
directional daylight, no dark or moody shadows. Absolutely no text, no
letters, no watermark, no logos, no UI overlay, no people's faces in
close-up. Do not copy any real brand, real landmark's exact identifiable
form, or existing game's artwork — keep it an original stylized impression.
Wide 4:3 landscape composition, with the top 30% and bottom 25% of the frame
kept visually quiet (soft sky / soft ground) so a title and status icons can
be overlaid later, and the main landmark weighted toward the center band.
```

### city-saopaulo — São Paulo, Brazil

```
An aerial three-quarter view of an endless spread of pale mid-rise concrete
apartment blocks under bright warm afternoon sun, small rooftop helipads
marked with a friendly orange cross here and there, a soft golden haze
catching the tops of the buildings, a strip of sky-blue sky visible at the
horizon. Rendered as a bright, cheerful editorial game-art illustration: a
clean white and soft sky-blue color world (like a sunny, high-key mobile
game), with vivid warm-orange and sunny yellow-gold accents placed as focal
highlights. High contrast and high readability even at small size, crisp
saturated color grading, clean vector-adjacent shapes with a little grain for
texture, soft directional daylight, no dark or moody shadows. Absolutely no
text, no letters, no watermark, no logos, no UI overlay, no people's faces in
close-up. Do not copy any real brand, real landmark's exact identifiable
form, or existing game's artwork — keep it an original stylized impression.
Wide 4:3 landscape composition, with the top 30% and bottom 25% of the frame
kept visually quiet (soft sky / soft ground) so a title and status icons can
be overlaid later, and the main landmark weighted toward the center band.
```

### city-mexicocity — Mexico City, Mexico

```
An aerial three-quarter view of a high-altitude valley city ringed by soft
blue-green volcanic peaks under a bright thin-air sky, a cream-colored
colonial plaza and cathedral anchoring the center, rows of low rooftops
painted in cheerful terracotta-orange and sunny ochre spreading outward,
clear crisp mountain daylight. Rendered as a bright, cheerful editorial
game-art illustration: a clean white and soft sky-blue color world (like a
sunny, high-key mobile game), with vivid warm-orange and sunny yellow-gold
accents placed as focal highlights. High contrast and high readability even
at small size, crisp saturated color grading, clean vector-adjacent shapes
with a little grain for texture, soft directional daylight, no dark or moody
shadows. Absolutely no text, no letters, no watermark, no logos, no UI
overlay, no people's faces in close-up. Do not copy any real brand, real
landmark's exact identifiable form, or existing game's artwork — keep it an
original stylized impression. Wide 4:3 landscape composition, with the top
30% and bottom 25% of the frame kept visually quiet (soft sky / soft ground)
so a title and status icons can be overlaid later, and the main landmark
weighted toward the center band.
```

### city-addisababa — Addis Ababa, Ethiopia

```
An aerial three-quarter view of a highland African capital at golden morning
hour, cheerful corrugated-roof neighborhoods in warm orange and cream
interleaved with new white concrete construction and a few small crane
silhouettes, soft green eucalyptus stands dotting the surrounding hills, a
light warm-gold haze, a bright sky-blue sky above. Rendered as a bright,
cheerful editorial game-art illustration: a clean white and soft sky-blue
color world (like a sunny, high-key mobile game), with vivid warm-orange and
sunny yellow-gold accents placed as focal highlights. High contrast and high
readability even at small size, crisp saturated color grading, clean
vector-adjacent shapes with a little grain for texture, soft directional
daylight, no dark or moody shadows. Absolutely no text, no letters, no
watermark, no logos, no UI overlay, no people's faces in close-up. Do not
copy any real brand, real landmark's exact identifiable form, or existing
game's artwork — keep it an original stylized impression. Wide 4:3 landscape
composition, with the top 30% and bottom 25% of the frame kept visually quiet
(soft sky / soft ground) so a title and status icons can be overlaid later,
and the main landmark weighted toward the center band.
```

### city-nairobi — Nairobi, Kenya

```
An aerial three-quarter view of an East African city meeting open golden
savannah at its edge, a compact cluster of clean white modern towers, a few
acacia trees and pale-gold dry grassland in the foreground, soft distant
clouds catching a warm orange light, a bright sky-blue sky overhead. Rendered
as a bright, cheerful editorial game-art illustration: a clean white and soft
sky-blue color world (like a sunny, high-key mobile game), with vivid
warm-orange and sunny yellow-gold accents placed as focal highlights. High
contrast and high readability even at small size, crisp saturated color
grading, clean vector-adjacent shapes with a little grain for texture, soft
directional daylight, no dark or moody shadows. Absolutely no text, no
letters, no watermark, no logos, no UI overlay, no people's faces in
close-up. Do not copy any real brand, real landmark's exact identifiable
form, or existing game's artwork — keep it an original stylized impression.
Wide 4:3 landscape composition, with the top 30% and bottom 25% of the frame
kept visually quiet (soft sky / soft ground) so a title and status icons can
be overlaid later, and the main landmark weighted toward the center band.
```

### city-jakarta — Jakarta, Indonesia

```
An aerial three-quarter view of a low tropical delta megacity just after a
rain shower, everything freshly rinsed and bright, tightly packed
terracotta-orange rooftops split by a calm pale-blue canal, a few isolated
white glass towers, cheerful green palm crowns breaking the roofline, a
sunny sky-blue sky with soft humid light. Rendered as a bright, cheerful
editorial game-art illustration: a clean white and soft sky-blue color world
(like a sunny, high-key mobile game), with vivid warm-orange and sunny
yellow-gold accents placed as focal highlights. High contrast and high
readability even at small size, crisp saturated color grading, clean
vector-adjacent shapes with a little grain for texture, soft directional
daylight, no dark or moody shadows. Absolutely no text, no letters, no
watermark, no logos, no UI overlay, no people's faces in close-up. Do not
copy any real brand, real landmark's exact identifiable form, or existing
game's artwork — keep it an original stylized impression. Wide 4:3 landscape
composition, with the top 30% and bottom 25% of the frame kept visually quiet
(soft sky / soft ground) so a title and status icons can be overlaid later,
and the main landmark weighted toward the center band.
```

### city-sydney — Sydney, Australia

```
An aerial three-quarter view of a deep sky-blue natural harbour city on a
brilliant clear morning, pale sandstone headlands and small bays, a white
steel arch bridge and a white shell-form performance hall glinting at the
water's edge, a few sailboats leaving bright white wakes, warm orange and
yellow-gold light catching the tops of the towers. Rendered as a bright,
cheerful editorial game-art illustration: a clean white and soft sky-blue
color world (like a sunny, high-key mobile game), with vivid warm-orange and
sunny yellow-gold accents placed as focal highlights. High contrast and high
readability even at small size, crisp saturated color grading, clean
vector-adjacent shapes with a little grain for texture, soft directional
daylight, no dark or moody shadows. Absolutely no text, no letters, no
watermark, no logos, no UI overlay, no people's faces in close-up. Do not
copy any real brand, real landmark's exact identifiable form, or existing
game's artwork — keep it an original stylized impression. Wide 4:3 landscape
composition, with the top 30% and bottom 25% of the frame kept visually quiet
(soft sky / soft ground) so a title and status icons can be overlaid later,
and the main landmark weighted toward the center band.
```

---

## 4. 生成後の配置手順

1. 生成画像をWebP(q80、長辺1200px)に変換し、`city-<cityId>.webp`という名前で保存する(例: `city-tokyo.webp`)。
2. ファイルを `apps/mobile/src/assets/images/cities/` に置く。
3. `apps/mobile/src/assets/images/registry.ts` を開き、`CITY_IMAGES`内の該当行のコメントアウトを外す。

```ts
const CITY_IMAGES: Partial<Record<string, ImageSourcePropType>> = {
  'city-tokyo': require('./cities/city-tokyo.webp'),
  // ...
};
```

4. アプリを再起動すると`GridBackdrop`が自動的にコード生成のフォールバック背景から実写画像に切り替わる(呼び出し側のコード変更は不要)。
5. 採用前に`docs/image_prompts.md`§8の受け入れ基準(配色・文字・構図・実在物・容量)を確認する。
