import { Ticket } from 'src/modules/tickets/schemas/ticket.schema';
import { BaseRepositoryInterface } from '../base/base.interface.repository';

export interface TicketsRepositoryInterface extends BaseRepositoryInterface<Ticket> {}
