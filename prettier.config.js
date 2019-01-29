module.exports = {
  useTabs: false, // Indent lines with tabs instead of spaces.
  printWidth: 120, // Specify the length of line that the printer will wrap on.
  tabWidth: 2, // Specify the number of spaces per indentation-level.
  singleQuote: true, // Use single quotes instead of double quotes.
  jsxSingleQuote: true,
  bracketSpacing: true,
  arrowParens: 'always',
  proseWrap: 'always',
  htmlWhitespaceSensitivity: 'ignore',
  endOfLine: 'lf',

  /**
   * Print trailing commas wherever possible.
   * Valid options:
   *   - "none" - no trailing commas
   *   - "es5" - trailing commas where valid in ES5 (objects, arrays, etc)
   *   - "all" - trailing commas wherever possible (function arguments)
   */
  trailingComma: 'none',
  /**
   * Do not print spaces between brackets.
   * If true, puts the > of a multi-line jsx element at the end of the last line instead of being
   * alone on the next line
   */
  jsxBracketSameLine: true,
  /**
   * Specify which parse to use.
   * Valid options:
   *   - "flow"
   *   - "babylon"
   *   - "typescript"
   *     Don't specify anything / Prettier itself detects it.( All file types can be prettified without providing
   *     a separate config then)
   */
  // parser: 'typescript',
  /**
   * Do not print semicolons, except at the beginning of lines which may need them.
   * Valid options:
   * - true - add a semicolon at the end of every line
   * - false - only add semicolons at the beginning of lines that may introduce ASI failures
   */
  semi: true
};
