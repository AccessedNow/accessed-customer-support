import appConfig from './app.config';
import mongoConfig from './mongo.config';
import rabbitmqConfig from './rabbitmq.config';

export const configurations = [appConfig, mongoConfig, rabbitmqConfig];

export { appConfig, mongoConfig, rabbitmqConfig };
