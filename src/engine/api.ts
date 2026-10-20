// データ送信。実験側（experiment/）はこのファイルを使わない。engine が自動で呼ぶ。

export interface Session {
  participant_code: string;
  condition: string;
}

export interface Sink {
  /** 1 試行分のデータをキューに積む（送信は裏で行われる） */
  send(trial: Record<string, unknown>): void;
  /** キューが空になるまで待つ（最大 timeoutMs） */
  flush(timeoutMs?: number): Promise<void>;
  /** 実験の完了を記録する */
  complete(): Promise<void>;
}

const BATCH_SIZE = 50;

export async function startSession(): Promise<Session> {
  const res = await fetch("/api/session", { method: "POST" });
  if (!res.ok) throw new Error(`session: ${res.status}`);
  return (await res.json()) as Session;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** プレビュー用。何も送らない */
export function createNullSink(): Sink {
  return { send() {}, async flush() {}, async complete() {} };
}

export function createRemoteSink(participantCode: string): Sink {
  const queue: Record<string, unknown>[] = [];
  let draining: Promise<void> | null = null;

  const post = (path: string, payload: unknown) =>
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

  // 失敗したら間隔を空けて再送する。サーバー側で二重保存は起きない（trial_index で重複を無視）
  function drain(): Promise<void> {
    if (draining) return draining;
    draining = (async () => {
      let delay = 500;
      while (queue.length > 0) {
        const batch = queue.slice(0, BATCH_SIZE);
        try {
          const res = await post("/api/trials", { participant_code: participantCode, trials: batch });
          if (res.ok) {
            queue.splice(0, batch.length);
            delay = 500;
          } else if (res.status >= 400 && res.status < 500) {
            // 再送しても直らないエラー。詰まらないように捨てる
            console.error("trials rejected", res.status);
            queue.splice(0, batch.length);
          } else {
            throw new Error(String(res.status));
          }
        } catch {
          await sleep(delay);
          delay = Math.min(delay * 2, 8000);
        }
      }
    })().finally(() => {
      draining = null;
    });
    return draining;
  }

  // タブを閉じるときに、まだ送れていない分を sendBeacon で送る
  window.addEventListener("pagehide", () => {
    if (queue.length === 0) return;
    const body = JSON.stringify({ participant_code: participantCode, trials: queue.slice(0, BATCH_SIZE) });
    navigator.sendBeacon("/api/trials", new Blob([body], { type: "application/json" }));
  });

  return {
    send(trial) {
      queue.push(JSON.parse(JSON.stringify(trial)));
      void drain();
    },
    async flush(timeoutMs = 10000) {
      await Promise.race([drain(), sleep(timeoutMs)]);
    },
    async complete() {
      await this.flush();
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await post("/api/complete", { participant_code: participantCode });
          if (res.ok) return;
        } catch {
          // 再試行する
        }
        await sleep(1000 * (attempt + 1));
      }
    },
  };
}
