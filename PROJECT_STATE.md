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

Step B(店舗詳細タブ)・Step C(本社財務/人事/マーケ)・Step D(証券/ニュース)は未着手。
