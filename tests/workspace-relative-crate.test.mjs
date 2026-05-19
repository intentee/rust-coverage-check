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

test("matches a Windows path with mismatched drive-letter and directory case", () => {
  assert.equal(
    workspaceRelativeCrate(
      "c:\\Workspace\\my_crate\\src\\file.rs",
      "C:\\workspace\\",
    ),
    "my_crate",
  );
});

test("returns null for a Windows file on a different drive", () => {
  assert.equal(
    workspaceRelativeCrate("D:\\elsewhere\\file.rs", "C:\\workspace"),
    null,
  );
});

test("treats POSIX paths case-sensitively", () => {
  assert.equal(
    workspaceRelativeCrate("/Workspace/my_crate/src/file.rs", "/workspace"),
    null,
  );
});

test("matches a UNC-style Windows workspace root", () => {
  assert.equal(
    workspaceRelativeCrate(
      "\\\\server\\share\\repo\\my_crate\\src\\file.rs",
      "\\\\server\\share\\repo",
    ),
    "my_crate",
  );
});

test("throws when workspaceRoot is a relative path", () => {
  assert.throws(() =>
    workspaceRelativeCrate("/workspace/foo/bar.rs", "workspace"),
  );
});

test("returns null when filename is a relative path", () => {
  assert.equal(
    workspaceRelativeCrate("crate/src/lib.rs", process.cwd()),
    null,
  );
});
