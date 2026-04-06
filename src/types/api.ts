export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  list: T[]
  page: number
  total: number
  page_size: number
}

export interface PaginationParams {
  page?: number
  page_size?: number
}
