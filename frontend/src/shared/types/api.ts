export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta: PaginationMeta | null;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}
