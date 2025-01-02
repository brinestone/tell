import { Request }    from 'express';
import { userSchema } from '@functions/config/db/schema/users';

export function extractUser(req: Request) {
  if (!req.user) throw new Error('User not found');
  return userSchema.parse(req.user);
}
