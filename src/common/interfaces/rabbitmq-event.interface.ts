export interface BaseRabbitMQEvent {
  eventType: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface TicketCreatedEvent extends BaseRabbitMQEvent {
  eventType: 'ticket.created';
  data: {
    ticketId: string;
    title: string;
    description: string;
    priority: string;
    customerId: string;
    assigneeId?: string;
  };
}

export interface TicketUpdatedEvent extends BaseRabbitMQEvent {
  eventType: 'ticket.updated';
  data: {
    ticketId: string;
    changes: Record<string, any>;
    previousValues: Record<string, any>;
  };
}

export interface TaskCreatedEvent extends BaseRabbitMQEvent {
  eventType: 'task.created';
  data: {
    taskId: string;
    title: string;
    description: string;
    ticketId: string;
    assigneeId?: string;
  };
}

export interface NoteCreatedEvent extends BaseRabbitMQEvent {
  eventType: 'note.created';
  data: {
    noteId: string;
    content: string;
    ticketId: string;
    authorId: string;
  };
}

export interface NotificationEvent extends BaseRabbitMQEvent {
  eventType: 'notification.send';
  data: {
    type: 'email' | 'sms' | 'push';
    recipient: string;
    subject?: string;
    content: string;
    templateId?: string;
    templateData?: Record<string, any>;
  };
}

export type RabbitMQEvent =
  | TicketCreatedEvent
  | TicketUpdatedEvent
  | TaskCreatedEvent
  | NoteCreatedEvent
  | NotificationEvent;
