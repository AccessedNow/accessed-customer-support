import { Priority, TICKET_TYPE } from '../enums/ticket.enum';

export const TICKET_TYPE_PRIORITY_MAP = {
  [TICKET_TYPE.ACCOUNT]: Priority.HIGH,
  [TICKET_TYPE.BILLING]: Priority.HIGH,
  [TICKET_TYPE.ORGANIZATION]: Priority.MEDIUM,
  [TICKET_TYPE.CUSTOMIZING]: Priority.MEDIUM,
};
