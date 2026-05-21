import { strict as assert } from "node:assert";
import { test } from "node:test";

import { mergeSegmentsAcrossEntries } from "../src/merge-segments-across-entries.mjs";

// llvm-cov segment tuple: [line, column, count, hasCount, isRegionEntry, isGapRegion]

test("keeps the highest count when the same position appears in multiple entries", () => {
  const merged = mergeSegmentsAcrossEntries([
    [[10, 5, 0, true, true, false]],
    [[10, 5, 7, true, true, false]],
  ]);

  assert.deepEqual(merged, [[10, 5, 7, true, true, false]]);
});

test("OR's hasCount across entries when one entry lacks a counted segment at the position", () => {
  const merged = mergeSegmentsAcrossEntries([
    [[10, 5, 0, false, true, false]],
    [[10, 5, 0, true, true, false]],
  ]);

  assert.deepEqual(merged, [[10, 5, 0, true, true, false]]);
});

test("preserves distinct positions and returns them sorted by line then column", () => {
  const merged = mergeSegmentsAcrossEntries([
    [
      [20, 1, 0, true, true, false],
      [10, 5, 0, true, true, false],
    ],
    [[10, 9, 2, true, true, false]],
  ]);

  assert.deepEqual(merged, [
    [10, 5, 0, true, true, false],
    [10, 9, 2, true, true, false],
    [20, 1, 0, true, true, false],
  ]);
});

test("treats a gap-region segment as distinct from a non-gap segment at the same position", () => {
  const merged = mergeSegmentsAcrossEntries([
    [[10, 5, 0, true, true, false]],
    [[10, 5, 0, true, true, true]],
  ]);

  assert.deepEqual(merged, [
    [10, 5, 0, true, true, false],
    [10, 5, 0, true, true, true],
  ]);
});

test("returns an empty array when no entries are provided", () => {
  assert.deepEqual(mergeSegmentsAcrossEntries([]), []);
});
