import { relative, sep } from "node:path";

/**
 * @param {string} filename
 * @param {string} workspaceRoot
 * @returns {string | null}
 */
export function workspaceRelativeCrate(filename, workspaceRoot) {
  if (!filename.startsWith(workspaceRoot + sep)) {
    return null;
  }

  const relativePath = relative(workspaceRoot, filename);

  return relativePath.split(sep)[0];
}
