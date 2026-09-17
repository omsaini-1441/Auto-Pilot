import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Load .env into process.env without overriding existing vars (best practice). */
function loadEnvFile() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const mode = process.argv[2] === "start" ? "start" : "dev";
const port = String(process.env.PORT || "3000");

const child = spawn("npx", ["next", mode, "--port", port], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
