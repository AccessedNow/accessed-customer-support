import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'staging', 'uat').default('staging'),
  PORT: Joi.number().port().default(3000),
  APP_NAME: Joi.string().default('customer-support-api'),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  BASE_URL: Joi.string().uri().optional(),
  CORS_ENABLED: Joi.boolean().default(false),
  CORS_ORIGINS: Joi.string().optional(),

  MONGO_URI: Joi.string().required(),

  // RabbitMQ Configuration
  RABBITMQ_SERVER_URL: Joi.string()
    .pattern(/^amqps?:\/\//)
    .required(),
  RABBITMQ_NOTIFICATION_QUEUE: Joi.string().required(),
  RABBITMQ_PREFETCH_COUNT: Joi.number().integer().min(1).default(10),
  RABBITMQ_RETRY_ATTEMPTS: Joi.number().integer().min(0).default(3),
  RABBITMQ_RETRY_DELAY: Joi.number().integer().min(0).default(1000),
});

export const validationOptions = {
  abortEarly: false,
  allowUnknown: true,
};
