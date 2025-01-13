import { UserSchema } from 'db/schema/users';
import { Request }    from 'express';

export function extractUser(req: Request) {
  if (!req.user) throw new Error('User not found');
  return UserSchema.parse(req.user);
}
