// 結果を results/ に CSV で書き出す。
//   npm run export                 本番
//   npm run export:local           ローカル（動作確認用）
//   npm run export -- --version 2  特定の version だけ
//
// 出力は UTF-8（BOM 付き）。Excel でそのまま開ける。

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "../experiment/config";
import { parseTarget, query, sqlString, type Row } from "./lib/d1";

const argv = process.argv.slice(2);
const { remote, label } = parseTarget(argv);

const versionIndex = argv.indexOf("--version");
const version = versionIndex >= 0 ? Number(argv[versionIndex + 1]) : null;
if (version !== null && !Number.isInteger(version)) {
  console.error("--version には整数を指定してください。");
  process.exit(1);
}

const PAGE_SIZE = 500;
// 先頭に並べる列。残りの列は見つかった順に続ける
const LEADING_COLUMNS = [
  "participant_code",
  "experiment_id",
  "version",
  "assigned_condition",
  "trial_index",
  "phase",
  "stimulus_id",
  "condition",
  "correct_response",
  "response",
  "correct",
  "rt",
  "trial_type",
  "time_elapsed",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(columns: string[], rows: Row[]): string {
  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c])).join(","));
  return "﻿" + lines.join("\r\n") + "\r\n";
}

console.log(`対象: ${label}`);
console.log(`実験ID: ${config.id}${version === null ? "（全 version）" : `（version ${version}）`}`);

const where =
  `experiment_id = ${sqlString(config.id)}` + (version === null ? "" : ` AND version = ${version}`);

// セッション（完了したかどうか）
const sessions = query(
  `SELECT participant_code, experiment_id, version, condition AS assigned_condition, started_at, completed_at
     FROM sessions WHERE ${where} ORDER BY started_at`,
  remote,
);
const completed = new Set(sessions.filter((s) => s.completed_at).map((s) => s.participant_code));

// 試行を id の順に少しずつ取り出す
const trials: Row[] = [];
const seenColumns = new Set<string>(LEADING_COLUMNS);
const extraColumns: string[] = [];
let lastId = 0;
for (;;) {
  const page = query(
    `SELECT id, data_json FROM trials WHERE ${where} AND id > ${lastId} ORDER BY id LIMIT ${PAGE_SIZE}`,
    remote,
  );
  if (page.length === 0) break;
  for (const record of page) {
    lastId = Number(record.id);
    const data = JSON.parse(String(record.data_json)) as Row;
    data.session_completed = completed.has(String(data.participant_code)) ? 1 : 0;
    for (const key of Object.keys(data)) {
      if (!seenColumns.has(key)) {
        seenColumns.add(key);
        extraColumns.push(key);
      }
    }
    trials.push(data);
  }
  if (page.length < PAGE_SIZE) break;
}

const trialColumns = [...LEADING_COLUMNS, ...extraColumns.filter((c) => c !== "session_completed"), "session_completed"];
const sessionColumns = ["participant_code", "experiment_id", "version", "assigned_condition", "started_at", "completed_at"];

const outDir = resolve(import.meta.dirname, "..", "results");
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "");
const base = `${config.id}_${remote ? "remote" : "local"}_${stamp}`;
const trialsPath = resolve(outDir, `${base}_trials.csv`);
const sessionsPath = resolve(outDir, `${base}_sessions.csv`);

writeFileSync(trialsPath, toCsv(trialColumns, trials));
writeFileSync(sessionsPath, toCsv(sessionColumns, sessions));

console.log(`参加者 ${sessions.length} 人（完了 ${completed.size} 人）、試行 ${trials.length} 行`);
console.log(`書き出しました:\n  ${trialsPath}\n  ${sessionsPath}`);
