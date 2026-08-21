import { spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

const processes = [];
const backendEnvPath = "backend/.env";

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
  console.error("\nCould not start MongoDB automatically.");
  console.error("Install Docker Desktop, or run MongoDB yourself and set backend/.env MONGODB_URI.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

run("npm", ["run", "backend:dev"]);
run("npm", ["run", "dev"]);
