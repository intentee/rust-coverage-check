import { parseArgs } from "node:util";

import { CliArgsError } from "./cli-args-error.mjs";

/**
 * @typedef {object} CliArgs
 * @property {string} jsonPath
 * @property {string} workspaceRoot
 * @property {Map<string, number>} gatedCrates
 */

/**
 * @typedef {object} GatedEntry
 * @property {string} crateName
 * @property {number} requiredPercent
 */

/**
 * @param {string} value
 * @returns {GatedEntry}
 */
function parseGatedEntry(value) {
  const equalsIndex = value.indexOf("=");

  if (equalsIndex === -1) {
    throw new CliArgsError(
      "gated_missing_threshold",
      `--gated must be <crate>=<percent>, got ${value}`,
    );
  }

  const crateName = value.slice(0, equalsIndex);

  if (crateName.length === 0) {
    throw new CliArgsError(
      "gated_crate_name_required",
      `--gated crate name is empty in ${value}`,
    );
  }

  const thresholdSource = value.slice(equalsIndex + 1);

  if (thresholdSource.length === 0) {
    throw new CliArgsError(
      "gated_threshold_not_number",
      `--gated threshold is empty for crate ${crateName}`,
    );
  }

  const requiredPercent = Number(thresholdSource);

  if (!Number.isFinite(requiredPercent)) {
    throw new CliArgsError(
      "gated_threshold_not_number",
      `--gated threshold for ${crateName} must be a number, got ${thresholdSource}`,
    );
  }

  if (requiredPercent < 0 || requiredPercent > 100) {
    throw new CliArgsError(
      "gated_threshold_out_of_range",
      `--gated threshold for ${crateName} must be between 0 and 100, got ${requiredPercent}`,
    );
  }

  return { crateName, requiredPercent };
}

/**
 * @param {string[]} gatedValues
 * @returns {Map<string, number>}
 */
function buildGatedCrates(gatedValues) {
  /** @type {Map<string, number>} */
  const gatedCrates = new Map();

  for (const value of gatedValues) {
    const { crateName, requiredPercent } = parseGatedEntry(value);

    if (gatedCrates.has(crateName)) {
      throw new CliArgsError(
        "gated_crate_duplicate",
        `--gated ${crateName} was supplied more than once`,
      );
    }

    gatedCrates.set(crateName, requiredPercent);
  }

  return gatedCrates;
}

/**
 * @param {string[]} argv
 * @returns {CliArgs}
 */
export function parseCliArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      "workspace-root": { type: "string" },
      gated: { type: "string", multiple: true },
    },
    allowPositionals: true,
    strict: true,
  });

  if (positionals.length !== 1) {
    throw new CliArgsError(
      "usage",
      "usage: rust-coverage-check <llvm-cov-json-path> --workspace-root <path> [--gated <crate>=<percent>]...",
    );
  }

  const jsonPath = positionals[0];
  const workspaceRoot = values["workspace-root"];

  if (typeof workspaceRoot !== "string" || workspaceRoot.length === 0) {
    throw new CliArgsError(
      "workspace_root_required",
      "--workspace-root is required",
    );
  }

  const gatedCrates = buildGatedCrates(values.gated ?? []);

  return { jsonPath, workspaceRoot, gatedCrates };
}
