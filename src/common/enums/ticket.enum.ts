export enum TicketType {
  SITE_ISSUE = 'SITE_ISSUE',
  PRODUCT_FEEDBACK = 'PRODUCT_FEEDBACK',
  INVESTOR = 'INVESTOR',
  BRANDING = 'BRANDING',
  REQUEST_REFUND = 'REQUEST_REFUND',
  OTHER = 'OTHER',
}

export const TICKET_TYPE_PREFIX_MAP = {
  [TicketType.SITE_ISSUE]: 'SI',
  [TicketType.PRODUCT_FEEDBACK]: 'PF',
  [TicketType.INVESTOR]: 'IN',
  [TicketType.BRANDING]: 'BR',
  [TicketType.REQUEST_REFUND]: 'RF',
  [TicketType.OTHER]: 'OT',
};

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
