import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  findFailedGatedCrates,
  formatCoverageTable,
  parseLlvmCovJson,
} from "../src/index.mjs";

test("re-exports the public API as named exports", () => {
  assert.equal(typeof findFailedGatedCrates, "function");
  assert.equal(typeof formatCoverageTable, "function");
  assert.equal(typeof parseLlvmCovJson, "function");
});
