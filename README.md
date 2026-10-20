# gotanda-avenue

ブラウザで刺激を提示して反応を記録する実験のテンプレートです。
jsPsych 8 で実験を組み、Cloudflare Workers にデプロイし、結果を Cloudflare D1 に保存します。

作者: yandod

実験の中身は `experiment/` の中だけを編集します。コーディングエージェントに作らせる場合のルールは [AGENTS.md](AGENTS.md) にあります。

## 必要なもの

- Node.js 22.12 以上（`.node-version` は 22.14.0。nodenv なら自動で切り替わります）
- Cloudflare アカウント（デプロイするときだけ）

## はじめかた

```bash
npm install
npm run dev            # http://localhost:8787 で起動
```

`npm run dev` は、`vite build` で `dist/` を作り、ローカル D1 に未適用のテーブル定義（`migrations/`）を適用してから、`wrangler dev` で配信します。
テーブル定義だけを適用したいときは `npm run db:migrate` を使います。`.wrangler/` を消したあとなどに「no such table」と出たら、`npm run dev` を実行し直してください。
`experiment/` を書き換えたら、`Ctrl+C` で止めてからもう一度 `npm run dev` を実行してください。

### 動作確認

| URL | 意味 |
| --- | --- |
| `http://localhost:8787/` | 本番と同じ動き。データはローカル D1 に保存される |
| `http://localhost:8787/?preview=1` | データを保存せず、サーバーにも一切つながない |
| `...?preview=1&skip=practice` | プレビューで練習を飛ばす（本番では飛ばせない） |
| `...?preview=1&condition=B` | プレビューで参加者間条件を指定する |

```bash
npm run validate       # 実験定義のチェック（config、stimuli.csv、data の phase / stimulus_id など）
npm run typecheck      # 型のチェック
```

## フォルダ構成

```
experiment/        ← 実験の中身（ここだけ編集する）
  PROTOCOL.md        実験計画のメモ（学生と合意した内容）
  config.ts          実験ID、バージョン、条件、教示文、同意文
  timeline.ts        jsPsych のタイムライン
  stimuli.csv        刺激リスト（1 行 1 刺激）
  questionnaires.ts  事前・事後の質問紙
  assets/            画像・音声・動画（CSV からは assets/... で参照）
examples/          参考実装（stroop / rating / listening）
DESIGN.md          画面デザインの規定（色・文字・部品。教員が管理）
src/engine/        同意画面、データ送信、終了処理（ブラウザ側）。theme.css は DESIGN.md を CSS にしたもの
src/worker/        データを受け取る API（Cloudflare Workers、Hono）
migrations/        D1 のテーブル定義
scripts/           validate / export / status
```

例を試すには、`examples/` のフォルダの中身を `experiment/` にコピーし、`.ts` ファイルの中の `../../src/` を `../src/` に書き換えます。詳しくは [examples/README.md](examples/README.md) を見てください。

## デプロイ（学生が実行する）

```bash
npx wrangler login         # 初回のみ
npm run deploy             # ビルドして Cloudflare に公開する
npm run db:migrate:remote  # 本番 D1 にテーブルを作る（初回と、migrations を足したとき）
```

`wrangler.jsonc` に `database_id` は書いてありません。初回のデプロイで D1 が作られない場合は、次を実行してください。

```bash
npx wrangler d1 create gotanda-avenue
```

表示された `database_id` を `wrangler.jsonc` の `d1_databases` に書き足してから、もう一度デプロイします（`wrangler.jsonc` は原則編集しないファイルなので、教員に確認してください）。

## 結果を取り出す（学生が実行する）

結果をブラウザで見る画面はありません。URL を知っている人に結果を見られないよう、取り出しは CLI だけです。
実行できるのは、デプロイした Cloudflare アカウントでログインしている人だけです。

```bash
npm run status                 # 本番の参加人数・完了数・条件ごとの人数
npm run export                 # 本番の結果を results/ に CSV で保存
npm run export -- --version 2  # version を指定して保存

npm run status -- --local      # ローカル D1 を見る
npm run export:local           # ローカル D1 の結果を保存（動作確認用）
```

`results/` に 2 つの CSV ができます。UTF-8（BOM 付き）なので Excel でそのまま開けます。

- `*_trials.csv` … 1 行 1 試行。`participant_code`, `assigned_condition`（参加者間条件）, `phase`, `stimulus_id`, `condition`（その試行の条件）, `response`, `correct`, `rt` など。質問紙の回答は `response` に JSON 文字列で入る
- `*_sessions.csv` … 1 行 1 参加者。開始・完了の時刻

分析に使わない試行は `phase` が `filler` です。分析では `phase` が `main` の行を使い、練習は `practice`、質問紙は `questionnaire` で区別します。
`session_completed` が 1 の行は、最後の説明画面まで進んだ参加者のものです。

`results/` は `.gitignore` に入っています。CSV をコミットしたり、別の場所にコピーしたりしないでください。

## 画面の見た目

見た目の決まりは、ルートの [DESIGN.md](DESIGN.md)（色・文字・余白・部品。教員が管理）にあります。
それを CSS にしたものが `src/engine/theme.css` で、色やサイズは CSS 変数（`var(--color-primary)` など）として使います。

実験の中の HTML（教示など）では、色や文字サイズを直接書かず、DESIGN.md の部品クラスを使います。

| 使う場面 | クラス |
| --- | --- |
| 教示の文章 | `instruction-card` |
| キーの案内（F、Space など） | `key-hint` |
| 画面に 1 つだけ出すボタン（始める、次へ） | `button-primary`（`button_html` で付ける。例は `examples/rating/timeline.ts`） |
| 固視点 | `css_classes: ["fixation-cross"]` |
| 刺激を出す試行 | `css_classes: ["trial-stage"]` |
| 練習の正誤 | `feedback-correct` / `feedback-incorrect` |

- 試行画面の背景色・刺激の文字サイズ・刺激の領域は、`experiment/config.ts` の `display` で変えます。書き方は `config.ts` のコメントを見てください。同意・教示・質問紙の画面には効きません
- `css_classes` は、`#app` ではなく、その内側の `.jspsych-content` に付きます。背景色は engine が画面全体に塗ります
- アニメーション、ホバー効果、影、ダークモード対応は付けません。参加者の OS の設定にかかわらず、全員に同じ見た目で出ます
- スライダーの評定画面は、文字が大きくなりすぎるので `trial-stage` を付けません
- 刺激そのものの色（ストループ課題のインク色、画像の色）は、刺激なので直接書いてかまいません
- `npm run validate` は、`style` 属性に色（`#rrggbb`）や `px` が直接書かれていると警告します

## データの扱い

- 参加者の識別は、実験の開始時にサーバーが発行するランダムな `participant_code` だけです。氏名・学籍番号・メールアドレスなどを聞く項目は作らないでください
- 参加者間条件の割付は、サーバーが行います。同じ `id` と `version` で「開始した」人数が少ない条件に割り付けます（`assignment: "random"` ならランダム）
- 同意画面で「参加しない」を選んだ人、プレビューで開いた人の分は、保存されません
- `config.version` は、本番のデータ収集を始めたあとに内容を変えるときに、必ず 1 上げてください。新旧のデータが区別できなくなります
- 参加者のブラウザは、フォント・スタイル・画像などを `localhost` や自分のサイト以外からは読み込みません（Noto Sans は `dist/` に同梱しています）

## 仕組みのメモ

- `/api/session`（参加者コードと条件の発行）、`/api/trials`（試行データの受信）、`/api/complete`（完了の記録）の 3 つの POST だけがあります。データを返す API はありません
- 送信に失敗した試行は、ブラウザ側で間隔を空けて再送します。同じ試行が重複して保存されることはありません
- `phase` が `practice` のブロックだけを取り除く `?skip=practice` は、`preview=1` のときだけ有効です
- jsPsych では、親の timeline の `data` が子の `data` より優先されます。ブロックに `data: { phase: ... }` を付けると、中の試行もすべてその値になるので注意してください
