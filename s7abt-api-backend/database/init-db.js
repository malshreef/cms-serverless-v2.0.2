/**
 * Database Initialization Script
 * Run this script to initialize the S7abt CMS database tables
 *
 * Usage:
 *   node init-db.js
 *
 * Environment Variables:
 *   DB_HOST - Database host
 *   DB_PORT - Database port (default: 3306)
 *   DB_USER - Database username
 *   DB_PASSWORD - Database password
 *   DB_NAME - Database name (default: s7abt)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  console.log('🚀 Starting S7abt CMS Database Initialization...\n');

  // Get configuration from environment or use defaults
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  const dbName = process.env.DB_NAME || 's7abt';

  console.log(`📊 Database Configuration:`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${dbName}\n`);

  let connection;

  try {
    // Connect without database first
    console.log('🔗 Connecting to MySQL server...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server\n');

    // Read SQL schema file
    const schemaPath = path.join(__dirname, 'init-schema.sql');
    console.log(`📄 Reading schema file: ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded\n');

    // Execute the schema
    console.log('🔨 Executing database schema...\n');

    // Split by semicolons but preserve them for execution
    const statements = schema
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await connection.query(statement);
          // Log a summary of what was executed
          const firstLine = statement.split('\n')[0].substring(0, 60);
          console.log(`   ✓ ${firstLine}...`);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists') &&
              !err.message.includes('Duplicate entry')) {
            console.warn(`   ⚠ Warning: ${err.message.substring(0, 80)}`);
          }
        }
      }
    }

    console.log('\n✅ Database schema executed successfully!\n');

    // Verify tables were created
    console.log('📋 Verifying tables...');
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );

    console.log(`\n📊 Tables in ${dbName}:`);
    tables.forEach(t => console.log(`   • ${t.TABLE_NAME}`));

    // Count records
    console.log('\n📈 Initial data counts:');

    const counts = [
      { table: 's7b_user', name: 'Users' },
      { table: 's7b_section', name: 'Sections' },
      { table: 's7b_tags', name: 'Tags' },
      { table: 's7b_article', name: 'Articles' },
      { table: 's7b_news', name: 'News' }
    ];

    for (const { table, name } of counts) {
      try {
        const [[{ count }]] = await connection.query(
          `SELECT COUNT(*) as count FROM ${dbName}.${table}`
        );
        console.log(`   ${name}: ${count}`);
      } catch (err) {
        console.log(`   ${name}: (table not found)`);
      }
    }

    console.log('\n🎉 Database initialization complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. Change the default admin password');
    console.log('   2. Configure your .env file with database credentials');
    console.log('   3. Deploy the API stack with SAM\n');

  } catch (error) {
    console.error('\n❌ Error initializing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
