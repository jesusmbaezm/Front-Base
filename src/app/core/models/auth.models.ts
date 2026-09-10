export interface LoginRequest {
  email: string;
  password: string;
}

export interface BackendResponse<T> {
  data: T;
  errors: string[];
  message: string;
}

export interface LoginApiResponse {
  token: string;
  expiresAt: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  branches: { id: number; name: string; isMain: boolean }[];
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  branches: { id: number; name: string; isMain: boolean }[];
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: number;
  user: UserProfile;
}

export interface SessionState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: UserProfile | null;
  expiresAt: number | null;
}

export interface RefreshTokenResponse {
  token: string;
  expiresAt: string;
}
