// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const minimumAge = 3 * 24 * 60 * 60 * 1000;

export async function checkReleaseAge(lock, { fetchMetadata = metadata, now = Date.now() } = {}) {
  if (lock.lockfileVersion !== 3 || !lock.packages) throw new Error("Expected a v3 package lock");
  const packages = new Map();
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path) continue;
    const name = path.split("node_modules/").at(-1);
    const expected = `https://registry.npmjs.org/${name}/-/`;
    if (!entry.version || !entry.integrity || !entry.resolved?.startsWith(expected) || entry.link || entry.inBundle) {
      throw new Error(`Unsupported dependency source: ${path}; only npm registry packages are allowed`);
    }
    if (!packages.has(name)) packages.set(name, new Set());
    packages.get(name).add(entry.version);
  }
  let count = 0;
  // Fetch one packument per name; sequential requests avoid registry bursts.
  for (const [name, versions] of packages) {
    const data = await fetchMetadata(name);
    for (const version of versions) {
      const published = data.time?.[version];
      const timestamp = typeof published === "string" ? Date.parse(published) : NaN;
      if (!Number.isFinite(timestamp)) throw new Error(`Missing publication time: ${name}@${version}`);
      if (now - timestamp < minimumAge) {
        throw new Error(`${name}@${version} was published ${published}; wait until ${new Date(timestamp + minimumAge).toISOString()} (72-hour minimum)`);
      }
      count++;
    }
  }
  return count;
}

async function metadata(name) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Registry metadata failed for ${name}: HTTP ${response.status}`);
  return response.json();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
  console.log(`Release-age policy passed: ${await checkReleaseAge(lock)} package versions are at least 72 hours old.`);
}
