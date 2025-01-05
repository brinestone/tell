import { neonConfig }    from '@neondatabase/serverless';
import * as campaigns    from '@schemas/campaigns';
import * as categories   from '@schemas/categories';
import * as finance      from '@schemas/finance';
import * as users        from '@schemas/users';
import { DefaultLogger } from 'drizzle-orm/logger';
import { drizzle }       from 'drizzle-orm/neon-serverless';
import ws                from 'ws';
import { DefaultWriter } from '../../db/log-writer';

neonConfig.webSocketConstructor = global.WebSocket ?? ws;
const connection = String(process.env['DATABASE_URL']);
const casing = 'snake_case';
const logger = new DefaultLogger({
  writer: new DefaultWriter()
});

export function useFinanceDb() {
  return drizzle({
    schema: { ...finance }, casing, connection, logger
  });
}

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
