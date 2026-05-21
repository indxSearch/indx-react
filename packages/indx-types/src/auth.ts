export interface LoginInfo {
  userEmail: string;
  userPassWord: string;
}

export interface LoginResponse {
  token: string;
  mustChangePassword: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
