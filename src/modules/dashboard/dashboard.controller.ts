import { Controller, Get, Query, Version } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
// import { RequirePrivileges } from 'src/common/decorators/require-privileges.decorator';
// import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Dashboard Analytics')
@Controller('dashboard')
// @Roles('ROLE_CUSTOMER_SUPPORT', 'ROLE_CUSTOMER_SUPPORT_ADMIN', 'ROLE_ADMIN')
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
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for metrics calculation (e.g., 30d, 7d)',
    example: '30d',
  })
  @ApiQuery({
    name: 'compare',
    required: false,
    description: 'Whether to compare with previous period',
    example: true,
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
  // @RequirePrivileges('VIEW_DASHBOARD')
  @Public()
  async getMetrics(
    @Query('period') period: string = '30d',
    @Query('compare') compare: boolean = true,
    @Query('start') start?: Date,
    @Query('end') end?: Date,
  ) {
    return this.dashboardService.getMetrics(period, compare, start, end);
  }

  @Get('tickets-trend')
  @Version('1')
  @ApiOperation({
    summary: 'Get tickets creation and resolution trend',
    description: 'Returns trend data for tickets created and solved over a specified period',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for trend analysis (e.g., 7d, 30d)',
    example: '7d',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    description: 'Data granularity (daily, weekly)',
    example: 'daily',
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
  // @RequirePrivileges('VIEW_DASHBOARD')
  @Public()
  async getTicketsTrend(
    @Query('period') period: string = '7d',
    @Query('granularity') granularity: string = 'daily',
    @Query('start') start?: Date,
    @Query('end') end?: Date,
  ) {
    return this.dashboardService.getTicketsTrend(period, granularity, start, end);
  }

  @Get('first-reply-analysis')
  @Version('1')
  @ApiOperation({
    summary: 'Get first reply time analysis',
    description: 'Returns breakdown of tickets by first reply time categories',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for analysis (e.g., 30d)',
    example: '30d',
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
  // @RequirePrivileges('VIEW_DASHBOARD')
  @Public()
  async getFirstReplyAnalysis(@Query('period') period: string = '30d', start?: Date, end?: Date) {
    return this.dashboardService.getFirstReplyAnalysis(period, start, end);
  }

  @Get('channels-analysis')
  @Version('1')
  @ApiOperation({
    summary: 'Get tickets distribution by channels',
    description: 'Returns breakdown of tickets by communication channels',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for analysis (e.g., 30d)',
    example: '30d',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by ticket status (active, all)',
    example: 'active',
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
  // @RequirePrivileges('VIEW_DASHBOARD')
  @Public()
  async getChannelsAnalysis(
    @Query('period') period: string = '30d',
    @Query('status') status: string = 'active',
    @Query('start') start?: Date,
    @Query('end') end?: Date,
  ) {
    return this.dashboardService.getChannelsAnalysis(period, status, start, end);
  }

  @Get('customer-satisfaction')
  @Version('1')
  @ApiOperation({
    summary: 'Get customer satisfaction metrics',
    description: 'Returns customer satisfaction breakdown with sentiment analysis',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for analysis (e.g., 30d)',
    example: '30d',
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
  // @RequirePrivileges('VIEW_DASHBOARD')
  @Public()
  async getCustomerSatisfaction(@Query('period') period: string = '30d', start?: Date, end?: Date) {
    return this.dashboardService.getCustomerSatisfaction(period, start, end);
  }

  @Get('overview')
  @Version('1')
  @ApiOperation({
    summary: 'Get complete dashboard overview',
    description: 'Returns all dashboard data in a single optimized request',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period for analysis (e.g., 30d)',
    example: '30d',
  })
  @ApiQuery({
    name: 'compare',
    required: false,
    description: 'Whether to compare with previous period',
    example: true,
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
  //  @RequirePrivileges('VIEW_DASHBOARD')
  @Public()
  async getDashboardOverview(
    @Query('period') period: string = '30d',
    @Query('compare') compare: boolean = true,
  ) {
    return this.dashboardService.getDashboardOverview(period, compare);
  }
}
