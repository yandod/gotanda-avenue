import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

const root = resolve(import.meta.dirname, "src/engine");
const outDir = resolve(import.meta.dirname, "dist");
const assetsSrc = resolve(import.meta.dirname, "experiment/assets");

/** experiment/assets/ を dist/assets/ にそのままコピーする（CSV から assets/... で参照できる） */
function copyExperimentAssets(): Plugin {
  return {
    name: "copy-experiment-assets",
    closeBundle() {
      if (existsSync(assetsSrc)) {
        cpSync(assetsSrc, resolve(outDir, "assets"), { recursive: true });
      }
    },
  };
}

/**
 * jsPsych と SurveyJS の CSS は、Open Sans の @font-face を持っている（SurveyJS は fonts.gstatic.com から読む）。
 * 外部の CDN は使わない方針なので取り除き、書体は src/engine/theme.css で Noto Sans に統一する。
 */
function stripOpenSans(): Plugin {
  const targets = ["jspsych/css/jspsych.css", "@jspsych/plugin-survey/css/survey.css"];
  return {
    name: "strip-open-sans",
    enforce: "pre",
    transform(code, id) {
      if (!targets.some((target) => id.includes(target))) return null;
      const stripped = code.replace(/@font-face\s*\{[^}]*Open Sans[^}]*\}\s*/g, "");
      if (/fonts\.gstatic\.com|fonts\.googleapis\.com/.test(stripped)) {
        this.error(`${id} に外部フォントの参照が残っています。`);
      }
      return { code: stripped, map: null };
    },
  };
}

export default defineConfig({
  root,
  publicDir: false,
  base: "./",
  build: {
    outDir,
    emptyOutDir: true,
    // Vite 自身の出力は _app/ に置き、assets/ は実験用ファイルに空けておく
    assetsDir: "_app",
    // jsPsych と SurveyJS を 1 ファイルにまとめているので、サイズ警告は出さない
    chunkSizeWarningLimit: 2000,
  },
  plugins: [stripOpenSans(), copyExperimentAssets()],
});
