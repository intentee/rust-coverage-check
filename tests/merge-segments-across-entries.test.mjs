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

test("ORs hasCount across entries when one entry lacks a counted segment at the position", () => {
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

test("orders region-entry segments before non-region segments at the same position so startsSkippedRegion sees the structural marker first", () => {
  const skippedRegionMarker = [10, 5, 0, false, true, false];
  const nonRegionSegment = [10, 5, 5, true, false, false];

  const merged = mergeSegmentsAcrossEntries([
    [nonRegionSegment],
    [skippedRegionMarker],
  ]);

  assert.deepEqual(merged, [skippedRegionMarker, nonRegionSegment]);
});

test("produces identical output regardless of the order of data[] entries with distinct-flag segments at the same line and column", () => {
  const regionEntrySegment = [10, 5, 3, true, true, false];
  const nonRegionSegment = [10, 5, 0, true, false, false];

  const forward = mergeSegmentsAcrossEntries([
    [regionEntrySegment],
    [nonRegionSegment],
  ]);
  const reverse = mergeSegmentsAcrossEntries([
    [nonRegionSegment],
    [regionEntrySegment],
  ]);

  assert.deepEqual(forward, reverse);
});
