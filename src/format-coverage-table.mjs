import { percent } from "./percent.mjs";

const HEADER_SEPARATOR = "-".repeat(96);
const REQUIRED_COLUMN_WIDTH = "required".length;

/**
 * @param {Map<string, number>} gatedCrates
 * @param {string} crateName
 * @returns {string}
 */
function requiredLabel(gatedCrates, crateName) {
  const threshold = gatedCrates.get(crateName);

  if (threshold === undefined) {
    return "-";
  }

  return `${threshold.toFixed(2)}%`;
}

/**
 * @param {Map<string, import("./parse-llvm-cov-json.mjs").CrateStats>} crateStats
 * @param {Map<string, number>} gatedCrates
 * @returns {string}
 */
export function formatCoverageTable(crateStats, gatedCrates) {
  const sortedCrates = [...crateStats.entries()].sort(
    ([leftName], [rightName]) => leftName.localeCompare(rightName),
  );

  const lines = [
    `${"crate".padEnd(48)} ${"lines".padStart(10)} ${"functions".padStart(10)} ${"regions".padStart(10)}  ${"required".padStart(REQUIRED_COLUMN_WIDTH)}`,
    HEADER_SEPARATOR,
  ];

  for (const [crateName, stats] of sortedCrates) {
    const linesPercent = percent(stats.lines);
    const functionsPercent = percent(stats.functions);
    const regionsPercent = percent(stats.regions);
    const required = requiredLabel(gatedCrates, crateName);

    lines.push(
      `${crateName.padEnd(48)} ${linesPercent.toFixed(2).padStart(9)}% ${functionsPercent.toFixed(2).padStart(9)}% ${regionsPercent.toFixed(2).padStart(9)}%  ${required.padStart(REQUIRED_COLUMN_WIDTH)}`,
    );
  }

  return lines.join("\n");
}
