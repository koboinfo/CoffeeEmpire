# Coffee Empire

コーヒーチェーン経営シミュレーションゲーム。`基盤④: Sim Core Engine`の設計(`~/CoreEngines/core/04-sim-core/README.md`)をベースに、店舗運営・サプライチェーン・企業統治・財務諸表をターン(月次)で管理する。

## 構成

- `packages/core` — ドメインロジック(型定義 + ターン進行計算)。純粋TS、UIに依存しない。
- `apps/mobile` — Expo(React Native) + TypeScriptのモバイルアプリ(Phase 3で追加)。
- `functions` — Firebase Cloud Functions(Phase 5でバックエンド同期を追加)。

## 進行フェーズ

- [x] Phase 1: データ構造・API型定義
- [x] Phase 2: Core バックエンド実装 & 単体テスト（`packages/core`、テスト76件全パス）
- [x] Phase 3: フロントエンド UI & ステート管理実装（`apps/mobile`、iOS Simulator上で起動・画面表示確認済み）
- [x] Phase 4: 枝葉データ適用(初期都市データ・豆の種類・イベント定義)（`packages/core/src/data/`）
- [ ] Phase 5: エラーハンドリング・セーブデータ永続化・パフォーマンス最適化

## スタンドアロン実行(Expo Go不要)

`apps/mobile`はExpo SDK 57 + ネイティブiOSプロジェクト(`apps/mobile/ios/`、`expo prebuild`で生成)構成。**Expo Goアプリは一切不要**で、Bundle ID `com.coffeeempire.mobile` の単独アプリとしてビルド・起動する。

```bash
cd apps/mobile
npx expo prebuild -p ios   # ios/ を再生成する場合のみ
npx expo run:ios --configuration Release   # Release=JSバンドル埋め込み、完全オフライン動作
```

Releaseビルドは`main.jsbundle`をアプリ内に埋め込むため、**Metro/開発サーバーへの接続なし・完全オフラインで動作**する(実機確認済み。Metro停止状態でホーム画面のアイコンから単独起動)。開発中にJS変更を都度反映したい場合は`--configuration Debug`(デフォルト)でMetro接続のDevビルドを使う。

### 既知のビルド上の注意(iCloud Desktop同期環境)

プロジェクトが`~/Desktop`など iCloud Drive「デスクトップとドキュメントフォルダ」同期下にある場合、`expo-modules-jsi`のネイティブビルドスクリプトが生成する一時ビルド成果物にmacOSが`com.apple.fileprovider`/`com.apple.provenance`等の拡張属性を自動付与し、`codesign`が `resource fork, Finder information, or similar detritus not allowed` で失敗することがある。対処として`node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh`のビルドキャッシュ先(`DERIVED_DATA_PATH`/`SPM_BUILD_PATH`/`SPM_WORKSPACE_PATH`)を`/private/tmp`配下に固定するパッチを適用済み(vendored fileへの直接修正のため`npm install`で上書きされたら再適用が必要)。

## 動作確認メモ(2026-08-16)

- `packages/core`: `tsc`ビルド成功、`node --test`で76件全パス。
- `apps/mobile`: Expo SDK 57 + React Navigation v7 + React 19 + React Native 0.86へアップグレード済み(旧: SDK51/RN0.74)。型チェック・core側テストとも全パス。
- Releaseビルド(`xcodebuild -configuration Release`)でiOS Simulator(iPhone 17 Pro)にネイティブアプリとしてインストール・起動し、Metro/Expo Go完全停止状態でダッシュボード画面(資金・ターン・ボトムタブ)が正常表示されることを確認済み。
- `apps/mobile/src/state/persistence.ts`によるセーブデータ永続化は実装済みだが、実機での長期動作検証は未実施(Phase 5で対応)。
