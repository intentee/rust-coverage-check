// llvm-cov export emits one `data[]` entry per profiled binary. The static
// region table for a given source file is identical across entries, so a file
// touched by multiple binaries appears with the same segment coordinates but
// potentially different `count` and `hasCount` values. Aggregating segments by
// position lets `lineCoverageFromSegments` and `regionCoverageFromSegments`
// score the union of coverage across binaries without double-counting the
// denominator.
//
// llvm-cov segment tuple: [line, column, count, hasCount, isRegionEntry, isGapRegion]

const LINE = 0;
const COLUMN = 1;
const COUNT = 2;
const HAS_COUNT = 3;
const IS_REGION_ENTRY = 4;
const IS_GAP_REGION = 5;

/**
 * @param {import("./line-coverage-from-segments.mjs").Segment} segment
 * @returns {string}
 */
function segmentPositionKey(segment) {
  return `${segment[LINE]}:${segment[COLUMN]}:${segment[IS_REGION_ENTRY]}:${segment[IS_GAP_REGION]}`;
}

/**
 * @param {import("./line-coverage-from-segments.mjs").Segment} left
 * @param {import("./line-coverage-from-segments.mjs").Segment} right
 * @returns {number}
 */
function compareSegmentsByPosition(left, right) {
  if (left[LINE] !== right[LINE]) {
    return left[LINE] - right[LINE];
  }

  if (left[COLUMN] !== right[COLUMN]) {
    return left[COLUMN] - right[COLUMN];
  }

  if (left[IS_REGION_ENTRY] !== right[IS_REGION_ENTRY]) {
    return Number(left[IS_REGION_ENTRY]) - Number(right[IS_REGION_ENTRY]);
  }

  return Number(left[IS_GAP_REGION]) - Number(right[IS_GAP_REGION]);
}

/**
 * @param {import("./line-coverage-from-segments.mjs").Segment[][]} segmentArrays
 * @returns {import("./line-coverage-from-segments.mjs").Segment[]}
 */
export function mergeSegmentsAcrossEntries(segmentArrays) {
  /** @type {Map<string, import("./line-coverage-from-segments.mjs").Segment>} */
  const mergedByPosition = new Map();

  for (const segments of segmentArrays) {
    for (const segment of segments) {
      const key = segmentPositionKey(segment);
      const existing = mergedByPosition.get(key);

      if (existing) {
        existing[COUNT] = Math.max(existing[COUNT], segment[COUNT]);
        existing[HAS_COUNT] = existing[HAS_COUNT] || segment[HAS_COUNT];
      } else {
        mergedByPosition.set(key, [
          segment[LINE],
          segment[COLUMN],
          segment[COUNT],
          segment[HAS_COUNT],
          segment[IS_REGION_ENTRY],
          segment[IS_GAP_REGION],
        ]);
      }
    }
  }

  return [...mergedByPosition.values()].sort(compareSegmentsByPosition);
}
