# AGENTS.md

このリポジトリは、ブラウザで刺激を提示して反応を記録する実験のテンプレートです。
学生が自分の実験に合わせて改造し、Cloudflare Workers にデプロイして使います。
あなた（コーディングエージェント）の役割は、学生の実験設計を **`experiment/` の中だけ** で実装することです。

作者: yandod

---

## 1. 最初にやること

コードを書く前に、学生に次の項目を確認してください。分からない項目があれば質問し、推測で埋めないでください。

1. 何を調べる実験か（仮説・問い）
2. 独立変数と水準（例: 色と文字が一致／不一致）
3. 参加者内か参加者間か。参加者間ならカウンターバランスの方法
4. 刺激の種類と数（テキスト・画像・音声・動画）
5. 反応の取り方（キー、ボタン、リッカート、VAS、自由記述）と測る値（正誤、反応時間、評定値）
6. 1試行の流れ（固視点 → 刺激 → 反応 → 間隔 など）と各時間（ms）
7. 練習試行の有無、試行数、ブロック構成、ランダム化の単位
8. 事前・事後の質問紙

確認した内容は `experiment/PROTOCOL.md` に書き出し、学生の了承を得てから実装に入ります。
設計を変えるときも、先に `PROTOCOL.md` を更新してください。

（ルートの `DESIGN.md` は画面デザインの規定で、実験計画とは別のファイルです）

---

## 2. 構成

```
.
├── AGENTS.md              # このファイル
├── DESIGN.md              # 画面デザインの規定（色・文字・部品。編集しない）
├── wrangler.jsonc         # Cloudflare 設定（原則編集しない）
├── migrations/            # D1 のスキーマ（編集しない）
├── src/
│   ├── worker/            # データ受信 API（編集しない）
│   └── engine/            # jsPsych の起動、同意画面、データ送信、終了処理（編集しない）
├── experiment/            # ★ ここだけを編集する
│   ├── PROTOCOL.md        # 実験計画のメモ（学生と合意した内容）
│   ├── config.ts          # 実験ID、バージョン、条件、教示文、同意文など
│   ├── timeline.ts        # jsPsych のタイムライン本体
│   ├── stimuli.csv        # 刺激リスト（1行1刺激）
│   ├── questionnaires.ts  # 事前・事後の質問紙
│   └── assets/            # 画像・音声・動画
├── examples/              # 参考実装（読むだけ。編集しない）
│   ├── stroop/            # 反応時間課題
│   ├── rating/            # 画像の印象評定
│   └── listening/         # 音楽聴取＋主観評価
└── scripts/               # CLI 用スクリプト（編集しない）
    ├── validate.ts        # 実験定義のチェック
    ├── export.ts          # D1 から結果を CSV に書き出す
    └── status.ts          # 参加人数・完了数・条件ごとの人数を表示
```

### 編集してよい範囲

- `experiment/` 以下のすべて
- 必要な jsPsych プラグインを `package.json` に追加すること（`@jspsych/plugin-*` のみ）

### 編集してはいけない範囲

- `src/`、`migrations/`、`wrangler.jsonc`、`scripts/`、`examples/`、`DESIGN.md`
- どうしても必要だと判断した場合は、変更せずに学生へ理由を説明し、教員に相談するよう伝えてください

新しい実装を始めるときは、まず `examples/` から最も近いものを読み、その書き方に合わせてください。

### 画面の見た目

- 教示や質問紙などの HTML を書くときは、ルートの `DESIGN.md` に従ってください。色・文字サイズ・余白は `src/engine/theme.css` の CSS 変数（`var(--color-primary)` など）を使い、値を直接書かないでください
- 部品は `DESIGN.md` の `components` にあるクラス名（`instruction-card`、`key-hint`、`likert-option` など）を使います
- アニメーション、ホバー効果、影、ダークモード対応を追加しないでください
- 試行画面の背景色や刺激の文字サイズを変えたいときは、`experiment/config.ts` の `display` で設定します

---

## 3. 技術スタック

- エンジン: jsPsych 8 系（プラグインは `@jspsych/plugin-*` 2 系）
- ビルド: Vite（`experiment/` と `src/engine/` をまとめて静的アセットに出力）
- 配信と API: Cloudflare Workers（静的アセット配信＋`/api/*`）
- 保存: Cloudflare D1
- 結果の取り出しと進捗確認: CLI のみ（`npm run export` / `npm run status`）。内部で `wrangler d1 execute --remote` を使うため、デプロイした Cloudflare アカウントでログインしている人だけが実行できる

### Web に管理画面を作らない

- 収集したデータを返す HTTP エンドポイント（一覧、CSV ダウンロード、集計表示など）を追加しないでください。URL を知っている人なら誰でも結果を見られる状態になります
- `/api/*` は参加者のブラウザからデータを **受け取る** だけです
- 学生から「Web で結果を見たい」と頼まれた場合も実装せず、`npm run export` / `npm run status` を案内してください

jsPsych の初期化（`initJsPsych`）や `jsPsych.run` は `src/engine/` が行います。
`experiment/timeline.ts` はタイムラインの配列を **export するだけ** にしてください。

```ts
// experiment/timeline.ts
import type { ExperimentContext } from "../src/engine/types";

export function buildTimeline(ctx: ExperimentContext) {
  // ctx.jsPsych, ctx.condition, ctx.stimuli, ctx.isPreview が使える
  return [ /* 試行やサブタイムライン */ ];
}
```

---

## 4. データのルール

データは 1 試行ごとに `src/engine/` が自動で `/api/trials` に送ります。送信処理を自分で書かないでください。

### すべての記録対象の試行に付ける `data`

```ts
data: {
  phase: "practice" | "main" | "questionnaire",
  stimulus_id: "s01",      // stimuli.csv の id 列と一致させる
  condition: "congruent",  // その試行の条件
  correct_response: "f",   // 正解がある課題のみ
}
```

- 正誤は `on_finish` で `data.correct = (data.response === data.correct_response)` のように計算します
- 固視点や試行間間隔など、分析に使わない試行には `data: { phase: "filler" }` を付けます
- 列名は `snake_case` にし、既存の列名（`rt`, `response`, `trial_index`, `time_elapsed` など jsPsych 標準のもの）を上書きしないでください
- 上記以外の値も `data` に入れてかまいません。D1 では `data_json` 列に丸ごと保存され、CSV 出力時に列として展開されます

### 個人情報

- 氏名、学籍番号、メールアドレス、顔写真などを収集する項目を作らないでください
- 参加者の識別は engine が発行するランダムな `participant_code` で行います
- 年齢などの属性を聞く場合は、範囲での選択肢（例: 18–19, 20–21, 22以上）にします

---

## 5. 刺激

- 刺激は `experiment/stimuli.csv` に 1 行 1 刺激で書きます。最低限 `id` 列を持たせ、条件や正解も列にします
- 画像・音声・動画は `experiment/assets/` に置き、CSV からは相対パス（例: `assets/img/apple.png`）で参照します
- 画像・音声・動画を使う場合は、タイムラインの先頭に `@jspsych/plugin-preload` を入れます
- 大きい動画ファイルはリポジトリに入れず、教員に R2 への配置を相談するよう学生に伝えてください
- 他人が著作権を持つ音源・画像を使う場合は、利用条件を学生に確認してください

---

## 6. タイミングと環境

- 反応時間はブラウザ上ではフレーム単位（60Hz で約 17ms）の精度が上限です。それより細かい差を主張する設計になっていたら学生に伝えてください
- 音声を使う実験は、最初にクリックを求める画面を入れてください（自動再生の制限対策）。engine の同意画面がこれを兼ねます
- キー反応の実験は PC 前提です。`config.ts` の `requireKeyboard: true` を設定すると、スマホからのアクセスは開始前に止まります
- 全画面化が必要なら `@jspsych/plugin-fullscreen` を使います

---

## 7. config.ts で必ず設定する項目

```ts
export const config = {
  id: "stroop-2026-tanaka",   // 半角英数とハイフン。学生ごとに一意
  version: 1,                  // 本番データ収集開始後に内容を変えたら必ず +1
  title: "色と文字の実験",
  conditions: ["A", "B"],      // 参加者間条件。参加者内のみなら ["default"]
  assignment: "balanced",      // "balanced"（人数が均等になるよう割付）| "random"
  requireKeyboard: true,
  estimatedMinutes: 10,
  consentText: "...",          // 同意文。学生が書く（エージェントは下書きまで）
  debriefText: "...",          // 終了時の説明文
};
```

- `version` を上げないまま内容を変えると、新旧のデータが区別できなくなります。本番開始後の変更では必ず上げてください
- 同意文と終了時の説明文は、エージェントが下書きを作り、最終的な文面は学生と教員が確認します

---

## 8. コマンド

```bash
npm install
npm run dev            # ローカルで起動（ローカル D1 を使用）
npm run validate       # 実験定義のチェック
npm run db:migrate     # ローカル D1 にスキーマを適用（初回のみ）
npm run deploy         # Cloudflare にデプロイ（学生が実行する）

npm run status         # 本番の参加人数・完了数・条件ごとの人数（学生が実行する）
npm run export         # 本番の結果を results/ に CSV で保存（学生が実行する）
npm run export:local   # ローカル D1 の結果を CSV で保存（動作確認用）
```

- `http://localhost:8787/?preview=1` でデータを保存せずに通しで試せます。`?preview=1&skip=practice` で練習を飛ばせます
- 出力される CSV の列が意図どおりか確かめるときは、`?preview=1` を付けずにローカルで 1 回通してから `npm run export:local` を使ってください
- デプロイ（`npm run deploy`）と本番 D1 に触れる操作（`status`、`export`、`--remote` 付きの wrangler コマンド）は、エージェントが実行せず学生に任せてください。本番データには参加者の回答が含まれます
- `results/` は `.gitignore` 済みです。CSV をコミットしたり、リポジトリ内の別の場所にコピーしたりしないでください

---

## 9. 作業を終える前のチェック

次をすべて満たしてから、学生に完了を報告してください。

- [ ] `npm run validate` がエラーなしで通る
- [ ] `npm run dev` で起動し、`?preview=1` で最初から最後まで通せる
- [ ] 試行数、条件の割付、ランダム化が `PROTOCOL.md` のとおりになっている
- [ ] 画面の色やサイズを直接書いていない（`DESIGN.md` の CSS 変数とクラスを使っている）
- [ ] 記録対象の試行すべてに `phase` と `stimulus_id` が付いている
- [ ] 刺激ファイルがすべて読み込める（ブラウザのコンソールに 404 が出ない）
- [ ] `src/`、`migrations/`、`wrangler.jsonc`、`scripts/` を変更していない（`git diff --stat` で確認）
- [ ] データを返す HTTP エンドポイントを追加していない
- [ ] 本番開始後の変更なら `config.version` を上げた

報告では、何を実装したか、学生が確認すべき点（教示文、同意文、試行時間など）を短くまとめてください。

---

## 10. 学生とのやりとり

- 学生はプログラミングに慣れていない場合があります。専門用語は短く説明を添えてください
- 実験デザイン上の問題（条件の交絡、順序効果、試行数の不足など）に気づいたら、実装する前に指摘してください。決めるのは学生です
- 分からないことを推測で実装せず、質問してください
