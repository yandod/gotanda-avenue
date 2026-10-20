import survey from "@jspsych/plugin-survey";
import type { ExperimentContext } from "../src/engine/types";

// 実験の前に出す質問紙。不要なら空の配列を返す。
// 個人を特定できる項目（氏名・学籍番号・メールアドレスなど）は作らない。年齢は範囲で聞く。
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
        ],
      },
      data: { phase: "questionnaire", stimulus_id: "pre_age" },
    },
  ];
}

// 実験の後に出す質問紙。不要なら空の配列を返す。
export function postQuestionnaire(_ctx: ExperimentContext) {
  return [];
}
