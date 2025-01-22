import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { PgTransaction } from 'drizzle-orm/pg-core';
import * as categories from '../db/seed/categories';
import * as users from '../db/seed/users';
import * as wallets from '../db/seed/wallets';
import { DefaultWriter } from '../db/log-writer';
import { DefaultLogger } from 'drizzle-orm/logger';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

type Seeder = { name: string, seed: (t: PgTransaction<any>) => Promise<void> }
const seeders: Seeder[] = [users, categories, wallets];
neonConfig.webSocketConstructor = global.WebSocket ?? ws;

const logger = process.env['NODE_ENV'] === 'development' ? new DefaultLogger({ writer: new DefaultWriter() }) : false
console.log('db url = ', process.env['DATABASE_URL'])
const db = drizzle(new Pool({ connectionString: String(process.env['DATABASE_URL']) }), { logger });
db.transaction(async t => {
  for await (const { seed, name } of seeders) {
    console.log(`Seeding "${name} ⚙️`);
    await seed(t as unknown as PgTransaction<any>);
    console.log(`Seeded "${name}" ✅`);
  }
}).then(() => db.$client.end())
  .catch(console.error);
