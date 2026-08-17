# /src/assets/images/

外部画像生成AI(Midjourney等)で作った実写系アセットの格納場所。プロンプトは `docs/image_prompts.md` を参照。

## ディレクトリとファイル名の対応

`packages/core/src/data/` の id とファイル名を一致させる(`registry.ts` がこの命名を前提に静的 `require` している)。

| ディレクトリ | 対応する id | 例 |
|---|---|---|
| `cities/` | `cities.ts` の `City.id` | `city-tokyo.webp` |
| `interiors/` | furniture tier (`1` / `2` / `4`) | `tier-1.webp` |
| `origins/` | `farms.ts` の `Farm.country` | `brazil.webp` |
| `news/` | `events.ts` の `SimEvent.id` | `viral-social-moment.webp` |

形式・サイズは `docs/image_prompts.md` §1-5 の書き出し規約に従う(WebP、都市背景は長辺1200px等)。

## 現在の状態

このディレクトリは空(`.gitkeep` のみ)。`registry.ts` の各関数は該当ファイルが無い間 `undefined` を返し、
呼び出し側(`GridBackdrop` 等)はコード生成のグラデーション背景に自動フォールバックする。

画像を追加したら `registry.ts` の該当箇所の `require(...)` コメントアウトを外すこと
(Metroバンドラーは静的解析で `require` パスを解決するため、存在しないファイルを動的パスで
`require` することはできない — ファイルを置いたら明示的に有効化する運用)。
