// llvm-cov emits one `functions` entry per instantiation, so the same source
// function appears once for the unit-test build and once for each dependency
// build. Two instantiations of one function share identical source coordinates,
// so the first region's start/end position is a stable identity key. A function
// is covered when any instantiation executed it.
//
// llvm-cov region tuple: [lineStart, columnStart, lineEnd, columnEnd, ...].

/**
 * @typedef {object} FunctionEntry
 * @property {string} name
 * @property {number} count
 * @property {string[]} filenames
 * @property {number[][]} regions
 */

/**
 * @typedef {object} MergedFunction
 * @property {string} filename
 * @property {boolean} covered
 */

const REGION_IDENTITY_SPAN = 4;

/**
 * @param {FunctionEntry} functionEntry
 * @returns {string}
 */
function functionIdentity({ filenames, regions }) {
  if (filenames.length === 0 || regions.length === 0) {
    throw new Error(
      "Function entry must carry at least one filename and region",
    );
  }

  const homeFilename = filenames[0];
  const firstRegionSpan = regions[0].slice(0, REGION_IDENTITY_SPAN).join(":");

  return `${homeFilename}:${firstRegionSpan}`;
}

/**
 * @param {FunctionEntry[]} functionEntries
 * @returns {MergedFunction[]}
 */
export function mergeFunctionInstantiations(functionEntries) {
  /** @type {Map<string, { filename: string, maxCount: number }>} */
  const mergedByIdentity = new Map();

  for (const functionEntry of functionEntries) {
    const identity = functionIdentity(functionEntry);
    const alreadyMerged = mergedByIdentity.get(identity);

    if (alreadyMerged) {
      alreadyMerged.maxCount = Math.max(
        alreadyMerged.maxCount,
        functionEntry.count,
      );
    } else {
      mergedByIdentity.set(identity, {
        filename: functionEntry.filenames[0],
        maxCount: functionEntry.count,
      });
    }
  }

  return [...mergedByIdentity.values()].map(({ filename, maxCount }) => ({
    filename,
    covered: maxCount > 0,
  }));
}
