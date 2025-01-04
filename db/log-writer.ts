import { LogWriter } from 'drizzle-orm/logger';
import pino, { Logger } from 'pino';

// export const LogtailTransport = pino.transport({
//   target: '@logtail/pino',
//   options: { sourceToken: String(process.env['LOGTAIL_TOKEN']) }
// })

export class PinoWriter implements LogWriter {
  private logger?: Logger;

  write(message: string) {
    this.logger?.info(message);
  }

  constructor(transport?: any) {
    try {
      this.logger = pino({ level: 'trace', name: 'drizzle' });
    } catch (e) {
      console.error(e);
    }
  }
}
