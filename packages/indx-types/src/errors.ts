export enum JsonErrorType {
  None = 0,
  ControlCharacters = 1,
  TrailingComma = 2,
  UnescapedQuotes = 3,
  UnescapedBackslash = 4,
  StructuralError = 5,
  UnknownError = 6
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
