import { drizzle }    from 'drizzle-orm/neon-serverless';
import * as users     from '../config/db/schema/users';
import { neonConfig } from '@neondatabase/serverless';
import ws             from 'ws';

neonConfig.webSocketConstructor = global.WebSocket ?? ws;

export function useUsersDb() {
  return drizzle({
    schema: { ...users },
    connection: String(process.env['DATABASE_URL'])
  })
}
