// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import { copyFile, cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist/licenses");
const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
await mkdir(output, { recursive: true });

for (const file of ["LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md", "PRIVACY.md"]) {
  await copyFile(join(root, file), join(output, file));
}

const inventory = [];
for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path || entry.dev) continue;
  const source = join(root, path);
  const metadata = JSON.parse(await readFile(join(source, "package.json"), "utf8"));
  if (metadata.version !== entry.version) {
    throw new Error(`Installed version differs from lockfile: ${path}; run npm ci`);
  }
  const files = (await readdir(source)).filter((name) =>
    /^(licen[cs]e|copying|notice)([.-]|$)/i.test(name),
  ).sort();
  const destination = join(output, "dependencies", path.replace(/^node_modules\//, ""));
  await mkdir(destination, { recursive: true });
  for (const file of files) {
    await cp(join(source, file), join(destination, file), { recursive: true });
  }
  inventory.push({
    name: metadata.name,
    version: entry.version,
    path,
    license: entry.license ?? metadata.license ?? "UNKNOWN",
    files,
    ...(files.length ? {} : {
      review: "No standalone license file. Check Cesium's full notices and upstream provenance before release.",
    }),
  });
}

await writeFile(join(output, "inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`);
const missing = inventory.filter((entry) => !entry.files.length);
console.log(`Preserved license files for ${inventory.length} runtime packages in dist/licenses.`);
if (missing.length) {
  console.warn(`License review required (no standalone file): ${missing.map((entry) => entry.name).join(", ")}`);
}
