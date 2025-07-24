import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, timeout, catchError, retry, of } from 'rxjs';

@Injectable()
export class RabbitmqService {
  private readonly logger = new Logger(RabbitmqService.name);

  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
      this.logger.log('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  async onModuleDestroy() {
    await this.client.close();
    this.logger.log('RabbitMQ connection closed');
  }

  /**
   * Publish message to RabbitMQ
   */
  publishMessage(pattern: string, data: any): Observable<any> {
    const retryAttempts = this.configService.get<number>('rabbitmq.retryAttempts');
    const retryDelay = this.configService.get<number>('rabbitmq.retryDelay');

    return this.client.send(pattern, data).pipe(
      timeout(10000), // 10 second timeout
      retry({
        count: retryAttempts,
        delay: retryDelay,
      }),
      catchError((error) => {
        this.logger.error(`Failed to publish message: ${pattern}`, error);
        return of({ error: 'Failed to publish message', details: error.message });
      }),
    );
  }

  /**
   * Emit event to RabbitMQ
   */
  emitEvent(pattern: string, data: any): Observable<any> {
    const retryAttempts = this.configService.get<number>('rabbitmq.retryAttempts');
    const retryDelay = this.configService.get<number>('rabbitmq.retryDelay');

    return this.client.emit(pattern, data).pipe(
      retry({
        count: retryAttempts,
        delay: retryDelay,
      }),
      catchError((error) => {
        this.logger.error(`Failed to emit event: ${pattern}`, error);
        return of({ error: 'Failed to emit event', details: error.message });
      }),
    );
  }

  /**
   * Publish ticket created event
   */
  publishTicketCreated(ticketData: any): Observable<any> {
    return this.emitEvent('ticket.created', ticketData);
  }

  /**
   * Publish ticket updated event
   */
  publishTicketUpdated(ticketData: any): Observable<any> {
    return this.emitEvent('ticket.updated', ticketData);
  }

  /**
   * Publish task created event
   */
  publishTaskCreated(taskData: any): Observable<any> {
    return this.emitEvent('task.created', taskData);
  }

  /**
   * Publish note created event
   */
  publishNoteCreated(noteData: any): Observable<any> {
    return this.emitEvent('note.created', noteData);
  }

  /**
   * Send notification to notification queue
   */
  sendNotification(notificationData: any): Observable<any> {
    return this.publishMessage('notification.send', notificationData);
  }

  /**
   * Send message directly to notification queue
   */
  sendToNotificationQueue(messageData: any): Observable<any> {
    return this.emitEvent('notification_queue', messageData);
  }

  /**
   * Send ticket assignment notification
   */
  sendTicketAssignmentNotification(notificationData: any): Observable<any> {
    this.logger.log(
      `Sending ticket assignment notification for user: ${notificationData.user?.name}`,
    );
    return this.sendToNotificationQueue(notificationData);
  }
}
