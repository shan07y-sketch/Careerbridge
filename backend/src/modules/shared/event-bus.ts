import { EventEmitter } from 'events';
import { logger } from '../../config/logger';

class EventBus extends EventEmitter {
  emit(event: string | symbol, ...args: any[]): boolean {
    logger.info({ event, args }, `[EVENT BUS] Broadcast event`);
    return super.emit(event, ...args);
  }
}

export const eventBus = new EventBus();
