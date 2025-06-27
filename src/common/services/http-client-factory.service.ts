import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from './http-client.service';
import { HttpClientConfig } from '../types/http-client.types';

export interface ExternalServiceConfig {
  [serviceName: string]: HttpClientConfig;
}

@Injectable()
export class HttpClientFactoryService {
  private clients: Map<string, HttpClientService> = new Map();

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Lấy hoặc tạo HTTP client cho một external service
   */
  getClient(serviceName: string, config?: HttpClientConfig): HttpClientService {
    if (!this.clients.has(serviceName)) {
      const serviceConfig = this.getServiceConfig(serviceName, config);
      const client = this.httpClientService.createClient(serviceConfig);
      this.clients.set(serviceName, client);
    }

    return this.clients.get(serviceName)!;
  }

  /**
   * Tạo client mới (không cache)
   */
  createClient(serviceName: string, config?: HttpClientConfig): HttpClientService {
    const serviceConfig = this.getServiceConfig(serviceName, config);
    return this.httpClientService.createClient(serviceConfig);
  }

  /**
   * Xóa client khỏi cache
   */
  removeClient(serviceName: string): void {
    this.clients.delete(serviceName);
  }

  /**
   * Xóa tất cả client khỏi cache
   */
  clearClients(): void {
    this.clients.clear();
  }

  /**
   * Lấy danh sách tất cả client đã được tạo
   */
  getActiveClients(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Kiểm tra health của tất cả external services
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const promises = Array.from(this.clients.entries()).map(async ([serviceName, client]) => {
      const config = this.getServiceConfig(serviceName);
      if (config.baseURL) {
        results[serviceName] = await client.healthCheck(config.baseURL);
      } else {
        results[serviceName] = false;
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Lấy cấu hình cho service từ config hoặc environment
   */
  private getServiceConfig(
    serviceName: string,
    overrideConfig?: HttpClientConfig,
  ): HttpClientConfig {
    // Lấy config từ environment variables
    const envConfig: HttpClientConfig = {
      baseURL: this.configService.get<string>(`EXTERNAL_${serviceName.toUpperCase()}_BASE_URL`),
      timeout:
        this.configService.get<number>(`EXTERNAL_${serviceName.toUpperCase()}_TIMEOUT`) || 30000,
      retries: this.configService.get<number>(`EXTERNAL_${serviceName.toUpperCase()}_RETRIES`) || 3,
      retryDelay:
        this.configService.get<number>(`EXTERNAL_${serviceName.toUpperCase()}_RETRY_DELAY`) || 1000,
    };

    // Setup auth từ environment
    const authType = this.configService.get<string>(
      `EXTERNAL_${serviceName.toUpperCase()}_AUTH_TYPE`,
    );
    if (authType) {
      envConfig.auth = {
        type: authType as any,
        token: this.configService.get<string>(`EXTERNAL_${serviceName.toUpperCase()}_AUTH_TOKEN`),
        username: this.configService.get<string>(
          `EXTERNAL_${serviceName.toUpperCase()}_AUTH_USERNAME`,
        ),
        password: this.configService.get<string>(
          `EXTERNAL_${serviceName.toUpperCase()}_AUTH_PASSWORD`,
        ),
        apiKey: this.configService.get<string>(
          `EXTERNAL_${serviceName.toUpperCase()}_AUTH_API_KEY`,
        ),
        apiKeyHeader: this.configService.get<string>(
          `EXTERNAL_${serviceName.toUpperCase()}_AUTH_API_KEY_HEADER`,
        ),
      };
    }

    // Merge với override config
    return { ...envConfig, ...overrideConfig };
  }
}
