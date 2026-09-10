import { Permission } from "./permissions.model";

export interface Role {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissionIds: number[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: number[];
}