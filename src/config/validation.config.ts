import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  APP_NAME: Joi.string().default('customer-support-api'),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  BASE_URL: Joi.string().uri().optional(),
  CORS_ENABLED: Joi.boolean().default(false),
  CORS_ORIGINS: Joi.string().optional(),

  MONGO_URI: Joi.string().required(),
});

export const validationOptions = {
  abortEarly: false,
  allowUnknown: true,
};
