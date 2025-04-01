export enum TicketType {
  INCIDENT = 'INCIDENT',
  PROBLEM = 'PROBLEM',
  CHANGE_REQUEST = 'CHANGE_REQUEST',
  SERVICE_REQUEST = 'SERVICE_REQUEST',
  QUESTION = 'QUESTION',
  FEEDBACK = 'FEEDBACK',
  OTHER = 'OTHER',
}

export const TICKET_TYPE_PREFIX_MAP = {
  [TicketType.INCIDENT]: 'IN',
  [TicketType.PROBLEM]: 'PR',
  [TicketType.CHANGE_REQUEST]: 'CH',
  [TicketType.SERVICE_REQUEST]: 'SR',
  [TicketType.QUESTION]: 'QU',
  [TicketType.FEEDBACK]: 'FB',
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
