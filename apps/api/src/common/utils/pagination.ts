export interface PaginationParams {
  page?: number;
  limit?: number;
  defaultLimit?: number;
  maxLimit?: number;
}

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

function toPositiveInt(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const int = Math.trunc(value as number);
  return int > 0 ? int : fallback;
}

export function normalizePagination(params: PaginationParams): NormalizedPagination {
  const page = toPositiveInt(params.page, 1);
  const defaultLimit = toPositiveInt(params.defaultLimit, 20);
  const maxLimit = toPositiveInt(params.maxLimit, 100);
  const requestedLimit = toPositiveInt(params.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
