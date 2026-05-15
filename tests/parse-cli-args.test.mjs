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
  assert.equal(result.requiredPercent, 0);
});

test("accumulates repeated --gated flags into a set", () => {
  const result = parseCliArgs([
    "out.json",
    "--workspace-root",
    "/repo",
    "--gated",
    "alpha",
    "--gated",
    "beta",
    "--required-percent",
    "99",
  ]);

  assert.deepEqual([...result.gatedCrates].sort(), ["alpha", "beta"]);
  assert.equal(result.requiredPercent, 99);
});

test("throws when no positional argument is given", () => {
  assert.throws(
    () => parseCliArgs(["--workspace-root", "/repo"]),
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

test("throws when --gated is used without --required-percent", () => {
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
      caught.code === "required_percent_required",
  );
});

test("throws when --required-percent is not a number", () => {
  assert.throws(
    () =>
      parseCliArgs([
        "out.json",
        "--workspace-root",
        "/repo",
        "--gated",
        "alpha",
        "--required-percent",
        "abc",
      ]),
    (caught) =>
      caught instanceof CliArgsError &&
      caught.code === "required_percent_not_number",
  );
});

test("throws when --required-percent is outside 0..100", () => {
  assert.throws(
    () =>
      parseCliArgs([
        "out.json",
        "--workspace-root",
        "/repo",
        "--gated",
        "alpha",
        "--required-percent",
        "150",
      ]),
    (caught) =>
      caught instanceof CliArgsError &&
      caught.code === "required_percent_out_of_range",
  );
});

test("throws when more than one positional argument is supplied", () => {
  assert.throws(
    () =>
      parseCliArgs(["first.json", "second.json", "--workspace-root", "/repo"]),
    (caught) => caught instanceof CliArgsError && caught.code === "usage",
  );
});
