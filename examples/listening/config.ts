import type { ExperimentConfig } from "../../src/engine/types";

export const config: ExperimentConfig = {
  id: "example-listening",
  version: 1,
  title: "音の印象の実験",
  conditions: ["default"],
  assignment: "balanced",
  requireKeyboard: false,
  estimatedMinutes: 4,
  consentText: `【下書き】この文面は学生と教員が確認して書き換えてください。

この実験では、短い音を聞いて、その印象をスライダーで答えていただきます。
音が出ます。周りに配慮して、イヤホンやヘッドホンの使用をおすすめします。音量は小さめから調整してください。
所要時間は約 4 分です。

・参加は自由です。途中でやめたいときは、ブラウザを閉じてください。
・氏名やメールアドレスなど、個人を特定できる情報は集めません。
・集めたデータは統計的に処理し、個人が特定される形で公表することはありません。`,
  debriefText: `【下書き】ご協力ありがとうございました。

この実験では、単純な音（純音）と和音で、聞いたときの心地よさがどう違うかを調べました。
実験の内容について質問がある場合は、実験者に連絡してください。`,
};
