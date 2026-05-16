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

test("returns empty array when every gated crate meets its required percent", () => {
  const stats = new Map([
    ["alpha", fullyCovered()],
    ["beta", fullyCovered()],
  ]);
  const gated = new Map([
    ["alpha", 100],
    ["beta", 100],
  ]);

  const failures = findFailedGatedCrates(stats, gated);

  assert.deepEqual(failures, []);
});

test("reports a gated crate whose lines coverage falls below its threshold", () => {
  const stats = new Map([["alpha", partiallyCovered()]]);
  const gated = new Map([["alpha", 100]]);

  const failures = findFailedGatedCrates(stats, gated);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].crateName, "alpha");
  assert.equal(failures[0].requiredPercent, 100);
  assert.equal(failures[0].linesPercent, 80);
  assert.equal(failures[0].missing, false);
});

test("reports a gated crate that is missing from the stats map", () => {
  const stats = new Map([["alpha", fullyCovered()]]);
  const gated = new Map([
    ["alpha", 100],
    ["missing_crate", 90],
  ]);

  const failures = findFailedGatedCrates(stats, gated);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].crateName, "missing_crate");
  assert.equal(failures[0].requiredPercent, 90);
  assert.equal(failures[0].missing, true);
});

test("applies a different threshold to each gated crate", () => {
  const stats = new Map([
    ["strict_crate", partiallyCovered()],
    ["lenient_crate", partiallyCovered()],
  ]);
  const gated = new Map([
    ["strict_crate", 100],
    ["lenient_crate", 70],
  ]);

  const failures = findFailedGatedCrates(stats, gated);

  assert.equal(failures.length, 1);
  assert.equal(failures[0].crateName, "strict_crate");
  assert.equal(failures[0].requiredPercent, 100);
});
