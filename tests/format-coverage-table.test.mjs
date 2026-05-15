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

test("renders a header row and a separator row", () => {
  const output = formatCoverageTable(new Map(), new Set());

  const [header, separator] = output.split("\n");
  assert.ok(header.includes("crate"));
  assert.ok(header.includes("lines"));
  assert.ok(header.includes("functions"));
  assert.ok(header.includes("regions"));
  assert.ok(header.includes("gated"));
  assert.ok(separator.length > 0);
  assert.ok(separator.split("").every((character) => character === "-"));
});

test("sorts crates alphabetically", () => {
  const stats = new Map([
    ["zeta", statsWith(10, 10)],
    ["alpha", statsWith(10, 10)],
  ]);

  const output = formatCoverageTable(stats, new Set());
  const alphaIndex = output.indexOf("alpha");
  const zetaIndex = output.indexOf("zeta");

  assert.ok(alphaIndex > 0 && zetaIndex > 0);
  assert.ok(alphaIndex < zetaIndex);
});

test("marks gated crates with YES and non-gated with no", () => {
  const stats = new Map([
    ["gated_one", statsWith(10, 10)],
    ["not_gated", statsWith(10, 10)],
  ]);
  const gated = new Set(["gated_one"]);

  const output = formatCoverageTable(stats, gated);
  const gatedLine = output
    .split("\n")
    .find((line) => line.includes("gated_one"));
  const notGatedLine = output
    .split("\n")
    .find((line) => line.includes("not_gated"));

  assert.ok(gatedLine.trimEnd().endsWith("YES"));
  assert.ok(notGatedLine.trimEnd().endsWith("no"));
});

test("formats percentages with two decimal places", () => {
  const stats = new Map([["alpha", statsWith(2, 3)]]);

  const output = formatCoverageTable(stats, new Set());

  assert.ok(output.includes("66.67%"));
});
