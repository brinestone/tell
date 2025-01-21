import { Logtail } from '@logtail/node';
import DatadogWinston from 'datadog-winston';
import { hostname } from 'node:os';
import winston from 'winston';
import Transport from 'winston-transport';

class LogTailTransport extends Transport {
  private logTail: Logtail;

  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    this.logTail = new Logtail(String(process.env['LOGTAIL_TOKEN']));
  }

  override log(info: { message: string, level: string } & Record<string, unknown>, next: () => void): any {
    const { message, level } = info;
    const rest = Object.entries(info).filter(([k]) => k != 'mesage' && k != 'level').reduce((acc, [k, v]) => ({
      ...acc,
      [k]: v
    }), {} as Record<string, unknown>);

    this.logTail.log(message, level, rest).then(() => next()).catch(err => {
      console.error(err);
      this.log(info, next);
    });
  }
}

export const DevelopmentFormatter = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.align(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
  })
);
export const ProductionFormatter = winston.format.json();

function useProdLogger() {
  return winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'info',
    transports: [
      new winston.transports.Console({
        format: ProductionFormatter
      }),
      // Datadog logs
      new DatadogWinston({
        apiKey: String(process.env['DATADOG_KEY']),
        hostname: new URL(String(process.env['ORIGIN'])).hostname,
        ddsource: 'nodejs',
        ddtags: `env:${process.env['NODE_ENV']}`
      }),
      new LogTailTransport({ format: ProductionFormatter }),
    ],
    defaultMeta
  })
}

function useDevLogger() {
  return winston.createLogger({
    level: process.env['LOG_LEVEL'] ?? 'debug',
    transports: [
      new winston.transports.Console({
        format: DevelopmentFormatter
      }),
      new DatadogWinston({
        apiKey: String(process.env['DATADOG_KEY']),
        hostname: new URL(String(process.env['ORIGIN'])).hostname,
        ddsource: 'nodejs',
        ddtags: `env:${process.env['NODE_ENV']}`
      }),
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

export function useLogger(meta: Record<string, string | number>) {
  return defaultLogger.child(meta);
}

export default defaultLogger;
