export interface BackendResponse<T> {
  data: T;
  errors: string[];
  message: string;
}
export interface BackendPaginatedResponse<T> {
  message: string;
  data: {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
  errors: any[];
}


export interface DropDownModel {
  id: number;
  name: string;
}

export interface AuditableResponseDto {
  createdByUserId: number;
  createdAt: string;
  modifiedByUserId: number;
  modifiedAt: string;
}