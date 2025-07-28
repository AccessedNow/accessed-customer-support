import { NotificationData } from '../interfaces/notification.interface';

export class NotificationHelper {
  static createTicketAssignNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
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
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'ASSIGN_TICKET',
      meta: {
        name: data.assignedBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        ticketType: data.ticket.ticketType,
        priority: data.ticket.priority,
        userId: data.assigneePartyId,
        assignedBy: data.assignedBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createTicketChangeAssigneeNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
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
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'CHANGE_TICKET_ASSIGNEE',
      meta: {
        name: data.assignedBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        ticketType: data.ticket.ticketType,
        priority: data.ticket.priority,
        assignee: data.assigneeName,
        previousAssignee: data.previousAssignee || 'Unassigned',
        userId: data.assigneePartyId,
        assignedBy: data.assignedBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createTicketChangeStatusNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
      ticketType: string;
      priority: string;
    };
    previousStatus: string;
    newStatus: string;
    changedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'CHANGE_TICKET_STATUS',
      meta: {
        name: data.changedBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        ticketType: data.ticket.ticketType,
        priority: data.ticket.priority,
        status: data.newStatus,
        previousStatus: data.previousStatus,
        userId: data.assigneePartyId,
        assignedBy: data.changedBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createTicketChangePriorityNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
      ticketType: string;
      priority: string;
    };
    previousPriority: string;
    newPriority: string;
    changedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'CHANGE_TICKET_PRIORITY',
      meta: {
        name: data.changedBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        ticketType: data.ticket.ticketType,
        priority: data.newPriority,
        previousPriority: data.previousPriority,
        userId: data.assigneePartyId,
        assignedBy: data.changedBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createAddTaskNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    task: {
      id: string;
      title: string;
      ticketId: string;
    };
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
    };
    createdBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'ADD_TASK',
      meta: {
        name: data.createdBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        taskId: data.task.id,
        taskTitle: data.task.title,
        userId: data.assigneePartyId,
        assignedBy: data.createdBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createAddNoteNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    note: {
      id: string;
      content: string;
      ticketId: string;
    };
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
    };
    createdBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'ADD_NOTE',
      meta: {
        name: data.createdBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        noteId: data.note.id,
        noteContent:
          data.note.content.substring(0, 100) + (data.note.content.length > 100 ? '...' : ''),
        userId: data.assigneePartyId,
        assignedBy: data.createdBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createAddFollowUpNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
    };
    followUpContent: string;
    createdBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'ADD_FOLLOW_UP',
      meta: {
        name: data.createdBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        followUpContent:
          data.followUpContent.substring(0, 100) + (data.followUpContent.length > 100 ? '...' : ''),
        userId: data.assigneePartyId,
        assignedBy: data.createdBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createUpdateTaskNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    task: {
      id: string;
      title: string;
      ticketId: string;
    };
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
    };
    changes: Record<string, { from: any; to: any }>;
    updatedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'UPDATE_TASK',
      meta: {
        name: data.updatedBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        taskId: data.task.id,
        taskTitle: data.task.title,
        userId: data.assigneePartyId,
        changes: data.changes,
        assignedBy: data.updatedBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createDeleteTaskNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    task: {
      id: string;
      title: string;
      ticketId: string;
    };
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
    };
    deletedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'DELETE_TASK',
      meta: {
        name: data.deletedBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        taskId: data.task.id,
        taskTitle: data.task.title,
        userId: data.assigneePartyId,
        assignedBy: data.deletedBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createUpdateNoteNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    note: {
      id: string;
      content: string;
      ticketId: string;
    };
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
    };
    previousContent: string;
    updatedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'UPDATE_NOTE',
      meta: {
        name: data.updatedBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        noteId: data.note.id,
        noteContent:
          data.note.content.substring(0, 100) + (data.note.content.length > 100 ? '...' : ''),
        previousValue:
          data.previousContent.substring(0, 100) + (data.previousContent.length > 100 ? '...' : ''),
        newValue:
          data.note.content.substring(0, 100) + (data.note.content.length > 100 ? '...' : ''),
        userId: data.assigneePartyId,
        assignedBy: data.updatedBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }

  static createDeleteNoteNotification(data: {
    messengerId: string;
    assigneeName: string;
    assigneePartyId: string;
    note: {
      id: string;
      content: string;
      ticketId: string;
    };
    ticket: {
      id: string;
      ticketId: string;
      subject: string;
    };
    deletedBy?: {
      id: string;
      partyId: string;
      name: string;
      email?: string;
      avatar?: string;
    };
  }): NotificationData {
    return {
      user: data.messengerId,
      notificationType: 'TICKET',
      eventType: 'DELETE_NOTE',
      meta: {
        name: data.deletedBy?.name || 'Someone',
        ticketId: data.ticket.id,
        ticketTitle: data.ticket.subject,
        ticketNumber: data.ticket.ticketId,
        noteId: data.note.id,
        noteContent:
          data.note.content.substring(0, 100) + (data.note.content.length > 100 ? '...' : ''),
        userId: data.assigneePartyId,
        assignedBy: data.deletedBy,
        timestamp: new Date().toISOString(),
      },
      app: 'ACCESSED_CORPORATE',
    };
  }
}
