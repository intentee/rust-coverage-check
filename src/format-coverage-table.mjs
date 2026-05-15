import { percent } from "./percent.mjs";

const HEADER_SEPARATOR = "-".repeat(96);

/**
 * @param {Map<string, import("./parse-llvm-cov-json.mjs").CrateStats>} crateStats
 * @param {Set<string>} gatedCrates
 * @returns {string}
 */
export function formatCoverageTable(crateStats, gatedCrates) {
  const sortedCrates = [...crateStats.entries()].sort(
    ([leftName], [rightName]) => leftName.localeCompare(rightName),
  );

  const lines = [
    `${"crate".padEnd(48)} ${"lines".padStart(10)} ${"functions".padStart(10)} ${"regions".padStart(10)}  gated`,
    HEADER_SEPARATOR,
  ];

  for (const [crateName, stats] of sortedCrates) {
    const linesPercent = percent(stats.lines);
    const functionsPercent = percent(stats.functions);
    const regionsPercent = percent(stats.regions);
    const isGated = gatedCrates.has(crateName);

    lines.push(
      `${crateName.padEnd(48)} ${linesPercent.toFixed(2).padStart(9)}% ${functionsPercent.toFixed(2).padStart(9)}% ${regionsPercent.toFixed(2).padStart(9)}%  ${isGated ? "YES" : "no"}`,
    );
  }

  return lines.join("\n");
}
