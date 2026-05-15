// llvm-cov segment tuple layout:
// [line, column, count, hasCount, isRegionEntry, isGapRegion]
const COUNT = 2;
const HAS_COUNT = 3;
const IS_REGION_ENTRY = 4;
const IS_GAP_REGION = 5;

/**
 * @param {import("./line-coverage-from-segments.mjs").Segment} segment
 * @returns {boolean}
 */
function isCountedRegionEntry(segment) {
  return (
    segment[IS_REGION_ENTRY] && segment[HAS_COUNT] && !segment[IS_GAP_REGION]
  );
}

/**
 * @param {import("./line-coverage-from-segments.mjs").Segment[]} segments
 * @returns {import("./percent.mjs").Coverage}
 */
export function regionCoverageFromSegments(segments) {
  let count = 0;
  let covered = 0;

  for (const segment of segments) {
    if (!isCountedRegionEntry(segment)) {
      continue;
    }

    count += 1;

    if (segment[COUNT] > 0) {
      covered += 1;
    }
  }

  return { count, covered };
}
