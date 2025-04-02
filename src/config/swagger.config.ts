import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(
  app: INestApplication,
  nodeEnv: string,
  apiPrefix: string = 'api',
  apiVersion: string = 'v1',
) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Accessed Customer Support API')
    .setDescription('API documentation for Accessed Customer Support')
    .setVersion(apiVersion.replace('v', ''))
    .addTag('health', 'Health check endpoints')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Add custom JS to hide endpoints in production
  if (nodeEnv === 'production') {
    // You could filter out sensitive endpoints in production
    // document.paths = filterEndpointsForProduction(document.paths);
  }

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Accessed API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });
}
