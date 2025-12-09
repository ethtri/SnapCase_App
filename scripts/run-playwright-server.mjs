#!/usr/bin/env node
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

const args = process.argv.slice(2);

const hostnameIndex = args.indexOf("--hostname");
const portIndex = args.indexOf("--port");

const hostname =
  hostnameIndex >= 0 && args[hostnameIndex + 1]
    ? args[hostnameIndex + 1]
    : "127.0.0.1";
const port =
  portIndex >= 0 && args[portIndex + 1]
    ? Number.parseInt(args[portIndex + 1], 10)
    : 3000;

const nextBin = resolve(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

const child = spawn(
  process.execPath,
  [nextBin, "dev", "-H", hostname, "-p", String(port)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
    },
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
