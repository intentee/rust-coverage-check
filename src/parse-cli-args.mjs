import { parseArgs } from "node:util";

import { CliArgsError } from "./cli-args-error.mjs";

/**
 * @typedef {object} CliArgs
 * @property {string} jsonPath
 * @property {string} workspaceRoot
 * @property {Set<string>} gatedCrates
 * @property {number} requiredPercent
 */

/**
 * @param {unknown} value
 * @returns {number}
 */
function parseRequiredPercent(value) {
  if (typeof value !== "string") {
    throw new CliArgsError(
      "required_percent_required",
      "--required-percent is required when --gated is supplied",
    );
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new CliArgsError(
      "required_percent_not_number",
      `--required-percent must be a number, got ${value}`,
    );
  }

  if (parsed < 0 || parsed > 100) {
    throw new CliArgsError(
      "required_percent_out_of_range",
      `--required-percent must be between 0 and 100, got ${parsed}`,
    );
  }

  return parsed;
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
      "required-percent": { type: "string" },
    },
    allowPositionals: true,
    strict: true,
  });

  if (positionals.length !== 1) {
    throw new CliArgsError(
      "usage",
      "usage: rust-coverage-check <llvm-cov-json-path> --workspace-root <path> [--gated <crate>]... [--required-percent <number>]",
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

  const gatedList = values.gated ?? [];
  const gatedCrates = new Set(gatedList);

  const requiredPercent =
    gatedCrates.size === 0
      ? 0
      : parseRequiredPercent(values["required-percent"]);

  return { jsonPath, workspaceRoot, gatedCrates, requiredPercent };
}
