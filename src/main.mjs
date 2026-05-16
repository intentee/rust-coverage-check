#!/usr/bin/env node

import { findFailedGatedCrates } from "./find-failed-gated-crates.mjs";
import { formatCoverageTable } from "./format-coverage-table.mjs";
import { parseCliArgs } from "./parse-cli-args.mjs";
import { parseLlvmCovJson } from "./parse-llvm-cov-json.mjs";

const { jsonPath, workspaceRoot, gatedCrates } = parseCliArgs(
  process.argv.slice(2),
);

const crateStats = parseLlvmCovJson(jsonPath, workspaceRoot);

console.log(formatCoverageTable(crateStats, gatedCrates));

if (gatedCrates.size === 0) {
  process.exit(0);
}

const failures = findFailedGatedCrates(crateStats, gatedCrates);

if (failures.length > 0) {
  console.error("");
  console.error("Coverage below required threshold on gated crates:");

  for (const failure of failures) {
    if (failure.missing) {
      console.error(
        `  ${failure.crateName}: missing from coverage report (required ${failure.requiredPercent}%)`,
      );
    } else {
      console.error(
        `  ${failure.crateName}: required ${failure.requiredPercent}%, got lines ${failure.linesPercent.toFixed(2)}% functions ${failure.functionsPercent.toFixed(2)}% regions ${failure.regionsPercent.toFixed(2)}%`,
      );
    }
  }

  process.exit(1);
}

console.log("");
console.log("All gated crates meet their required coverage.");
