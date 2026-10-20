import { initJsPsych } from "jspsych";
import htmlButtonResponse from "@jspsych/plugin-html-button-response";
// 見た目: 外部ライブラリの CSS を先に読み込み、DESIGN.md の theme.css を最後に読み込んで上書きする
import "jspsych/css/jspsych.css";
import "@jspsych/plugin-survey/css/survey.css";
import "./theme.css";

import { config } from "../../experiment/config";
import { postQuestionnaire, preQuestionnaire } from "../../experiment/questionnaires";
import stimuliCsv from "../../experiment/stimuli.csv?raw";
import { buildTimeline } from "../../experiment/timeline";
import { createNullSink, createRemoteSink, startSession, type Session } from "./api";
import { parseStimuli } from "./csv";
import { collectText, loadFonts } from "./fonts";
import type { DisplayConfig, ExperimentContext } from "./types";
import { escapeHtml, showConsent, showEnd, showMessage } from "./ui";

const params = new URLSearchParams(location.search);
const isPreview = params.get("preview") === "1";
// 練習を飛ばせるのはプレビューのときだけ（参加者が飛ばせないようにする）
const skipPractice = isPreview && params.get("skip") === "practice";

const app = document.getElementById("app")!;
document.title = config.title;

// engine 自身が出す文言。フォントを先に読み込むために、まとめて持っておく
const ENGINE_TEXT =
  "パソコンで開いてください この実験はキーボードを使うため、スマートフォンやタブレットでは参加できません。" +
  "パソコンのブラウザでこのページを開き直してください。同意して参加する参加しない所要時間の目安: 約 分" +
  "ありがとうございました参加しないことを選びました。このページは閉じて構いません。" +
  "接続できませんでした サーバーに接続できませんでした。通信状況を確認して、ページを読み込み直してください。" +
  "エラーが発生しました問題が起きました。ページを読み込み直してください。" +
  "プレビュー（データは保存されません）／条件:練習スキップ" +
  "ご協力ありがとうございました実験は終了しました。参加者コード（データの取り下げを希望するときに必要です。控えてください）終了";

/** 空行で区切って段落（<p>）にする。段落の中の改行は <br> にする */
function toParagraphs(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function looksLikeMobile(): boolean {
  const ua = navigator.userAgent;
  const isIpadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || isIpadOs;
}

/** config.display を CSS 変数にして、試行画面（trial-stage）に反映する */
function applyDisplay(display: DisplayConfig | undefined) {
  if (!display) return;
  const style = document.documentElement.style;
  if (display.background) style.setProperty("--display-background", display.background);
  if (display.stimulusFontSize !== undefined) {
    const size = typeof display.stimulusFontSize === "number" ? `${display.stimulusFontSize}px` : display.stimulusFontSize;
    style.setProperty("--display-stimulus-font-size", size);
  }
  if (display.stimulusArea?.width) style.setProperty("--display-stimulus-width", display.stimulusArea.width);
  if (display.stimulusArea?.height) style.setProperty("--display-stimulus-height", display.stimulusArea.height);
}

/** プレビュー用の割付。サーバーには問い合わせない（本番の人数が偏らないように） */
function previewSession(): Session {
  const wanted = params.get("condition");
  const list = config.conditions;
  const condition = wanted && list.includes(wanted) ? wanted : list[Math.floor(Math.random() * list.length)];
  return { participant_code: "PREVIEW", condition };
}

type Node = { timeline?: Node[]; data?: { phase?: unknown } } & Record<string, unknown>;

/** ノードの下にある各試行の phase を集める。jsPsych と同じく、親の data.phase が子より優先される */
function collectPhases(node: Node, inherited?: unknown): unknown[] {
  const own = typeof node.data === "object" && node.data !== null ? node.data.phase : undefined;
  const phase = inherited ?? own;
  return Array.isArray(node.timeline) ? node.timeline.flatMap((child) => collectPhases(child, phase)) : [phase];
}

/** 練習だけでできたブロック（または試行）を取り除く。本番や質問紙が混ざるブロックは、中の練習だけ取り除く */
function dropPractice(nodes: Node[]): Node[] {
  return nodes.flatMap((node) => {
    const phases = collectPhases(node);
    if (!phases.includes("practice")) return [node];
    if (!phases.some((p) => p === "main" || p === "questionnaire")) return [];
    return [{ ...node, timeline: dropPractice(node.timeline ?? []) }];
  });
}

async function main() {
  applyDisplay(config.display);
  const stimuli = parseStimuli(stimuliCsv);

  // 書体は同意画面の前に読み込む（実験の途中で書体が切り替わらないように）
  const fontText = collectText([config, stimuli, ENGINE_TEXT]);
  await loadFonts(fontText);

  if (config.requireKeyboard && looksLikeMobile()) {
    showMessage(
      app,
      "パソコンで開いてください",
      "この実験はキーボードを使うため、スマートフォンやタブレットでは参加できません。\nパソコンのブラウザでこのページを開き直してください。",
    );
    return;
  }

  const agreed = await showConsent(app, {
    title: config.title,
    estimatedMinutes: config.estimatedMinutes,
    consentText: config.consentText,
  });
  if (!agreed) {
    showMessage(app, "ありがとうございました", "参加しないことを選びました。このページは閉じて構いません。");
    return;
  }

  let session: Session;
  try {
    session = isPreview ? previewSession() : await startSession();
  } catch {
    showMessage(app, "接続できませんでした", "サーバーに接続できませんでした。通信状況を確認して、ページを読み込み直してください。", true);
    return;
  }

  const sink = isPreview ? createNullSink() : createRemoteSink(session.participant_code);

  app.replaceChildren();
  if (isPreview) {
    const banner = document.createElement("div");
    banner.className = "preview-banner";
    banner.textContent = `プレビュー（データは保存されません）／ 条件: ${session.condition}${skipPractice ? "／ 練習スキップ" : ""}`;
    document.body.append(banner);
  }

  const jsPsych = initJsPsych({
    display_element: app,
    on_trial_finish: (data: Record<string, unknown>) => sink.send(data),
  });
  jsPsych.data.addProperties({
    participant_code: session.participant_code,
    experiment_id: config.id,
    version: config.version,
    assigned_condition: session.condition,
  });

  const ctx: ExperimentContext = { jsPsych, condition: session.condition, stimuli, isPreview };

  // 最後の画面。参加者コードを大きく出して、控えるよう促す
  const debrief = {
    type: htmlButtonResponse,
    stimulus:
      `<div class="instruction-card">${toParagraphs(config.debriefText)}</div>` +
      (isPreview
        ? ""
        : `<p class="caption-text">参加者コード（データの取り下げを希望するときに必要です。控えてください）</p>` +
          `<p class="completion-code">${escapeHtml(session.participant_code)}</p>`),
    choices: ["終了"],
    button_html: (choice: string) => `<button class="jspsych-btn button-primary">${choice}</button>`,
    data: { phase: "filler" },
    // 最後の画面に入ったところで完了を記録する（ここまで来た参加者を完了とみなす）
    on_start: () => {
      void sink.complete();
    },
  };

  let timeline: Node[] = [
    ...(preQuestionnaire(ctx) as Node[]),
    ...(buildTimeline(ctx) as Node[]),
    ...(postQuestionnaire(ctx) as Node[]),
    debrief as unknown as Node,
  ];
  if (skipPractice) timeline = dropPractice(timeline);

  // タイムラインに書かれた文字も、開始前に読み込んでおく
  await loadFonts(collectText(timeline));

  await jsPsych.run(timeline as never);
  await sink.flush();
  showEnd(app, isPreview ? null : session.participant_code);
}

main().catch((error) => {
  console.error(error);
  showMessage(app, "エラーが発生しました", "問題が起きました。ページを読み込み直してください。", true);
});
