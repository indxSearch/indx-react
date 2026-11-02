/** By name on the wire since 6.0. */
export enum JsonErrorType {
  None = 'None',
  ControlCharacters = 'ControlCharacters',
  TrailingComma = 'TrailingComma',
  UnescapedQuotes = 'UnescapedQuotes',
  UnescapedBackslash = 'UnescapedBackslash',
  StructuralError = 'StructuralError',
  UnknownError = 'UnknownError'
}

export interface ParseResult {
  token?: string | null;
  progressPercent: number;
  recordIndex: number;
  isEndOfStream: boolean;
  errorType: JsonErrorType;
  errorMessage?: string | null;
  bytePositionInLine?: number | null;
  jsonPath?: string | null;
  wasSanitized: boolean;
  originalToken?: string | null;
}

export interface ProcessError {
  source?: string | null;
  message?: string | null;
  parseError?: ParseResult | null;
  /** UTC timestamp (ISO 8601) when the error was recorded. */
  timeStampUtc: string;
}

export interface ProcessErrorCount {
  error?: ProcessError | null;
  count: number;
}
