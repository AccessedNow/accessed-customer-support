export interface ErrorData {
  code: number;
  message: string;
  stack?: string;
}

export interface ErrorResponse {
  data: ErrorData;
  code: number;
  message: string;
}
