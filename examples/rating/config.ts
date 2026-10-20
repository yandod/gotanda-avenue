import type { ExperimentConfig } from "../../src/engine/types";

export const config: ExperimentConfig = {
  id: "example-rating",
  version: 1,
  title: "図形の印象の実験",
  conditions: ["preference", "memorability"], // 参加者間: 何を評定するか
  assignment: "balanced",
  requireKeyboard: false, // マウス（スライダー）だけで答えられる
  estimatedMinutes: 4,
  consentText: `【下書き】この文面は学生と教員が確認して書き換えてください。

この実験では、画面に表示される図形を見て、スライダーで評定していただきます。
所要時間は約 4 分です。

・参加は自由です。途中でやめたいときは、ブラウザを閉じてください。
・氏名やメールアドレスなど、個人を特定できる情報は集めません。
・集めたデータは統計的に処理し、個人が特定される形で公表することはありません。`,
  debriefText: `【下書き】ご協力ありがとうございました。

この実験では、丸みのある図形と角のある図形で、評定がどう違うかを調べました。
参加者によって、評定する内容（好ましさ／覚えやすさ）は異なっていました。
実験の内容について質問がある場合は、実験者に連絡してください。`,
};
