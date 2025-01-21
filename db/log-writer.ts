import { LogWriter } from 'drizzle-orm/logger';
import defaultLogger from '@logger/common'

export class DefaultWriter implements LogWriter {

  write(message: string) {
    defaultLogger.verbose(message, 'context', 'drizzle');
  }
}
