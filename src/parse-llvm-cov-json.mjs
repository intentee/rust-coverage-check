import { readFileSync } from "node:fs";

import { lineCoverageFromSegments } from "./line-coverage-from-segments.mjs";
import { mergeFunctionInstantiations } from "./merge-function-instantiations.mjs";
import { mergeSegmentsAcrossEntries } from "./merge-segments-across-entries.mjs";
import { regionCoverageFromSegments } from "./region-coverage-from-segments.mjs";
import { workspaceRelativeCrate } from "./workspace-relative-crate.mjs";

// llvm-cov's per-file `summary` is computed per instantiation, so it undercounts
// a crate that is compiled both as a unit-test binary and as a dependency. The
// `segments` array and the `functions` list carry merged counts within a single
// `data[]` entry, but llvm-cov export emits one entry per profiled binary, so a
// file or function touched by multiple binaries appears in multiple entries.
// Coverage is therefore derived by aggregating segments and function entries
// across all data entries before computing per-crate stats.

/**
 * @typedef {object} CrateStats
 * @property {import("./percent.mjs").Coverage} lines
 * @property {import("./percent.mjs").Coverage} functions
 * @property {import("./percent.mjs").Coverage} regions
 */

/**
 * @typedef {object} FileEntry
 * @property {string} filename
 * @property {import("./line-coverage-from-segments.mjs").Segment[]} segments
 */

/**
 * @typedef {object} DataEntry
 * @property {FileEntry[]} files
 * @property {import("./merge-function-instantiations.mjs").FunctionEntry[]} functions
 */

/**
 * @typedef {object} LlvmCovJson
 * @property {DataEntry[]} data
 */

/**
 * @returns {CrateStats}
 */
function emptyCrateStats() {
  return {
    lines: { count: 0, covered: 0 },
    functions: { count: 0, covered: 0 },
    regions: { count: 0, covered: 0 },
  };
}

/**
 * @param {import("./percent.mjs").Coverage} target
 * @param {import("./percent.mjs").Coverage} addition
 */
function addCoverage(target, addition) {
  target.count += addition.count;
  target.covered += addition.covered;
}

/**
 * @param {Map<string, CrateStats>} crateStats
 * @param {string} crateName
 * @returns {CrateStats}
 */
function crateStatsFor(crateStats, crateName) {
  const existing = crateStats.get(crateName);

  if (existing !== undefined) {
    return existing;
  }

  const fresh = emptyCrateStats();
  crateStats.set(crateName, fresh);

  return fresh;
}

/**
 * @param {LlvmCovJson} data
 * @returns {Map<string, import("./line-coverage-from-segments.mjs").Segment[][]>}
 */
function collectSegmentsByFilename(data) {
  /** @type {Map<string, import("./line-coverage-from-segments.mjs").Segment[][]>} */
  const segmentsByFilename = new Map();

  for (const dataEntry of data.data) {
    for (const fileEntry of dataEntry.files) {
      const existing = segmentsByFilename.get(fileEntry.filename);

      if (existing) {
        existing.push(fileEntry.segments);
      } else {
        segmentsByFilename.set(fileEntry.filename, [fileEntry.segments]);
      }
    }
  }

  return segmentsByFilename;
}

/**
 * @param {LlvmCovJson} data
 * @returns {import("./merge-function-instantiations.mjs").FunctionEntry[]}
 */
function collectFunctionEntries(data) {
  /** @type {import("./merge-function-instantiations.mjs").FunctionEntry[]} */
  const functionEntries = [];

  for (const dataEntry of data.data) {
    for (const functionEntry of dataEntry.functions) {
      functionEntries.push(functionEntry);
    }
  }

  return functionEntries;
}

/**
 * @param {string} jsonPath
 * @param {string} workspaceRoot
 * @returns {Map<string, CrateStats>}
 */
export function parseLlvmCovJson(jsonPath, workspaceRoot) {
  /** @type {LlvmCovJson} */
  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  /** @type {Map<string, CrateStats>} */
  const crateStats = new Map();

  for (const [filename, segmentArrays] of collectSegmentsByFilename(data)) {
    const crateName = workspaceRelativeCrate(filename, workspaceRoot);

    if (crateName === null) {
      continue;
    }

    const mergedSegments = mergeSegmentsAcrossEntries(segmentArrays);
    const stats = crateStatsFor(crateStats, crateName);

    addCoverage(stats.regions, regionCoverageFromSegments(mergedSegments));
    addCoverage(stats.lines, lineCoverageFromSegments(mergedSegments));
  }

  for (const mergedFunction of mergeFunctionInstantiations(
    collectFunctionEntries(data),
  )) {
    const crateName = workspaceRelativeCrate(
      mergedFunction.filename,
      workspaceRoot,
    );

    if (crateName === null) {
      continue;
    }

    const stats = crateStatsFor(crateStats, crateName);

    stats.functions.count += 1;

    if (mergedFunction.covered) {
      stats.functions.covered += 1;
    }
  }

  return crateStats;
}
