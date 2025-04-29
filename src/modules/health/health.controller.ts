import { Controller, Get, HttpCode, HttpStatus, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @Version('1')
  @ApiOperation({ summary: 'Check API health (v1)' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  @HttpCode(HttpStatus.NOT_FOUND)
  checkHealth() {
    return null;
  }

  @Get()
  @Version('2')
  @Public()
  @ApiOperation({ summary: 'Check API health (v2)' })
  @ApiResponse({ status: 200, description: 'API is healthy with extended info' })
  @HttpCode(HttpStatus.NOT_FOUND)
  checkHealthV2() {
    return null;
  }
}
