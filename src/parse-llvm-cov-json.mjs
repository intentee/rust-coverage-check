import { readFileSync } from "node:fs";

import { lineCoverageFromSegments } from "./line-coverage-from-segments.mjs";
import { mergeFunctionInstantiations } from "./merge-function-instantiations.mjs";
import { regionCoverageFromSegments } from "./region-coverage-from-segments.mjs";
import { workspaceRelativeCrate } from "./workspace-relative-crate.mjs";

// llvm-cov's per-file `summary` is computed per instantiation, so it undercounts
// a crate that is compiled both as a unit-test binary and as a dependency. The
// `segments` array and the `functions` list, however, carry the merged counts
// across every instantiation, so coverage is derived from those instead.

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
 * @param {string} jsonPath
 * @param {string} workspaceRoot
 * @returns {Map<string, CrateStats>}
 */
export function parseLlvmCovJson(jsonPath, workspaceRoot) {
  /** @type {LlvmCovJson} */
  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  /** @type {Map<string, CrateStats>} */
  const crateStats = new Map();

  for (const dataEntry of data.data) {
    for (const fileEntry of dataEntry.files) {
      const crateName = workspaceRelativeCrate(
        fileEntry.filename,
        workspaceRoot,
      );

      if (crateName === null) {
        continue;
      }

      const stats = crateStatsFor(crateStats, crateName);

      addCoverage(
        stats.regions,
        regionCoverageFromSegments(fileEntry.segments),
      );
      addCoverage(stats.lines, lineCoverageFromSegments(fileEntry.segments));
    }

    for (const mergedFunction of mergeFunctionInstantiations(
      dataEntry.functions,
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
  }

  return crateStats;
}
