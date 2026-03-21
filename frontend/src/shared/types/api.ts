export interface ApiErrorResponse {
  message?: string;
}

export interface AuthUserPreview {
  id: number;
  fullName: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
}

export interface MeResponse {
  user: AuthUserPreview;
}
