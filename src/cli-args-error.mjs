/**
 * @typedef {"usage"
 *   | "workspace_root_required"
 *   | "required_percent_required"
 *   | "required_percent_not_number"
 *   | "required_percent_out_of_range"} CliArgsErrorCode
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
