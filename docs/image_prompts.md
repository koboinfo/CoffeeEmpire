# Coffee Empire — 外部画像アセット用プロンプト集

画像生成AI（Midjourney / Stable Diffusion 等）で本アプリ用のラスター画像を作る際の**参考資料**。
アイコン・チャート・UI 部品は SVG コンポーネントとして内製する方針のため、**このドキュメントの対象外**。
ここで扱うのは「コードで描くのが非現実的な絵」——都市マップ背景、店舗内装、産地風景、イベント挿絵、ストア掲載素材——に限る。

> **著作権に関する前提**: 『Coffee Inc 2』のロゴ・アイソメトリックイラスト・独自フォント等をそのまま複製する意図のプロンプトは記載しない。
> 本ドキュメントのプロンプトは全て、既存のオリジナル配色（ダークネイビー + ロースト オレンジ）に沿った独自アートを生成するためのもの。
> 生成物は必ず目視確認し、既存ブランド・実在ロゴ・実在人物に酷似したものは破棄する。

---

## 1. 共通スタイル規約

すべてのプロンプトはこの「スタイル接尾辞」を末尾に付けて発注する。ここが揺れると画面ごとにトーンがバラつく。

### 1-1. スタイル接尾辞（Style Suffix）

```
dark editorial game-art illustration, deep navy-teal base (#141F29) with
roasted-orange accent (#D9722C), muted cream highlights (#F3E4D0),
low-saturation cinematic color grading, soft volumetric light,
clean vector-adjacent shapes with subtle grain, no text, no logos,
no user interface elements, flat lighting on midtones
```

### 1-2. ネガティブ / 除外指定

Midjourney は `--no`、SD 系は negative prompt に入れる。

```
--no text, letters, watermark, signature, logo, brand marks, UI overlay,
   buttons, HUD, people faces in closeup, distorted hands, oversaturated colors,
   pure white background, neon cyberpunk pink, lens flare
```

### 1-3. 推奨パラメータ

| 用途 | Midjourney パラメータ |
|---|---|
| 都市マップ背景 | `--ar 4:3 --v 7 --style raw --q 2` |
| 店舗内装ヘッダー | `--ar 16:9 --v 7 --style raw --q 2` |
| ニュース／イベント挿絵 | `--ar 1:1 --v 7 --style raw` |
| ストア掲載スクショ背景 | `--ar 9:19.5 --v 7 --style raw --q 2` |

### 1-4. トーンを揃える運用

1. まず **§2 の Tokyo** を生成し、最も方針に合う 1 枚を確定させる。
2. その画像 URL を以降すべてのプロンプトの先頭に置き、`--sref <URL> --sw 80` を付ける。
3. `--sref` が使えない環境では、§1-1 の接尾辞を一字一句変えずに使い回すこと。

### 1-5. 書き出し規約

| 種別 | 形式 | 長辺 | 配置先 |
|---|---|---|---|
| 都市マップ背景 | WebP (q80) | 1200px | `apps/mobile/assets/cities/<cityId>.webp` |
| 店舗内装 | WebP (q80) | 1600px | `apps/mobile/assets/interiors/<tier>.webp` |
| 産地風景 | WebP (q75) | 1000px | `apps/mobile/assets/origins/<country>.webp` |
| イベント挿絵 | WebP (q75) | 512px | `apps/mobile/assets/news/<eventId>.webp` |

命名は `packages/core/src/data/` の id と一対一で揃える（例: `city-tokyo` → `city-tokyo.webp`）。
`@2x` / `@3x` は用意せず、長辺を上表の値にして `resizeMode="cover"` で縮小させる。

---

## 2. 都市マップ背景（12都市）

**用途**: `MapScreen` の 2 カラム都市カード背景、および `NewStoreScreen` のヘッダー。
**構図の共通指示**: カード上に緑/赤のドットと都市名テキストが重なるため、**上部 30% と下部 25% は情報量を落とし、中央帯にランドマークを寄せる**こと。

各プロンプトは以下の雛形に当てはめてある。

```
aerial three-quarter view of <CITY DESCRIPTION>, seen at <TIME OF DAY>,
stylized game map illustration, simplified building masses, <SIGNATURE ELEMENT>,
composition weighted to the center band with quiet sky above and quiet ground below,
<STYLE SUFFIX> --ar 4:3 --v 7 --style raw --q 2
```

### city-tokyo — Tokyo, Japan（所得8 / 人流1.4）

```
aerial three-quarter view of a dense Japanese metropolis at blue hour,
layered low-rise blocks under elevated rail lines, a single tall broadcast tower
glowing warm orange at the center, scattered vending-machine glow in the alleys,
stylized game map illustration, simplified building masses,
composition weighted to the center band with quiet sky above and quiet ground below,
dark editorial game-art illustration, deep navy-teal base (#141F29) with
roasted-orange accent (#D9722C), muted cream highlights (#F3E4D0),
low-saturation cinematic color grading, soft volumetric light,
clean vector-adjacent shapes with subtle grain, no text, no logos,
no user interface elements --ar 4:3 --v 7 --style raw --q 2
```

### city-newyork — New York, USA（所得9 / 人流1.5）

```
aerial three-quarter view of a tight grid of Art Deco skyscrapers at dusk,
steam rising from street vents, long avenue canyon cutting diagonally,
one setback tower crowned in warm amber light, stylized game map illustration,
simplified building masses, center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-london — London, UK（所得9 / 人流1.3）

```
aerial three-quarter view of a low Georgian-brick city under overcast light,
a wide slate-grey river bending through the frame, a stone clock tower and a
dome silhouetted in the mid-ground, wet pavement reflecting muted amber lamps,
stylized game map illustration, center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-seoul — Seoul, South Korea（所得7 / 人流1.3）

```
aerial three-quarter view of a river-split modern Asian capital at night,
apartment tower clusters in even rows, forested granite mountain ridge behind the
skyline, bridges traced in thin warm light, stylized game map illustration,
center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-singapore — Singapore（所得9 / 人流1.2）

```
aerial three-quarter view of an equatorial harbour city at twilight,
glass towers wrapped in tropical greenery, a curved waterfront promenade,
container cranes small on the horizon, humid haze softening the far buildings,
stylized game map illustration, center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-shanghai — Shanghai, China（所得6 / 人流1.4）

```
aerial three-quarter view of a vast riverfront megacity at dusk,
a wide brown river separating low colonial-era stone facades from a dense cluster
of supertall towers, river barges leaving thin wakes, haze layering the depth,
stylized game map illustration, center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-saopaulo — São Paulo, Brazil（所得4 / 人流1.1）

```
aerial three-quarter view of an endless sea of mid-rise concrete apartment blocks
under low afternoon sun, no visible horizon break, helicopters pads dotting rooftops,
warm dust in the air, stylized game map illustration, center-weighted composition,
<STYLE SUFFIX> --ar 4:3
```

### city-mexicocity — Mexico City, Mexico（所得4 / 人流1.1）

```
aerial three-quarter view of a high-altitude valley city ringed by volcanic peaks,
a colonial plaza and cathedral anchoring the center, low painted rooftops in
terracotta and ochre spreading outward, thin mountain light, stylized game map
illustration, center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-addisababa — Addis Ababa, Ethiopia（所得2 / 人流0.8）

```
aerial three-quarter view of a highland African capital at golden hour,
corrugated-roof neighbourhoods interleaved with new concrete construction and
crane silhouettes, eucalyptus stands on the surrounding hills, warm dust haze,
stylized game map illustration, center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-nairobi — Nairobi, Kenya（所得3 / 人流0.9）

```
aerial three-quarter view of an East African city meeting open savannah at its edge,
a compact cluster of modern towers, acacia trees and dry grassland in the foreground,
distant thunderheads catching orange light, stylized game map illustration,
center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-jakarta — Jakarta, Indonesia（所得4 / 人流1.1）

```
aerial three-quarter view of a low tropical delta megacity after rain,
tightly packed red-tile rooftops split by a murky canal, a few isolated glass towers,
palm crowns breaking the roofline, heavy humid atmosphere, stylized game map
illustration, center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

### city-sydney — Sydney, Australia（所得8 / 人流1.2）

```
aerial three-quarter view of a deep blue natural harbour city at early morning,
sandstone headlands and small bays, a steel arch bridge and a shell-form
performance hall at the water's edge, clear high-contrast southern light,
stylized game map illustration, center-weighted composition, <STYLE SUFFIX> --ar 4:3
```

---

## 3. 店舗内装（`furniture` tier 1 / 2 / 4）

**用途**: `StoreDetailScreen` の Design & Equipment タブ ヘッダー画像。`equipmentCatalog` の furniture 3 段階に対応させ、投資すると絵が変わる体験を作る。
**共通指示**: **人物の顔を描かせない**（後ろ姿・シルエットまで）。文字入り看板・メニューボードは `--no text` で潰す。

### tier 1 — シンプル

```
interior of a small no-frills coffee shop, bare concrete floor, four plain wooden
two-tops, a single pendant bulb, exposed conduit on the ceiling, one worn espresso
machine on a laminate counter, morning light through an unadorned window,
slightly empty and utilitarian mood, no people, <STYLE SUFFIX> --ar 16:9 --v 7 --style raw --q 2
```

### tier 2 — スタンダード

```
interior of a comfortable neighbourhood cafe, warm oak tables and cushioned bench
seating along one wall, brass pendant lamps, potted plants on a ledge, a tidy
espresso bar with a polished machine, cream and walnut palette warmed by a single
orange accent wall, two blurred silhouettes seated far from camera,
<STYLE SUFFIX> --ar 16:9 --v 7 --style raw --q 2
```

### tier 4 — プレミアム

```
interior of a flagship specialty coffee bar, double-height space with a floating
mezzanine, dark green marble counter with brass inlay, custom leather banquettes,
a wall of curated brewing equipment behind glass, layered architectural lighting
picking out warm orange pools against deep navy shadow, luxurious but restrained,
no people, <STYLE SUFFIX> --ar 16:9 --v 7 --style raw --q 2
```

---

## 4. 生豆産地・農園（`farms.ts` の 8 産地 → 6 地域）

**用途**: `SupplyChain` 系画面の産地選択カード、`acquireFarm`（自社農園買収）の確認モーダル。
`farm-brazil-cerrado` と `farm-guatemala-antigua` のように似た中南米産地はまとめず、標高と地形で描き分ける。

### brazil（cerrado / 低地・大規模機械化）

```
vast flat highland coffee plantation at sunrise, mechanized harvester moving down
an endless straight row, red laterite soil, drying patios laid out in geometric
rectangles, industrial scale and order, wide landscape, <STYLE SUFFIX> --ar 4:3
```

### ethiopia（yirgacheffe / 高地・森林間作）

```
steep highland smallholder coffee garden in morning mist, coffee shrubs growing
under tall shade trees, hand-picked cherries in a woven basket in the foreground,
terraced green slopes receding into fog, intimate scale, <STYLE SUFFIX> --ar 4:3
```

### colombia / guatemala（高地・火山性土壌）

```
steep volcanic mountainside covered in terraced coffee rows, a conical volcano
silhouette behind low cloud, red cherries dense on the branches in the foreground,
cool morning shadow in the valley with warm light on the ridge, <STYLE SUFFIX> --ar 4:3
```

### vietnam（dak lak / ロブスタ・大量生産）

```
flat red-earth robusta plantation under hard tropical noon light, orderly rows
stretching to a treeline, irrigation piping, sacks stacked beside a dirt access
road, functional and high-volume mood, <STYLE SUFFIX> --ar 4:3
```

### kenya（nyeri / 高地・小規模精製所）

```
red-soil highland coffee slopes with Mount Kenya faint on the horizon, a small
open-air wet mill with concrete fermentation tanks and raised drying beds,
sharp equatorial light and long shadows, <STYLE SUFFIX> --ar 4:3
```

### indonesia / jamaica（島嶼・湿潤高地）

```
misty tropical island mountain ridge planted with coffee, dense wet jungle
crowding the plot edges, wooden drying racks under a corrugated shelter,
saturated deep greens muted by constant humidity, <STYLE SUFFIX> --ar 4:3
```

---

## 5. イベント／ニュース挿絵（`events.ts` の 10 種）

**用途**: `NewsScreen` のフィード行サムネイル、および発生時のトースト。
**共通指示**: 正方形・**被写体は1つのメタファーに絞る**（64〜96pt で表示されるため、要素を足すと潰れる）。ポジティブ系は `#D9722C`、ネガティブ系は `#E2564B` を主役色に。

| イベントid | プロンプト本体（末尾に `<STYLE SUFFIX> --ar 1:1 --v 7 --style raw`） |
|---|---|
| `viral-social-moment` | `a single latte cup at the center of an expanding ring of glowing orange signal waves, seen from directly above, celebratory upward energy` |
| `weather-crop-failure` | `a bare coffee branch with shriveled cherries against a cracked dry earth background, harsh red-tinged light, sense of loss` |
| `employee-strike` | `an empty barista apron hanging on a hook beside a dark unlit espresso machine, cold blue shadow, stillness` |
| `equipment-breakdown` | `a cracked espresso machine portafilter with a thin plume of escaping steam, warning-red rim light on brushed steel` |
| `competitor-price-war` | `two paper coffee cups facing each other like duelists on a dark board, a jagged red fracture line running between them` |
| `economic-boom` | `an upward-stepping stack of coffee cups forming a rising bar chart silhouette, warm orange light rising from below` |
| `economic-recession` | `a descending stack of coffee cups forming a falling bar chart silhouette, cold desaturated blue light, long shadow` |
| `quality-scandal` | `a spilled dark coffee stain spreading across clean white paper, viewed top-down, red warning light at the edge of frame` |
| `celebrity-endorsement` | `a single takeaway coffee cup on a pedestal under a theatrical spotlight, warm gold beam, dark surrounding void` |
| `loyalty-program-success` | `a punch card of coffee-bean stamps fully completed, the final stamp glowing warm orange, top-down flat composition` |

---

## 6. ブランド／マーケティング素材

**用途**: `CorporateScreen` の marketing タブのキャンペーンカード背景。
`marketingCampaignPresets` のプリセットごとに 1 枚。抽象度を高め、**都市や人物を特定させない**。

```
abstract marketing campaign key visual for a coffee brand, <CONCEPT>,
geometric composition built from concentric circles and coffee-bean forms,
deep navy field with a single roasted-orange focal element and cream linework,
poster-like negative space, no text, <STYLE SUFFIX> --ar 3:2 --v 7 --style raw
```

`<CONCEPT>` の差し替え候補:

- ローカルチラシ → `grassroots neighbourhood scale, small repeated marks clustered tightly`
- SNS広告 → `a signal radiating outward through a network of nodes`
- TVCM → `a broad horizontal sweep of light across the full frame, mass-reach scale`
- ブランドキャンペーン → `a single perfect circle held in wide empty space, premium restraint`

---

## 7. ストア掲載素材（App Store）

**用途**: スクリーンショットの背景・フィーチャーグラフィック。**アプリUIそのものは実機キャプチャを合成する**ため、ここで作るのは背後の地の絵のみ。

```
minimal vertical gradient backdrop for a business simulation game store page,
deep navy-teal (#141F29) at the top falling to near-black at the bottom,
a very large soft-focus coffee bean form bleeding off the left edge at 8% opacity,
one diffuse roasted-orange light bloom in the upper third,
completely empty center for UI compositing, no text, no logos, no devices
--ar 9:19.5 --v 7 --style raw --q 2
```

---

## 8. 生成物の受け入れ基準

発注した画像を採用する前に、以下を全て満たすか確認する。1つでも外れたら再生成する。

1. **配色**: スポイトで拾った暗部が `#141F29` 近傍、アクセントが `#D9722C` 近傍にある。青紫やシアンに転んでいない。
2. **文字**: 看板・ポスター等に読めない疑似文字が残っていない（潰れた文字は最も安っぽく見える）。
3. **構図**: 都市マップは上部30%・下部25%が空いている（ドットと都市名が乗る）。
4. **実在物**: 実在ブランドのロゴ、識別可能な実在人物、既存ゲームのアートに酷似した要素が無い。
5. **容量**: WebP 変換後、都市背景 1 枚あたり 150KB 以下。超える場合は品質を q70 まで落とす。

---

## 9. 対象外（SVGで内製するもの）

以下は**画像生成AIに発注しない**。`react-native-svg` のコンポーネントとして実装する。

- 全アイコン類（コーヒー、ビル、グラフ、スタッフ、紙幣、ベル、歯車 等）
- チャート（`LineChart` / `DonutChart` / `Gauge` — 実装済み）
- ロゴ・ワードマーク
- バッジ、ドット、区切り線などの装飾

理由: 解像度非依存であること、テーマカラーを props で切り替えられること、リポジトリ容量を増やさないこと。
