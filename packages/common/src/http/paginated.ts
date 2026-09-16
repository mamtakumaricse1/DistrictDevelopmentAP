export class PaginationMetaDto {
  page!: number;
  pageSize!: number;
  total!: number;
  totalPages!: number;
}

export class PaginatedResponseDto<T> {
  data!: T[];
  meta!: PaginationMetaDto;
}

export function paginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
): PaginatedResponseDto<T> {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: pageSize === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
}
