import { Controller, Query, Get, HttpStatus, Version, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { QueryActivityDto } from './dto/query-activity.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';

@ApiTags('tickets/:ticketId/activities')
@Controller('tickets/:ticketId/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activities with filtering and pagination' })
  @ApiQuery({ name: 'sort', required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'sequence', required: false, description: 'Sort order (asc or desc)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all activities matching the criteria',
  })
  @Version('1')
  async findAll(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Query() query: QueryActivityDto,
  ) {
    return this.activitiesService.findAll({ ticketId, query });
  }
}
