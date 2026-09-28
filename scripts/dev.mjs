import { spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { connect } from "node:net";

const processes = [];
const backendEnvPath = "backend/.env";
const backendPort = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? "4000");

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  processes.push(child);
  return child;
}

function runAndWait(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = run(command, args, options);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
      }
    });
    child.on("error", reject);
  });
}

function shutdown(signal) {
  for (const child of processes) {
    if (!child.killed) child.kill(signal);
  }
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = connect({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
  process.exit(0);
});

if (!existsSync(backendEnvPath)) {
  copyFileSync("backend/.env.example", backendEnvPath);
  console.log("Created backend/.env from backend/.env.example");
}

try {
  await runAndWait("docker", ["compose", "up", "-d", "mongo"]);
} catch (error) {
  console.warn("\nCould not start MongoDB automatically.");
  console.warn("Install Docker Desktop, or run MongoDB yourself and set backend/.env MONGODB_URI.");
  console.warn(error instanceof Error ? error.message : error);
}

const backendRunning = await isPortInUse(backendPort);
if (backendRunning) {
  console.log(`Backend already running on port ${backendPort}; skipping backend startup.`);
} else {
  run("npm", ["run", "backend:dev"]);
}

run("npm", ["run", "dev"]);
