/**
 * @typedef {"usage"
 *   | "workspace_root_required"
 *   | "workspace_root_not_absolute"
 *   | "gated_missing_threshold"
 *   | "gated_crate_name_required"
 *   | "gated_threshold_not_number"
 *   | "gated_threshold_out_of_range"
 *   | "gated_crate_duplicate"} CliArgsErrorCode
 */

export class CliArgsError extends Error {
  /** @type {string} */
  name = "CliArgsError";

  /**
   * @param {CliArgsErrorCode} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    /** @type {CliArgsErrorCode} */
    this.code = code;
  }
}
