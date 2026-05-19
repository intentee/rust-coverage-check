import { strict as assert } from "node:assert";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseLlvmCovJson } from "../src/parse-llvm-cov-json.mjs";

const FIXTURE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "sample-llvm-cov.json",
);

const WINDOWS_FIXTURE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "windows-llvm-cov.json",
);

const WORKSPACE_ROOT = "/workspace";

test("groups files by their first path component", () => {
  const crateStats = parseLlvmCovJson(FIXTURE_PATH, WORKSPACE_ROOT);

  assert.ok(crateStats.has("spiffe_svid_manager"));
  assert.ok(crateStats.has("spiffe_svid_manager_tests"));
});

test("reports a crate as fully covered from merged segment data even though its per-instantiation summary undercounts it", () => {
  // The fixture's svid_converter_service.rs carries a summary of 150/151 regions
  // and 74/75 lines because llvm-cov summarised a single instantiation; its
  // merged segments prove every region and line is covered.
  const crateStats = parseLlvmCovJson(FIXTURE_PATH, WORKSPACE_ROOT);
  const managerCrate = crateStats.get("spiffe_svid_manager");

  assert.deepEqual(managerCrate.regions, { count: 172, covered: 172 });
  assert.deepEqual(managerCrate.lines, { count: 81, covered: 81 });
  assert.deepEqual(managerCrate.functions, { count: 17, covered: 17 });
});

test("still reports a genuinely uncovered region", () => {
  const crateStats = parseLlvmCovJson(FIXTURE_PATH, WORKSPACE_ROOT);
  const testsCrate = crateStats.get("spiffe_svid_manager_tests");

  assert.deepEqual(testsCrate.regions, { count: 33, covered: 32 });
  assert.deepEqual(testsCrate.lines, { count: 17, covered: 17 });
  assert.deepEqual(testsCrate.functions, { count: 4, covered: 4 });
});

test("skips files outside the supplied workspace root", () => {
  const crateStats = parseLlvmCovJson(FIXTURE_PATH, "/different-root");

  assert.equal(crateStats.size, 0);
});

test("groups files by crate for a Windows-style llvm-cov report", () => {
  const crateStats = parseLlvmCovJson(WINDOWS_FIXTURE_PATH, "C:\\workspace");

  assert.ok(crateStats.has("spiffe_svid_manager"));
  assert.ok(crateStats.has("spiffe_svid_manager_tests"));
});
