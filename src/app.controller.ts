import { Controller, Get, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('app')
@Controller({
  version: '',
})
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'OK' })
  getRoot() {
    return {
      status: 200,
      message: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('health')
  @Public()
  @Version('')
  @ApiOperation({ summary: 'Health endpoint' })
  @ApiResponse({ status: 200, description: 'OK' })
  health() {
    return {
      status: 200,
      message: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
