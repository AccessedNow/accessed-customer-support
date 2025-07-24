import { NotificationData } from '../interfaces/notification.interface';

export class NotificationHelper {
  /**
   * Tạo notification data khi user được assign vào ticket
   */
  static createTicketAssignedNotification(data: {
    assignee: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
      messengerId?: string;
    };
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
      ticketType: string;
      priority: string;
    };
    assignedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.assignee?.messengerId || '',
      notificationType: 'TICKET',
      eventType: 'ASSIGN_TICKET',
      meta: {
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        ticketType: data.ticket.ticketType,
        priority: data.ticket.priority,
        assignedBy: data.assignedBy
          ? {
              id: data.assignedBy.id,
              partyId: data.assignedBy.partyId,
              name: data.assignedBy.name,
              email: data.assignedBy.email,
              avatar: data.assignedBy.avatar,
            }
          : undefined,
        userId: data.assignee?.partyId,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  /**
   * Tạo notification data khi ticket được update với assignee mới
   */
  static createTicketReassignedNotification(data: {
    assignee: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
      messengerId?: string;
    };
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
      ticketType: string;
      priority: string;
    };
    previousAssignee?: string;
    assignedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.assignee?.messengerId || '',
      notificationType: 'TICKET',
      eventType: 'CHANGE_TICKET_STATUS',
      meta: {
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        ticketType: data.ticket.ticketType,
        priority: data.ticket.priority,
        previousAssignee: data.previousAssignee,
        assignedBy: data.assignedBy
          ? {
              id: data.assignedBy.id,
              partyId: data.assignedBy.partyId,
              name: data.assignedBy.name,
              email: data.assignedBy.email,
              avatar: data.assignedBy.avatar,
            }
          : undefined,
        userId: data.assignee?.partyId,
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  /**
   * Tạo notification data khi task được assign
   */
  static createTaskAssignedNotification(data: {
    assignee: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
      messengerId?: string;
    };
    task: {
      id: string;
      title: string;
      ticketId: string;
    };
    assignedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.assignee?.messengerId || '',
      notificationType: 'TASK',
      eventType: 'ASSIGN_TASK',
      meta: {
        taskId: data.task.id,
        taskTitle: data.task.title,
        ticketId: data.task.ticketId,
        assignedBy: data.assignedBy
          ? {
              id: data.assignedBy.id,
              partyId: data.assignedBy.partyId,
              name: data.assignedBy.name,
              email: data.assignedBy.email,
              avatar: data.assignedBy.avatar,
            }
          : undefined,
        userId: data.assignee?.partyId,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }
}
