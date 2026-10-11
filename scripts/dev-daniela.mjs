/**
 * Owner test mode (LOCAL ONLY): starts the site on http://localhost:3000 with Daniela enabled for non-production use.
 * It sets AI_CONCIERGE_ENABLED=true for this process only; nothing is deployed or published, production variables are untouched,
 * and the production launch guard (lib/ai-concierge/launch.ts) still blocks any production environment.
 * Usage: npm run dev:daniela            (uses OPENAI_CONCIERGE_MODEL from .env.local)
 *        npm run dev:daniela -- gpt-6-luna   (try another model for this session only)
 * Real model calls use the development OpenAI key in .env.local and the Upstash TEST database (limits: 10/min per IP, 20 per session, 300/day).
 */
import { spawn } from "node:child_process";

const model = process.argv[2];
const env = { ...process.env, AI_CONCIERGE_ENABLED: "true", NODE_ENV: "development" };
if (model) env.OPENAI_CONCIERGE_MODEL = model;
console.log(`Daniela test mode: open http://localhost:3000/pt  (or /en, /es)${model ? `  [model override: ${model}]` : ""}\nCtrl+C to stop. Not published; local only.`);
const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev", "--webpack", "-p", "3000"], { env, stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 0));
