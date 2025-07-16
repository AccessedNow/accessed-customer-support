import { Controller, Get, HttpCode, HttpStatus, Version } from '@nestjs/common';
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
  @HttpCode(HttpStatus.OK)
  getRoot() {
    return null;
  }

  @Get('health')
  @Public()
  @Version('')
  @ApiOperation({ summary: 'Health endpoint' })
  @ApiResponse({ status: 200, description: 'OK' })
  @HttpCode(HttpStatus.OK)
  health() {
    return null;
  }
}
