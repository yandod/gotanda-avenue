// 参加人数・完了数・条件ごとの人数を表示する。
//   npm run status                 本番
//   npm run status -- --local      ローカル

import { config } from "../experiment/config";
import { parseTarget, query, sqlString } from "./lib/d1";

const { remote, label } = parseTarget(process.argv.slice(2));

console.log(`対象: ${label}`);
console.log(`実験ID: ${config.id}（現在の version: ${config.version}）\n`);

const rows = query(
  `SELECT version, condition,
          COUNT(*) AS started,
          SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed
     FROM sessions
    WHERE experiment_id = ${sqlString(config.id)}
    GROUP BY version, condition
    ORDER BY version, condition`,
  remote,
);

if (rows.length === 0) {
  console.log("まだ参加者はいません。");
} else {
  console.table(
    rows.map((r) => ({
      version: r.version,
      条件: r.condition,
      開始: r.started,
      完了: r.completed,
    })),
  );
  const started = rows.reduce((sum, r) => sum + Number(r.started), 0);
  const completed = rows.reduce((sum, r) => sum + Number(r.completed), 0);
  console.log(`合計: 開始 ${started} 人 / 完了 ${completed} 人`);
}
