import { percent } from "./percent.mjs";

/**
 * @typedef {object} GateFailure
 * @property {string} crateName
 * @property {number} requiredPercent
 * @property {number} linesPercent
 * @property {number} functionsPercent
 * @property {number} regionsPercent
 * @property {boolean} missing
 */

/**
 * @param {Map<string, import("./parse-llvm-cov-json.mjs").CrateStats>} crateStats
 * @param {Map<string, number>} gatedCrates
 * @returns {GateFailure[]}
 */
export function findFailedGatedCrates(crateStats, gatedCrates) {
  /** @type {GateFailure[]} */
  const failures = [];

  for (const [crateName, requiredPercent] of gatedCrates) {
    const stats = crateStats.get(crateName);

    if (stats === undefined) {
      failures.push({
        crateName,
        requiredPercent,
        linesPercent: 0,
        functionsPercent: 0,
        regionsPercent: 0,
        missing: true,
      });
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
        requiredPercent,
        linesPercent,
        functionsPercent,
        regionsPercent,
        missing: false,
      });
    }
  }

  return failures;
}
