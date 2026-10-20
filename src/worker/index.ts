import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { config } from "../../experiment/config";

// 参加者のブラウザからデータを「受け取る」だけの API。
// データを返すエンドポイント（一覧・CSV・集計など）は作らない。

type Env = { Bindings: { DB: D1Database } };

const MAX_BODY_BYTES = 512 * 1024;
const MAX_TRIALS_PER_REQUEST = 200;
const MAX_TRIAL_JSON_BYTES = 64 * 1024;
// 紛らわしい文字（0/O, 1/I/L）を除いた参加者コード用の文字集合
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const app = new Hono<Env>();

// 同一オリジンからの呼び出しだけを受け付ける（CORS は許可しない）
app.use("/api/*", async (c, next) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) {
    throw new HTTPException(403, { message: "forbidden" });
  }
  await next();
});

app.post("/api/session", async (c) => {
  const condition = await assignCondition(c.env.DB);
  const userAgent = (c.req.header("User-Agent") ?? "").slice(0, 300);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeParticipantCode();
    const result = await c.env.DB.prepare(
      `INSERT OR IGNORE INTO sessions (participant_code, experiment_id, version, condition, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(code, config.id, config.version, condition, userAgent)
      .run();
    if (result.meta.changes === 1) {
      return c.json({ participant_code: code, condition });
    }
  }
  throw new HTTPException(500, { message: "could not issue participant code" });
});

app.post("/api/trials", async (c) => {
  const body = await readJsonBody(c.req.raw);
  const code = asString(body.participant_code);
  const trials = body.trials;
  if (!code || !Array.isArray(trials) || trials.length === 0 || trials.length > MAX_TRIALS_PER_REQUEST) {
    throw new HTTPException(400, { message: "bad request" });
  }

  const session = await c.env.DB.prepare(
    "SELECT experiment_id, version FROM sessions WHERE participant_code = ?",
  )
    .bind(code)
    .first<{ experiment_id: string; version: number }>();
  if (!session) throw new HTTPException(404, { message: "unknown participant" });

  const insert = c.env.DB.prepare(
    `INSERT OR IGNORE INTO trials
       (participant_code, experiment_id, version, trial_index, phase, stimulus_id, condition, rt, response, data_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const statements: D1PreparedStatement[] = [];
  for (const raw of trials) {
    if (typeof raw !== "object" || raw === null) throw new HTTPException(400, { message: "bad trial" });
    const t = raw as Record<string, unknown>;
    if (!Number.isInteger(t.trial_index)) throw new HTTPException(400, { message: "bad trial_index" });

    const dataJson = JSON.stringify(t);
    if (dataJson.length > MAX_TRIAL_JSON_BYTES) throw new HTTPException(413, { message: "trial too large" });

    statements.push(
      insert.bind(
        code,
        session.experiment_id,
        session.version,
        t.trial_index,
        asString(t.phase, 32),
        asString(t.stimulus_id, 128),
        asString(t.condition, 128),
        typeof t.rt === "number" && Number.isFinite(t.rt) ? t.rt : null,
        toResponseText(t.response),
        dataJson,
      ),
    );
  }

  await c.env.DB.batch(statements);
  return c.json({ ok: true, received: statements.length });
});

app.post("/api/complete", async (c) => {
  const body = await readJsonBody(c.req.raw);
  const code = asString(body.participant_code);
  if (!code) throw new HTTPException(400, { message: "bad request" });

  const result = await c.env.DB.prepare(
    "UPDATE sessions SET completed_at = COALESCE(completed_at, datetime('now')) WHERE participant_code = ?",
  )
    .bind(code)
    .run();
  if (result.meta.changes === 0) throw new HTTPException(404, { message: "unknown participant" });
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: "not found" }, 404));

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "internal error" }, 500);
});

export default app;

// ---------------------------------------------------------------------------

/** 同じ id・version で「開始した」人数が最も少ない条件に割り付ける（同数ならランダム） */
async function assignCondition(db: D1Database): Promise<string> {
  const conditions = config.conditions;
  if (config.assignment === "random" || conditions.length === 1) {
    return conditions[randomInt(conditions.length)];
  }

  const { results } = await db
    .prepare(
      "SELECT condition, COUNT(*) AS n FROM sessions WHERE experiment_id = ? AND version = ? GROUP BY condition",
    )
    .bind(config.id, config.version)
    .all<{ condition: string; n: number }>();

  const counts = new Map(conditions.map((name) => [name, 0]));
  for (const row of results) {
    if (counts.has(row.condition)) counts.set(row.condition, row.n);
  }
  const min = Math.min(...counts.values());
  const candidates = conditions.filter((name) => counts.get(name) === min);
  return candidates[randomInt(candidates.length)];
}

function makeParticipantCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

function randomInt(max: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % max;
}

/** sendBeacon は Content-Type が text/plain になることがあるので、本文を文字列で読んで JSON として解釈する */
async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  const length = Number(req.headers.get("Content-Length") ?? 0);
  if (length > MAX_BODY_BYTES) throw new HTTPException(413, { message: "body too large" });

  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) throw new HTTPException(413, { message: "body too large" });

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
  } catch {
    // 下で 400 にする
  }
  throw new HTTPException(400, { message: "invalid json" });
}

function asString(value: unknown, maxLength = 64): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string" || value === "") return null;
  return value.slice(0, maxLength);
}

/** response が文字列・数値ならそのまま、オブジェクト（質問紙など）なら JSON 文字列にする */
function toResponseText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
