export class CategoriesFilter {
  search?: string;
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
  isActive?: boolean;
}

export interface Category {
  id?: number;
  name: string;
  fatherCategoryId: number | null;
  fatherCategoryName: string | null;
  description: string;
  CountAssociatedProducts: number | null;
  isActive: boolean;
}
export interface CategorySelect {
  id: number;
  code: string;
  name: string;
  fatherCategoryId: number | null;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  fatherCategoryId: number | null;
  description: string;
  isActive: boolean;
}

export interface UpdateCategoryRequest {
  id?: number;
  name?: string;
  fatherCategoryId?: number | null;
  description?: string;
  isActive?: boolean;
}
