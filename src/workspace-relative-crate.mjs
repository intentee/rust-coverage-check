import { win32 } from "node:path";

/**
 * @param {string} filename
 * @param {string} workspaceRoot
 * @returns {string | null}
 */
export function workspaceRelativeCrate(filename, workspaceRoot) {
  const resolvedFilename = win32.resolve(filename);
  const resolvedRoot = win32.resolve(workspaceRoot);

  if (!resolvedFilename.startsWith(resolvedRoot + win32.sep)) {
    return null;
  }

  return win32.relative(resolvedRoot, resolvedFilename).split(win32.sep)[0];
}
