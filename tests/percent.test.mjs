import { strict as assert } from "node:assert";
import { test } from "node:test";

import { percent } from "../src/percent.mjs";

test("returns 100 when count is zero", () => {
  assert.equal(percent({ count: 0, covered: 0 }), 100);
});

test("returns full coverage proportion when count is non-zero", () => {
  assert.equal(percent({ count: 10, covered: 5 }), 50);
});

test("returns 100 when covered equals count", () => {
  assert.equal(percent({ count: 4, covered: 4 }), 100);
});

test("returns 0 when nothing is covered", () => {
  assert.equal(percent({ count: 8, covered: 0 }), 0);
});
