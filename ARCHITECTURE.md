# Coffee Empire — Architecture

## レイヤー構成

```
packages/core   — ドメインロジック(型 + 純粋関数)。UIに依存しない。React Nativeからは
                   file:依存で読み込む。node --testでユニットテスト。
apps/mobile     — Expo(React Native)。UI・状態管理(Zustand)・永続化(AsyncStorage)。
```

`packages/core`は「入力(state, context)→出力(nextState, 各種明細)」の純粋関数群として設計している。ランダム性が絡む処理は`rng: () => number`を引数として受け取り、テストで決定的に検証できるようにする(既存の`generateEmployeeCandidates`/`rollEvents`等と同じ規約)。

## packages/core のファイル粒度

1ファイル1関心事(supplyChain.ts/corporate.ts/financials.ts/events.ts/competitorAI.ts/employeeCandidates.ts/propertyGenerator.ts/history.ts/loans.ts)。`turnEngine.ts`がこれらを束ねて`advanceTurn()`という単一のオーケストレーション関数を提供する。

Phase2で追加した`loans.ts`(銀行融資)は財務系ロジックだが、`financials.ts`とは別ファイルに切り出した。理由: `financials.ts`は既に7つの計算関数を持ち十分な大きさであること、融資は「返済スケジュール管理」という独立した関心事であることから、既存ファイルへの追記より新設が妥当と判断した。

`corporate.ts`に追加した`applyExecutiveAutomation()`は、`packages/core/src/data/marketingCampaignPresets.ts`の型(`MarketingCampaignPreset`)を`import type`で参照する。`logic/`が`data/`の実装(値)をimportすることはこれまで通り避けているが、型のみの参照はコンパイル時に消えるため層の分離を壊さない。プリセットの実データは呼び出し元(`turnEngine.advanceTurn`、さらにその呼び出し元の`gameStore`)から引数として渡す(`events`パラメータと同じ設計)。

## apps/mobile の状態管理(Zustand Slicesパターン)

Phase1では`gameStore.ts`が430行の単一ファイルにactionを全て持っていた。Phase2で機能(役員自動化・融資・動的株価・部門拡張)が増えるため、[Zustand公式のSlicesパターン](https://docs.pmnd.rs/zustand/guides/typescript#slices-pattern)に沿って分割した。

```
apps/mobile/src/state/
  gameStore.ts              — 各Sliceを合成するだけの薄いファイル(GameStore型の定義含む)
  slices/
    coreSlice.ts             — state本体・ターン進行(advance)・永続化(hydrate)・エラー状態
    storeSlice.ts             — 店舗運営(出店・値付け・設備購入・雇用)
    supplyChainSlice.ts       — 生豆調達・焙煎・メニューへの適用
    corporateSlice.ts         — 本社拡張・部門フロア拡張・役員雇用・マーケティング・役員自動化フラグ
    financeSlice.ts           — IPO・配当・自社株買い・M&A・不動産投資・銀行融資
```

### 設計判断

- **`state`(`CoffeeEmpireState`)は分割しない**: ゲームの状態そのものは`packages/core`が定義する単一の型であり、UI側のstore構造の都合で分割すると`packages/core`の型と乖離するリスクがある。分割するのは「stateを操作するaction群」であり、`state`フィールド自体は全Sliceが共有する。
- **各SliceはStateCreator<GameStore, [], [], XxxSlice>で型付け**: `GameStore`(全Slice合成後の型)を`gameStore.ts`からimport type し、各Slice側は自身のインターフェースをexportする循環参照になるが、`import type`同士の循環はTypeScriptのコンパイルでは問題にならない(zustand公式ガイドと同じパターン)。
- **Slice間の呼び出しは`get()`経由**: 例えば`financeSlice.buyBackShares`は`corporateSlice`のactionを直接importせず、必要なら`get()`で最新の`state`を読む。Slice同士が互いのモジュールをvalue importすることは避け、疎結合を保つ。

## advanceTurn の処理順序(Phase2で変更)

```
1. applyExecutiveAutomation(state, context, marketingPresets, rng)
   → CFO在籍+autoPricing: 全店舗メニュー価格を都市所得水準・品質から自動調整
   → COO在籍+autoHiring:  無人店舗にバリスタを自動採用
   → CMO在籍+autoMarketing: キャンペーン0件なら最安プリセットを自動起動
2. 各店舗の売上・原価・賃料・設備維持費をPLItem化(Phase1と同じ)
3. serviceLoans(state.loans) → 当ターンの利息・元本返済額を算出
4. buildIncomeStatement(...) → interestExpenseに融資利息を反映
5. buildBalanceSheet(...) → longTermDebtに融資残高を反映
6. cashFlowStatement.financingCashFlow から元本返済分を追加控除
7. 上場中なら calculateDynamicStockPrice() で株価を更新
```

自動化(手順1)は収益計算(手順2)より前に実行するため、「今ターンCFOが自動調整した価格」が「今ターンの売上」に反映される。

## 既知の簡略化(Phase2時点)

- `applyExecutiveAutomation`のautoHiringは「現金が候補給与の6ヶ月分を超えていれば採用」という単純なバッファ判定のみ。店舗収益性やスキルレベルでの判断はしない。
- `calculateDynamicStockPrice`は正確な金融モデルではなく、利益率と市場シェアから成長率を単純計算する近似モデル。
- `calculateMarketShareRatio`は自社の`balanceSheet.totalAssets`と競合`valuation`を同一軸で比較する近似値。競合側もvaluationの単位が店舗数や収益と直接連動していない(Phase1からの制約)。
- 部門フロア(`HeadquartersOffice.departments`)は現時点でレベルを保持するのみで、レベルが自動化の効果量やコストに影響するロジックは未実装(Phase2後続で拡張予定)。
- `competitorAI.ts`(NPC競合の価格/拡張意思決定ロジック)はPhase1時点で実装済みだが`advanceTurn`に未統合。モジュール9(Dynamic Rival AI)で統合する。

## テスト方針

`packages/core`の新規関数は全て`node --test`でユニットテストを書く(既存76件→Phase2で100件に増加)。`advanceTurn`統合テストでは「融資の利息がP&Lに反映される」「上場中は黒字ターンで株価が上がる」等、複数モジュールの組み合わせ結果を検証する。UIコンポーネント側の自動テストは未整備(Phase1からの既知の未対応領域)。

## Phase5: 企業成長ステージ・税制エンジン

### entityType(企業成長ステージ)

`CoffeeEmpireState.entityType: 'soleProprietorship' | 'corporation' | 'holding'`を単一の状態フィールドとして持ち、`soleProprietorship → corporation → holding`の一方向にのみ遷移する(降格なし)。IPO(`StockListing.isPublic`)は既存Phase1-2の実装をそのまま流用し、entityTypeとは別軸のフラグとして扱う(法人成り前でもUI上IPOボタン自体は隠さないが、`corporation`/`holding`到達を前提とした運用を想定)。

`logic/incorporation.ts`が遷移ロジックを持つ:
- `incorporateCompany(state)`: 個人事業主→株式会社。`INCORPORATION_COST`(手続き費用の概算)をcashから引き、`fiscalPeriod.accumulatedPretaxIncome`をリセットする(個人事業の累計所得と法人の決算期の損益を混同しないため)。
- `establishHolding(state, distinctCityCount)`: 株式会社→HD。本アプリには店舗に「ブランド」概念が無いため、Stage3(マルチブランド)/Stage4(多店舗展開)は店舗数(`HOLDING_MIN_STORE_COUNT`=10)・出店都市数(`HOLDING_MIN_CITY_COUNT`=3)を代理指標として使う既知の簡略化。`distinctCityCount`はmobile層が`store.propertyId→Property.cityId`を解決して渡す(pure関数側でProperty解決を持たせないため)。

### 決算(年1回)一括課税と黒字倒産

Phase4までは毎月`buildIncomeStatement`が`taxRule.corporateTaxRate`の単一税率で毎ターン課税していたが、Phase5で「税金は年1回(`SETTLEMENT_INTERVAL_TURNS`=12ターン)の決算でまとめて一括徴収される」方式に変更した(黒字倒産リスクを再現するため)。

- `financials.ts`に`buildIncomeStatementWithTax(turn, items, depreciation, interestExpense, taxAmount)`を追加。既存の`buildIncomeStatement`(taxRuleから内部で税額計算)とはPL集計ロジック(`buildPretaxStatement`)を共有しつつ、税額を外部から直接渡せるようにした。
- `turnEngine.advanceTurn`は毎ターン`buildIncomeStatementWithTax(..., 0)`で仮のPL(`corporateTax=0`)を作り、`pretaxIncome`を`state.fiscalPeriod.accumulatedPretaxIncome`に積み上げる。
- `nextTurn % SETTLEMENT_INTERVAL_TURNS === 0`の決算ターンでのみ`logic/taxes.ts`の`calculateAnnualSettlement()`で累計税引前利益に対する一括納税額を算定し、`buildIncomeStatementWithTax`を`taxAmount=settlement.totalTaxDue`で再計算し直す。この月のnetIncomeが一括で大きく落ち込み、`operatingCashFlow`経由でcashが一気に減る(黒字倒産の再現)。
- `nextState.isBankrupt`は`cashFlowStatement.endingCash < 0`になった時点で`true`に固定される(以後の黒字化では戻らない)。ゲームオーバーUIは未実装(既知のギャップ、下記参照)。

### 税目の内訳(`logic/taxes.ts` / `data/taxConstants.ts`)

- 個人事業主(`entityType==='soleProprietorship'`): 所得税(`personalIncomeTaxBrackets`による累進課税、速算控除表ではなくブラケットごとの積み上げ計算)+住民税(フラット10%)+個人事業税(事業主控除290万円超過分に5%)。
- 法人/HD: 法人税(中小企業軽減税率。課税所得800万円以下15%/超過分23.2%の二段階)+法人住民税均等割(`corporateInhabitantTaxMinimumPerYear`=年7万円。赤字でも必ず発生)。
- 社会保険料(健康保険・厚生年金の事業主負担、概算15%)は決算とは別に、`entityType!=='soleProprietorship'`かつ給与総額>0の場合に毎月の固定費(PLItem)として発生する(個人事業主段階は対象外という簡略化)。
- 消費税課税事業者判定(`isConsumptionTaxable`)は、本来の基準期間(前々事業年度)ではなく直近12ヶ月の売上高(`trailing12MonthRevenue`、`SettlementResult.isConsumptionTaxable`)で簡略判定する。判定結果は決算記録に残るのみで、消費税そのものの納税額計算には反映しない(価格モデルが税込前提のため)。

### apps/mobile側の配線

`state/slices/corporateSlice.ts`の`incorporate()`/`establishHoldingAction(distinctCityCount)`が`logic/incorporation.ts`をラップする。`distinctCityCount`はpure関数側にProperty解決を持たせない設計のため、`CorporateScreen.tsx`が`state.stores`+`properties`(`store.propertyId→Property.cityId`)から算出して渡す。

決算・黒字倒産の通知は`coreSlice.ts`の`latestSettlement`(直近決算結果。`advance()`のたびに更新、`dismissSettlement()`で消去)と`state.isBankrupt`をUI側が購読する形で実現している。`components/SettlementModal.tsx`が前者を、`components/BankruptcyScreen.tsx`(全画面オーバーレイ+`resetGame()`ボタン)が後者を表示する。`coreSlice.advance()`は`isBankrupt`時に早期returnし、以後のターン進行を止める。

### 既知のギャップ(Phase5時点。意図的な簡略化)

- HD化(Stage3/4)は店舗数・都市数の代理指標のみで、真の意味でのマルチブランド管理(ブランドごとの損益・複数子会社のBS分離)は無い。
- 消費税は課税事業者フラグの表示のみで、実際の納税額計算には組み込んでいない。
- `resetGame()`は保存データを`createInitialState()`へ丸ごと差し替えるのみで、過去のプレイ実績(決算履歴等)を残す「殿堂入り」のような機構は無い。
