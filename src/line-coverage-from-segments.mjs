// Reimplements llvm-cov's LineCoverageIterator / LineCoverageStats so that line
// coverage is derived from the merged `segments` array rather than the per-file
// `summary`, which llvm-cov computes per-instantiation and therefore undercounts
// when a crate is compiled both as a unit-test binary and as a dependency.
//
// llvm-cov segment tuple layout:
// [line, column, count, hasCount, isRegionEntry, isGapRegion]

/**
 * @typedef {[number, number, number, boolean, boolean, boolean]} Segment
 */

const LINE = 0;
const COUNT = 2;
const HAS_COUNT = 3;
const IS_REGION_ENTRY = 4;
const IS_GAP_REGION = 5;

/**
 * @param {Segment} segment
 * @returns {boolean}
 */
function isStartOfRegion(segment) {
  return (
    !segment[IS_GAP_REGION] && segment[HAS_COUNT] && segment[IS_REGION_ENTRY]
  );
}

/**
 * @param {Segment[]} lineSegments
 * @returns {boolean}
 */
function startsSkippedRegion(lineSegments) {
  return (
    lineSegments.length > 0 &&
    !lineSegments[0][HAS_COUNT] &&
    lineSegments[0][IS_REGION_ENTRY]
  );
}

/**
 * @param {Segment[]} lineSegments
 * @param {Segment | null} wrappedSegment
 * @returns {boolean}
 */
function lineIsMapped(lineSegments, wrappedSegment) {
  if (startsSkippedRegion(lineSegments)) {
    return false;
  }

  const hasWrappedCount = wrappedSegment !== null && wrappedSegment[HAS_COUNT];

  return hasWrappedCount || lineSegments.some(isStartOfRegion);
}

/**
 * Returns the execution count for a mapped line. The caller must guarantee
 * `lineIsMapped(lineSegments, wrappedSegment)` is true, which implies that
 * either `lineSegments` contains at least one region start with a count, or
 * `wrappedSegment` is non-null with a count — never neither.
 *
 * @param {Segment[]} lineSegments
 * @param {Segment | null} wrappedSegment
 * @returns {number}
 */
function lineExecutionCount(lineSegments, wrappedSegment) {
  const regionStarts = lineSegments.filter(isStartOfRegion);

  if (regionStarts.length > 0) {
    return regionStarts.reduce(
      (maxCount, segment) => Math.max(maxCount, segment[COUNT]),
      0,
    );
  }

  return /** @type {Segment} */ (wrappedSegment)[COUNT];
}

/**
 * @param {Segment[]} segments
 * @returns {import("./percent.mjs").Coverage}
 */
export function lineCoverageFromSegments(segments) {
  if (segments.length === 0) {
    return { count: 0, covered: 0 };
  }

  let count = 0;
  let covered = 0;
  /** @type {Segment | null} */
  let wrappedSegment = null;
  /** @type {Segment[]} */
  let previousLineSegments = [];
  let segmentIndex = 0;

  const firstLine = segments[0][LINE];
  const lastLine = segments[segments.length - 1][LINE];

  for (let line = firstLine; line <= lastLine; line += 1) {
    if (previousLineSegments.length > 0) {
      wrappedSegment = previousLineSegments[previousLineSegments.length - 1];
    }

    /** @type {Segment[]} */
    const lineSegments = [];

    while (
      segmentIndex < segments.length &&
      segments[segmentIndex][LINE] === line
    ) {
      lineSegments.push(segments[segmentIndex]);
      segmentIndex += 1;
    }

    if (lineIsMapped(lineSegments, wrappedSegment)) {
      count += 1;

      if (lineExecutionCount(lineSegments, wrappedSegment) > 0) {
        covered += 1;
      }
    }

    previousLineSegments = lineSegments;
  }

  return { count, covered };
}
