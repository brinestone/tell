import { defineConfig } from 'drizzle-kit';

const config = defineConfig({
  dialect: 'postgresql',
  out: 'db/migrations',
  schema: 'db/schema',
  casing: 'snake_case',
  dbCredentials: {
    url: String(process.env['DATABASE_URL']),
  }
})

export default config;
