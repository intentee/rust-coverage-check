import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(TESTS_DIR, "..");
const MAIN_SCRIPT = resolve(REPO_ROOT, "src", "main.mjs");
const FIXTURE_PATH = resolve(TESTS_DIR, "fixtures", "sample-llvm-cov.json");
const FIXTURE_WORKSPACE = "/workspace";

function runMain(argv) {
  return spawnSync("node", [MAIN_SCRIPT, ...argv], {
    encoding: "utf-8",
    timeout: 5000,
  });
}

test("prints the coverage table and exits 0 when no gated crates are supplied", () => {
  const result = runMain([FIXTURE_PATH, "--workspace-root", FIXTURE_WORKSPACE]);

  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes("spiffe_svid_manager"));
  assert.ok(result.stdout.includes("spiffe_svid_manager_tests"));
});

test("exits 0 when every gated crate meets the required percent", () => {
  const result = runMain([
    FIXTURE_PATH,
    "--workspace-root",
    FIXTURE_WORKSPACE,
    "--gated",
    "spiffe_svid_manager",
    "--required-percent",
    "100",
  ]);

  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes("All gated crates at 100% coverage."));
});

test("exits 1 and lists failures when a gated crate is below the required percent", () => {
  const result = runMain([
    FIXTURE_PATH,
    "--workspace-root",
    FIXTURE_WORKSPACE,
    "--gated",
    "spiffe_svid_manager_tests",
    "--required-percent",
    "100",
  ]);

  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("Coverage below 100%"));
  assert.ok(result.stderr.includes("spiffe_svid_manager_tests"));
});

test("exits 1 and reports a missing gated crate", () => {
  const result = runMain([
    FIXTURE_PATH,
    "--workspace-root",
    FIXTURE_WORKSPACE,
    "--gated",
    "nonexistent_crate",
    "--required-percent",
    "99",
  ]);

  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("missing from coverage report"));
  assert.ok(result.stderr.includes("nonexistent_crate"));
});
