export interface NotificationData {
  user: string;
  notificationType: 'TICKET' | 'TASK' | 'NOTE';
  eventType: 'ASSIGN_TICKET' | 'CHANGE_TICKET_STATUS' | 'ASSIGN_TASK' | 'ADD_NOTE';
  meta: {
    name?: string;
    ticketId?: string;
    ticketTitle?: string;
    ticketType?: string;
    priority?: string;
    status?: string;
    taskId?: string;
    noteId?: string;
    userId?: string;
    [key: string]: any;
  };
  app: 'ACCESSED_CORPORATE';
}

export interface NotificationResult {
  success: boolean;
  messageId: string;
  error?: string;
  sentAt?: Date;
}
