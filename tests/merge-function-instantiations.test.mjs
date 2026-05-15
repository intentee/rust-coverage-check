import { strict as assert } from "node:assert";
import { test } from "node:test";

import { mergeFunctionInstantiations } from "../src/merge-function-instantiations.mjs";

// llvm-cov function entry: { name, count, filenames, regions }
// region tuple: [lineStart, columnStart, lineEnd, columnEnd, count, ...]

test("merges instantiations sharing a source location and keeps the highest count", () => {
  const entries = [
    {
      name: "_RNvfromUnitTestBuild",
      count: 0,
      filenames: ["/workspace/crate_a/src/thing.rs"],
      regions: [[10, 5, 12, 6, 0]],
    },
    {
      name: "_RNvfromDependencyBuild",
      count: 3,
      filenames: ["/workspace/crate_a/src/thing.rs"],
      regions: [[10, 5, 12, 6, 3]],
    },
  ];

  assert.deepEqual(mergeFunctionInstantiations(entries), [
    { filename: "/workspace/crate_a/src/thing.rs", covered: true },
  ]);
});

test("keeps functions at different source locations distinct", () => {
  const entries = [
    {
      name: "_RNvfirst",
      count: 1,
      filenames: ["/workspace/crate_a/src/thing.rs"],
      regions: [[10, 5, 12, 6, 1]],
    },
    {
      name: "_RNvsecond",
      count: 1,
      filenames: ["/workspace/crate_a/src/thing.rs"],
      regions: [[20, 1, 25, 2, 1]],
    },
  ];

  assert.deepEqual(mergeFunctionInstantiations(entries), [
    { filename: "/workspace/crate_a/src/thing.rs", covered: true },
    { filename: "/workspace/crate_a/src/thing.rs", covered: true },
  ]);
});

test("marks a function uncovered when every instantiation has a zero count", () => {
  const entries = [
    {
      name: "_RNvfromUnitTestBuild",
      count: 0,
      filenames: ["/workspace/crate_a/src/thing.rs"],
      regions: [[10, 5, 12, 6, 0]],
    },
    {
      name: "_RNvfromDependencyBuild",
      count: 0,
      filenames: ["/workspace/crate_a/src/thing.rs"],
      regions: [[10, 5, 12, 6, 0]],
    },
  ];

  assert.deepEqual(mergeFunctionInstantiations(entries), [
    { filename: "/workspace/crate_a/src/thing.rs", covered: false },
  ]);
});

test("throws when a function entry has no regions", () => {
  const entries = [
    {
      name: "_RNvbroken",
      count: 1,
      filenames: ["/workspace/crate_a/src/thing.rs"],
      regions: [],
    },
  ];

  assert.throws(
    () => mergeFunctionInstantiations(entries),
    /at least one filename and region/,
  );
});

test("throws when a function entry has no filenames", () => {
  const entries = [
    {
      name: "_RNvbroken",
      count: 1,
      filenames: [],
      regions: [[10, 5, 12, 6, 1]],
    },
  ];

  assert.throws(
    () => mergeFunctionInstantiations(entries),
    /at least one filename and region/,
  );
});
