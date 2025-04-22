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

  // Set global API prefix with exclusions for root and health routes
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['', 'health'],
  });

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  // Configure CORS
  app.enableCors({
    origin: corsEnabled ? corsOrigins : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

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
        console.log('Validation errors:', errors); // Log the validation errors for debugging
        // Validation errors: [
        //   ValidationError {
        //     target: CreateTaskDto {
        //       title: 'Configure Email Server',
        //       description: 'Set up and configure email server for new account',
        //       status: 'OPEN',
        //       priority: 'HIGH'
        //     },
        //     value: 'OPEN',
        //     property: 'status',
        //     children: [],
        //     constraints: {
        //       isEnum: 'status must be one of the following values: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED'
        //     }
        //   }
        // ]
        const formattedErrors = errors.map((error) => ({
          property: error.property,
          constraints: Object.values(error.constraints || []),
          value: error.value,
        }));

        console.log('Formatted validation errors:', formattedErrors); // Log the formatted errors for debugging

        return new BadRequestException({
          message: 'Validation failed',
          error: 'Bad Request',
          details: formattedErrors,
          code: 'VALIDATION_FAILED',
        });
      },
    }),
  );

  setupSwagger(app, nodeEnv, apiPrefix, apiVersion);

  // Only show Swagger docs URL in non-production environments
  if (nodeEnv !== 'production') {
    logger.log(`Swagger documentation is available at http://localhost:${port}/${apiPrefix}/docs`);
  }

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Root endpoint: http://localhost:${port}`);
  logger.log(`Health check endpoint: http://localhost:${port}/health`);
}
bootstrap();
