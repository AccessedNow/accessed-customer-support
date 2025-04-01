import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, BadRequestException, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupSwagger } from './config/swagger.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('NestApplication');
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port');
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  const apiPrefix = configService.get<string>('app.apiPrefix');
  const apiVersion = configService.get<string>('app.apiVersion');
  const corsEnabled = configService.get<boolean>('app.corsEnabled');
  const corsOrigins = configService.get<string[]>('app.corsOrigins');

  // Set global API prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  // Configure CORS if enabled
  if (corsEnabled) {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });
  }

  // Add global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Add global transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.reduce((acc, error) => {
          acc[error.property] = Object.values(error.constraints || {});
          return acc;
        }, {});

        return new BadRequestException({
          message: 'Validation failed',
          error: 'Bad Request',
          details: formattedErrors,
          code: 'VALIDATION_FAILED',
        });
      },
    }),
  );

  // Setup Swagger
  setupSwagger(app, nodeEnv, apiPrefix, apiVersion);

  // Only show Swagger docs URL in non-production environments
  if (nodeEnv !== 'production') {
    logger.log(`Swagger documentation is available at http://localhost:${port}/${apiPrefix}/docs`);
  }

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
