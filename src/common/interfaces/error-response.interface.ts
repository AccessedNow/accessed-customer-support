export interface ErrorData {
  code: number;
  message: string;
  details: any[];
  stack?: string;
}

export interface ErrorResponse {
  data: ErrorData;
  code: number;
  message: string;
}
