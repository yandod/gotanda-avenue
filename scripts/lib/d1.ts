import { execFileSync } from "node:child_process";

export type Row = Record<string, unknown>;

/** `--local` が付いていればローカル D1、なければ本番（--remote）を対象にする */
export function parseTarget(argv: string[]): { remote: boolean; label: string } {
  const local = argv.includes("--local");
  return { remote: !local, label: local ? "ローカル D1" : "本番 D1（--remote）" };
}

export function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** wrangler d1 execute で SQL を 1 つ実行して、結果の行を返す */
export function query(sql: string, remote: boolean): Row[] {
  const args = ["wrangler", "d1", "execute", "DB", remote ? "--remote" : "--local", "--json", "--command", sql];
  let stdout: string;
  try {
    stdout = execFileSync("npx", args, {
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const e = error as { stderr?: string; stdout?: string; message: string };
    throw new Error(`wrangler の実行に失敗しました。\n${e.stderr || e.stdout || e.message}`);
  }

  // 先頭にログが混ざることがあるので、JSON の始まりを探す
  const start = stdout.search(/^\[\s*$/m);
  const json = JSON.parse(start >= 0 ? stdout.slice(start) : stdout) as { results?: Row[]; success?: boolean }[];
  return json.flatMap((part) => part.results ?? []);
}
