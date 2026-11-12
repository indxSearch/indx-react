/**
 * Who may read a cold storage item. `public`: anyone who may read the dataset, a Search key in a
 * browser included (but not a Search key over MCP, which reads none). `answer`: also Search or ask's
 * answer, Read keys and Viewers, never a Search key. `private` (the default): only Full keys, Read
 * keys with private cold storage allowed, and Editors and Admins in the console.
 */
export type ColdVisibility = 'public' | 'answer' | 'private';

/** The body of `PUT .../documents/{key}/cold/{name}` (`?language=` optional): one item beside a
 * record, never searched, read when a question needs it. */
export interface ColdWrite {
  content: string;
  /** e.g. `text/markdown`, `application/json`; default `text/plain`. */
  contentType?: string | null;
  description?: string | null;
  /** Default `private`. */
  visibility?: ColdVisibility | null;
  /** The sender's own reference to where the content came from. */
  sourceRef?: string | null;
  /** When the source last changed it (ISO 8601): a write older than what is stored is refused. */
  sourceUpdatedUtc?: string | null;
}

/** One item of `PUT .../cold` (`?prune=true` also deletes what the same sender wrote before and
 * did not send now). The record is named by its Indx key, or by `id`: the id the dataset's webhook
 * gave it, or the key as text. */
export interface ColdBatchItem extends ColdWrite {
  name: string;
  recordKey?: number | null;
  id?: string | null;
  language?: string | null;
}

/** How one batch item went, in the place of the item. */
export interface ColdBatchOutcome {
  /** 0 when no record has the item's id. */
  recordKey: number;
  name: string;
  language: string;
  outcome: 'created' | 'updated' | 'versionmismatch' | 'olderthanstored' | 'refused' | (string & {});
  /** Why, when it was not written. */
  detail?: string | null;
  /** The item's `id`, as it gave it. */
  id?: string | null;
}

/** An item as read: `GET .../documents/{key}/cold` lists them without content, `GET .../cold/{name}`
 * returns one with it. */
export interface ColdView {
  name: string;
  language: string;
  recordKey: number;
  /** Null in a listing. */
  content?: string | null;
  length: number;
  contentType: string;
  description: string;
  visibility: ColdVisibility;
  writtenBy: string;
  writtenVia: string;
  sourceRef?: string | null;
  sourceUpdatedUtc?: string | null;
  version: number;
  createdUtc: string;
  updatedUtc: string;
}
