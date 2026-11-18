import { spawn } from "node:child_process";

if (!process.env.DATABASE_URL?.trim()) {
  console.log("migrate: DATABASE_URL is not set; skipping");
  process.exit(0);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const migration = spawn(command, ["--no-install", "prisma", "migrate", "deploy"], {
  stdio: "inherit",
});

migration.on("error", (error) => {
  console.error("migrate: failed to start Prisma");
  console.error(error.message);
  process.exit(1);
});

migration.on("exit", (code, signal) => {
  if (signal) {
    console.error(`migrate: Prisma terminated by ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 1);
});
