import { Request } from 'express';

export function extractIp(req: Request) {
  return String(req.header('x-nf-client-connection-ip') ?? req.header('client-ip') ?? req.header('x-forwarded-for'))
}
