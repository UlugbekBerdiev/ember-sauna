import { spawn } from "node:child_process";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim() || "";

if (!connectionString) {
  console.log("migrate: DATABASE_URL is not set; skipping");
  process.exit(0);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const migration = spawn(command, ["--no-install", "prisma", "migrate", "deploy"], {
  env: { ...process.env, DATABASE_URL: connectionString },
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
