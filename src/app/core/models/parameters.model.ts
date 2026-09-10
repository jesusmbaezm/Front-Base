export interface ParameterDto {
  id: number;
  name: string;
  value: string;
  modificationDate: string;
  modifiedByUserId: number;
}

export interface ParameterResponse{
  data: ParameterDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PagedRequest {
  page?: number;
  pageSize?: number;
  sortBy: string | null;
  sortDescending: boolean;
  search: string | null;
}

export interface UpdateParameterDto {
  name: string;
  value: string;
}