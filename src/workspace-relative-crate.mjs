import { posix, win32 } from "node:path";

/**
 * @param {string} workspaceRoot
 * @returns {typeof posix | typeof win32}
 */
function pathModuleFor(workspaceRoot) {
  if (workspaceRoot[1] === ":") {
    return win32;
  }
  return posix;
}

/**
 * @param {string} filename
 * @param {string} workspaceRoot
 * @returns {string | null}
 */
export function workspaceRelativeCrate(filename, workspaceRoot) {
  const pathModule = pathModuleFor(workspaceRoot);
  const relativePath = pathModule.relative(workspaceRoot, filename);

  if (pathModule.isAbsolute(relativePath)) {
    return null;
  }

  const [firstSegment] = relativePath.split(pathModule.sep);

  if (firstSegment === "" || firstSegment === "..") {
    return null;
  }

  return firstSegment;
}
