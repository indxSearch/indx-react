export interface DataSetListDto {
  name: string;
  ownerUserId?: string | null;
  /** "owner" | "editor" | "viewer" */
  role: string;
}

export interface AccessGrantDto {
  email: string;
  /** "editor" | "viewer" */
  role: string;
}

export interface GrantAccessRequest {
  granteeEmail: string;
  /** "editor" | "viewer" */
  role: string;
}

export interface TransferOwnershipRequest {
  newOwnerEmail: string;
}
