// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { checkReleaseAge, minimumAge } from "./check-release-age.mjs";

const now = Date.parse("2026-09-14T12:00:00Z");
const entry = { version: "1.0.0", resolved: "https://registry.npmjs.org/example/-/example-1.0.0.tgz", integrity: "sha512-test" };
const lock = { lockfileVersion: 3, packages: { "": {}, "node_modules/example": entry } };
const options = (age) => ({ now, fetchMetadata: async () => ({ time: { "1.0.0": new Date(now - age).toISOString() } }) });

test("accepts the exact 72-hour boundary and older releases", async () => {
  assert.equal(await checkReleaseAge(lock, options(minimumAge)), 1);
  assert.equal(await checkReleaseAge(lock, options(minimumAge + 1)), 1);
});

test("rejects young and future releases", async () => {
  for (const age of [minimumAge - 1, 0, -1]) {
    await assert.rejects(checkReleaseAge(lock, options(age)), /72-hour minimum/);
  }
});

test("fails closed on missing timestamps and registry failures", async () => {
  await assert.rejects(checkReleaseAge(lock, { fetchMetadata: async () => ({}) }), /Missing publication time/);
  await assert.rejects(checkReleaseAge(lock, { fetchMetadata: async () => { throw new Error("offline"); } }), /offline/);
});

test("checks nested, optional and dev packages without exemptions", async () => {
  const nested = { ...lock, packages: { ...lock.packages, "node_modules/parent/node_modules/example": { ...entry, version: "2.0.0", dev: true, optional: true } } };
  await assert.rejects(checkReleaseAge(nested, options(minimumAge)), /example@2.0.0/);
});

test("rejects uncheckable sources and malformed locks", async () => {
  for (const override of [{ resolved: "git+https://example.com/repo" }, { link: true }, { inBundle: true }, { integrity: undefined }]) {
    await assert.rejects(checkReleaseAge({ ...lock, packages: { "node_modules/example": { ...entry, ...override } } }), /Unsupported dependency source/);
  }
  await assert.rejects(checkReleaseAge({}), /Expected a v3/);
});
