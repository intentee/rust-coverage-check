import { strict as assert } from "node:assert";
import { test } from "node:test";

import { lineCoverageFromSegments } from "../src/line-coverage-from-segments.mjs";

// llvm-cov segment tuple: [line, column, count, hasCount, isRegionEntry, isGapRegion]

test("returns zero counts for an empty segment list", () => {
  assert.deepEqual(lineCoverageFromSegments([]), { count: 0, covered: 0 });
});

test("counts a line entered by a positive-count region as covered", () => {
  const segments = [
    [1, 1, 7, true, true, false],
    [1, 30, 0, false, false, false],
  ];

  assert.deepEqual(lineCoverageFromSegments(segments), {
    count: 1,
    covered: 1,
  });
});

test("counts a line entered by a zero-count region as uncovered", () => {
  const segments = [
    [1, 1, 0, true, true, false],
    [1, 30, 0, false, false, false],
  ];

  assert.deepEqual(lineCoverageFromSegments(segments), {
    count: 1,
    covered: 0,
  });
});

test("does not count a line that only starts a skipped region", () => {
  const segments = [[1, 1, 0, false, true, false]];

  assert.deepEqual(lineCoverageFromSegments(segments), {
    count: 0,
    covered: 0,
  });
});

test("counts continuation lines covered by the wrapped region's count", () => {
  // A single region entered on line 1 and exited on line 3: lines 2 and 3 have
  // no region of their own and inherit the wrapped region's count.
  const segments = [
    [1, 1, 4, true, true, false],
    [3, 10, 0, false, false, false],
  ];

  assert.deepEqual(lineCoverageFromSegments(segments), {
    count: 3,
    covered: 3,
  });
});

test("does not count a line with no region start and no wrapped count", () => {
  const segments = [
    [1, 1, 0, false, false, false], // stray mid-region segment, no count, line 1
    [2, 1, 5, true, true, false],
    [2, 9, 0, false, false, false],
    [2, 15, 5, true, false, false], // counted, but not a region entry
  ];

  assert.deepEqual(lineCoverageFromSegments(segments), {
    count: 1,
    covered: 1,
  });
});

test("treats a gap region as not starting a region", () => {
  const segments = [[1, 1, 5, true, true, true]];

  assert.deepEqual(lineCoverageFromSegments(segments), {
    count: 0,
    covered: 0,
  });
});
