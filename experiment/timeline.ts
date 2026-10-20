import htmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";
import type { ExperimentContext } from "../src/engine/types";

// 動作確認用のサンプル。単語を 1 つずつ見て、スペースキーを押す。
// 見た目はルートの DESIGN.md の部品クラスで決める（色や文字サイズを直接書かない）。
//   教示: instruction-card と key-hint ／ 固視点: fixation-cross ／ 刺激: trial-stage
export function buildTimeline(ctx: ExperimentContext) {
  const { jsPsych, stimuli } = ctx;

  const instructions = {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="instruction-card">
        <p>単語が 1 つずつ表示されます。</p>
        <p>表示されたら、<span class="key-hint">Space</span> キーを押してください。</p>
        <p>準備ができたら <span class="key-hint">Space</span> キーを押してください。</p>
      </div>`,
    choices: [" "],
    data: { phase: "filler" },
  };

  const trial = {
    timeline: [
      {
        type: htmlKeyboardResponse,
        stimulus: "<p>+</p>",
        choices: "NO_KEYS" as const,
        trial_duration: 500,
        css_classes: ["fixation-cross"],
        data: { phase: "filler" },
      },
      {
        type: htmlKeyboardResponse,
        stimulus: () => `<p>${jsPsych.evaluateTimelineVariable("text")}</p>`,
        choices: [" "],
        css_classes: ["trial-stage"],
        data: {
          phase: "main",
          stimulus_id: jsPsych.timelineVariable("id"),
          condition: "default",
        },
      },
    ],
    timeline_variables: stimuli,
    randomize_order: true,
  };

  return [instructions, trial];
}
