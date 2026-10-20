import audioSliderResponse from "@jspsych/plugin-audio-slider-response";
import htmlButtonResponse from "@jspsych/plugin-html-button-response";
import preload from "@jspsych/plugin-preload";
import type { ExperimentContext } from "../../src/engine/types";

// 見た目はルートの DESIGN.md の部品クラスで決める（色や文字サイズは直接書かない）。
//   教示: instruction-card と button-primary ／ 評定画面: ふつうの本文の大きさ（trial-stage は付けない）

const INTERVAL_MS = 800;

// 画面に 1 つだけ出す「始める」のようなボタンは、button-primary にする
const primaryButton = (choice: string) => `<button class="jspsych-btn button-primary">${choice}</button>`;

export function buildTimeline(ctx: ExperimentContext) {
  const { jsPsych, stimuli } = ctx;

  // 音声は先頭で読み込んでおく。再生は同意画面のクリックのあとなので、自動再生の制限に引っかからない
  const preloadAudio = {
    type: preload,
    audio: stimuli.map((s) => s.audio),
    data: { phase: "filler" },
  };

  const instructions = {
    type: htmlButtonResponse,
    stimulus: `
      <div class="instruction-card">
        <p>短い音が 1 つずつ流れます。音が終わったら、聞いたときの心地よさをスライダーで答えてください。</p>
        <p>音量は、小さめにしてから始めてください。</p>
      </div>`,
    choices: ["始める"],
    button_html: primaryButton,
    data: { phase: "filler" },
  };

  const interval = {
    type: htmlButtonResponse,
    stimulus: "",
    choices: [],
    trial_duration: INTERVAL_MS,
    data: { phase: "filler" },
  };

  const listenTrial = {
    type: audioSliderResponse,
    stimulus: jsPsych.timelineVariable("audio"),
    labels: ["とても不快", "どちらでもない", "とても心地よい"],
    min: 0,
    max: 100,
    slider_start: 50,
    require_movement: true,
    response_allowed_while_playing: false, // 音が終わってから答える
    prompt: "<p>この音を聞いたときの心地よさを答えてください。</p>",
    button_label: "次へ",
    data: {
      phase: "main",
      stimulus_id: jsPsych.timelineVariable("id"),
      condition: jsPsych.timelineVariable("kind"),
    },
  };

  const main = {
    timeline: [listenTrial, interval],
    timeline_variables: stimuli,
    randomize_order: true,
  };

  return [preloadAudio, instructions, main];
}
