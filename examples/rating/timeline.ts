import htmlButtonResponse from "@jspsych/plugin-html-button-response";
import imageSliderResponse from "@jspsych/plugin-image-slider-response";
import preload from "@jspsych/plugin-preload";
import type { ExperimentContext } from "../../src/engine/types";

// 見た目はルートの DESIGN.md の部品クラスで決める（色や文字サイズは直接書かない）。
//   教示: instruction-card と button-primary ／ 固視点: fixation-cross
// スライダーの評定画面は、文字が大きくなりすぎるので trial-stage を付けず、ふつうの本文の大きさにする。

// 参加者間条件（ctx.condition）ごとの教示と評定軸
const RATING = {
  preference: {
    question: "この図形は、どのくらい好ましいですか。",
    labels: ["まったく好ましくない", "どちらでもない", "とても好ましい"],
  },
  memorability: {
    question: "この図形は、どのくらい覚えやすそうですか。",
    labels: ["まったく覚えにくい", "どちらでもない", "とても覚えやすい"],
  },
} as const;

const FIXATION_MS = 500;
const REPETITIONS = 1;

// 画面に 1 つだけ出す「始める」「次へ」のようなボタンは、button-primary にする
const primaryButton = (choice: string) => `<button class="jspsych-btn button-primary">${choice}</button>`;

export function buildTimeline(ctx: ExperimentContext) {
  const { jsPsych, stimuli, condition } = ctx;
  const rating = RATING[condition as keyof typeof RATING];

  // 画像は先頭で読み込んでおく
  const preloadImages = {
    type: preload,
    images: stimuli.map((s) => s.image),
    data: { phase: "filler" },
  };

  const instructions = {
    type: htmlButtonResponse,
    stimulus: `
      <div class="instruction-card">
        <p>図形が 1 つずつ表示されます。</p>
        <p>${rating.question}<br>スライダーを動かして答えてください。</p>
      </div>`,
    choices: ["始める"],
    button_html: primaryButton,
    data: { phase: "filler" },
  };

  const fixation = {
    type: htmlButtonResponse,
    stimulus: "<p>+</p>",
    choices: [],
    trial_duration: FIXATION_MS,
    css_classes: ["fixation-cross"],
    data: { phase: "filler" },
  };

  const ratingTrial = {
    type: imageSliderResponse,
    stimulus: jsPsych.timelineVariable("image"),
    stimulus_width: 250,
    labels: [...rating.labels],
    min: 0,
    max: 100,
    slider_start: 50,
    require_movement: true,
    prompt: `<p>${rating.question}</p>`,
    button_label: "次へ",
    data: {
      phase: "main",
      stimulus_id: jsPsych.timelineVariable("id"),
      condition: jsPsych.timelineVariable("shape"),
    },
  };

  const main = {
    timeline: [fixation, ratingTrial],
    timeline_variables: stimuli,
    randomize_order: true,
    repetitions: REPETITIONS,
  };

  return [preloadImages, instructions, main];
}
