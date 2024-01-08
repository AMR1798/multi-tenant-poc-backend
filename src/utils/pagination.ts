import { PaginatedData } from '../types/paginated-data';

function calcNumPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}

function paginate<T>(items: T[], pageNumber: number, pageSize: number): PaginatedData<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Ensure the page number is within valid bounds
  const currentPage = pageNumber > totalPages ? totalPages : pageNumber < 1 ? 1 : pageNumber;

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    total: totalItems,
    data: paginatedItems,
    page: currentPage,
    nextPage: currentPage + 1,
    pages: calcNumPages(totalItems, pageSize),
    limit: pageSize
  };
}

export { calcNumPages, paginate };
