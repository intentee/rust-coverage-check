import { strict as assert } from "node:assert";
import { test } from "node:test";

import { formatCoverageTable } from "../src/format-coverage-table.mjs";

function statsWith(linesCovered, linesCount) {
  return {
    lines: { count: linesCount, covered: linesCovered },
    functions: { count: 1, covered: 1 },
    regions: { count: 1, covered: 1 },
  };
}

test("renders a header row that includes the required threshold column", () => {
  const output = formatCoverageTable(new Map(), new Map());

  const [header, separator] = output.split("\n");
  assert.ok(header.includes("crate"));
  assert.ok(header.includes("lines"));
  assert.ok(header.includes("functions"));
  assert.ok(header.includes("regions"));
  assert.ok(header.includes("required"));
  assert.ok(separator.length > 0);
  assert.ok(separator.split("").every((character) => character === "-"));
});

test("sorts crates alphabetically", () => {
  const stats = new Map([
    ["zeta", statsWith(10, 10)],
    ["alpha", statsWith(10, 10)],
  ]);

  const output = formatCoverageTable(stats, new Map());
  const alphaIndex = output.indexOf("alpha");
  const zetaIndex = output.indexOf("zeta");

  assert.ok(alphaIndex > 0 && zetaIndex > 0);
  assert.ok(alphaIndex < zetaIndex);
});

test("shows the per-crate threshold for gated crates and - for non-gated", () => {
  const stats = new Map([
    ["gated_one", statsWith(10, 10)],
    ["not_gated", statsWith(10, 10)],
  ]);
  const gated = new Map([["gated_one", 99]]);

  const output = formatCoverageTable(stats, gated);
  const gatedLine = output
    .split("\n")
    .find((line) => line.includes("gated_one"));
  const notGatedLine = output
    .split("\n")
    .find((line) => line.includes("not_gated"));

  assert.ok(gatedLine.trimEnd().endsWith("99.00%"));
  assert.ok(notGatedLine.trimEnd().endsWith("-"));
});

test("formats body percentages with two decimal places", () => {
  const stats = new Map([["alpha", statsWith(2, 3)]]);

  const output = formatCoverageTable(stats, new Map());

  assert.ok(output.includes("66.67%"));
});
