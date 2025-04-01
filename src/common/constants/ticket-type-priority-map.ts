import { Priority, TicketType } from '../enums/ticket.enum';

export const TICKET_TYPE_PRIORITY_MAP: Record<TicketType, Priority> = {
  [TicketType.INCIDENT]: Priority.HIGH,
  [TicketType.PROBLEM]: Priority.HIGH,
  [TicketType.CHANGE_REQUEST]: Priority.MEDIUM,
  [TicketType.SERVICE_REQUEST]: Priority.MEDIUM,
  [TicketType.QUESTION]: Priority.LOW,
  [TicketType.FEEDBACK]: Priority.LOW,
  [TicketType.OTHER]: Priority.LOW,
};
