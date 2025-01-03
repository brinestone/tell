import { drizzle }     from 'drizzle-orm/neon-serverless';
import * as users      from '../config/db/schema/users';
import * as categories from '../config/db/schema/categories';
import * as campaigns  from '../config/db/schema/campaigns';
import { neonConfig }  from '@neondatabase/serverless';
import ws              from 'ws';

neonConfig.webSocketConstructor = global.WebSocket ?? ws;
const connection = String(process.env['DATABASE_URL']);
const casing = 'snake_case';
const logger = String(process.env['NODE_ENV']) == 'development';

export function useUsersDb() {
  return drizzle({
    schema: { ...users }, casing, connection, logger
  })
}

export function useCategoriesDb() {
  return drizzle({
    schema: { ...categories }, casing, connection, logger
  })
}

export function useCampaignsDb() {
  return drizzle({
    schema: { ...campaigns }, casing, connection, logger
  });
}
