import { Controller, Get, Query, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Dashboard Analytics')
@Controller('dashboard')
@ApiAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Version('1')
  @ApiOperation({
    summary: 'Get dashboard key metrics',
    description:
      'Returns key metrics including created tickets, unresolved tickets, solved tickets, and average first reply time with comparison to previous period',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved dashboard metrics',
    schema: {
      example: {
        data: {
          createdTickets: {
            current: 1564,
            previous: 1450,
            changePercent: 7.9,
            trend: 'up',
          },
          unresolvedTickets: {
            current: 4564,
            previous: 4200,
            changePercent: 8.7,
            trend: 'up',
          },
          solvedTickets: {
            current: 18208,
            previous: 16800,
            changePercent: 8.4,
            trend: 'up',
          },
          averageFirstTimeReply: {
            current: '12:01 min',
            currentMinutes: 721,
            previous: '14:30 min',
            previousMinutes: 870,
            changePercent: -17.1,
            trend: 'down',
          },
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @Public()
  async getMetrics(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getMetrics(query);
  }

  @Get('tickets-trend')
  @Version('1')
  @ApiOperation({
    summary: 'Get tickets creation and resolution trend',
    description: 'Returns trend data for tickets created and solved over a specified period',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved tickets trend data',
    schema: {
      example: {
        data: {
          period: 'Dec 1 - Dec 7',
          metrics: {
            avgTicketsCreated: 4564,
            avgTicketsSolved: 3320,
          },
          chartData: [
            {
              date: '2024-12-01',
              created: 4200,
              solved: 3100,
            },
            {
              date: '2024-12-02',
              created: 4800,
              solved: 3400,
            },
          ],
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @Public()
  async getTicketsTrend(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getTicketsTrend(query);
  }

  @Get('first-reply-analysis')
  @Version('1')
  @ApiOperation({
    summary: 'Get first reply time analysis',
    description: 'Returns breakdown of tickets by first reply time categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved first reply time analysis',
    schema: {
      example: {
        data: {
          totalTickets: 10000,
          breakdown: [
            {
              category: '0-1 Hours',
              count: 6100,
              percentage: 61,
            },
            {
              category: '1-8 Hours',
              count: 1500,
              percentage: 15,
            },
            {
              category: '8-24 Hours',
              count: 600,
              percentage: 6,
            },
            {
              category: '>24 Hours',
              count: 600,
              percentage: 6,
            },
            {
              category: 'No Replies',
              count: 200,
              percentage: 2,
            },
          ],
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @Public()
  async getFirstReplyAnalysis(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getFirstReplyAnalysis(query);
  }

  @Get('channels-analysis')
  @Version('1')
  @ApiOperation({
    summary: 'Get tickets distribution by channels',
    description: 'Returns breakdown of tickets by communication channels',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved channels analysis',
    schema: {
      example: {
        data: {
          totalActiveTickets: 3002,
          channels: [
            {
              name: 'Email',
              count: 1501,
              percentage: 50,
            },
            {
              name: 'Live Chat',
              count: 750,
              percentage: 25,
            },
            {
              name: 'Contact Form',
              count: 450,
              percentage: 15,
            },
            {
              name: 'Messenger',
              count: 180,
              percentage: 6,
            },
            {
              name: 'WhatsApp',
              count: 121,
              percentage: 4,
            },
          ],
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @Public()
  async getChannelsAnalysis(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getChannelsAnalysis(query);
  }

  @Get('customer-satisfaction')
  @Version('1')
  @ApiOperation({
    summary: 'Get customer satisfaction metrics',
    description: 'Returns customer satisfaction breakdown with sentiment analysis',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved customer satisfaction data',
    schema: {
      example: {
        data: {
          totalResponses: 156,
          sentiment: {
            positive: {
              count: 125,
              percentage: 80,
              previousPercentage: 72,
              trend: 'up',
            },
            neutral: {
              count: 23,
              percentage: 15,
              previousPercentage: 24,
              trend: 'down',
            },
            negative: {
              count: 8,
              percentage: 5,
              previousPercentage: 4,
              trend: 'up',
            },
          },
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @Public()
  async getCustomerSatisfaction(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getCustomerSatisfaction(query);
  }

  @Get('overview')
  @Version('1')
  @ApiOperation({
    summary: 'Get complete dashboard overview',
    description: 'Returns all dashboard data in a single optimized request',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved complete dashboard overview',
    schema: {
      example: {
        data: {
          metrics: '/* metrics data */',
          ticketsTrend: '/* trend data */',
          firstReplyAnalysis: '/* reply time data */',
          channelsAnalysis: '/* channels data */',
          customerSatisfaction: '/* satisfaction data */',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @Public()
  async getDashboardOverview(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getDashboardOverview(query);
  }
}
