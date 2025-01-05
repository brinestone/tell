import winston         from 'winston';
import Transport       from 'winston-transport';
import { Logtail }     from '@logtail/node';
import { from, retry } from 'rxjs';
import { hostname }    from 'node:os';

class LogTailTransport extends Transport {
  private logTail: Logtail;

  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    this.logTail = new Logtail(String(process.env['LOGTAIL_TOKEN']));
  }

  override log(info: { message: string, level: string, splat?: any[] }, next: () => void): any {
    console.log('here');
    const { message, level, splat } = info;
    let context: Record<string, any> = {
      hostname: hostname(),
      origin: process.env['ORIGIN'],
      env: process.env['NODE_ENV']
    };
    if (splat) {
      for (let i = 0, j = 1; i < splat.length - 1; ++i, j++) {
        context[splat[i]] = splat[j];
      }
    }
    from(this.logTail.log(message, level, context)).pipe(retry(20)).subscribe();
    next();
  }
}

export const DevelopmentFormatter = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => `${timestamp} ${level}: ${stack ?? message}`)
);
export const ProductionFormatter = winston.format.json();

export function useProdLogger() {
  return winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transports: [new LogTailTransport({ format: ProductionFormatter })],
    defaultMeta
  })
}

export function useDevLogger() {
  return winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'debug',
    transports: [
      new winston.transports.Console({
        format: DevelopmentFormatter
      })
    ],
    defaultMeta
  })
}

const defaultMeta = {
  hostname: hostname(),
  origin: process.env['ORIGIN'],
  env: process.env['NODE_ENV']
};

const defaultLogger = process.env['NODE_ENV'] == 'development' ? useDevLogger() : useProdLogger();
export default defaultLogger;
