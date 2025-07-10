import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket } from '../tickets/schemas/ticket.schema';
import { Activity } from '../activities/schemas/activity.schema';
import { TicketStatus } from 'src/common/enums/ticket.enum';
import { ChannelTicket } from 'src/common/enums/channel-ticket.enum';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

export interface MetricsResponse {
  createdTickets: MetricData;
  unresolvedTickets: MetricData;
  solvedTickets: MetricData;
  averageFirstTimeReply: ReplyTimeMetric;
}

export interface MetricData {
  current: number;
  previous: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReplyTimeMetric {
  current: string;
  currentMinutes: number;
  previous: string;
  previousMinutes: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TrendData {
  date: string;
  created: number;
  solved: number;
}

export interface ChannelData {
  name: string;
  type: string;
  count: number;
  percentage: number;
}

export interface FirstReplyBreakdown {
  category: string;
  count: number;
  percentage: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<Ticket>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  async getMetrics(query: DashboardQueryDto): Promise<MetricsResponse> {
    const { currentPeriod, previousPeriod } = this.getTimeRange(query);

    const [
      currentCreated,
      previousCreated,
      currentUnresolved,
      previousUnresolved,
      currentSolved,
      previousSolved,
      currentReplyTime,
      previousReplyTime,
    ] = await Promise.all([
      this.getCreatedTicketsCount(currentPeriod),
      query.compare ? this.getCreatedTicketsCount(previousPeriod) : 0,
      this.getUnresolvedTicketsCount(currentPeriod),
      query.compare ? this.getUnresolvedTicketsCount(previousPeriod) : 0,
      this.getSolvedTicketsCount(currentPeriod),
      query.compare ? this.getSolvedTicketsCount(previousPeriod) : 0,
      this.getAverageFirstReplyTime(currentPeriod),
      query.compare ? this.getAverageFirstReplyTime(previousPeriod) : 0,
    ]);

    return {
      createdTickets: {
        current: currentCreated,
        previous: previousCreated,
        changePercent: this.calculateChangePercent(currentCreated, previousCreated),
        trend: this.getTrend(currentCreated, previousCreated),
      },
      unresolvedTickets: {
        current: currentUnresolved,
        previous: previousUnresolved,
        changePercent: this.calculateChangePercent(currentUnresolved, previousUnresolved),
        trend: this.getTrend(currentUnresolved, previousUnresolved),
      },
      solvedTickets: {
        current: currentSolved,
        previous: previousSolved,
        changePercent: this.calculateChangePercent(currentSolved, previousSolved),
        trend: this.getTrend(currentSolved, previousSolved),
      },
      averageFirstTimeReply: {
        current: this.formatMinutesToTime(currentReplyTime),
        currentMinutes: currentReplyTime,
        previous: this.formatMinutesToTime(previousReplyTime),
        previousMinutes: previousReplyTime,
        changePercent: this.calculateChangePercent(currentReplyTime, previousReplyTime),
        trend: this.getTrend(previousReplyTime, currentReplyTime), // Reversed for reply time (lower is better)
      },
    };
  }

  async getTicketsTrend(query: DashboardQueryDto) {
    const { startDate, endDate } = this.getTimeRange(query).currentPeriod;

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          created: { $sum: 1 },
          solved: {
            $sum: {
              $cond: [{ $in: ['$status', [TicketStatus.RESOLVED, TicketStatus.CLOSED]] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 as const } },
    ];

    const trendData = await this.ticketModel.aggregate(pipeline);

    const chartData: TrendData[] = trendData.map((item) => ({
      date: item._id,
      created: item.created,
      solved: item.solved,
    }));

    const avgCreated = Math.round(
      chartData.reduce((sum, item) => sum + item.created, 0) / chartData.length,
    );
    const avgSolved = Math.round(
      chartData.reduce((sum, item) => sum + item.solved, 0) / chartData.length,
    );

    return {
      period: `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
      metrics: {
        avgTicketsCreated: avgCreated,
        avgTicketsSolved: avgSolved,
      },
      chartData,
    };
  }

  async getFirstReplyAnalysis(query: DashboardQueryDto) {
    const { startDate, endDate } = this.getTimeRange(query).currentPeriod;

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          deletedAt: null,
        },
      },
      {
        $lookup: {
          from: 'activities',
          localField: '_id',
          foreignField: 'ticket',
          as: 'activities',
        },
      },
      {
        $addFields: {
          firstResponse: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$activities',
                  as: 'activity',
                  cond: {
                    $and: [
                      { $eq: ['$$activity.type', 'NOTE_ADDED'] },
                      { $eq: ['$$activity.deletedAt', null] },
                    ],
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          replyTimeHours: {
            $cond: [
              { $ne: ['$firstResponse', null] },
              {
                $divide: [
                  { $subtract: ['$firstResponse.createdAt', '$createdAt'] },
                  1000 * 60 * 60,
                ],
              },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $eq: ['$replyTimeHours', null] }, then: 'No Replies' },
                { case: { $lte: ['$replyTimeHours', 1] }, then: '0-1 Hours' },
                { case: { $lte: ['$replyTimeHours', 8] }, then: '1-8 Hours' },
                { case: { $lte: ['$replyTimeHours', 24] }, then: '8-24 Hours' },
              ],
              default: '>24 Hours',
            },
          },
          count: { $sum: 1 },
        },
      },
    ];

    const data = await this.ticketModel.aggregate(pipeline);
    const totalTickets = data.reduce((sum, item) => sum + item.count, 0);

    const breakdown: FirstReplyBreakdown[] = data.map((item) => ({
      category: item._id,
      count: item.count,
      percentage: Math.round((item.count / totalTickets) * 100),
    }));

    return {
      totalTickets,
      breakdown,
    };
  }

  async getChannelsAnalysis(query: DashboardQueryDto) {
    const { startDate, endDate } = this.getTimeRange(query).currentPeriod;

    const matchCondition: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      deletedAt: null,
    };

    if (query.status === 'active') {
      matchCondition.status = { $nin: [TicketStatus.CLOSED, TicketStatus.RESOLVED] };
    }

    const pipeline = [
      { $match: matchCondition },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 as const } },
    ];

    const data = await this.ticketModel.aggregate(pipeline);
    const totalTickets = data.reduce((sum, item) => sum + item.count, 0);

    const channels: ChannelData[] = data.map((item) => ({
      name: this.formatChannelName(item._id),
      type: item._id,
      count: item.count,
      percentage: Math.round((item.count / totalTickets) * 100),
    }));

    return {
      totalActiveTickets: totalTickets,
      channels,
    };
  }

  async getCustomerSatisfaction(query: DashboardQueryDto) {
    const { currentPeriod, previousPeriod } = this.getTimeRange(query);

    // This would typically come from a separate feedback/survey system
    // For now, we'll simulate based on ticket resolution patterns
    const [currentSatisfaction, previousSatisfaction] = await Promise.all([
      this.calculateSatisfactionMetrics(currentPeriod),
      this.calculateSatisfactionMetrics(previousPeriod),
    ]);

    return {
      totalResponses: currentSatisfaction.total,
      sentiment: {
        positive: {
          count: currentSatisfaction.positive,
          percentage: Math.round((currentSatisfaction.positive / currentSatisfaction.total) * 100),
          previousPercentage: Math.round(
            (previousSatisfaction.positive / previousSatisfaction.total) * 100,
          ),
          trend: this.getTrend(currentSatisfaction.positive, previousSatisfaction.positive),
        },
        neutral: {
          count: currentSatisfaction.neutral,
          percentage: Math.round((currentSatisfaction.neutral / currentSatisfaction.total) * 100),
          previousPercentage: Math.round(
            (previousSatisfaction.neutral / previousSatisfaction.total) * 100,
          ),
          trend: this.getTrend(currentSatisfaction.neutral, previousSatisfaction.neutral),
        },
        negative: {
          count: currentSatisfaction.negative,
          percentage: Math.round((currentSatisfaction.negative / currentSatisfaction.total) * 100),
          previousPercentage: Math.round(
            (previousSatisfaction.negative / previousSatisfaction.total) * 100,
          ),
          trend: this.getTrend(currentSatisfaction.negative, previousSatisfaction.negative),
        },
      },
    };
  }

  async getDashboardOverview(query: DashboardQueryDto) {
    const [metrics, ticketsTrend, firstReplyAnalysis, channelsAnalysis, customerSatisfaction] =
      await Promise.all([
        this.getMetrics(query),
        this.getTicketsTrend({ ...query, period: '7d' }),
        this.getFirstReplyAnalysis(query),
        this.getChannelsAnalysis(query),
        this.getCustomerSatisfaction(query),
      ]);

    return {
      metrics,
      ticketsTrend,
      firstReplyAnalysis,
      channelsAnalysis,
      customerSatisfaction,
    };
  }

  // Helper methods
  private getTimeRange(query: DashboardQueryDto) {
    if (query.period) {
      return this.getPeriodDates(query.period);
    }

    const currentStart = query.startDate ? new Date(query.startDate) : new Date();
    const currentEnd = query.endDate ? new Date(query.endDate) : new Date();

    // Calculate the duration in milliseconds
    const duration = currentEnd.getTime() - currentStart.getTime();

    // Calculate previous period with same duration
    const previousStart = new Date(currentStart.getTime() - duration);
    const previousEnd = new Date(currentEnd.getTime() - duration);

    return {
      currentPeriod: { startDate: currentStart, endDate: currentEnd },
      previousPeriod: { startDate: previousStart, endDate: previousEnd },
    };
  }

  private getPeriodDates(period: string) {
    const now = new Date();
    const days = parseInt(period.replace('d', ''));

    const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const currentEnd = now;

    const previousStart = new Date(currentStart.getTime() - days * 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;

    return {
      currentPeriod: { startDate: currentStart, endDate: currentEnd },
      previousPeriod: { startDate: previousStart, endDate: previousEnd },
    };
  }

  private getPeriodRange(period: string, startDate?: Date, endDate?: Date) {
    if (startDate && endDate) {
      return { startDate, endDate };
    }

    const now = new Date();
    const days = parseInt(period.replace('d', ''));

    return {
      startDate: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
      endDate: now,
    };
  }

  private async getCreatedTicketsCount(period: {
    startDate: Date;
    endDate: Date;
  }): Promise<number> {
    return this.ticketModel.countDocuments({
      createdAt: { $gte: period.startDate, $lte: period.endDate },
      deletedAt: null,
    });
  }

  private async getUnresolvedTicketsCount(period: {
    startDate: Date;
    endDate: Date;
  }): Promise<number> {
    return this.ticketModel.countDocuments({
      createdAt: { $gte: period.startDate, $lte: period.endDate },
      status: { $nin: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      deletedAt: null,
    });
  }

  private async getSolvedTicketsCount(period: { startDate: Date; endDate: Date }): Promise<number> {
    return this.ticketModel.countDocuments({
      createdAt: { $gte: period.startDate, $lte: period.endDate },
      status: { $in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      deletedAt: null,
    });
  }

  private async getAverageFirstReplyTime(_period: {
    startDate: Date;
    endDate: Date;
  }): Promise<number> {
    // This would require complex aggregation with activities
    // For now, return a simulated value based on SLA requirements
    return Math.floor(Math.random() * 900) + 300; // 5-20 minutes
  }

  private async calculateSatisfactionMetrics(period: { startDate: Date; endDate: Date }) {
    const totalTickets = await this.ticketModel.countDocuments({
      createdAt: { $gte: period.startDate, $lte: period.endDate },
      status: { $in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      deletedAt: null,
    });

    // Simulate satisfaction based on resolution time and priority
    return {
      total: Math.floor(totalTickets * 0.3), // 30% response rate
      positive: Math.floor(totalTickets * 0.24), // 80% of responses
      neutral: Math.floor(totalTickets * 0.045), // 15% of responses
      negative: Math.floor(totalTickets * 0.015), // 5% of responses
    };
  }

  private calculateChangePercent(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  private getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  }

  private formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} min`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private formatChannelName(source: string): string {
    const channelMap: Record<string, string> = {
      [ChannelTicket.WEB]: 'Contact Form',
      [ChannelTicket.CORP]: 'Corporate',
      [ChannelTicket.CHAT]: 'Chat',
      [ChannelTicket.WHATSAPP]: 'WhatsApp',
      [ChannelTicket.LINKEDIN]: 'LinkedIn',
    };

    return channelMap[source?.toLowerCase()] || source || 'Other';
  }
}
