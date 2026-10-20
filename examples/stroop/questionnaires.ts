import survey from "@jspsych/plugin-survey";
import type { ExperimentContext } from "../../src/engine/types";

export function preQuestionnaire(_ctx: ExperimentContext) {
  return [
    {
      type: survey,
      survey_json: {
        showQuestionNumbers: false,
        completeText: "次へ",
        elements: [
          {
            type: "radiogroup",
            name: "age_range",
            title: "年齢を選んでください。",
            isRequired: true,
            choices: ["18–19", "20–21", "22以上", "回答しない"],
          },
          {
            type: "radiogroup",
            name: "color_vision",
            title: "色の見え方に困ったことはありますか。",
            isRequired: true,
            choices: ["ない", "ある", "回答しない"],
          },
        ],
      },
      data: { phase: "questionnaire", stimulus_id: "pre_basic" },
    },
  ];
}

export function postQuestionnaire(_ctx: ExperimentContext) {
  return [
    {
      type: survey,
      survey_json: {
        showQuestionNumbers: false,
        completeText: "送信",
        elements: [
          {
            type: "comment",
            name: "free_comment",
            title: "実験について気づいたことがあれば書いてください（任意）。",
          },
        ],
      },
      data: { phase: "questionnaire", stimulus_id: "post_comment" },
    },
  ];
}
