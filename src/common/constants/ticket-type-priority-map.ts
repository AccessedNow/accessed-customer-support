import { Priority, TicketType } from '../enums/ticket.enum';

export const TICKET_TYPE_PRIORITY_MAP: Record<TicketType, Priority> = {
  [TicketType.BRANDING]: Priority.HIGH,
  [TicketType.INVESTOR]: Priority.HIGH,
  [TicketType.PRODUCT_FEEDBACK]: Priority.MEDIUM,
  [TicketType.SITE_ISSUE]: Priority.MEDIUM,
  [TicketType.REQUEST_REFUND]: Priority.LOW,
  [TicketType.OTHER]: Priority.LOW,
};
