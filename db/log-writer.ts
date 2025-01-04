import { LogWriter } from 'drizzle-orm/logger';
import pino, { Logger } from 'pino';
export class PinoWriter implements LogWriter {
  private logger: Logger;

  write(message: string) {
    this.logger.info(message);
  }

  constructor(transport?: any) {
    try {
      this.logger = pino({ transport, name: 'drizzle' });
    } catch (e) {
      throw e;
    }
  }
}
