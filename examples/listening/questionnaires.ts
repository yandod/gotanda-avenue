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
            name: "music_experience",
            title: "楽器の演奏や歌の経験はどのくらいありますか。",
            isRequired: true,
            choices: ["ない", "1〜3年", "4〜9年", "10年以上"],
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
            type: "radiogroup",
            name: "volume_ok",
            title: "音量は適切でしたか。",
            isRequired: true,
            choices: ["小さすぎた", "ちょうどよかった", "大きすぎた"],
          },
        ],
      },
      data: { phase: "questionnaire", stimulus_id: "post_volume" },
    },
  ];
}
