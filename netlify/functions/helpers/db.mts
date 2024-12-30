import { drizzle }     from 'drizzle-orm/neon-serverless';
import * as users      from '../config/db/schema/users.mjs';
import * as categories from '../config/db/schema/categories.mjs';
import { neonConfig }  from '@neondatabase/serverless';
import ws              from 'ws';

neonConfig.webSocketConstructor = global.WebSocket ?? ws;

export function useUsersDb() {
  return drizzle({
    schema: { ...users },
    connection: String(process.env['DATABASE_URL'])
  })
}

export function useCategoriesDb() {
  return drizzle({
    schema: { ...categories },
    connection: String(process.env['DATABASE_URL'])
  })
}
