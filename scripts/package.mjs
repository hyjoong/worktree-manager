import {
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const pnpmVersion = "9.15.9";
const pnpmMajorVersion = `${pnpmVersion.split(".")[0]}.`;
const pnpmBin = join(
  homedir(),
  ".cache/node/corepack/pnpm",
  pnpmVersion,
  "bin/pnpm.cjs"
);
const shimDir = join("/private/tmp", "worktree-manager-pnpm9-shim");
const shimPath = join(shimDir, "pnpm");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function findPnpmCommand() {
  const currentPnpm = spawnSync("pnpm", ["--version"], {
    encoding: "utf8",
    shell: false,
  });

  if (
    currentPnpm.status === 0 &&
    currentPnpm.stdout.trim().startsWith(pnpmMajorVersion)
  ) {
    return {
      command: "pnpm",
      envPath: process.env.PATH ?? "",
    };
  }

  if (!existsSync(pnpmBin)) {
    run("corepack", ["prepare", `pnpm@${pnpmVersion}`, "--activate"]);
  }

  mkdirSync(dirname(shimPath), { recursive: true });
  rmSync(shimPath, { force: true });
  symlinkSync(pnpmBin, shimPath);

  return {
    command: "pnpm",
    envPath: `${shimDir}:${process.env.PATH ?? ""}`,
  };
}

const pnpm = findPnpmCommand();

const isUnsignedBuild = process.env.WORKTREE_MANAGER_UNSIGNED === "1";
const env = {
  ...process.env,
  PATH: pnpm.envPath,
  ...(isUnsignedBuild ? { CSC_IDENTITY_AUTO_DISCOVERY: "false" } : {}),
};
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const releaseDir = join("release", packageJson.version);

rmSync(releaseDir, { force: true, recursive: true });
run(pnpm.command, ["build"], { env });
run(join("node_modules", ".bin", "electron-builder"), process.argv.slice(2), {
  env,
});
