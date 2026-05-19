import { strict as assert } from "node:assert";
import { test } from "node:test";

import { workspaceRelativeCrate } from "../src/workspace-relative-crate.mjs";

test("returns first path component for a file inside the workspace", () => {
  assert.equal(
    workspaceRelativeCrate(
      "/workspace/sync_holder/src/sync_holder.rs",
      "/workspace",
    ),
    "sync_holder",
  );
});

test("returns null for a file outside the workspace", () => {
  assert.equal(
    workspaceRelativeCrate("/somewhere/else/file.rs", "/workspace"),
    null,
  );
});

test("returns the crate name even when the file is deeply nested", () => {
  assert.equal(
    workspaceRelativeCrate(
      "/workspace/spiffe_svid_manager/src/inner/deeper/file.rs",
      "/workspace",
    ),
    "spiffe_svid_manager",
  );
});

test("returns null when filename equals the workspace root (no separator)", () => {
  assert.equal(workspaceRelativeCrate("/workspace", "/workspace"), null);
});

test("returns the crate for a Windows-style backslash path with trailing separator", () => {
  assert.equal(
    workspaceRelativeCrate(
      "C:\\workspace\\my_crate\\src\\file.rs",
      "C:\\workspace\\",
    ),
    "my_crate",
  );
});
