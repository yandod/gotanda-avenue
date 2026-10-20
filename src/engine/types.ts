import type { JsPsych } from "jspsych";

/** stimuli.csv の 1 行。すべての値は文字列として渡される */
export type StimulusRow = { id: string } & Record<string, string>;

export interface ExperimentContext {
  jsPsych: JsPsych;
  /** 参加者間条件の割付結果（config.conditions のどれか） */
  condition: string;
  /** stimuli.csv の全行 */
  stimuli: StimulusRow[];
  /** ?preview=1 で開いているとき true（データは保存されない） */
  isPreview: boolean;
}

/** 試行画面の見た目。省略した項目は DESIGN.md の初期値になる。画面の他の部分（同意・教示・質問紙）には効かない */
export interface DisplayConfig {
  /** 試行画面の背景色（CSS の色。例: "#808080"）。初期値は白 */
  background?: string;
  /** 刺激テキストの文字サイズ。数値なら px、文字列なら CSS の長さ（例: "64px"）。初期値は 48px */
  stimulusFontSize?: number | string;
  /** 刺激を置く領域の大きさ（CSS の長さ。例: { width: "600px", height: "400px" }）。初期値は内容に合わせる */
  stimulusArea?: { width?: string; height?: string };
}

export interface ExperimentConfig {
  /** 半角英数とハイフン。学生ごとに一意 */
  id: string;
  /** 本番データ収集開始後に内容を変えたら必ず +1 */
  version: number;
  title: string;
  /** 参加者間条件。参加者内のみなら ["default"] */
  conditions: string[];
  assignment: "balanced" | "random";
  requireKeyboard: boolean;
  estimatedMinutes: number;
  consentText: string;
  debriefText: string;
  /** 試行画面の見た目（省略可） */
  display?: DisplayConfig;
}
