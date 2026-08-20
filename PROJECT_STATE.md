# Coffee Empire — Project State

## Phase 1(完了)

`README.md`の進行フェーズ(データ構造・Core実装・UI実装・データ適用)は全て完了。要点:

- `packages/core`: ドメインロジック一式(ターン進行/財務諸表/サプライチェーン/競合買収基礎/本社拡張/役員雇用/IPO基礎/不動産投資)。テスト76件全パス。
- `apps/mobile`: Expo SDK 57 + React Navigation v7、ネイティブiOSスタンドアロンビルド(Expo Go不要、Bundle ID `com.coffeeempire.mobile`)。ダークネイビー+オレンジアクセントのUI(コーヒーインク2参考画像に配色・レイアウトパターンを準拠、アイソメトリックイラストは対象外)。ボトムタブ(経営/店舗/マップ/焙煎/企業)+部署タブ(本社/役員/宣伝/投資/M&A)構成。

Phase1時点でのCorporate機能は「単発の買収・固定株価IPO・役員雇用(自動化なし)」までで、Phase2で拡張する「自動化権限委譲」「動的株価」「銀行融資」「競合AI」「R&D」「垂直統合(自社焙煎所・自社農園)」は未実装。

## Phase 2(進行中) — グローバル企業シミュレーションへの拡張

### スコープ

1. Corporate Management & C-Suite: 本社部門フロア拡張、役員への自動化権限委譲(自動価格調整/自動採用/自動マーケティング)
2. Advanced Finance & Stock Market: 銀行融資(金利・自動返済)、動的株価(売上・利益率・市場シェア連動)、株式発行/配当/自社株買い、M&A拡張
3. Dynamic Rival AI: NPC競合企業の出店・価格設定、市場シェア円グラフ、需要への動的干渉
4. Research, Tech & R&D: 研究開発ツリー、モバイルオーダー/自社アプリ(売上バフ)
5. Vertical Integration: 自社焙煎所(オリジナルブレンド)、自社農園買収(原価低減とのトレードオフで天候リスク)

### 状態管理の再設計

`apps/mobile/src/state/gameStore.ts`(単一430行)をZustand Sliceパターンで分割。設計詳細は`ARCHITECTURE.md`を参照。

### 実行順序と進捗

- [x] PROJECT_STATE.md作成
- [x] gameStore.tsのSlice分割 + ARCHITECTURE.md作成
- [x] モジュール7(Corporate Management)基盤: 本社部門フロア、役員自動化権限委譲ロジック
- [x] モジュール8(Advanced Finance)基盤: 銀行融資、動的株価計算
- [x] 本社ダッシュボードUI + 株式市場UI(CorporateScreenの部門タブとして実装。独立画面ではなくタブ切り替え型)
- [x] モジュール9: Dynamic Rival AI — NPC競合の出店拡大(都市選択)・値付け、都市別/全都市合算の市場シェア算出+円グラフ可視化、競合出店密度による自店舗需要への動的干渉(`calculateCompetitivePressure`)
- [x] モジュール10: Research/Tech/R&D — 3ブランチ(app/eco/machine)×2ティアの研究開発ツリー。アンロックした効果は全店舗の売上・原価に乗数として適用(モバイルオーダーアプリ=売上バフ、エコパッケージ=原価削減、新型エスプレッソマシン=品質向上を売上バフとして近似)
- [x] モジュール11: Vertical Integration — 複数生豆ロットの配合焙煎(`roastBlend`、オリジナルブランド豆にブランド名を付与)、自社農園買収(`acquireFarm`、毎ターン自動収穫・市場価格の約1割の維持費・12%の確率で不作)

**Phase 2 全11モジュール完了。**

### 設計判断メモ

- 役員の自動化権限委譲は、役職ごとのネストした個別設定ではなく`state.executiveAutomation: {autoPricing, autoHiring, autoMarketing}`という単純なフラグ構造にする。該当役職(CFO/COO/CMO)が実際に雇用されている場合のみ有効化される。理由: Phase2の他モジュールとの統合を優先し、過度な設計を避けるため。
- 動的株価は複雑な市場シミュレーションではなく、直近ターンの利益率・売上成長・(競合評価額に対する)相対市場シェアから算出する単純な乗数モデルとする。正確な金融モデルの再現よりも「経営判断が株価に跳ね返る」という体験を優先。
- 競合AI(`competitorAI.ts`)は`CompetitorBrand`に`cash`/`storesByCity`/`avgPrice`を追加して「都市ごとに出店するNPC企業」として拡張した。`valuation`(M&A買収額の算定基準)は従来通り維持しつつ、出店数は`storesByCity`という別軸で管理する二重構造。理由: 既存のvaluationベースのM&A機能(Phase1)を壊さずに、出店拡大という新しい意思決定軸を追加するため。
- 市場シェアは「出店数ベース」(`calculateCityMarketShare`/`calculateCompetitivePressure`)と「評価額ベース」(`calculateMarketShareRatio`、株価計算用)の2種類が並存する。前者はUI可視化(マップ画面の都市別シェア、企業統治画面のドーナツ)、後者は株価の動的計算にのみ使う。統一しなかった理由: 出店数0でも評価額は正の競合(まだ出店していないが資金力はある新興ブランド、等)を許容する設計上の柔軟性を残すため。
- 需要干渉(`calculateCompetitivePressure`)は都市内の競合店舗数のみを見る単純な線形モデル(1店舗ごとに5%減、最大50%減)。競合の価格・品質は現時点では自店舗の客数に直接影響しない(将来的な精緻化の余地として残す)。
- R&D効果(`ResearchNodeEffects`)は`revenueMultiplier`/`costMultiplier`の2種類の乗数のみで表現する。「新型エスプレッソマシン」のような品質向上系ノードも、`calculateStoreRevenue`内部の品質係数(qualityFactor)には手を入れず、事後的に売上乗数へ近似変換している。理由: `calculateStoreRevenue`の既存シグネチャ・既存テスト(financials.test.ts)を壊さずに済むこと、また競合の需要干渉(`competitivePressure`)と全く同じ「売上・原価への事後乗算」パターンに揃えることで`turnEngine.advanceTurn`内の実装が一貫すること。
- `researchTree`(ノード定義データ)は`marketingCampaignPresets`と同じ扱いで、`logic/`層は値としてimportせず、`advanceTurn`の引数として外部(`gameStore`)から注入する。`logic/research.ts`が`data/researchTree.ts`を直接importしないのはこのレイヤー分離規約を保つため。
- 自社農園(`OwnedFarm`)は市場からの都度購入(`Farm`+`GreenBeanLot`、既存のPhase1機能)とは別の状態(`state.ownedFarms`)として持つ。買収は`gameStore`のアクション(`acquireFarm`)で即時cash控除、以降は`advanceTurn`内で毎ターン自動収穫される非対称設計(購入は手動、収穫は自動)。理由: 「一度買収すれば手間なく生豆が入り続ける」という垂直統合の体験的メリットを素直に表現するため。
- ブレンド焙煎(`roastBlend`)は既存の単一ロット焙煎(`roastLot`)とは別アクションとして追加し、既存の動作・テストには一切手を入れていない。`calculateRoastOutput`自体はPhase1時点で既に複数ロット入力に対応済みだったため、coreロジックの追加変更は不要で、gameStore(UI操作の受け口)とUIのみの拡張で済んだ。

## Phase 3(進行中) — Coffee Inc 2 UI/UX リファインメント

本家『Coffee Inc 2』のレイアウト・配色・操作感への忠実再現を目的とした改修。著作物(ロゴ・アイソメトリック絵・独自フォント等)そのものの複製は行わず、既存のオリジナル素材(ダークネイビー+オレンジ基調)でレイアウトパターンのみ再現する方針。Step A〜Dの段階的置き換えで進行する。

### Step A(完了) — グローバルHUD + ワールドマップ/都市マップ

- `HudBar`(従来未使用だった孤立コンポーネント)を`RootNavigator`のタブ画面共通ヘッダーとして配置。現在日時(ターン数から`YYYY年M月`形式に変換、`turnUnit: 'month'`のためCoffee Inc 2の「週」表示ではなく月表示)・Cash・純資産(直近`BalanceSheet.totalAssets - totalLiabilities`)・株価(`state.stock.sharePrice`、未上場時は「IPO前」)を常時表示。
- 新規`GameSpeedControl`コンポーネント: ⏸/1x/2x/5x のUIで、本アプリはターン制(リアルタイムループ無し)のため「速度」ではなく「タップ時に何ターン連続進行するか」として実装(2x/5xは`advance()`をその回数分awaitで直列実行)。`DashboardScreen`にあった「ターンを進める」ボタンはHUDへ統合したため削除。
- `MapScreen`(ワールドマップ)を2カラムグリッドのカード表示に刷新。自社出店数(緑ドット)・競合出店数(赤ドット)・自社シェア%をカードごとに表示。
- `NewStoreScreen`(都市詳細)にその都市の自社店舗ピン(緑バッジ、店名表示)を先頭に表示した上で、空き物件候補を2カラムグリッド(バッジ付き)で表示するよう変更。
- 設計上の制約: `NewStoreScreen`の物件候補は`generatePropertiesForCity`で都度ランダム生成される候補であり、`gameStore.properties`に永続化されているのは実際に出店した物件のみ。そのため「競合が特定の空き物件を借りている」といった物件単位の競合可視化はStep A時点では未対応(競合の出店数は都市集計値のみ)。物件単位の空き/競合状態を永続管理したい場合はStep B以降でコア側のデータモデル拡張が必要。

### Step B(完了) — 店舗詳細マネジメント画面(タブ切り替え式)

- `StoreDetailScreen`を単一スクロールからタブ切り替え式(概要/運営/内装・機材/人事)に全面リファクタリング。各タブの中身は`screens/store-detail/{Overview,Operations,Design,Staff}Tab.tsx`に分割。新規`TabBar`コンポーネントを追加。
- 概要タブ用に`turnEngine.advanceTurn`の戻り値へ`storeReports: Record<string, { storeId, revenue, customers }>`を追加(既存の`plItems`計算内で捨てていた`rawRevenue.customers`を店舗単位で保持するだけの加算的変更、既存フィールド・シグネチャは無変更)。`gameStore`の`latestStoreReports`として保持。
- レイティングは新規指標を作らず既存の`store.cumulativeCustomerSatisfaction`(0-100)を★5段階に換算して流用。従業員満足度はその店舗所属従業員の`motivation`平均。
- `Store`型に`operatingHours: { open, close }`を追加。運営タブで設定可能だが`calculateStoreRevenue`には未接続(表示・設定のみの既知の簡略化。将来的に営業時間を売上係数に組み込む余地を残す)。
- 人事タブ向けに`storeSlice`へ`fireEmployee`(解雇)・`adjustSalary`(給与スライダー、採用時給与の0.5〜2倍に制限)・`trainEmployee`(研修、コスト`5000+skillLevel×500`でskillLevelを+10、最大100)を追加。内装・機材タブ向けに`sellEquipment`(購入額の50%で売却、既存機材の入れ替え用)を追加。
- 座席・インテリアはスコープ外(Store/Equipmentに座席数や内装の概念が無く、売上モデルへの組み込みには新規データ設計が必要なため)。Design & Equipmentタブは機材(エスプレッソマシン等)の購入・売却のみ実装。将来Step以降での拡張候補として残す。
- `packages/core`は`npm run build`でdistを再生成しないとmobile側の型が更新されない(モノレポの依存がsrcではなくdist経由のため)。Step B作業中に一度ハマったので明記する。

### Step C(完了) — 本社財務/人事/マーケティング

- 調査の結果、本社(HQ拡張・部門フロア)・C-Suite役員雇用・権限委譲自動化・マーケティングキャンペーン・IPO/自社株買い/配当・銀行融資・M&A・R&Dは`CorporateScreen`のタブとして既にPhase1-2で実装済みだった。Step Cは主に既存機能への視覚的な肉付けと導線整理に絞った。
- 新規`Gauge`コンポーネント(0-100の横棒ゲージ)を追加し、`marketing`タブに「ブランド認知度」ゲージ(既存の`state.statuses.brandAwareness`を可視化、これまでDashboardの汎用ステータスカードにしか出ていなかった)を新設。
- `hq`タブ先頭に「P&L・貸借対照表を見る」ボタンを追加し、既存の`FinancialsScreen`(Phase1から存在)への導線をDashboard経由だけでなくCorporate画面からも辿れるようにした。
- IPO/銀行融資/M&Aは元々`CorporateScreen`の`ipo`/`loans`/`ma`タブとして実装済みのため、当初のStep D想定(証券/銀行)と重複している。Step Dは実質「株価チャート(現状は現在値のみで推移履歴が無い)」「ニュース・イベントフィード」が主な残作業になる。

### Step D(完了) — 株価推移チャート/ニュース・イベントフィード

- `CoffeeEmpireState.history`に`stockPrices: StockPricePoint[]`と`newsFeed: NewsFeedEntry[]`を追加(既存の`incomeStatements`等と同じ配列型の追加のみ、既存フィールドは無変更)。`turnEngine.advanceTurn`自体は変更せず、`coreSlice.advance()`側で他の履歴配列と同じ`capHistory`パターンで積み上げる(上場中のみ`stockPrices`に追加、`triggeredEvents`は毎ターン`newsFeed`に追加)。
- `SimEvent`(`packages/core`)自体はUI文言を持たない設計(基盤④README準拠)のため、見出し文言は`apps/mobile/src/data/eventNews.ts`でイベントid→日本語見出しのマップとして新規に用意し、core側の型・データは変更していない。
- 新規`NewsScreen`(スタック画面)を追加し、`newsFeed`を新しい順に一覧表示。`HudBar`にベルアイコンを追加してこの画面への導線とし、ニュースが1件でもあれば赤い未読ドットを表示する(既読管理はせず「1件でもあれば表示」の簡易実装)。
- `CorporateScreen`の`ipo`タブに既存`LineChart`を再利用した株価推移チャートを追加(2点以上蓄積されたら表示)。

Phase3(Coffee Inc 2 UI/UXリファインメント)のStep A〜D、当初計画の主要項目は完了。

### 追加対応(完了) — 座席・インテリアの売上連動

Step B時点で「新規データモデル設計が必要」としてスコープ外にしていた座席・インテリアを追加実装。新しい概念(座席数・レイアウト配置)は作らず、既存の`Equipment`型の`furniture`カテゴリ(元々型定義には存在したがカタログに1種類しかなく、売上にも無関係だった)を拡張する形で対応した。

- `packages/core/src/logic/financials.ts`に`calculateInteriorQualityFactor(equipment)`を追加。店舗の`furniture`機材のうち最大tierのものを採用し、`1 + tier×4%`(上限+30%)の売上係数を返す。複数のfurniture機材を持っていても最大tierのみ有効(重ね置きで際限なく強化されない)。
- `turnEngine.ts`で既存の`competitivePressure`・`researchEffects`と同じ「事後乗算」パターンでrevenue/variableCostに適用。`calculateStoreRevenue`自体(quality/price/satisfactionFactorのロジック)は無変更。
- `equipmentCatalog`のfurnitureを1種類(tier2)から3段階(シンプル/スタンダード/プレミアム、tier1/2/4)に拡張し、espressoMachineと同様の「アップグレード」の意味を持たせた。
- `DesignTab`に現在の座席・内装ボーナス(%)を表示。
- `financials.test.ts`に4件、`turnEngine.test.ts`に1件テストを追加(既存126件+5件=131件、全パス)。
- 座席「数」や店内レイアウト配置(什器をキャンバス上に並べるような表現)は依然として実装していない。あくまで機材tierによる売上係数という簡略化に留まる。

## Phase 4(完了) — リアル経済バランス・店舗ごとイベント・季節変動・近接型競合AI

「Coffee Inc 2クローンを日本の実店舗経営に即したリアルなシミュレーションへ」という改修依頼への対応。3本柱(経済定数リバランス/2Dマップ/季節変動・競合AI・イベント)のうち、2Dマップは技術的制約(ドット絵・スプライト素材を作成できない)から、仕様書自身が代替案として挙げる「カード一覧+数値バッジ強化」に縮小して実施した。

### 1. 経済定数リバランス

日本の実店舗相場を参考に、ほぼ全ての金額定数を実額(円)ベースへ較正し直した。

- 初期資金: ¥500,000 → **¥10,000,000**
- テナント賃料(`propertyGenerator.ts`): `incomeLevel × 500 × サイズ係数` → `incomeLevel × サイズ単価(kiosk 15,000/small 25,000/medium 90,000)`。東京(incomeLevel8)でkiosk ¥120,000・small ¥200,000・medium ¥720,000/月
- 生豆仕入れ原価(`farms.ts`): USD建て($4.0〜$28.0)から円建て(¥1,500〜¥8,500/kg)へ全面差し替え。Jamaica Blue Mountainのみ最高級豆として一般レンジを意図的に超過
- 人件費(`employeeCandidates.ts`のBASE_SALARY_BY_ROLE): バリスタ月給¥180,000、店長¥320,000、役員¥700,000(スキル連動0.8〜1.4倍の仕組みは維持)
- 機材(`equipmentCatalog.ts`): 購入費・月次維持費を実勢の1/50〜1/300程度から実額へ引き上げ(エスプレッソマシン¥350,000〜¥1,200,000等)
- 水道光熱費(新規コスト項目): `turnEngine.ts`に`clamp(40,000 + 機材数×8,000 + 営業時間×1,500, 40,000, 100,000)`を店舗ごとの固定費として追加
- 銀行融資(`CorporateScreen.tsx`のLOAN_PRESETS)・本社設立/拡張(`corporateSlice.ts`・`calculateDepartmentUpgradeCost`)・マーケティング予算(`marketingCampaignPresets.ts`)・競合初期valuation(`sampleWorld.ts`)を新資金スケールに合わせて×20前後で引き上げ
- 不動産投資額・生豆農園買収額は既存の式(賃料×96ヶ月分/月産量×市場単価×24ヶ月分)がrentPerMonth/pricePerKgの変更に自動追随するため個別変更不要だった

### 2. イベントシステムの再設計(会社全体/店舗ごとの分離+金額のランダム化)

ユーザー要望により、単一のイベントリストを「会社全体イベント」と「店舗ごとイベント」に分割し、金額を固定値からレンジ抽選に変更した。

- 既存の`SimEvent`/`rollEvents`/`applyEffect`(基盤④README準拠のAPI)は型・シグネチャとも無変更。新規`data/eventEffectRanges.ts`の`resolveEventEffect(eventId, baseEffect, rng)`が、イベントidに対応するレンジがあればその中からランダムな値を、無ければ`effect`の固定値を返す。`turnEngine.ts`はこの解決後の値を使う(既存の会社全体イベント機構への追加レイヤーとして実装、破壊的変更なし)。
- 店舗ごとイベントは全く新しい仕組み(`types/storeEvents.ts`・`data/storeEvents.ts`・`logic/storeEvents.ts`)として追加。各店舗に対して毎ターン独立に確率判定するため、店舗数が多いほど発生機会も増える。効果は現金・顧客満足度・従業員モチベーション・当ターン限定の売上倍率の4種。
  - `equipment-breakdown`(機材故障、¥-220,000〜¥-80,000)
  - `employee-strike`(その店舗の従業員モチベーション平均<40が条件、¥-300,000〜¥-100,000+モチベ-20〜-10)
  - `rent-hike-notice`(賃料値上げ交渉、¥-300,000〜¥-100,000。`Property`がCoffeeEmpireStateの外・モバイル層にあるため、恒久的な賃料改定ではなく一括コストとして計上する簡略化)
  - `viral-buzz`(SNSバズり、当ターンのみ売上2〜3倍。複数ターンにまたがる一時バフの仕組みは無いため、単ターンで完結させる簡略化)
  - `food-safety-rumor`(悪評、顧客満足度-30〜-15)
- `AdvanceTurnResult`に`triggeredStoreEvents`を追加。`NewsFeedEntry`に`storeId?`を追加し、`NewsScreen`で店舗名バッジを表示するようにした。`eventNews.ts`に新規イベントの見出しを追加。

### 3. 季節変動

新規`logic/seasonality.ts`。`turn`を月インデックス(0=1月)に変換する関数はHudBarの表示ロジックと同じ計算式に揃えてある。月ごとの係数(1月0.75〜8月1.30)を全店舗の売上・原価に一律適用する(既存のcompetitivePressure/researchEffectsと同じ事後乗算パターン)。

### 4. 近接型競合AIの近似実装

「店舗単位で自社の隣に競合が出店してくる」という要望に対し、2Dマップ同様の理由(店舗単位の物件データがまだ存在しない)で完全な近接配置は行わず、都市単位の近似で対応した。`competitorAI.ts`の`CompetitorMarketContext`に`playerStoresByCity?`を追加し、出店拡大先の都市選択を「自社出店数+1」の重み付き抽選に変更(未指定なら従来通り完全ランダム、後方互換)。`turnEngine.ts`が自社の都市別出店数を集計して渡す。

### 5. マップの数値バッジ強化(2Dビジュアルマップの代替)

`MapScreen`に推定人通り(footTrafficIndex×1000)・自社/競合出店数のアイコン付きバッジを追加。`NewStoreScreen`の物件候補カードもアイコン付きの人通り・賃料バッジに変更(「For Rent」プレビューの簡易版)。実地図描画(react-native-maps等)やドット絵アニメーションは引き続き未実装。

### 検証

- `packages/core`のテストを149件に拡充(既存の金額前提を新数値に更新+新規ロジックのテスト18件追加)、全パス
- `npm run typecheck`全ワークスペースでエラーなし
- 初期資金¥10,000,000・店舗1店(無人)で12ターン分のシミュレーションを実行し、月次現金が急激に破綻・高騰しないことを確認(月次純利益は概ね-20万円台〜+80万円台で推移、12ターン後も資金の大半が残存)

## Phase 5(完了) — 法人化・ホールディングス・税制

「本作を日本の税制・財務・組織形態の変化を学べる教材に昇華させる」という改修依頼への対応。企業成長ステージ(個人事業主→株式会社→HD)と、年1回決算での一括課税・黒字倒産リスクを`packages/core`に実装した。設計の詳細は`ARCHITECTURE.md`の「Phase5: 企業成長ステージ・税制エンジン」節を参照。

### 実装した内容(`packages/core`)

- `types/corporate.ts`: `EntityType`('soleProprietorship'|'corporation'|'holding')・`EntityStatus`(法人成り/HD化したターン)を追加。
- `types/finance.ts`: `TaxRule`を大幅拡張(個人所得税の累進ブラケット・住民税・個人事業税・法人税の軽減税率二段階・法人住民税均等割・社会保険料率・消費税課税事業者の基準)。決算結果を表す`SettlementResult`を新設。
- `types/simState.ts`: `CoffeeEmpireState`に`entityType`・`entityStatus`・`fiscalPeriod`(決算までの累計税引前利益)・`isBankrupt`を追加。`history.settlements`(決算記録の履歴)を追加。
- `data/taxConstants.ts`(新規): 実際の日本の税制に概ね準拠した`defaultTaxRule`。
- `logic/taxes.ts`(新規): 所得税(累進)・住民税・個人事業税・法人税(軽減税率)・法人住民税均等割・社会保険料事業主負担・消費税課税事業者判定・`calculateAnnualSettlement()`(決算の一括納税額算定)。
- `logic/incorporation.ts`(新規): `incorporateCompany()`(法人成り、手続き費用¥1,000,000)・`establishHolding()`(HD化、店舗数10・都市数3・費用¥5,000,000が条件。ブランド概念が無いため店舗数/都市数を代理指標とする簡略化)。
- `logic/financials.ts`: `buildIncomeStatementWithTax()`を追加(税額を外部から渡せる版。既存`buildIncomeStatement`とPL集計を共有)。
- `logic/turnEngine.ts`: 毎月の課税をやめ、`SETTLEMENT_INTERVAL_TURNS`(=12ターン)ごとの決算で`fiscalPeriod.accumulatedPretaxIncome`に対して一括課税する方式に変更。法人成り後は給与総額に連動する社会保険料(事業主負担)を毎月の固定費として追加。決算の一括納税でcashがマイナスになったら`isBankrupt=true`(黒字倒産)。

### 検証

- `packages/core`のテストを179件に拡充(taxes.test.ts 15件・incorporation.test.ts 10件・turnEngine決算/社保/黒字倒産シナリオ5件を新規追加)、全パス。
- スクリプトで「個人事業主12ターン運営→決算(累進課税)→法人成り→従業員雇用→法人として12ターン運営→決算(軽減税率法人税+均等割)」「現金わずかな状態で高額な累積利益を抱えて決算を迎え黒字倒産する」の両シナリオを実行し、期待通りの挙動を確認。

### 実装した内容(`apps/mobile`)

前回セッションで`packages/core`のみ完了・コミット(`b06f71d`)されていたが、UI/UX刷新セッションを挟んで本セッションで`apps/mobile`側の配線を完了させた。

- `state/slices/corporateSlice.ts`: `incorporate()`(法人成り。`canIncorporate`で不成立時は無視)・`establishHoldingAction(distinctCityCount)`(HD化。`distinctCityCount`は呼び出し元のUI層が`store.propertyId→Property.cityId`を解決して渡す)を追加。
- `state/slices/coreSlice.ts`: `latestSettlement`(直近決算結果)を`advance()`の戻り値から追跡し、`dismissSettlement()`で消去。`resetGame()`(黒字倒産後の再スタート用。保存データを破棄し`createInitialState()`へ戻す)を追加。`advance()`は`state.isBankrupt`時に何もしない早期returnを追加(UI側のブロックと二重の防御)。
- `state/persistence.ts`: `clearState()`(保存データ破棄)を追加。
- `components/SettlementModal.tsx`(新規): 決算発生時に税目別内訳(所得税/住民税/事業税 または 法人税/均等割)と納税額合計を表示するモーダル。赤字決算時は`tone="urgent"`。
- `components/BankruptcyScreen.tsx`(新規): `isBankrupt`時に全画面オーバーレイでゲームオーバー演出+「新しい会社で再スタート」ボタンを表示。
- `components/Modal.tsx`: `AppModal`に`tone?: 'default' | 'urgent'`を追加(赤アクセントの枠線・glow・警告アイコン)。緊急イベント(`EventAlertModal`)・赤字決算通知の両方で使う。
- `screens/CorporateScreen.tsx`: 新タブ「組織」を追加。現在の企業成長ステージ表示、法人成り/HD化の条件チェックリストとボタン、決算履歴(直近6件)を表示。
- `components/HudBar.tsx`: 日付表示の隣に企業形態バッジ(個人事業主/株式会社/ホールディングス)を追加。
- `App.tsx`: `SettlementModal`・`BankruptcyScreen`を配線。

### 既存バグの修正(Phase5とは無関係、本セッションで発見)

`App.tsx`の`<HudBar />`が`<NavigationContainer>`の外(兄弟要素)に置かれており、`HudBar`内部の`useNavigation()`呼び出しが起動時に例外を投げてクラッシュする状態だった(`RootNavigator.tsx`の`TabNavigator`内にも重複して正しく配置された`<HudBar />`があり、二重管理になっていた)。過去のUI刷新セッションの並行編集マージに起因すると見られる。`HudBar`を`NavigationContainer`の内側(全画面共通ヘッダーとして`RootNavigator`の直前)に一本化し、`TabNavigator`側の重複を削除して解消した。

### 検証

- `packages/core`: `npm run build`→`node --test dist/**/*.test.js` 179件全パス(コード変更なし、既存の実装を再確認)。
- `apps/mobile`: `npm run typecheck`エラーなし。
- ゲームループ(個人事業主で開始→現金を貯めて法人成り→従業員雇用・店舗拡大→10店舗/3都市でHD化条件充足→IPO)をコードレビューで机上検証。実機/シミュレータでの起動確認は本セッションの環境では実施できていない(次回引き継ぎ時に実施推奨)。

## Phase 6(完了、既存) — オンボーディング・クリア条件・実績システム

前セッションで実装済み(`logic/achievements.ts`・`logic/gameOutcome.ts`・`data/achievements.ts`、`isVictoryAchieved`/`unlockedAchievementIds`)。本セッション開始時点でPROJECT_STATE.mdへの記載が漏れていたため、後続セッションのために存在だけ明記しておく(本セッションでは変更していない)。詳細はコミット`7b78985`参照。

## Phase A/B/C(完了) — HQ組織委譲・マクロ金融/資本市場・ブランド戦略/サプライチェーン深化

「経営シミュレーションとしての深み(権限委譲の精緻化・資本市場のリアリティ・ブランド戦略とサプライチェーンの接続)」を目的とした3本柱の追加実装。全て既存の型・関数シグネチャに対してadditive/optionalな設計を徹底し、旧セーブデータ(`save-v2`のまま、ストレージキーのローテーションは不要と判断)・既存テスト191件を破壊せずに追加した。`packages/core`のテストは214件に拡充(全パス)、`apps/mobile`は`npx tsc --noEmit`エラーなしを確認済み。

### Phase A: HQ組織・権限委譲の精緻化

- `types/employee.ts`の`Employee`に`equityCompensationPerMonth?: number`(ストックオプション/RSU相当の月額株式報酬)を追加。`logic/financials.ts`の`calculateEquityCompensationExpense()`(`calculatePayroll`と同じ集計パターン)が合計を算出し、`turnEngine.ts`が`plItems`へ`equityCompensation`(fixedCost)として計上する。会計上は費用だが現金支出を伴わない非資金費用のため、減価償却と同じく`operatingCashFlow`算定時に足し戻す(費用計上してもcashの着地額は変わらない設計。`turnEngine.test.ts`で検証済み)。`apps/mobile`の`corporateSlice.setEmployeeEquityCompensation()`・`CorporateScreen`のexecタブから役員へ月給の10%相当を付与/解除できる。
- `types/corporate.ts`の`ExecutiveAutomation`に`departmentBudgets?: { hiringMonthlyBudget?: number; marketingMonthlyBudget?: number }`を追加(既存の3フラグ`autoPricing`/`autoHiring`/`autoMarketing`は無変更)。`logic/corporate.ts`の`applyExecutiveAutomation()`は、COO自動採用は今ターンの新規採用給与総額が`hiringMonthlyBudget`を超えたら以降の店舗をスキップ、CMO自動宣伝は`marketingMonthlyBudget`以下のプリセットのみを自動起動候補にするよう変更した。両方とも未設定なら従来通り無制限(cashバッファ判定のみ)で後方互換。`autoPricing`(CFOの自動価格調整)には自然な「予算」概念が無いため対象外とした(価格は原資を消費しないため)。
- `apps/mobile`の`CorporateScreen`execタブに部門予算の+/-コントロールを追加。独立した`HeadquartersScreen`は作らず、既存のタブ構成(Phase3 Step Cで整理済み)にカードを追加する形で統一感を保った。

### Phase B: マクロ金融・資本市場

- `packages/core/src/logic/creditRating.ts`(新規)。負債比率(40点満点)・利益率(30点満点)・手元資金の売上何ヶ月分か(30点満点)を加点式で0-100スコア化し、8段階(AAA/AA/A/BBB/BB/B/CCC/D)へマッピングする`calculateCreditRating()`。正確な信用モデルではなく「財務が健全なほど有利な金利で借りられる」体験を優先した単純モデル(`calculateDynamicStockPrice`と同系統の設計判断)。`isBankrupt`なら問答無用でD。
- `logic/loans.ts`に`calculateLoanOfferRate(baseRate, creditRating)`を追加。格付けごとの`interestRateMultiplier`(AAA=0.7倍〜D=3.0倍)を基準金利に乗算し、下限0.5%でクランプする。`createLoan`/`serviceLoans`自体は無変更(呼び出し元が事前に金利を調整してから渡す設計)。`apps/mobile`の`CorporateScreen`loansタブで格付けバッジと調整後オファー金利を表示、`takeLoan`にはこの調整後金利を渡す。
- `types/corporate.ts`の`StockListing`に`institutionalFloatShares?: number`(publicFloatSharesの内訳のうち機関投資家保有分)を追加。`logic/corporate.ts`の`calculateOwnershipComposition(stock)`が創業者/機関投資家/個人投資家の株数・比率を算出する(founderSharesは`totalShares - publicFloatShares`の差分として暗黙的に扱い、新規フィールドは増やさない=既存設計の踏襲)。`apps/mobile`の`financeSlice.executeIPO()`にinstitutionalRatio引数(デフォルト0.6)を追加、新規`issueAdditionalShares()`(公募増資)で追加株式発行時にも按分して更新する。`CorporateScreen`ipoタブに株主構成ドーナツチャートと、希薄化率を試算表示する公募増資ボタン(5,000株固定プリセット。可変額入力の本格的な「資金調達モーダル」は時間の都合上見送り、既知の簡略化)を追加。
- `FinancialsScreen`のキャッシュフロー計算書セクションが実は未配線だったことが判明したため追加した(貸借対照表は既存で配線済みだったため無変更)。Phase5時点の引き継ぎでは「BS/CFは配線済みの想定」とされていたが、実際にはBSのみだった。

### Phase C: ブランド戦略・サプライチェーン深化

- `types/simState.ts`の`CoffeeEmpireState`に`brandAwarenessByCity?: Record<string, number>`を追加。既存のグローバルな`state.statuses.brandAwareness`(イベント効果・`launchCampaign`の即時グローバル加点)とは完全に別軸で並存させる(後方互換のため既存ロジックは一切変更していない)。`logic/branding.ts`(新規)が`decayBrandAwarenessByCity()`(毎ターンbaseline=20へわずかに回帰)・`bumpCityBrandAwareness()`・`calculateCityAwarenessRevenueFactor()`(0-100の認知度を0.9〜1.1倍の売上係数へ変換)を提供する。
- `types/corporate.ts`の`MarketingCampaign`に`cityId?: string`を追加。`cityId`が設定されたキャンペーンは`turnEngine.ts`内で対象都市の`brandAwarenessByCity`のみへ、キャンペーン期間中(`durationTurns`)毎ターン按分した効果量(`awarenessEffect / durationTurns`)を積み増す(既存のグローバルキャンペーンは起動時に全量を即時付与する挙動のままで無変更)。都市認知度は`calculateCityAwarenessRevenueFactor`経由で店舗revenue/variableCostへ、既存の`competitivePressure`/`researchEffects`/`seasonalFactor`と同じ「事後乗算」パターンで適用する。`apps/mobile`の`CorporateScreen`marketingタブに都市選択UI・都市別認知度ゲージを追加し、`launchCampaign(preset, cityId)`で対象都市を指定できるようにした(既存のグローバル起動もcityId省略で引き続き可能)。
- `types/store.ts`の`MenuItem`に`originBlend?: { originCountries, isOriginalBlend, blendName? }`(表示専用メタデータ)、`types/supplyChain.ts`の`RoastBatch`に`originCountries?: string[]`を追加。`logic/supplyChain.ts`の`calculateMenuItemPreferenceScore()`が産地×焙煎度合い×ブレンドの有無から顧客訴求スコア(0-100)を算出する: シングルオリジンは産地ストーリー性で+4、複数産地を配合したオリジナルブレンドは目新しさで+6。`apps/mobile`の`supplyChainSlice.roastLot()`/`roastBlend()`がこのスコアを`RoastBatch.qualityScore`として採用するよう変更した(`calculateRoastOutput`の結果を上書きする形。既存の`MenuItem.qualityScore`→`averageMenuQuality`→`calculateStoreRevenue`という既存の経路をそのまま流用するため、`calculateStoreRevenue`自体のシグネチャ・ロジックは無変更)。`SupplyChainScreen`(既存の「仕入れ・焙煎」画面がそのまま産地×焙煎×ブレンドを組み立てる画面としての要件を満たしていたため、新規画面は作らず)に顧客訴求スコア・産地/ブレンド種別バッジを追加表示した。

### 既知のギャップ・簡略化(Phase A/B/C時点)

- CFOの自動価格調整(`autoPricing`)には部門予算の概念を導入していない(値付けは原資を消費しないため自然な対応が無い)。
- 信用格付け・株価モデルと同様、`calculateCreditRating`は簡略化された加点式モデルであり、実際の与信審査を再現するものではない。
- 公募増資は5,000株固定のプリセットボタンのみで、可変額を入力する本格的な「資金調達モーダル」は実装していない。
- 都市限定マーケティングキャンペーンに「ポスター/地域広告が出ていないとTV/ブランドスポンサーを起動できない」といった段階的なアンロック制約は設けていない(プリセット自体の予算・効果は既存通り段階的だが、UIはどの都市からでも任意の段階のプリセットを起動できる)。
- ストックオプション付与は役員への一律の月給10%固定(UIのトグルボタン)で、株数ベースの本格的な権利確定(ベスティング)スケジュールは実装していない。
- 都市別ブランド認知度の売上係数(0.9〜1.1倍)は既存の`competitivePressure`(0.5〜1.0倍)等と比べて意図的に控えめなレンジにした(認知度単体でゲームバランスを崩さないための保守的な選択)。

## Phase D(完了) — 不動産投資の毎ターン経済化・M&A統合・取締役会解任リスク・フランチャイズ収益

ギャップ分析済みの4項目(①不動産の継続収益化、②M&A統合、③取締役会/株主総会機構、④フランチャイズ)を実装した。全て既存の型・関数シグネチャに対してadditive/optionalな設計を徹底し、`save-v3`のローテーションは不要と判断した(全ての新規フィールドがoptionalで、未設定時は既存ロジックがそのまま動く後方互換設計のため)。`packages/core`のテストは214件→241件に拡張(全パス)。

### ① 不動産投資の毎ターン経済化

`types/corporate.ts`の`RealEstateInvestment`・`logic/corporate.ts`の`evaluateRealEstateInvestment()`(購入時点の一回限りの見積もり)は既存のまま変更していない。追加したのは以後の毎ターン処理: `logic/realEstateLogic.ts`(新規)。

- `calculateRealEstateDepreciation()`: `calculateEquipmentDepreciation`(financials.ts)と同じ定額法パターン。法定耐用年数は構造ごとに異なる(鉄骨造34年・木造22年等)が、簡略化して一律240ヶ月(20年)とした。
- `calculateRealEstateMaintenanceCost()`: `turnEngine.ts`の水道光熱費と同じ「実勢レンジへのクランプ」パターン(購入額×年0.6%相当を月額¥8,000〜¥120,000にクランプ)。
- `rollVacancy()` / `calculateRealEstateMonthlyResult()`: 確率的な空室リスク(毎ターン10%、空室月は賃料収入が20%まで低下)。rngを引数で受け取る既存規約に準拠。

`turnEngine.ts`は従来の固定額`monthlyRentalIncome`をそのままPLに計上していた箇所を置き換え、保有不動産ごとに賃貸収入(空室考慮後)・維持費のPL明細を積み、減価償却費・簿価を店舗設備の減価償却(`calculateStoresDepreciationAndNetBookValue`)と合算して`totalMonthlyDepreciation`/`totalNetBookValue`(→BSの`propertyAndEquipmentNet`)に反映するよう変更した。

### ② M&A post-acquisition統合

`logic/corporate.ts`に`integrateAcquisition(brandAwarenessByCity, competitor)`を追加。買収した競合ブランドの`storesByCity`(都市ごとの出店数)を、新規の`Store`実体を作らずに「都市別ブランド認知度への一括加点(1店舗につき+5、`bumpCityBrandAwareness`経由)」+「吸収した店舗数に応じた一時金(1店舗につき30万円)」として自社へ反映する(既知の簡略化: 買収先の店舗を個別のStoreとして運営することはしない。`evaluateRealEstateInvestment`等と同じ「post-hoc見積もり」スタイルに合わせた設計判断)。`types/corporate.ts`の`Acquisition`に`absorbedStoreCount?`/`integrationCashBonus?`(表示用の記録、additive)を追加。`apps/mobile`の`financeSlice.acquireCompetitor()`がこの統合結果を`state.brandAwarenessByCity`とcashへ反映する。

### ③ 取締役会/株主総会機構

`types/simState.ts`の`CoffeeEmpireState`に`boardConfidence?: number`(0-100)・`isBoardDismissed?: boolean`を追加(共にoptional、`isBankrupt`と同じ「一度trueになったら固定」方式)。`logic/boardLogic.ts`(新規)が黒字/赤字(±)・配当有無(±)・株価トレンド(±、`clamp(-5,5)`)の3シグナルから信任スコアの増減量を算出し(`calculateBoardConfidenceDelta`)、0-100にクランプして積み上げる(`applyBoardConfidenceDelta`)。閾値15以下で解任(`shouldDismissBoard`)。

適用範囲の設計判断: 取締役会・株主総会は制度上「上場企業」の概念であるため、`entityType`(個人事業主/株式会社/HD)ではなく`state.stock.isPublic`を適用条件とした。未上場中は信任スコアが変化せず、解任リスクも発生しない。`turnEngine.ts`は株価更新の直後にこの処理を行い、`nextState.isBoardDismissed`をisBankruptと同じ`||`パターンで固定する。

`apps/mobile`: `coreSlice.advance()`が`isBoardDismissed`時も`isBankrupt`と同様に早期returnする。`components/BoardDismissalScreen.tsx`(新規、`BankruptcyScreen.tsx`と同じ全画面オーバーレイ+「新しい会社で再スタート」パターン)を`App.tsx`に配線。`CorporateScreen.tsx`の組織タブに上場中のみ表示する信任スコアGaugeを追加。

### ④ フランチャイズ

`types/franchise.ts`(新規)に`FranchiseContract`(id/cityId/royaltyRate/monthlyGrossRevenueEstimate/openedAtTurn)。既存の「本社経営シミュレーション」を丸ごと複製する重い実装は避け、`evaluateRealEstateInvestment`と同じ「post-hoc見積もり」スタイルを踏襲した: フランチャイジー側の店舗運営(Employee/Equipment等)は一切シミュレートせず、契約時点の客足×都市所得水準からの粗い月間総売上見積もり(`evaluateFranchiseOpportunity`、rng注入)に対してロイヤリティ率(デフォルト6%)を掛けた分だけが毎ターンのPL収益になる(`logic/franchiseLogic.ts`)。フランチャイジーが運営費を全額負担するため、対応するコスト項目は無い。`turnEngine.ts`が`state.franchiseContracts ?? []`をループしてPL収益項目を積む。

`apps/mobile`: `financeSlice.openFranchise()`を追加。`NewStoreScreen.tsx`の出店マップの各物件カードに「出店する」ボタンと並べて「FC契約」ボタンを追加(見積もり月次ロイヤリティ額を表示)。`CorporateScreen.tsx`のM&Aタブにフランチャイズ収益一覧カードを、`FinancialsScreen.tsx`に不動産・フランチャイズ・M&A統合効果の内訳セクションを追加した。

### 既知のギャップ・簡略化(Phase D時点)

- M&A統合は新規`Store`実体を作らない近似(店舗ごとの個別運営は再現しない)。
- フランチャイズはフランチャイジー側の経営破綻・契約解除・royaltyRate/monthlyGrossRevenueEstimateの経時変化(季節変動等)を再現しない(契約時点の固定見積もりのまま)。
- 取締役会信任スコアは3シグナルの単純な加減点モデルであり、実際の株主総会での議決権行使シミュレーションではない(`calculateCreditRating`/`calculateDynamicStockPrice`と同系統の設計判断)。
- 不動産の空室リスクは物件ごとに独立した確率判定(都市の景況感・季節性とは連動しない)。
