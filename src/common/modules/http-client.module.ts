import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HttpClientService } from '../services/http-client.service';
import { HttpClientFactoryService } from '../services/http-client-factory.service';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        timeout: 30000,
        maxRedirects: 5,
      }),
    }),
    ConfigModule,
  ],
  providers: [HttpClientService, HttpClientFactoryService],
  exports: [HttpClientService, HttpClientFactoryService],
})
export class HttpClientModule {}
