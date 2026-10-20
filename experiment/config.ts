import type { ExperimentConfig } from "../src/engine/types";

export const config: ExperimentConfig = {
  id: "template-sample", // 半角英数とハイフン。学生ごとに一意にする
  version: 1, // 本番データ収集開始後に内容を変えたら必ず +1
  title: "サンプル実験",
  conditions: ["default"], // 参加者間条件。参加者内のみなら ["default"]
  assignment: "balanced", // "balanced"（人数が均等になるよう割付）| "random"
  requireKeyboard: true,
  estimatedMinutes: 3,
  // 試行画面の見た目（省略可）。同意・教示・質問紙の画面には効かない
  // display: { background: "#808080", stimulusFontSize: 64, stimulusArea: { width: "600px", height: "300px" } },
  consentText: `【下書き】この文面は学生と教員が確認して書き換えてください。

この実験では、画面に表示される単語を見て、キーを押していただきます。
所要時間は約 3 分です。

・参加は自由です。途中でやめたいときは、ブラウザを閉じてください。
・氏名やメールアドレスなど、個人を特定できる情報は集めません。
・集めたデータは統計的に処理し、個人が特定される形で公表することはありません。`,
  debriefText: `【下書き】ご協力ありがとうございました。

この実験は、テンプレートの動作確認のためのサンプルです。
この画面を閉じて終了してください。`,
};
