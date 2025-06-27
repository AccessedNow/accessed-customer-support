import { Injectable, Logger } from '@nestjs/common';
import { HttpClientFactoryService } from './http-client-factory.service';

// Example interfaces cho các external API responses
interface PaymentServiceResponse {
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
}

interface NotificationServiceResponse {
  messageId: string;
  status: 'sent' | 'failed';
  recipient: string;
}

interface UserManagementResponse {
  userId: string;
  username: string;
  email: string;
  status: 'active' | 'inactive';
}

@Injectable()
export class ExternalServiceExamplesService {
  private readonly logger = new Logger(ExternalServiceExamplesService.name);

  constructor(private readonly httpClientFactory: HttpClientFactoryService) {}

  /**
   * Example: Payment Service Integration
   */
  async processPayment(amount: number, currency: string): Promise<PaymentServiceResponse> {
    const paymentClient = this.httpClientFactory.getClient('payment', {
      baseURL: 'https://api.payment-provider.com/v1',
      timeout: 15000,
      retries: 2,
      auth: {
        type: 'bearer',
        token: process.env.PAYMENT_API_TOKEN,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '2024-01',
      },
    });

    try {
      const response = await paymentClient.post<PaymentServiceResponse>('/payments', {
        amount,
        currency,
        method: 'credit_card',
      });

      this.logger.log(`Payment processed: ${response.data.transactionId}`);
      return response.data;
    } catch (error) {
      this.logger.error('Payment processing failed', error);
      throw new Error('Payment processing failed');
    }
  }

  /**
   * Example: Notification Service Integration
   */
  async sendNotification(
    recipient: string,
    message: string,
    type: 'email' | 'sms',
  ): Promise<NotificationServiceResponse> {
    const notificationClient = this.httpClientFactory.getClient('notification', {
      baseURL: 'https://api.notification-service.com/v2',
      auth: {
        type: 'api-key',
        apiKey: process.env.NOTIFICATION_API_KEY,
        apiKeyHeader: 'X-API-Key',
      },
    });

    const response = await notificationClient.post<NotificationServiceResponse>('/send', {
      recipient,
      message,
      type,
      priority: 'normal',
    });

    return response.data;
  }

  /**
   * Example: User Management Service Integration với retry logic custom
   */
  async getUserInfo(userId: string): Promise<UserManagementResponse> {
    const userClient = this.httpClientFactory.getClient('user-management', {
      baseURL: 'https://api.user-service.com/v1',
      auth: {
        type: 'basic',
        username: process.env.USER_SERVICE_USERNAME,
        password: process.env.USER_SERVICE_PASSWORD,
      },
    });

    const response = await userClient.get<UserManagementResponse>(`/users/${userId}`, {
      retryConfig: {
        retries: 5,
        retryDelay: 2000,
        retryCondition: (error) => {
          // Custom retry logic - chỉ retry với lỗi 500+ hoặc timeout
          return !error.response || error.response.status >= 500 || error.code === 'ECONNABORTED';
        },
      },
    });

    return response.data;
  }

  /**
   * Example: Webhook callback
   */
  async sendWebhook(url: string, data: any): Promise<void> {
    // Tạo client riêng cho webhook (không cache)
    const webhookClient = this.httpClientFactory.createClient('webhook', {
      timeout: 10000,
      retries: 3,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CustomerSupport-Webhook/1.0',
      },
    });

    await webhookClient.post(url, data);
  }

  /**
   * Example: File upload to external service
   */
  async uploadFile(file: Buffer, filename: string): Promise<{ fileUrl: string }> {
    const fileServiceClient = this.httpClientFactory.getClient('file-storage', {
      baseURL: 'https://api.file-storage.com/v1',
      timeout: 60000, // 1 minute for file upload
      auth: {
        type: 'bearer',
        token: process.env.FILE_STORAGE_TOKEN,
      },
    });

    const formData = new FormData();
    formData.append('file', new Blob([file]), filename);

    const response = await fileServiceClient.post<{ fileUrl: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Example: Health check của tất cả external services
   */
  async checkAllServicesHealth(): Promise<Record<string, boolean>> {
    return await this.httpClientFactory.healthCheckAll();
  }

  /**
   * Example: Batch requests với Promise.all
   */
  async batchUserRequests(userIds: string[]): Promise<UserManagementResponse[]> {
    const userClient = this.httpClientFactory.getClient('user-management');

    const promises = userIds.map(async (userId) => {
      try {
        const response = await userClient.get<UserManagementResponse>(`/users/${userId}`);
        return response.data;
      } catch (error) {
        this.logger.warn(`Failed to fetch user ${userId}`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter((result) => result !== null) as UserManagementResponse[];
  }
}
