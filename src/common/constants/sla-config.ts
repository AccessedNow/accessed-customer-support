import { Priority } from '../enums/ticket.enum';

export const SLA_CONFIG = {
  [Priority.URGENT]: { firstResponse: 1, resolution: 4 },
  [Priority.HIGH]: { firstResponse: 4, resolution: 8 },
  [Priority.MEDIUM]: { firstResponse: 8, resolution: 24 },
  [Priority.LOW]: { firstResponse: 24, resolution: 48 },
};
