import { neonConfig, Pool } from '@neondatabase/serverless';
import * as campaigns from '@schemas/campaigns';
import * as categories from '@schemas/categories';
import * as finance from '@schemas/finance';
import * as users from '@schemas/users';
import { DefaultLogger } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import { DefaultWriter } from '../../db/log-writer';

neonConfig.webSocketConstructor = global.WebSocket ?? ws;
const logger = new DefaultLogger({
  writer: new DefaultWriter()
});

const pool = new Pool({
  connectionString: String(process.env['DATABASE_URL']),
  ssl: true
})

export function useFinanceDb() {
  return drizzle(pool, {
    schema: { ...finance }, logger
  });
}

export function useUsersDb() {
  return drizzle(pool, {
    schema: { ...users }, logger
  })
}

export function useCategoriesDb() {
  return drizzle(pool, {
    schema: { ...categories }, logger
  })
}

export function useCampaignsDb() {
  return drizzle(pool, {
    schema: { ...campaigns }, logger
  });
}
