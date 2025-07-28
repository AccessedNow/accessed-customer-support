export interface NotificationData {
  user: string;
  notificationType: 'TICKET';
  eventType:
    | 'ASSIGN_TICKET'
    | 'CHANGE_TICKET_STATUS'
    | 'CHANGE_TICKET_PRIORITY'
    | 'CHANGE_TICKET_ASSIGNEE'
    | 'ADD_FOLLOW_UP'
    | 'ADD_TASK'
    | 'UPDATE_TASK'
    | 'DELETE_TASK'
    | 'ADD_NOTE'
    | 'UPDATE_NOTE'
    | 'DELETE_NOTE';
  meta: {
    name?: string; // Person who performed the action
    ticketId?: string;
    ticketTitle?: string;
    ticketNumber?: string;
    ticketType?: string;
    priority?: string;
    status?: string;
    previousStatus?: string;
    previousPriority?: string;
    assignee?: string; // New assignee name
    previousAssignee?: string;
    assignedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
    followUpContent?: string;
    taskId?: string;
    taskTitle?: string;
    noteId?: string;
    noteContent?: string;
    userId?: string; // For avatar lookup
    previousValue?: any;
    newValue?: any;
    changes?: Record<string, { from: any; to: any }>;
    timestamp?: string;
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
