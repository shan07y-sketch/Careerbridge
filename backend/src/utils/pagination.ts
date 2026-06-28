import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  search: string;
  sortBy: string;
  order: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message: string;
}

export const getPaginationParams = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  let limit = parseInt(req.query.limit as string) || 20;
  limit = Math.min(100, Math.max(1, limit)); // defaults limits between 20 and 100

  const skip = (page - 1) * limit;
  const search = (req.query.search as string) || '';
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip, search, sortBy, order };
};

export const formatPaginatedResult = <T>(
  data: T[],
  totalRecords: number,
  params: PaginationParams,
  message = 'Data retrieved successfully.'
): PaginatedResult<T> => {
  const totalPages = Math.ceil(totalRecords / params.limit) || 1;
  
  return {
    success: true,
    data,
    pagination: {
      currentPage: params.page,
      totalPages,
      totalRecords,
      pageSize: params.limit,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1
    },
    message
  };
};
