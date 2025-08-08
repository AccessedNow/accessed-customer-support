import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_SERVER_URL || 'amqp://guest:guest@localhost:5672',
  notificationQueue: process.env.RABBITMQ_NOTIFICATION_QUEUE || 'notification_queue_dev',
  prefetchCount: parseInt(process.env.RABBITMQ_PREFETCH_COUNT, 10) || 10,
  retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS, 10) || 3,
  retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY, 10) || 1000,
}));
