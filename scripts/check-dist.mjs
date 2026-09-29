// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const dist = new URL("dist/", root);

test("production entry references emitted JavaScript and CSS", async () => {
  const html = await readFile(new URL("index.html", dist), "utf8");
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
    .map((match) => match[1]);
  assert.ok(assets.some((asset) => asset.endsWith(".js")));
  assert.ok(assets.some((asset) => asset.endsWith(".css")));
  for (const asset of assets) {
    assert.ok((await stat(new URL(asset.slice(1), dist))).size > 0);
  }
});

test("Cesium runtime directories are shipped", async () => {
  for (const directory of ["Workers", "Assets", "Widgets", "ThirdParty"]) {
    assert.ok((await readdir(new URL(`cesium/${directory}/`, dist))).length > 0);
  }
});

test("legal documents and runtime dependency licenses match the lockfile", async () => {
  for (const file of ["LICENSE", "NOTICE", "THIRD_PARTY_NOTICES.md", "PRIVACY.md"]) {
    assert.equal(
      await readFile(new URL(`licenses/${file}`, dist), "utf8"),
      await readFile(new URL(file, root), "utf8"),
    );
  }
  const lock = JSON.parse(await readFile(new URL("package-lock.json", root), "utf8"));
  const inventory = JSON.parse(await readFile(new URL("licenses/inventory.json", dist), "utf8"));
  const runtime = Object.entries(lock.packages).filter(([path, entry]) => path && !entry.dev);
  assert.deepEqual(inventory.map((entry) => entry.path).sort(), runtime.map(([path]) => path).sort());
  for (const entry of inventory) {
    assert.equal(entry.version, lock.packages[entry.path].version);
    assert.ok(entry.files.length > 0 || entry.review, `Missing license review: ${entry.name}`);
    for (const file of entry.files) {
      const path = entry.path.replace(/^node_modules\//, "");
      await stat(new URL(`licenses/dependencies/${path}/${file}`, dist));
    }
  }
});
