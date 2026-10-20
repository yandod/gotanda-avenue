import type { ExperimentConfig } from "../../src/engine/types";

export const config: ExperimentConfig = {
  id: "example-stroop",
  version: 1,
  title: "色と文字の実験",
  conditions: ["default"], // 参加者内の比較だけなので 1 つ
  assignment: "balanced",
  requireKeyboard: true,
  estimatedMinutes: 5,
  consentText: `【下書き】この文面は学生と教員が確認して書き換えてください。

この実験では、画面に表示される色のついた文字を見て、文字の「色」を答えていただきます。
所要時間は約 5 分です。キーボードを使います。

・参加は自由です。途中でやめたいときは、ブラウザを閉じてください。
・氏名やメールアドレスなど、個人を特定できる情報は集めません。
・集めたデータは統計的に処理し、個人が特定される形で公表することはありません。`,
  debriefText: `【下書き】ご協力ありがとうございました。

この実験では、文字の意味と色が一致しているとき（例: 赤い「赤」）と一致していないとき（例: 青い「赤」）で、色を答えるまでの時間がどう変わるかを調べました。
実験の内容について質問がある場合は、実験者に連絡してください。`,
};
