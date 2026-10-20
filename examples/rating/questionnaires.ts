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
            name: "art_interest",
            title: "デザインや美術にどのくらい関心がありますか。",
            isRequired: true,
            choices: ["ない", "あまりない", "ややある", "とてもある"],
          },
        ],
      },
      data: { phase: "questionnaire", stimulus_id: "pre_basic" },
    },
  ];
}

// 事後の質問紙は使わない
export function postQuestionnaire(_ctx: ExperimentContext) {
  return [];
}
