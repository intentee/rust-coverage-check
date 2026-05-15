import { strict as assert } from "node:assert";
import { test } from "node:test";

import { regionCoverageFromSegments } from "../src/region-coverage-from-segments.mjs";

// llvm-cov segment tuple: [line, column, count, hasCount, isRegionEntry, isGapRegion]

test("returns zero counts for an empty segment list", () => {
  assert.deepEqual(regionCoverageFromSegments([]), { count: 0, covered: 0 });
});

test("counts a region-entry segment with a positive count as covered", () => {
  const segments = [[10, 1, 4, true, true, false]];

  assert.deepEqual(regionCoverageFromSegments(segments), {
    count: 1,
    covered: 1,
  });
});

test("counts a region-entry segment with a zero count as uncovered", () => {
  const segments = [[10, 1, 0, true, true, false]];

  assert.deepEqual(regionCoverageFromSegments(segments), {
    count: 1,
    covered: 0,
  });
});

test("ignores gap regions, skipped regions, and non-entry segments", () => {
  const segments = [
    [10, 1, 5, true, true, true], // gap region
    [11, 1, 0, false, true, false], // skipped region: region entry without a count
    [12, 1, 9, true, false, false], // mid-region segment, not an entry
  ];

  assert.deepEqual(regionCoverageFromSegments(segments), {
    count: 0,
    covered: 0,
  });
});
