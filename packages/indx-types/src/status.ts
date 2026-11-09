import { SystemState } from './enums';
import { ProcessErrorCount, ProcessError } from './errors';

export interface LicenseInfo {
  licensed: boolean;
  validLicense: boolean;
  documentLimit: number;
  documentLimitExceeded: boolean;
  expirationDate: string;
  licensedTo?: string | null;
  type?: string | null;
  description?: string | null;
  licenseFileName?: string | null;
  /** True when a .license file was found on disk (independent of whether it validated). */
  licenseFileFound: boolean;
}

export interface SystemStatus {
  systemState: SystemState;
  documentCount: number;
  searchCounter: number;
  secondsToIndex: number;
  invalidDataSetName: boolean;
  invalidState: boolean;
  invalidArgument: boolean;
  /** A query's text was over the length a search takes, and the search was refused. */
  tooLongSearchText: boolean;
  /** A record's text was cut at the length the index takes (the record is stored whole). */
  indexedTextTruncated: boolean;
  /** A word longer than the configuration takes was cut to it. */
  wordTokenSizeCapped: boolean;
  /** A field's own k1 is set on a BM25F dataset, where the dataset's k1 is used instead. */
  fieldK1Ignored: boolean;
  licenseInfo: LicenseInfo;
  recoverableErrors?: ProcessErrorCount[] | null;
  unrecoverableErrors?: ProcessError[] | null;
  errorMessage?: string | null;
  version?: string | null;
  timeOfInstanceCreation: string;
  timeOfLastIndexBuild: string;
  /** Records the store holds for this dataset, readable without waking it. Created with
   * recordsOnDisk > 0 is what "hibernated" means since Hibernated left SystemState. */
  recordsOnDisk: number;
  /** Fields in the stored field configuration; 0 = not analyzed. */
  fieldsDiscovered: number;
  /** True while a rebuild on a shadow engine runs. `PUT fields/configuration` and
   * `POST index` on a Ready dataset answer 202 as soon as one is started. */
  shadowBuildInProgress: boolean;
  shadowBuildStartedUtc?: string | null;
  /** When the last rebuild ended; null while one runs and before the first. */
  shadowBuildFinishedUtc?: string | null;
  /** Why the last rebuild failed, or null. A failed rebuild swaps nothing in: the dataset
   * keeps serving with the documents and field configuration it had. */
  shadowBuildError?: string | null;
}
