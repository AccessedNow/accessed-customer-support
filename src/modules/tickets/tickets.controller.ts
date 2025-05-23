import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Version,
  Delete,
  Query,
  HttpCode,
  Put,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PageSortDto } from 'src/common/utils/page-sort.dto';
import { FilterTicketDto } from './dto/filter-ticket.dto';
import { RequirePrivileges } from 'src/common/decorators/require-privileges.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { TicketStatus, TICKET_TYPE, Priority, TICKET_SUBTYPE } from 'src/common/enums/ticket.enum';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Tickets Management')
@Controller('tickets')
@Roles('ROLE_CUSTOMER_SUPPORT', 'ROLE_CUSTOMER_SUPPORT_ADMIN', 'ROLE_ADMIN')
@ApiAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new ticket',
    description:
      'Creates a new support ticket with customer information and ticket details. The customer ID is automatically set from the authenticated user.',
  })
  @ApiBody({
    type: CreateTicketDto,
    description: 'Ticket creation data',
    examples: {
      ticket: {
        value: {
          subject: 'VPN Access Request',
          message: 'Need VPN access for remote work during the upcoming business trip.',
          ticketType: 'INVESTOR',
          priority: 'MEDIUM',
          source: 'POSTMAN',
          assigneeId: '4:6db934cb-9aba-4675-a007-eb0d31c51391:222',
          followers: [
            '4:6db934cb-9aba-4675-a007-eb0d31c51391:487',
            '4:6db934cb-9aba-4675-a007-eb0d31c51391:1493',
          ],
          files: [
            {
              url: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/01/3574aa7e-0007-4e62-9cf3-1333a411c1ee/large/agadnxiaahzdcfu.webp',
              type: 'image',
            },
            {
              url: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/01/f89f7f91-3e9b-4f06-b25a-8c1a9809716a/original/nguyen-viet-minh-duy-fresher-software-developer1',
              type: 'document',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ticket has been successfully created',
    schema: {
      example: {
        data: {
          deletedAt: null,
          ticketId: '#IN-000005',
          customer: {
            id: '67ebca9e8c1373deda961688',
            customerId: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
            name: 'Đức Châu',
            avatar: '',
          },
          subject: 'Application Crash on Login',
          message:
            'Users are experiencing crashes when trying to log in. Issue started after the latest update.',
          ticketType: 'INCIDENT',
          priority: 'HIGH',
          status: 'OPEN',
          source: 'User Reports',
          firstResponseDue: '2025-04-02T06:45:34.468Z',
          resolutionDue: '2025-04-02T10:45:34.468Z',
          createdBy: '67ebca9e8c1373deda961688',
          _id: '67eca4ceae95c4dcfd60ac75',
          createdAt: '2025-04-02T02:45:34.479Z',
          updatedAt: '2025-04-02T02:45:34.479Z',
          id: '67eca4ceae95c4dcfd60ac75',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        data: {
          code: 400,
          message: 'Validation failed',
        },
        code: 400,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid customer token',
    schema: {
      example: {
        data: {
          code: 401,
          message: 'Bearer token is required',
        },
        code: 401,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    schema: {
      example: {
        data: {
          data: {
            code: 403,
            message: 'User does not have the required privilege(s): ADD_TICKETS',
          },
          code: 403,
          message: 'Success',
        },
      },
    },
  })
  @Public()
  @Version('1')
  createTicket(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create({ createTicketDto, user: null });
  }

  @Post('add')
  @Version('1')
  createTicketByUser(@Body() createTicketDto: CreateTicketDto, @User() user: any) {
    return this.ticketsService.create({ createTicketDto, user });
  }

  @Post('list')
  @ApiOperation({
    summary: 'Get all tickets with filtering and pagination',
    description:
      'Retrieves a list of tickets with optional filtering through body and pagination through query parameters.',
  })
  @ApiBody({
    type: FilterTicketDto,
    description: 'Filter criteria',
    required: false,
    examples: {
      filters: {
        value: {
          status: TicketStatus.OPEN,
          priority: Priority.HIGH,
          ticketType: TICKET_TYPE.ACCOUNT,
          ticketSubtype: TICKET_SUBTYPE.ACCOUNT_REGISTRATION,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all tickets matching the criteria',
    schema: {
      example: {
        data: {
          content: [
            {
              _id: '67e8b4334733133cd205780e',
              deletedAt: null,
              ticketId: '#IN-000004',
              customer: {
                id: '67e8ad318b21d51a0a364a0a',
                customerId: '4:6db934cb-9aba-4675-a007-eb0d31c51391:222',
                name: 'Duy Minh',
                avatar:
                  'https://accessed.s3.us-west-2.amazonaws.com/user/4:6db934cb-9aba-4675-a007-eb0d31c51391:222/avatar/person_4:6db934cb-9aba-4675-a007-eb0d31c51391:222_1743058575955.png',
              },
              assignee: {
                id: '66f000000000000000000000',
                firstName: 'Duy',
                lastName: 'Minh',
                email: 'duy.nguyen@example.com',
                phone: '+1234567890',
                role: 'sales',
                status: 'active',
              },
              subject: 'Application Crash on Login',
              message:
                'Users are experiencing crashes when trying to log in. Issue started after the latest update.',
              ticketType: 'INCIDENT',
              priority: 'HIGH',
              status: 'OPEN',
              source: 'User Reports',
              firstResponseDue: '2025-03-30T07:02:11.806Z',
              resolutionDue: '2025-03-30T11:02:11.806Z',
              createdBy: '67e8ad318b21d51a0a364a0a',
              createdAt: '2025-03-30T03:02:11.807Z',
              updatedAt: '2025-03-30T03:02:11.807Z',
            },
            {
              _id: '67e8b4264733133cd2057806',
              deletedAt: null,
              ticketId: '#IN-000003',
              customer: {
                id: '67e8ad318b21d51a0a364a0a',
                customerId: '4:6db934cb-9aba-4675-a007-eb0d31c51391:222',
                name: 'Duy Minh',
                avatar:
                  'https://accessed.s3.us-west-2.amazonaws.com/user/4:6db934cb-9aba-4675-a007-eb0d31c51391:222/avatar/person_4:6db934cb-9aba-4675-a007-eb0d31c51391:222_1743058575955.png',
              },
              assignee: {
                id: '66f000000000000000000000',
                firstName: 'Duy',
                lastName: 'Minh',
                email: 'duy.nguyen@example.com',
                phone: '+1234567890',
                role: 'sales',
                status: 'active',
              },
              subject: 'Server Downtime',
              message:
                'Our main server is down, causing service disruptions. Please investigate immediately.',
              ticketType: 'INCIDENT',
              priority: 'HIGH',
              status: 'OPEN',
              source: 'Monitoring System',
              firstResponseDue: '2025-03-30T07:01:58.816Z',
              resolutionDue: '2025-03-30T11:01:58.816Z',
              createdBy: '67e8ad318b21d51a0a364a0a',
              createdAt: '2025-03-30T03:01:58.818Z',
              updatedAt: '2025-03-30T03:01:58.818Z',
            },
          ],
          pageable: {
            sort: {
              unsorted: false,
              sort: true,
              empty: false,
            },
            pageSize: 10,
            pageNumber: 1,
            offset: 0,
            paged: true,
            unpaged: false,
          },
          last: true,
          totalPages: 1,
          totalElements: 2,
          first: true,
          numberOfElements: 2,
          size: 10,
          number: 1,
          empty: false,
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid customer token',
    schema: {
      example: {
        data: {
          code: 401,
          message: 'Bearer token is required',
        },
        code: 401,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    schema: {
      example: {
        data: {
          data: {
            code: 403,
            message: 'User does not have the required privilege(s): VIEW_TICKETS',
          },
          code: 403,
          message: 'Success',
        },
      },
    },
  })
  @RequirePrivileges('VIEW_TICKETS')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  getTickets(@Body() filterTicketDto: FilterTicketDto, @Query() pageSortDto: PageSortDto) {
    const query = { ...filterTicketDto, ...pageSortDto };
    return this.ticketsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a ticket by ID',
    description: 'Retrieves detailed information of a specific ticket by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the ticket',
    schema: {
      example: {
        data: {
          _id: '67ebca9f8c1373deda96168c',
          deletedAt: null,
          ticketId: '#SR-000001',
          customer: {
            id: '67ebca9e8c1373deda961688',
            customerId: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
            name: 'Đức Châu',
            avatar: '',
          },
          subject: 'New Email Account Setup',
          message: 'Request to create an official email account for a new user.',
          ticketType: 'SERVICE_REQUEST',
          priority: 'MEDIUM',
          status: 'OPEN',
          source: 'HR Team',
          firstResponseDue: '2025-04-01T19:14:39.070Z',
          resolutionDue: '2025-04-02T11:14:39.070Z',
          createdBy: '67ebca9e8c1373deda961688',
          createdAt: '2025-04-01T11:14:39.075Z',
          updatedAt: '2025-04-01T11:14:39.075Z',
          activities: [
            {
              _id: '67ebca9f8c1373deda96168f',
              type: 'Ticket Created',
              description: 'Ticket #SR-000001 created',
              createdBy: {
                id: '67ebca9e8c1373deda961688',
                name: 'Đức Châu',
              },
              ticket: '67ebca9f8c1373deda96168c',
              metadata: {
                priority: 'MEDIUM',
                ticketType: 'SERVICE_REQUEST',
              },
              createdAt: '2025-04-01T11:14:39.145Z',
            },
          ],
          tasks: [],
          notes: [],
          files: [
            {
              _id: '67ebca9f8c1373deda961692',
              fileId: '3574aa7e-0007-4e62-9cf3-1333a411c1ee',
              fileType: 'image',
              path: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/01/3574aa7e-0007-4e62-9cf3-1333a411c1ee/large/agadnxiaahzdcfu.webp',
              ticket: '67ebca9f8c1373deda96168c',
            },
            {
              _id: '67ebca9f8c1373deda961693',
              fileId: 'f89f7f91-3e9b-4f06-b25a-8c1a9809716a',
              fileType: 'document',
              path: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/01/f89f7f91-3e9b-4f06-b25a-8c1a9809716a/original/nguyen-viet-minh-duy-fresher-software-developer1',
              ticket: '67ebca9f8c1373deda96168c',
            },
          ],
          id: '67ebca9f8c1373deda96168c',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Ticket not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid customer token',
    schema: {
      example: {
        data: {
          code: 401,
          message: 'Bearer token is required',
        },
        code: 401,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    schema: {
      example: {
        data: {
          data: {
            code: 403,
            message: 'User does not have the required privilege(s): VIEW_TICKETS',
          },
          code: 403,
          message: 'Success',
        },
      },
    },
  })
  @RequirePrivileges('VIEW_TICKETS')
  @Version('1')
  getTicket(@Param('id') id: string) {
    return this.ticketsService.findOneById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a ticket',
    description:
      'Updates an existing ticket with new information. The user ID performing the update is automatically recorded.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiBody({
    type: UpdateTicketDto,
    description: 'Updated ticket information',
    examples: {
      ticket: {
        value: {
          status: TicketStatus.CLOSED,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket has been successfully updated',
    schema: {
      example: {
        data: {
          _id: '67ebca9f8c1373deda96168c',
          deletedAt: null,
          ticketId: '#SR-000001',
          customer: {
            id: '67ebca9e8c1373deda961688',
            customerId: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
            name: 'Đức Châu',
            avatar: '',
          },
          subject: 'New Email Account Setup',
          message: 'Request to create an official email account for a new user.',
          ticketType: 'SERVICE_REQUEST',
          priority: 'MEDIUM',
          status: 'CLOSED',
          source: 'HR Team',
          firstResponseDue: '2025-04-01T19:14:39.070Z',
          resolutionDue: '2025-04-02T11:14:39.070Z',
          createdBy: '67ebca9e8c1373deda961688',
          createdAt: '2025-04-01T11:14:39.075Z',
          updatedAt: '2025-04-02T02:49:28.177Z',
          id: '67ebca9f8c1373deda96168c',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    schema: {
      example: {
        data: {
          code: 400,
          message: 'Validation failed',
        },
        code: 400,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Ticket not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid customer token',
    schema: {
      example: {
        data: {
          code: 401,
          message: 'Bearer token is required',
        },
        code: 401,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    schema: {
      example: {
        data: {
          data: {
            code: 403,
            message: 'User does not have the required privilege(s): UPDATE_TICKETS',
          },
          code: 403,
          message: 'Success',
        },
      },
    },
  })
  @RequirePrivileges('UPDATE_TICKETS')
  @Version('1')
  updateTicket(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @User() user: any,
  ) {
    const updateData = {
      ...updateTicketDto,
      userId: user.id,
    };

    return this.ticketsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a ticket',
    description:
      'Performs a soft delete on the specified ticket, marking it as deleted but retaining the record in the database.',
  })
  @ApiParam({
    name: 'id',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket has been successfully deleted',
    schema: {
      example: {
        data: {
          success: true,
          message: 'Ticket #PR-000003 has been deleted',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Ticket not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid customer token',
    schema: {
      example: {
        data: {
          code: 401,
          message: 'Bearer token is required',
        },
        code: 401,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    schema: {
      example: {
        data: {
          data: {
            code: 403,
            message: 'User does not have the required privilege(s): DELETE_TICKETS',
          },
          code: 403,
          message: 'Success',
        },
      },
    },
  })
  @RequirePrivileges('DELETE_TICKETS')
  @Version('1')
  deleteTicket(@Param('id') id: string) {
    return this.ticketsService.softDelete(id);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get all followers of a ticket' })
  @ApiResponse({
    status: 200,
    description: 'Returns array of followers with their basic information',
    schema: {
      example: {
        data: [
          {
            _id: '67f64e784c4ede7c2f80347a',
            name: 'ban  HR',
            avatar:
              'https://accessed.s3.us-west-2.amazonaws.com/user/4:6db934cb-9aba-4675-a007-eb0d31c51391:487/avatar/person_4:6db934cb-9aba-4675-a007-eb0d31c51391:487_1743746118020.jpg',
            partyId: '4:6db934cb-9aba-4675-a007-eb0d31c51391:487',
          },
          {
            _id: '67f64e794c4ede7c2f80347c',
            name: 'Mỹ Tâm Hồ',
            avatar: '',
            partyId: '4:6db934cb-9aba-4675-a007-eb0d31c51391:1493',
          },
        ],
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket not found',
  })
  @RequirePrivileges('VIEW_TICKETS')
  @Version('1')
  async getFollowers(@Param('id') id: string) {
    return this.ticketsService.getFollowers(id);
  }

  @Post(':id/followers')
  @ApiOperation({ summary: 'Add a new follower to a ticket' })
  @ApiBody({
    description: 'User ID to add as follower',
    required: true,
    schema: {
      type: 'object',
      properties: {
        partyId: {
          type: 'string',
          example: '4:6db934cb-9aba-4675-a007-eb0d31c51391:487',
          description: 'The ID of the user to add as a follower',
        },
      },
      required: ['partyId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully added follower',
    schema: {
      example: {
        data: {
          success: true,
          message:
            'Successfully added follower Accessed Developer 2 to ticket 67f64e794c4ede7c2f803480',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket or user not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Ticket with ID 67f64e794c4ede7c2f803481 not found',
          details: [],
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User is already a follower',
  })
  @RequirePrivileges('UPDATE_TICKETS')
  @Version('1')
  async addFollower(
    @Param('id') ticketId: string,
    @Body('partyId') partyId: string,
    @User() user: any,
  ) {
    return this.ticketsService.addFollower(ticketId, partyId, user.id);
  }

  @Delete(':id/followers/:followerId')
  @ApiOperation({ summary: 'Remove a follower from a ticket' })
  @ApiResponse({
    status: 200,
    description: 'Successfully removed follower',
    schema: {
      example: {
        data: {
          success: true,
          message:
            'Successfully removed follower Accessed Developer 2 from ticket 67f64e794c4ede7c2f803480',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket, follower, or user not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Ticket with ID 67f64e794c4ede7c2f803481 not found',
          details: [],
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Follower is not following the ticket',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Follower with ID 67f65ebe34bda64a243a19b0 not found',
          details: [],
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @RequirePrivileges('UPDATE_TICKETS')
  @Version('1')
  async removeFollower(
    @User() user: any,
    @Param('id') id: string,
    @Param('followerId') followerId: string,
  ) {
    return this.ticketsService.removeFollower(id, followerId, user.id);
  }
}
