// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { checkReleaseAge } from "./check-release-age.mjs";

const { packageManager } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const version = packageManager.replace(/^npm@/, "");
// Check the tool itself before downloading its tarball, even on fresh machines.
const response = await fetch("https://registry.npmjs.org/npm", {
  signal: AbortSignal.timeout(15000), redirect: "error",
});
if (!response.ok) throw new Error(`npm registry metadata failed: ${response.status}`);
const metadata = await response.json();
const dist = metadata.versions?.[version]?.dist;
await checkReleaseAge({
  lockfileVersion: 3,
  packages: {
    "node_modules/npm": {
      version,
      resolved: dist?.tarball,
      integrity: dist?.integrity,
    },
  },
}, { fetchMetadata: async () => metadata });
const executable = process.platform === "win32" ? "npm.cmd" : "npm";
const current = spawnSync(executable, ["--version"], { encoding: "utf8", cwd: tmpdir() });
if (current.status !== 0) throw new Error("npm must already be installed with Node.js");
if (current.stdout.trim() !== version) {
  // Outside the project so old npm can bootstrap without its devEngines guard.
  const result = spawnSync(executable, ["install", "--global", `npm@${version}`, "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: tmpdir(), stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("Failed to install pinned npm");
}
console.log(`npm ${version} is ready and at least 72 hours old.`);
