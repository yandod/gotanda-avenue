// 実験定義のチェック。
//   npm run validate                       experiment/ をチェック
//   npm run validate -- examples/stroop    別のフォルダをチェック
//
// エラーがあれば終了コード 1 で終わる。警告は確認してほしい点で、終了コードには影響しない。

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseStimuli } from "../src/engine/csv";
import type { ExperimentConfig, ExperimentContext, StimulusRow } from "../src/engine/types";

// jsPsych のプラグインは import した時点でブラウザの API を参照する。Node で読み込むための最小限の代用品
{
  const g = globalThis as Record<string, unknown>;
  const stub: unknown = new Proxy(function () {}, {
    get: (_t, prop) => (prop === Symbol.toPrimitive ? () => "" : stub),
    apply: () => stub,
    construct: () => stub as object,
  });
  g.window ??= globalThis;
  g.document ??= stub;
  for (const name of ["HTMLElement", "Element", "Node", "Event", "CustomEvent", "MutationObserver", "ResizeObserver"]) {
    g[name] ??= class {};
  }
}

const root = resolve(import.meta.dirname, "..");
const dir = resolve(root, process.argv[2] ?? "experiment");
const errors: string[] = [];
const warnings: string[] = [];
const error = (message: string) => errors.push(message);
const warn = (message: string) => warnings.push(message);

const PHASES = ["practice", "main", "questionnaire", "filler"];
const MEDIA_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|mp3|wav|ogg|m4a|mp4|webm|mov)$/i;
const PERSONAL_INFO = /氏名|名前|学籍番号|学生番号|メールアドレス|e-?mail|電話番号|住所/i;

function read(name: string): string | null {
  const path = resolve(dir, name);
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

async function load(name: string): Promise<Record<string, unknown> | null> {
  const path = resolve(dir, name);
  if (!existsSync(path)) {
    error(`${name} がありません。`);
    return null;
  }
  try {
    return (await import(pathToFileURL(path).href)) as Record<string, unknown>;
  } catch (e) {
    error(`${name} を読み込めません: ${(e as Error).message}`);
    return null;
  }
}

// --- config.ts -------------------------------------------------------------

const CSS_LENGTH = /^(\d+(\.\d+)?(px|rem|em|vw|vh|%)|auto)$/;

function checkDisplay(display: unknown) {
  if (display === undefined) return;
  if (typeof display !== "object" || display === null || Array.isArray(display)) {
    error("config.display はオブジェクトにしてください。");
    return;
  }
  const { background, stimulusFontSize, stimulusArea, ...rest } = display as Record<string, unknown>;
  for (const key of Object.keys(rest)) error(`config.display.${key} は使えません（background / stimulusFontSize / stimulusArea のみ）。`);

  if (background !== undefined && (typeof background !== "string" || !background.trim())) {
    error('config.display.background は CSS の色の文字列にしてください（例: "#808080"）。');
  }
  if (stimulusFontSize !== undefined) {
    const ok =
      (typeof stimulusFontSize === "number" && stimulusFontSize > 0) ||
      (typeof stimulusFontSize === "string" && CSS_LENGTH.test(stimulusFontSize) && stimulusFontSize !== "auto");
    if (!ok) error('config.display.stimulusFontSize は正の数（px）か、"64px" のような長さにしてください。');
  }
  if (stimulusArea !== undefined) {
    if (typeof stimulusArea !== "object" || stimulusArea === null || Array.isArray(stimulusArea)) {
      error("config.display.stimulusArea は { width, height } のオブジェクトにしてください。");
      return;
    }
    for (const [key, value] of Object.entries(stimulusArea as Record<string, unknown>)) {
      if (key !== "width" && key !== "height") error(`config.display.stimulusArea.${key} は使えません（width / height のみ）。`);
      else if (typeof value !== "string" || !CSS_LENGTH.test(value)) error(`config.display.stimulusArea.${key} は "600px" のような長さにしてください。`);
    }
  }
}

function checkConfig(config: ExperimentConfig) {
  if (typeof config.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(config.id)) {
    error("config.id は半角英数とハイフンだけで書いてください。");
  } else if (config.id === "template-sample") {
    warn('config.id が初期値の "template-sample" のままです。学生ごとに一意な値にしてください。');
  }
  if (!Number.isInteger(config.version) || config.version < 1) error("config.version は 1 以上の整数にしてください。");
  if (typeof config.title !== "string" || !config.title.trim()) error("config.title が空です。");
  if (!Array.isArray(config.conditions) || config.conditions.length === 0) {
    error('config.conditions が空です。参加者内のみなら ["default"] にしてください。');
  } else {
    if (new Set(config.conditions).size !== config.conditions.length) error("config.conditions に重複があります。");
    if (config.conditions.some((c) => typeof c !== "string" || !c)) error("config.conditions は空でない文字列の配列にしてください。");
  }
  if (config.assignment !== "balanced" && config.assignment !== "random") {
    error('config.assignment は "balanced" か "random" にしてください。');
  }
  if (typeof config.requireKeyboard !== "boolean") error("config.requireKeyboard は true / false にしてください。");
  if (typeof config.estimatedMinutes !== "number" || !(config.estimatedMinutes > 0)) {
    error("config.estimatedMinutes は 0 より大きい数にしてください。");
  }
  checkDisplay(config.display);
  for (const key of ["consentText", "debriefText"] as const) {
    const text = config[key];
    if (typeof text !== "string" || !text.trim()) error(`config.${key} が空です。`);
    else if (text.includes("【下書き】")) warn(`config.${key} に「【下書き】」が残っています。学生と教員が確認して書き換えてください。`);
  }
}

// --- stimuli.csv -----------------------------------------------------------

function checkStimuli(stimuli: StimulusRow[]): { usesAssets: boolean } {
  let usesAssets = false;
  if (stimuli.length === 0) {
    warn("stimuli.csv に刺激がありません。");
    return { usesAssets };
  }
  if (!("id" in stimuli[0])) {
    error("stimuli.csv に id 列がありません。");
    return { usesAssets };
  }
  const seen = new Set<string>();
  stimuli.forEach((row, i) => {
    const line = i + 2;
    if (!row.id) error(`stimuli.csv ${line} 行目: id が空です。`);
    else if (seen.has(row.id)) error(`stimuli.csv ${line} 行目: id "${row.id}" が重複しています。`);
    seen.add(row.id);

    for (const [column, value] of Object.entries(row)) {
      if (column === "id" || !value) continue;
      if (/^assets\//.test(value)) {
        usesAssets = true;
        if (!existsSync(resolve(dir, value))) error(`stimuli.csv ${line} 行目: ${column} のファイル "${value}" が見つかりません。`);
      } else if (MEDIA_EXTENSIONS.test(value)) {
        warn(`stimuli.csv ${line} 行目: ${column} の "${value}" は assets/ から始まるパスにしてください。`);
      }
    }
  });
  return { usesAssets };
}

// --- ソースの静的チェック --------------------------------------------------

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function checkSources() {
  const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };
  const installed = new Set(Object.keys(packageJson.dependencies ?? {}));

  for (const name of ["config.ts", "timeline.ts", "questionnaires.ts"]) {
    const source = read(name);
    if (source === null) continue;
    const code = stripComments(source);

    for (const match of code.matchAll(/from\s+["'](@jspsych\/plugin-[^"']+|jspsych)["']/g)) {
      if (!installed.has(match[1])) error(`${name}: ${match[1]} が package.json にありません（npm install ${match[1]}）。`);
    }
    if (name === "config.ts") continue;

    for (const [pattern, label] of [
      [/\bfetch\s*\(/, "fetch()"],
      [/XMLHttpRequest/, "XMLHttpRequest"],
      [/sendBeacon/, "sendBeacon"],
      [/\binitJsPsych\s*\(/, "initJsPsych()"],
      [/\.run\s*\(/, "jsPsych.run()"],
    ] as const) {
      if (pattern.test(code)) error(`${name}: ${label} は使えません。送信や起動は src/engine/ が行います。`);
    }
    // style 属性に、色（#rrggbb）や px の値が直接書かれていないか。${...} で埋め込む色（刺激そのものの色）は対象外
    for (const match of code.matchAll(/style\s*=\s*["'`]([^"'`]*)["'`]/g)) {
      const style = match[1].replace(/\$\{[^}]*\}/g, "");
      if (/#[0-9a-fA-F]{3,8}\b|\d\s*px\b/.test(style)) {
        warn(`${name}: style 属性に色や px が直接書かれています（"${match[1].slice(0, 40)}"）。ルートの DESIGN.md の部品クラスを使ってください。`);
      }
    }
    if (PERSONAL_INFO.test(code)) {
      warn(`${name}: 個人情報を聞く項目になっていませんか（氏名・学籍番号・メールアドレスなどは集めません）。`);
    }
  }
}

// --- タイムラインを組み立てて data を調べる --------------------------------

type Node = Record<string, unknown> & { timeline?: unknown; type?: { info?: { name?: string } }; data?: unknown };

function fakeJsPsych() {
  const fallback: unknown = new Proxy(function () {}, {
    get: (_t, prop) => (prop === Symbol.toPrimitive ? () => "" : fallback),
    apply: () => fallback,
  });
  return new Proxy(
    {
      timelineVariable: (name: string) => ({ timelineVariable: name }),
      evaluateTimelineVariable: () => "",
      randomization: {
        shuffle: <T>(array: T[]) => array,
        sampleWithoutReplacement: <T>(array: T[], n: number) => array.slice(0, n),
        sampleWithReplacement: <T>(array: T[], n: number) => array.slice(0, n),
        repeat: <T>(array: T[], n: number) => Array.from({ length: n }, () => array).flat(),
      },
    } as Record<string, unknown>,
    { get: (target, prop) => (prop in target ? target[prop as string] : fallback) },
  );
}

function checkNodes(nodes: unknown, inherited: Record<string, unknown>, path: string, stimulusIds: Set<string>, found: { preload: boolean }) {
  if (!Array.isArray(nodes)) {
    error(`${path}: タイムラインは配列にしてください。`);
    return;
  }
  nodes.forEach((raw, i) => {
    const node = raw as Node;
    const here = `${path}[${i}]`;
    const ownData = typeof node.data === "object" && node.data !== null ? (node.data as Record<string, unknown>) : null;
    const dynamicData = typeof node.data === "function";
    // jsPsych は親の data を子の data に重ねる。同じキーなら親が勝つ（子の指定は上書きされる）
    const merged = { ...(ownData ?? {}), ...inherited };

    if (Array.isArray(node.timeline)) {
      // 親が data を関数で持つと中身を静的に調べられないので、子には何も引き継がない
      checkNodes(node.timeline, dynamicData ? inherited : merged, `${here}.timeline`, stimulusIds, found);
      return;
    }
    const typeName = node.type?.info?.name ?? "不明";
    if (typeName === "preload") found.preload = true;
    if (dynamicData) return; // 関数で作るデータは静的には調べられない

    const phase = merged.phase;
    if (phase === undefined) {
      error(`${here}（${typeName}）: data.phase がありません。分析に使わない試行は data: { phase: "filler" } にしてください。`);
      return;
    }
    if (typeof phase === "string" && !PHASES.includes(phase)) {
      error(`${here}（${typeName}）: data.phase "${phase}" は ${PHASES.join(" / ")} のどれかにしてください。`);
    }
    if (phase !== "filler") {
      const id = merged.stimulus_id;
      if (id === undefined) {
        error(`${here}（${typeName}）: data.stimulus_id がありません。`);
      } else if (typeof id === "string" && phase !== "questionnaire" && !stimulusIds.has(id)) {
        warn(`${here}（${typeName}）: stimulus_id "${id}" が stimuli.csv の id にありません。`);
      }
    }
  });
}

function dryRunTimeline(buildTimeline: (ctx: ExperimentContext) => unknown, config: ExperimentConfig, stimuli: StimulusRow[], usesAssets: boolean) {
  const ctx = {
    jsPsych: fakeJsPsych(),
    condition: config.conditions?.[0] ?? "default",
    stimuli,
    isPreview: true,
  } as unknown as ExperimentContext;

  let timeline: unknown;
  try {
    timeline = buildTimeline(ctx);
  } catch (e) {
    warn(`buildTimeline を試しに実行できませんでした（phase / stimulus_id の確認は省略）: ${(e as Error).message}`);
    return;
  }
  const found = { preload: false };
  checkNodes(timeline, {}, "timeline", new Set(stimuli.map((s) => s.id)), found);
  if (usesAssets && !found.preload) {
    warn("画像・音声・動画を使っていますが、タイムラインに @jspsych/plugin-preload がありません（先頭に入れてください）。");
  }
}

// --- 実行 ------------------------------------------------------------------

console.log(`チェック対象: ${dir}\n`);

if (!existsSync(dir)) {
  console.error(`${dir} がありません。`);
  process.exit(1);
}

const configModule = await load("config.ts");
const timelineModule = await load("timeline.ts");
const questionnaireModule = await load("questionnaires.ts");

const config = configModule?.config as ExperimentConfig | undefined;
if (configModule && !config) error("config.ts が config を export していません。");
if (config) checkConfig(config);

let stimuli: StimulusRow[] = [];
const csv = read("stimuli.csv");
if (csv === null) error("stimuli.csv がありません。");
else stimuli = parseStimuli(csv);
const { usesAssets } = checkStimuli(stimuli);

const buildTimeline = timelineModule?.buildTimeline;
if (timelineModule && typeof buildTimeline !== "function") error("timeline.ts が buildTimeline を export していません。");
for (const name of ["preQuestionnaire", "postQuestionnaire"]) {
  if (questionnaireModule && typeof questionnaireModule[name] !== "function") error(`questionnaires.ts が ${name} を export していません。`);
}

checkSources();
if (config && typeof buildTimeline === "function") {
  dryRunTimeline(buildTimeline as (ctx: ExperimentContext) => unknown, config, stimuli, usesAssets);
}

const protocol = read("PROTOCOL.md");
if (protocol === null) error("PROTOCOL.md がありません。");
else if (protocol.includes("（未記入）")) warn("PROTOCOL.md に「（未記入）」の項目が残っています。");

for (const message of errors) console.log(`✗ エラー: ${message}`);
for (const message of warnings) console.log(`△ 警告: ${message}`);
if (config) {
  console.log(`\n実験ID: ${config.id} / version ${config.version} / 条件 ${config.conditions?.join(", ")} / 刺激 ${stimuli.length} 件`);
}
console.log(errors.length === 0 ? `\n✓ エラーはありません（警告 ${warnings.length} 件）` : `\nエラー ${errors.length} 件、警告 ${warnings.length} 件`);
process.exit(errors.length === 0 ? 0 : 1);
