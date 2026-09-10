export interface User {
  id: number;
  email: string;
  name: string;
  roles: SimpleRole[];
  branches: SimpleBranch[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SimpleRole {
  id: number;
  name: string;
}

export interface SimpleBranch {
  id: number;
  name: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  roleIds: number[];
  branchIds: number[];
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  roleIds?: number[];
  branchIds?: number[];
  isActive?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface UserFilter {
  search?: string;
  roleId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}
