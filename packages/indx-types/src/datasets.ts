/**
 * A dataset the caller can access, as returned by `GET /api/me/datasets`.
 * Datasets are owned by teams (the old per-user sharing model has been removed).
 */
export interface DataSetListDto {
  name: string;
  /** Team that owns the dataset. */
  teamName: string;
  /** The caller's role on the owning team: "Admin" | "Editor" | "Viewer". */
  role: string;
}
