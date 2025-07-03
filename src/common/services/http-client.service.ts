import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, catchError, firstValueFrom } from 'rxjs';
import {
  HttpClientConfig,
  HttpClientResponse,
  HttpClientError,
  HttpClientRequestConfig,
  RetryConfig,
} from '../types/http-client.types';

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private defaultConfig: HttpClientConfig = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
  };
  private clientConfig: HttpClientConfig = {};

  constructor(private readonly httpService: HttpService) {}

  /**
   * Tạo một instance HTTP client với cấu hình cụ thể
   */
  createClient(config: HttpClientConfig): HttpClientService {
    const clientConfig = { ...this.defaultConfig, ...config };

    // Tạo instance mới với config
    const service = new HttpClientService(this.httpService);
    service.defaultConfig = clientConfig;
    service.clientConfig = clientConfig;

    return service;
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>> {
    return this.executeRequest<T>('get', url, undefined, config);
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>> {
    return this.executeRequest<T>('post', url, data, config);
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>> {
    return this.executeRequest<T>('put', url, data, config);
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>> {
    return this.executeRequest<T>('patch', url, data, config);
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>> {
    return this.executeRequest<T>('delete', url, undefined, config);
  }

  /**
   * Thực hiện request với retry logic và error handling
   */
  private async executeRequest<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: any,
    config?: HttpClientRequestConfig,
  ): Promise<HttpClientResponse<T>> {
    const requestConfig = this.buildRequestConfig(config);

    this.logger.debug(`Making ${method.toUpperCase()} request to: ${url}`);

    try {
      let observable: Observable<AxiosResponse<T>>;

      switch (method) {
        case 'get':
          observable = this.httpService.get<T>(url, requestConfig);
          break;
        case 'post':
          observable = this.httpService.post<T>(url, data, requestConfig);
          break;
        case 'put':
          observable = this.httpService.put<T>(url, data, requestConfig);
          break;
        case 'patch':
          observable = this.httpService.patch<T>(url, data, requestConfig);
          break;
        case 'delete':
          observable = this.httpService.delete<T>(url, requestConfig);
          break;
      }

      const response = await firstValueFrom(
        observable.pipe(
          catchError((error: AxiosError) => {
            throw this.handleError(error, url, method);
          }),
        ),
      );

      this.logger.debug(
        `Request successful: ${method.toUpperCase()} ${url} - Status: ${response.status}`,
      );

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      this.logger.error(
        `Request failed: ${method.toUpperCase()} ${url}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Xây dựng cấu hình request
   */
  private buildRequestConfig(config?: HttpClientRequestConfig): AxiosRequestConfig {
    const baseConfig: AxiosRequestConfig = {
      baseURL: this.clientConfig.baseURL,
      timeout: config?.customTimeout || this.clientConfig.timeout || this.defaultConfig.timeout,
      headers: {
        ...this.clientConfig.headers,
        ...config?.headers,
      },
    };

    // Setup authentication từ client config
    if (this.clientConfig.auth && !config?.skipAuth) {
      this.setupAuthentication(baseConfig, this.clientConfig.auth);
    }

    // Merge với config được truyền vào
    return { ...baseConfig, ...config };
  }

  /**
   * Xây dựng cấu hình retry
   */
  private buildRetryConfig(retryConfig?: Partial<RetryConfig>): RetryConfig {
    return {
      retries: retryConfig?.retries || this.defaultConfig.retries || 3,
      retryDelay: retryConfig?.retryDelay || this.defaultConfig.retryDelay || 1000,
      retryCondition: retryConfig?.retryCondition || this.defaultRetryCondition,
    };
  }

  /**
   * Điều kiện retry mặc định
   */
  private defaultRetryCondition(error: AxiosError): boolean {
    return (
      !error.response ||
      error.response.status >= 500 ||
      error.response.status === 429 ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET'
    );
  }

  /**
   * Thiết lập authentication
   */
  private setupAuthentication(config: AxiosRequestConfig, auth: HttpClientConfig['auth']): void {
    if (!auth) return;

    // Ensure headers object exists
    if (!config.headers) {
      config.headers = {};
    }

    switch (auth.type) {
      case 'bearer':
        if (auth.token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${auth.token}`,
          };
        }
        break;
      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          config.headers = {
            ...config.headers,
            Authorization: `Basic ${credentials}`,
          };
        }
        break;
      case 'api-key':
        if (auth.apiKey && auth.apiKeyHeader) {
          config.headers = {
            ...config.headers,
            [auth.apiKeyHeader]: auth.apiKey,
          };
        }
        break;
    }
  }

  /**
   * Xử lý lỗi
   */
  private handleError(error: AxiosError, url: string, method: string): HttpClientError {
    const httpError: HttpClientError = {
      message: error.message || 'Unknown error occurred',
      status: error.response?.status,
      statusText: error.response?.statusText,
      response: error.response?.data,
      config: error.config,
    };

    // Log chi tiết lỗi
    this.logger.error(`HTTP ${method.toUpperCase()} ${url} failed`, {
      status: httpError.status,
      statusText: httpError.statusText,
      message: httpError.message,
      response: httpError.response,
    });

    return httpError;
  }

  /**
   * Kiểm tra health của external service
   */
  async healthCheck(baseURL: string, endpoint: string = '/health'): Promise<boolean> {
    try {
      const response = await this.get(`${baseURL}${endpoint}`, {
        customTimeout: 5000,
        retryConfig: { retries: 1 },
      });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      this.logger.warn(`Health check failed for ${baseURL}${endpoint}`, error);
      return false;
    }
  }
}
