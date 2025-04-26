import { Priority, TicketType } from '../enums/ticket.enum';

export const TICKET_TYPE_PRIORITY_MAP: Record<TicketType, Priority> = {
  [TicketType.ANALYTIC_REPORTING]: Priority.HIGH,
  [TicketType.COMPANY_REVIEWS]: Priority.HIGH,
  [TicketType.JOB_ADVERTISING]: Priority.MEDIUM,
  [TicketType.MANAGE_COMPANY_PROFILE]: Priority.MEDIUM,
  [TicketType.PERSONAL_ACCOUNT]: Priority.LOW,
  [TicketType.PROFILE]: Priority.LOW,
  [TicketType.SALARY_ESTIMATES]: Priority.MEDIUM,
  [TicketType.SALES_INQUIRY]: Priority.HIGH,
  [TicketType.SUBSCRIPTION_BILLING]: Priority.HIGH,
  [TicketType.TECHNICAL_SUPPORT]: Priority.LOW,
};
