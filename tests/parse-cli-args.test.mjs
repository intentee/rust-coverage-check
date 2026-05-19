import { strict as assert } from "node:assert";
import { test } from "node:test";

import { CliArgsError } from "../src/cli-args-error.mjs";
import { parseCliArgs } from "../src/parse-cli-args.mjs";

test("parses a json path and workspace root with no gated crates", () => {
  const result = parseCliArgs([
    "target/llvm-cov.json",
    "--workspace-root",
    "/repo",
  ]);

  assert.equal(result.jsonPath, "target/llvm-cov.json");
  assert.equal(result.workspaceRoot, "/repo");
  assert.equal(result.gatedCrates.size, 0);
});

test("accumulates repeated --gated flags into a map of per-crate thresholds", () => {
  const result = parseCliArgs([
    "out.json",
    "--workspace-root",
    "/repo",
    "--gated",
    "alpha=99",
    "--gated",
    "beta=80",
  ]);

  assert.equal(result.gatedCrates.get("alpha"), 99);
  assert.equal(result.gatedCrates.get("beta"), 80);
  assert.equal(result.gatedCrates.size, 2);
});

test("throws when no positional argument is given", () => {
  assert.throws(
    () => parseCliArgs(["--workspace-root", "/repo"]),
    (caught) => caught instanceof CliArgsError && caught.code === "usage",
  );
});

test("throws when more than one positional argument is supplied", () => {
  assert.throws(
    () =>
      parseCliArgs(["first.json", "second.json", "--workspace-root", "/repo"]),
    (caught) => caught instanceof CliArgsError && caught.code === "usage",
  );
});

test("throws when --workspace-root is missing", () => {
  assert.throws(
    () => parseCliArgs(["out.json"]),
    (caught) =>
      caught instanceof CliArgsError &&
      caught.code === "workspace_root_required",
  );
});

test("throws when a --gated entry has no =threshold", () => {
  assert.throws(
    () =>
      parseCliArgs([
        "out.json",
        "--workspace-root",
        "/repo",
        "--gated",
        "alpha",
      ]),
    (caught) =>
      caught instanceof CliArgsError &&
      caught.code === "gated_missing_threshold",
  );
});

test("throws when a --gated entry has an empty crate name", () => {
  assert.throws(
    () =>
      parseCliArgs(["out.json", "--workspace-root", "/repo", "--gated", "=99"]),
    (caught) =>
      caught instanceof CliArgsError &&
      caught.code === "gated_crate_name_required",
  );
});

test("throws when a --gated threshold is empty", () => {
  assert.throws(
    () =>
      parseCliArgs([
        "out.json",
        "--workspace-root",
        "/repo",
        "--gated",
        "alpha=",
      ]),
    (caught) =>
      caught instanceof CliArgsError &&
      caught.code === "gated_threshold_not_number",
  );
});

test("throws when a --gated threshold is not a number", () => {
  assert.throws(
    () =>
      parseCliArgs([
        "out.json",
        "--workspace-root",
        "/repo",
        "--gated",
        "alpha=abc",
      ]),
    (caught) =>
      caught instanceof CliArgsError &&
      caught.code === "gated_threshold_not_number",
  );
});

test("throws when a --gated threshold is outside 0..100", () => {
  assert.throws(
    () =>
      parseCliArgs([
        "out.json",
        "--workspace-root",
        "/repo",
        "--gated",
        "alpha=150",
      ]),
    (caught) =>
      caught instanceof CliArgsError &&
      caught.code === "gated_threshold_out_of_range",
  );
});

test("throws when the same gated crate is supplied twice", () => {
  assert.throws(
    () =>
      parseCliArgs([
        "out.json",
        "--workspace-root",
        "/repo",
        "--gated",
        "alpha=99",
        "--gated",
        "alpha=80",
      ]),
    (caught) =>
      caught instanceof CliArgsError && caught.code === "gated_crate_duplicate",
  );
});
