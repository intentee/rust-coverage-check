/**
 * @typedef {object} Coverage
 * @property {number} count
 * @property {number} covered
 */

/**
 * @param {Coverage} coverage
 * @returns {number}
 */
export function percent({ count, covered }) {
  if (count === 0) {
    return 100;
  }

  return (covered / count) * 100;
}
