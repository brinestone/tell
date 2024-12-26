import { defineConfig } from 'drizzle-kit';

const config = defineConfig({
  dialect: 'postgresql',
  out: 'netlify/functions/config/db/migrations',
  schema: 'netlify/functions/config/db/schema',
  dbCredentials: {
    url: String(process.env['DATABASE_URL']),
  }
})

export default config;
