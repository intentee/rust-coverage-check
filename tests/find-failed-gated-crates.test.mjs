import { strict as assert } from "node:assert";
import { test } from "node:test";

import { findFailedGatedCrates } from "../src/find-failed-gated-crates.mjs";

function fullyCovered() {
  return {
    lines: { count: 10, covered: 10 },
    functions: { count: 5, covered: 5 },
    regions: { count: 8, covered: 8 },
  };
}

function partiallyCovered() {
  return {
    lines: { count: 10, covered: 8 },
    functions: { count: 5, covered: 5 },
    regions: { count: 8, covered: 8 },
  };
}

test("returns empty array when every gated crate is at the required percent", () => {
  const stats = new Map([
    ["alpha", fullyCovered()],
    ["beta", fullyCovered()],
  ]);
  const gated = new Set(["alpha", "beta"]);

  const failures = findFailedGatedCrates(stats, gated, 100);

  assert.deepEqual(failures, []);
});

test("reports a gated crate whose lines coverage falls below the threshold", () => {
  const stats = new Map([["alpha", partiallyCovered()]]);
  const gated = new Set(["alpha"]);

  const failures = findFailedGatedCrates(stats, gated, 100);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].crateName, "alpha");
  assert.equal(failures[0].linesPercent, 80);
  assert.equal(failures[0].missing, false);
});

test("ignores non-gated crates even when they are below the threshold", () => {
  const stats = new Map([
    ["alpha", fullyCovered()],
    ["non_gated", partiallyCovered()],
  ]);
  const gated = new Set(["alpha"]);

  const failures = findFailedGatedCrates(stats, gated, 100);

  assert.deepEqual(failures, []);
});

test("reports a gated crate that is missing from the stats map", () => {
  const stats = new Map([["alpha", fullyCovered()]]);
  const gated = new Set(["alpha", "missing_crate"]);

  const failures = findFailedGatedCrates(stats, gated, 100);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].crateName, "missing_crate");
  assert.equal(failures[0].missing, true);
});
