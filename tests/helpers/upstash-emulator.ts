import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { HIT_SCRIPT } from "@/lib/rate-limit/upstash-store";

/**
 * Local HTTP emulator of the subset of the Upstash Redis REST API used by the limiter (one EVAL of HIT_SCRIPT).
 * It lets the REAL adapter code run over real sockets — HTTP, auth header, timeouts, connection loss, error bodies —
 * but it is NOT Upstash: results obtained with it are "emulator-verified", never "Upstash-verified".
 */
export type EmulatorMode = "ok" | "quota_400" | "quota_429" | "server_500" | "unauthorized" | "slow" | "drop" | "bad_json" | "non_integer";

export async function startUpstashEmulator(options: { token?: string; clock?: () => number } = {}) {
  const token = options.token ?? "test-token-0123456789abcdef";
  const clock = options.clock ?? Date.now;
  const store = new Map<string, { count: number; expiresAt: number }>();
  const state = { mode: "ok" as EmulatorMode, delayMs: 0, requests: 0, inFlight: 0, maxInFlight: 0 };
  const commands: unknown[][] = [];
  const authHeaders: Array<string | undefined> = [];
  const urls: string[] = [];

  const purge = () => {
    const now = clock();
    for (const [key, entry] of store) if (entry.expiresAt <= now) store.delete(key);
  };
  const readBody = (req: IncomingMessage) =>
    new Promise<string>((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });

  const server: Server = createServer(async (req, res) => {
    state.requests += 1;
    state.inFlight += 1;
    state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
    urls.push(req.url ?? "");
    authHeaders.push(req.headers.authorization);
    const raw = await readBody(req);
    const reply = (status: number, body: string) => {
      state.inFlight -= 1;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(body);
    };
    if (state.mode === "drop") {
      state.inFlight -= 1;
      req.socket.destroy();
      return;
    }
    if (state.mode === "slow") await new Promise((r) => setTimeout(r, state.delayMs));
    if (req.headers.authorization !== `Bearer ${token}` || state.mode === "unauthorized") return reply(401, JSON.stringify({ error: "Unauthorized" }));
    if (state.mode === "quota_400") return reply(400, JSON.stringify({ error: "ERR max requests limit exceeded. Limit: 500000, Usage: 500000" }));
    if (state.mode === "quota_429") return reply(429, JSON.stringify({ error: "Too Many Requests" }));
    if (state.mode === "server_500") return reply(500, "Internal Server Error");
    if (state.mode === "bad_json") return reply(200, "<html>not json</html>");
    if (state.mode === "non_integer") return reply(200, JSON.stringify({ result: "OK" }));

    let command: unknown[] = [];
    try {
      command = JSON.parse(raw);
    } catch {
      return reply(400, JSON.stringify({ error: "ERR invalid body" }));
    }
    commands.push(command);
    if (command[0] !== "EVAL" || command[1] !== HIT_SCRIPT || command[2] !== "1") return reply(400, JSON.stringify({ error: "ERR unsupported command" }));
    // Redis runs the whole script atomically; JavaScript's single thread gives the same guarantee here.
    purge();
    const key = String(command[3]);
    const ttlSeconds = Number(command[4]);
    const entry = store.get(key) ?? { count: 0, expiresAt: Number.POSITIVE_INFINITY };
    entry.count += 1;
    if (entry.count === 1) entry.expiresAt = clock() + ttlSeconds * 1000;
    store.set(key, entry);
    return reply(200, JSON.stringify({ result: entry.count }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    token,
    state,
    commands,
    authHeaders,
    urls,
    keys: () => {
      purge();
      return [...store.keys()];
    },
    ttlOf: (key: string) => {
      const entry = store.get(key);
      return entry ? Math.round((entry.expiresAt - clock()) / 1000) : null;
    },
    setMode(mode: EmulatorMode, delayMs = 0) {
      state.mode = mode;
      state.delayMs = delayMs;
    },
    reset() {
      store.clear();
      commands.length = 0;
      authHeaders.length = 0;
      urls.length = 0;
      Object.assign(state, { mode: "ok", delayMs: 0, requests: 0, inFlight: 0, maxInFlight: 0 });
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
