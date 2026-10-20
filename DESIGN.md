---
version: alpha
name: experiment-template-design
description: ブラウザ実験テンプレートの画面デザイン。配色は Notion の紫と暖色寄りのグレーをもとにしている。刺激を主役にし、UI は目立たせない。同意・教示・試行・質問紙・終了の5種類の画面で共通の見た目を保ち、参加者間で表示条件をそろえる。

colors:
  primary: "#5645d4"
  primary-pressed: "#4534b3"
  on-primary: "#ffffff"
  canvas: "#ffffff"
  surface: "#f6f5f4"
  hairline: "#e5e3df"
  hairline-strong: "#c8c4be"
  ink: "#1a1a1a"
  ink-secondary: "#5d5b54"
  trial-canvas: "#ffffff"
  trial-ink: "#000000"
  fixation: "#000000"
  focus-ring: "#5645d4"
  feedback-correct: "#0075de"
  feedback-incorrect: "#5d5b54"
  error: "#c92a2a"

typography:
  heading-1:
    fontFamily: Noto Sans JP
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.4
  heading-2:
    fontFamily: Noto Sans JP
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: Noto Sans JP
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.8
  body-sm:
    fontFamily: Noto Sans JP
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.7
  caption:
    fontFamily: Noto Sans JP
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: Noto Sans JP
    fontSize: 17px
    fontWeight: 500
    lineHeight: 1.3
  key-hint:
    fontFamily: Noto Sans Mono
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.3
  stimulus-text:
    fontFamily: Noto Sans JP
    fontSize: 48px
    fontWeight: 500
    lineHeight: 1.3
  fixation:
    fontFamily: Noto Sans Mono
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1.0

rounded:
  sm: 4px
  md: 8px
  lg: 12px

spacing:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px

components:
  page:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "{spacing.xxl} {spacing.lg}"
  heading:
    textColor: "{colors.ink}"
    typography: "{typography.heading-1}"
  caption-text:
    textColor: "{colors.ink-secondary}"
    typography: "{typography.caption}"
  outline:
    backgroundColor: "{colors.hairline-strong}"
    height: 1px
  outline-soft:
    backgroundColor: "{colors.hairline}"
    height: 1px
  outline-focused:
    backgroundColor: "{colors.focus-ring}"
    height: 2px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
    height: 52px
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-primary-disabled:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.ink-secondary}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "14px 28px"
    height: 52px
  response-button:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "14px 20px"
    height: 56px
  response-button-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  instruction-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  consent-box:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  key-hint:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.key-hint}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  trial-stage:
    backgroundColor: "{colors.trial-canvas}"
    textColor: "{colors.trial-ink}"
    typography: "{typography.stimulus-text}"
  fixation-cross:
    backgroundColor: "{colors.trial-canvas}"
    textColor: "{colors.fixation}"
    typography: "{typography.fixation}"
  feedback-correct:
    backgroundColor: "{colors.trial-canvas}"
    textColor: "{colors.feedback-correct}"
    typography: "{typography.heading-2}"
  feedback-incorrect:
    backgroundColor: "{colors.trial-canvas}"
    textColor: "{colors.feedback-incorrect}"
    typography: "{typography.heading-2}"
  likert-option:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  likert-option-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    height: 48px
  progress-bar:
    backgroundColor: "{colors.hairline}"
    rounded: "{rounded.sm}"
    height: 6px
  progress-bar-fill:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    height: 6px
  completion-code:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.heading-2}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  error-message:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.error}"
    typography: "{typography.body-sm}"
---

# 実験テンプレートのデザインシステム

## このファイルの読み方

- 先頭の `---` で囲まれた部分は、色・文字・余白・部品の **設定値（トークン）** です。エージェントとツールが読むため、キー名は英語のままにしています
- `{colors.primary}` のような書き方は「`colors` の `primary` の値を使う」という参照です
- この下の本文は、設定値をどう使うかの説明です。人もエージェントもここを読んで判断します
- 設定値は `src/engine/theme.css` で CSS 変数（例: `--color-primary`）として実装されています。画面を作るときは色やサイズを直接書かず、この変数を使ってください

## 基本方針

このテンプレートの画面は、商品ページやアプリとは目的が違います。**参加者の注意を刺激に向け、UI のデザインが実験結果に影響しないこと** を最優先にします。

1. **刺激が主役** — 試行画面（`trial-stage`）には刺激と、必要なら反応キーの案内だけを置く。ロゴ、装飾、説明文を常時表示しない
2. **全員に同じ見た目** — 参加者の OS 設定（ダークモードなど）で表示を変えない。`prefers-color-scheme` には反応させない
3. **動きを入れない** — 画面切り替えのフェードやアニメーション、ホバー効果を付けない。表示のタイミングが刺激提示時間に混ざるため
4. **色に意味を持たせすぎない** — UI に赤と緑を使わない。正誤フィードバックや刺激の色と混ざって、プライミングや交絡の原因になる
5. **読みやすさ** — 教示文や同意文は 18px・行間 1.8 を基本にし、1 画面の文章量を抑える

## 画面の種類

| 画面 | 使う部品 | 注意 |
|---|---|---|
| 同意 | `page`, `consent-box`, `button-primary` | 同意ボタンは同意文の下に置く。最後までスクロールしないと押せない設定にできる |
| 教示 | `page`, `instruction-card`, `key-hint`, `button-primary` | 反応キーは `key-hint` で `F` `J` のように示す。1 画面に 1 つの話題 |
| 試行 | `trial-stage`, `fixation-cross` | ボタンや進捗表示は置かない（反応ボタン型の課題を除く） |
| 練習のフィードバック | `trial-stage`, `feedback-correct`, `feedback-incorrect` | 「正解」「不正解」を文字で出す。色だけで伝えない |
| 質問紙 | `page`, `likert-option`, `text-input`, `button-primary` | リッカートは横一列。スマホ幅では縦に並べる |
| 終了 | `page`, `completion-code` | 取り下げ用コードを大きく表示し、控えるよう促す |

## 色

配色は Notion のサイトの紫（`#5645d4`）と、暖色寄りのグレーをもとにしています。

- **primary**（`#5645d4`、紫）: 「次へ」「同意する」など、進むためのボタンと選択中の状態だけに使う。本文や広い背景には使わない
- **canvas / surface**: 画面の背景（白）と、教示カードやキー表示などの面（ごく薄いグレー）
- **hairline / hairline-strong**: 枠線と区切り線の色（下の「枠線」を参照）
- **ink / ink-secondary**: 本文と、補足・無効状態の文字
- **trial-canvas / trial-ink**: 試行画面の背景と刺激テキストの色。初期値は白背景・黒文字。灰色背景にしたい実験では `experiment/config.ts` の `display.background` で変える（このファイルは編集しない）
- **feedback-correct / feedback-incorrect**: 練習試行の正誤表示用。青と灰色にしている（赤・緑を避けるため）。本試行ではフィードバックを出さないのが基本
- **error**: 入力漏れなどのフォームエラーだけに使う。試行画面では使わない

## 枠線

lint ツールの仕様上、部品の設定値に枠線を書けないため、枠線は `outline` 系の部品として定義しています。`backgroundColor` が線の色、`height` が線の太さです。

| 枠線 | 付ける部品 |
|---|---|
| `outline`（1px, hairline-strong） | `button-secondary`, `response-button`, `key-hint`, `likert-option`, `text-input`, `completion-code`（点線） |
| `outline-soft`（1px, hairline） | `consent-box` |
| `outline-focused`（2px, primary） | フォーカス中の `text-input` などすべての操作可能な部品。選択中の `response-button` と `likert-option` は枠も primary にする |

## 文字

- 書体は **Noto Sans JP** をテンプレートに同梱し、開始前に読み込む。端末ごとの標準フォントに任せると、OS によって刺激の見た目が変わるため（Notion 自身の書体は配布されていないので使わない）
- `stimulus-text`（48px）は刺激テキストの初期値。変更は `config.ts` の `display.stimulusFontSize` で行う
- px 指定は画面の物理サイズまでは揃えない。視角を厳密に統制する実験には向かないことを、必要に応じて学生に伝える
- 固視点（`+`）とキー表示には等幅の **Noto Sans Mono** を使う

## 部品の使い分け

**ボタン**
- `button-primary`: 画面ごとに 1 つまで。高さ 52px で、スマホでも押しやすくする
- `button-secondary`: 「戻る」など補助的な操作。実験中は原則使わない（戻ると試行順が崩れるため）
- `response-button`: 反応をボタンで取る課題用。選択肢は同じ大きさ・同じ見た目にし、位置で偏りが出ないよう左右の順をカウンターバランスする

**入力**
- `likert-option`: 両端に言葉のラベル（例:「まったく当てはまらない」「とても当てはまる」）を付ける。中間の数字だけのラベルは省略してよい
- `text-input`: 自由記述。必須にするかは質問ごとに決める

**その他**
- `key-hint`: キー名を枠で囲んで示す
- `progress-bar` / `progress-bar-fill`: ブロック間の休憩画面だけに出す。試行画面には出さない
- `completion-code`: 終了画面のコード表示。選択してコピーしやすいようにする

## やること・やらないこと

### やること
- 色・サイズ・余白は必ずトークン（CSS 変数）から取る
- 試行画面の刺激は画面中央に置き、試行間で位置を変えない（位置が独立変数の場合を除く）
- 教示文は短い段落に分け、反応キーは `key-hint` で示す
- フォーカスリング（`outline-focused`）を消さない。キーボードで操作する参加者がいる

### やらないこと
- アニメーション、トランジション、ホバー効果を付けない
- ダークモード対応をしない（全員同じ表示にするため）
- UI に赤・緑を使わない
- 試行画面にロゴ、進捗、説明文を常時表示しない
- 影（box-shadow）を付けない
- 外部のフォントや画像を CDN から読み込まない。読み込み遅延が刺激提示に影響するため、すべて同梱する

## 画面幅

| 幅 | 主な変化 |
|---|---|
| 768px 未満（スマホ） | 余白を `spacing.md` に縮める。リッカートは縦並び。キー反応の課題は開始前に止める（`requireKeyboard`） |
| 768px 以上 | 本文の最大幅は 720px で中央寄せ。試行画面は全幅 |

## 変更の手順

1. このファイルは教員が管理する。学生とエージェントは編集しない
2. 実験ごとの見た目の調整は `experiment/config.ts` の `display` で行う（背景色、刺激の文字サイズ、刺激の表示領域）
3. このファイルを変えたら `npx @google/design.md lint DESIGN.md` で確認し、`src/engine/theme.css` を更新する
