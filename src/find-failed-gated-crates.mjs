import { percent } from "./percent.mjs";

/**
 * @typedef {object} GateFailure
 * @property {string} crateName
 * @property {number} linesPercent
 * @property {number} functionsPercent
 * @property {number} regionsPercent
 * @property {boolean} missing
 */

/**
 * @param {Map<string, import("./parse-llvm-cov-json.mjs").CrateStats>} crateStats
 * @param {Set<string>} gatedCrates
 * @param {number} requiredPercent
 * @returns {GateFailure[]}
 */
export function findFailedGatedCrates(
  crateStats,
  gatedCrates,
  requiredPercent,
) {
  /** @type {GateFailure[]} */
  const failures = [];

  for (const [crateName, stats] of crateStats) {
    if (!gatedCrates.has(crateName)) {
      continue;
    }

    const linesPercent = percent(stats.lines);
    const functionsPercent = percent(stats.functions);
    const regionsPercent = percent(stats.regions);

    if (
      linesPercent < requiredPercent ||
      functionsPercent < requiredPercent ||
      regionsPercent < requiredPercent
    ) {
      failures.push({
        crateName,
        linesPercent,
        functionsPercent,
        regionsPercent,
        missing: false,
      });
    }
  }

  for (const expectedCrateName of gatedCrates) {
    if (!crateStats.has(expectedCrateName)) {
      failures.push({
        crateName: expectedCrateName,
        linesPercent: 0,
        functionsPercent: 0,
        regionsPercent: 0,
        missing: true,
      });
    }
  }

  return failures;
}
