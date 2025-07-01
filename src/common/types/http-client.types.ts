import { AxiosRequestConfig } from 'axios';

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
}

export interface HttpClientResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

export interface HttpClientError {
  message: string;
  status?: number;
  statusText?: string;
  response?: any;
  config?: AxiosRequestConfig;
}

export interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: any) => boolean;
}

export interface HttpClientRequestConfig extends AxiosRequestConfig {
  retryConfig?: Partial<RetryConfig>;
  skipAuth?: boolean;
  customTimeout?: number;
}
