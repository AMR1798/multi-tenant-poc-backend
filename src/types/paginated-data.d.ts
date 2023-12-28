export interface PaginatedData<T> {
  total: number;
  data: T[];
  page: number;
  nextPage: number;
  limit: number;
}
