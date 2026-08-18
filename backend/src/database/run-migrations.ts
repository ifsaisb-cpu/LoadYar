import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  const isTestEnv = process.env.DB_HOST && process.env.DB_PORT;

  const dataSource = new DataSource({
    type: isTestEnv ? 'postgres' : 'better-sqlite3',
    host: process.env.DB_HOST || 'localhost',
    port: isTestEnv ? parseInt(process.env.DB_PORT || '5432') : undefined,
    username: process.env.DB_USER || 'test',
    password: process.env.DB_PASSWORD || 'test',
    database: process.env.DB_NAME || 'loadyar.db',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Read and execute SQL migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const sqlFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`\n📝 Running migration: ${file}`);

      // Split by semicolon and run each statement
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        try {
          await dataSource.query(statement);
        } catch (error: any) {
          // Ignore errors for statements that might already exist (e.g., index creation)
          if (!error.message.includes('already exists') &&
              !error.message.includes('duplicate key')) {
            throw error;
          }
          console.log(`  ⚠️  ${error.message}`);
        }
      }

      console.log(`  ✅ ${file} completed`);
    }

    console.log('\n✅ All migrations completed successfully!');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
