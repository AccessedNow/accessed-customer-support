import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema, validationOptions } from './config/validation.config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './modules/health/health.module';
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD, Reflector } from '@nestjs/core';
import { ExceptionInterceptor } from './common/interceptors/exception.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { configurations } from './config/configurations';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotesModule } from './modules/notes/notes.module';
import { CustomersModule } from './modules/customers/customers.module';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './common/services/token.service';
import { FilesModule } from './modules/files/files.module';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthGuard } from './common/guards/auth.guard';
import { HttpModule } from '@nestjs/axios';
import { HttpClientModule } from './common/modules/http-client.module';
import { RabbitmqModule } from './common/modules/rabbitmq.module';
import * as https from 'https';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      validationOptions,
      load: configurations,
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath:
        {
          production: '.env.production',
          uat: '.env.uat',
          staging: '.env.staging',
        }[process.env.NODE_ENV] || '.env',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: Buffer.from(configService.get<string>('JWT_SECRET'), 'base64').toString('utf8'),
        signOptions: {
          algorithm: 'HS256',
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }),
      inject: [ConfigService],
    }),
    HttpClientModule,
    RabbitmqModule,
    HealthModule,
    TicketsModule,
    ActivitiesModule,
    TasksModule,
    NotesModule,
    CustomersModule,
    FilesModule,
    UsersModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    TokenService,
    Reflector,
    {
      provide: APP_INTERCEPTOR,
      useClass: ExceptionInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
