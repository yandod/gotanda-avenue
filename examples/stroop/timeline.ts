import htmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";
import type { ExperimentContext } from "../../src/engine/types";

// 見た目はルートの DESIGN.md の部品クラスで決める。
//   教示: instruction-card と key-hint ／ 固視点: fixation-cross ／ 刺激: trial-stage ／ 正誤: feedback-correct / feedback-incorrect
// 色や文字サイズは直接書かない。例外は、刺激そのものの色（ストループ課題のインク色）だけ。

const KEYS = ["f", "g", "h", "j"];
const FIXATION_MS = 500;
const FEEDBACK_MS = 600;
const PRACTICE_TRIALS = 4;
const MAIN_REPETITIONS = 5; // 8 刺激 × 5 回 = 40 試行

export function buildTimeline(ctx: ExperimentContext) {
  const { jsPsych, stimuli } = ctx;

  const instructions = {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="instruction-card">
        <p>色のついた文字が表示されます。文字の<b>意味ではなく、色</b>に合わせてキーを押してください。</p>
        <p><span class="key-hint">F</span> 赤　<span class="key-hint">G</span> 青　<span class="key-hint">H</span> 緑　<span class="key-hint">J</span> 黄</p>
        <p>できるだけ速く、正確に答えてください。</p>
        <p>準備ができたら <span class="key-hint">Space</span> キーを押してください。</p>
      </div>`,
    choices: [" "],
    data: { phase: "filler" },
  };

  const fixation = {
    type: htmlKeyboardResponse,
    stimulus: "<p>+</p>",
    choices: "NO_KEYS" as const,
    trial_duration: FIXATION_MS,
    css_classes: ["fixation-cross"],
    data: { phase: "filler" },
  };

  // phase だけ変えて、練習と本番で同じ試行を使い回す
  const stroopTrial = (phase: "practice" | "main") => ({
    type: htmlKeyboardResponse,
    // インク色は刺激そのものなので、stimuli.csv の値をそのまま使う
    stimulus: () => `<p style="color:${jsPsych.evaluateTimelineVariable("css_color")}">${jsPsych.evaluateTimelineVariable("word")}</p>`,
    choices: KEYS,
    css_classes: ["trial-stage"],
    data: {
      phase,
      stimulus_id: jsPsych.timelineVariable("id"),
      condition: jsPsych.timelineVariable("condition"),
      correct_response: jsPsych.timelineVariable("correct_response"),
    },
    on_finish: (data: { response: string | null; correct_response: string; correct?: boolean }) => {
      data.correct = data.response === data.correct_response;
    },
  });

  const feedback = {
    type: htmlKeyboardResponse,
    stimulus: () => {
      const last = jsPsych.data.get().last(1).values()[0] as { correct?: boolean };
      // 色だけで伝えず、文字でも「正解」「不正解」を出す
      return last.correct ? '<p class="feedback-correct">正解</p>' : '<p class="feedback-incorrect">不正解</p>';
    },
    choices: "NO_KEYS" as const,
    trial_duration: FEEDBACK_MS,
    css_classes: ["trial-stage"],
    data: { phase: "filler" },
  };

  const practice = {
    timeline: [fixation, stroopTrial("practice"), feedback],
    timeline_variables: jsPsych.randomization.sampleWithoutReplacement(stimuli, PRACTICE_TRIALS),
    // ブロック（timeline）には data.phase を付けない。付けると、親の値が子の値より優先されて、
    // 中の固視点やフィードバックまで phase: "practice" になってしまう。
    // 練習試行（phase: "practice"）だけでできたブロックは、?skip=practice のとき engine が丸ごと飛ばす。
  };

  const startMain = {
    type: htmlKeyboardResponse,
    stimulus: `
      <div class="instruction-card">
        <p>ここから本番です。練習と同じように、文字の色に合わせて答えてください。</p>
        <p><span class="key-hint">Space</span> キーを押すと始まります。</p>
      </div>`,
    choices: [" "],
    data: { phase: "filler" },
  };

  const main = {
    timeline: [fixation, stroopTrial("main")],
    timeline_variables: stimuli,
    randomize_order: true,
    repetitions: MAIN_REPETITIONS,
  };

  return [instructions, practice, startMain, main];
}
