import { drizzle } from 'drizzle-orm/neon-serverless';
import * as users  from '../config/db/schema/users';

export function useUsersDb() {
  return drizzle({
    schema: { ...users },
    connection: String(process.env['DATABASE_URL'])
  })
}
