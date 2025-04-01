import { Controller, Get, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Check API health (v1)' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  checkHealth() {
    return {
      status: 'ok',
      version: 'v1',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @Version('2')
  @ApiOperation({ summary: 'Check API health (v2)' })
  @ApiResponse({ status: 200, description: 'API is healthy with extended info' })
  checkHealthV2() {
    return {
      status: 'ok',
      version: 'v2',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
