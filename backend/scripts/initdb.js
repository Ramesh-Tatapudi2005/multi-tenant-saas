const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

const runMigrations = async () => {
  try {
    console.log('Running migrations...');
    
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log(`Executing migration: ${file}`);
        await db.query(sqlContent);
      }
    }

    console.log('✓ Migrations completed successfully');
    return true;
  } catch (err) {
    console.error('✗ Migration error:', err.message);
    return false;
  }
};

const seedData = async () => {
  try {
    console.log('Seeding database...');
    
    const seedFile = path.join(__dirname, '../database/seeds/seed_data.sql');
    const sqlContent = fs.readFileSync(seedFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }

    console.log('✓ Data seeded successfully');
    return true;
  } catch (err) {
    console.error('✗ Seed error:', err.message);
    return false;
  }
};

const main = async () => {
  try {
    // Run migrations
    const migrationsSuccess = await runMigrations();
    if (!migrationsSuccess) {
      process.exit(1);
    }

    // Seed data
    const seedSuccess = await seedData();
    if (!seedSuccess) {
      process.exit(1);
    }

    console.log('✓ Database initialization complete');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
};

main();
