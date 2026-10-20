// Noto Sans は文字の範囲ごとに分割されたファイル（unicode-range）で配られ、使う文字が初めて表示されたときに読み込まれる。
// 実験の途中で書体が切り替わらないよう、画面に出る文字を先に読み込んでおく。

import "@fontsource-variable/noto-sans-jp";
import "@fontsource-variable/noto-sans-mono";

const FAMILIES = ['"Noto Sans JP Variable"', '"Noto Sans Mono Variable"'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 値の中の文字列を集める。関数は実行しない（実行時にしか分からない文字列は、stimuli.csv の値でまかなう） */
export function collectText(value: unknown, into: Set<string> = new Set(), depth = 0): Set<string> {
  if (depth > 12 || value === null || value === undefined) return into;
  if (typeof value === "string") {
    for (const ch of value) into.add(ch);
  } else if (Array.isArray(value)) {
    for (const item of value) collectText(item, into, depth + 1);
  } else if (typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === "type") continue; // プラグインのクラス
      collectText(item, into, depth + 1);
    }
  }
  return into;
}

/** 指定した文字のフォントを読み込む。回線が遅くても実験が始まらなくならないよう、timeoutMs で打ち切る */
export async function loadFonts(chars: Iterable<string>, timeoutMs = 5000): Promise<void> {
  if (!("fonts" in document)) return;
  const text = [...new Set(chars)].join("") + "+0123456789";
  const loads = FAMILIES.map((family) => document.fonts.load(`500 18px ${family}`, text));
  await Promise.race([Promise.allSettled(loads), sleep(timeoutMs)]);
}
