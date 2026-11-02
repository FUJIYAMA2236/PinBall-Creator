# Third-party notices / サードパーティ表記

Pinball Maker — Copyright (c) 2026 FUJIYAMA2236 — [MIT License](LICENSE)

## English

**Pinball Maker bundles no third-party code or assets.**

| Item | What is used | Bundled? | License / rights |
|---|---|---|---|
| JavaScript libraries / frameworks | None (plain JavaScript, written for this project) | — | — |
| Web fonts | None. Text uses fonts already installed on the viewer's device, referenced by name only: `system-ui`, `-apple-system`, `Hiragino Sans`, `Noto Sans JP`, `Yu Gothic UI`, `Meiryo`, `sans-serif` (and `Cascadia Mono` / `Consolas` / `monospace` for the license text) | No | Each font belongs to its owner; no font files are distributed |
| Images / icons | Original inline SVG icons and canvas drawings made for this project | Yes (original) | MIT (this project) |
| Sounds | None. Sound effects are synthesized at run time with the Web Audio API | — | — |
| CDN / network access | None. The editor and exported games work offline | — | — |

### Build scripts

The optional scripts in `tools/` run on [Node.js](https://nodejs.org/) and use only its built-in modules (`fs`, `path`, `vm`). Node.js is not bundled and is not needed to use the editor or the exported games. Node.js license: MIT and others — see https://github.com/nodejs/node/blob/main/LICENSE

### Content you add

Background images and text you put into a table are your own content. Only use images you have the right to use. Games exported from the editor contain the Pinball Maker engine (MIT License); keep its license notice, which is included in the exported HTML automatically.

## 日本語

**ピンボールメーカーは、外部のライブラリ・素材を一切同梱していません。**

| 項目 | 使っているもの | 同梱 | ライセンス・権利 |
|---|---|---|---|
| JavaScript ライブラリ・フレームワーク | なし（このプロジェクト用に書いた素の JavaScript） | — | — |
| Webフォント | なし。見る人の端末に入っているフォントを名前で指定しているだけです（`system-ui`、`-apple-system`、`Hiragino Sans`、`Noto Sans JP`、`Yu Gothic UI`、`Meiryo`、`sans-serif`、ライセンス表示用に `Cascadia Mono` / `Consolas` / `monospace`） | なし | 各フォントの権利は各権利者に帰属。フォントファイルは配布していません |
| 画像・アイコン | このプロジェクト用に作ったインラインSVGと Canvas 描画 | あり（オリジナル） | MIT（本プロジェクト） |
| 音 | なし。効果音は Web Audio API で実行時に合成 | — | — |
| CDN・通信 | なし。エディタも書き出したゲームもオフラインで動作 | — | — |

### ビルド用スクリプト

`tools/` のスクリプト（任意）は Node.js で動き、組み込みモジュール（`fs`・`path`・`vm`）だけを使っています。Node.js は同梱しておらず、エディタや書き出したゲームを使うのには必要ありません。Node.js のライセンス：MIT ほか（https://github.com/nodejs/node/blob/main/LICENSE）

### 利用者が追加するもの

テーブルに入れる背景画像や文字は、作った人のコンテンツです。使う権利のある画像だけを使ってください。書き出したゲームにはピンボールメーカーのエンジン（MITライセンス）が含まれます。HTML内に自動で入るライセンス表記は残してください。
