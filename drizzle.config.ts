import { defineConfig } from 'drizzle-kit';


export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/db/schema/**/*.ts'],
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 🔥 SUPABASE CHECK CONSTRAINT BYPASS
  strict: false,
  verbose: true,

    // ONLY process YOUR tables
  tablesFilter: ['*users*', '*sessions*', '*accounts*', '*verification*'],

  // Skip problematic schemas
  schemaFilter: ['public']
});
