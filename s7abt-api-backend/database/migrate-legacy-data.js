/**
 * Lambda Function for Migrating Legacy Data
 *
 * Reads the legacy SQL dump (s7abtcom_s7abt_September2025.sql),
 * extracts INSERT statements, and executes them against the new schema.
 * Then populates new columns (slugs, email, role).
 *
 * Usage: Deploy as Lambda in VPC, invoke once, then delete.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const {
  SecretsManagerClient,
  GetSecretValueCommand
} = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({});

// --- Slug generation ---
function generateSlug(text) {
  if (!text || text.trim() === '') return null;
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')           // spaces to hyphens
    .replace(/[^\w\u0600-\u06FF\-]/g, '') // keep alphanumeric, Arabic, hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '');         // trim leading/trailing hyphens
}

// --- DB credentials from Secrets Manager ---
async function getDbCredentials() {
  const secretArn = process.env.DB_SECRET_ARN;
  if (!secretArn) {
    throw new Error('DB_SECRET_ARN environment variable not set');
  }
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsClient.send(command);
  return JSON.parse(response.SecretString);
}

// --- Parse SQL dump file ---
function extractInsertStatements(sqlContent) {
  // Split into logical statements
  // INSERT statements can span multiple lines until we hit a semicolon
  const statements = [];
  const lines = sqlContent.split('\n');
  let currentStatement = '';
  let inInsert = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines when not in a statement
    if (!inInsert) {
      if (trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed === '') {
        continue;
      }
      if (trimmed.startsWith('INSERT INTO')) {
        inInsert = true;
        currentStatement = line;
        // Check if statement ends on this line
        if (trimmed.endsWith(';')) {
          statements.push(currentStatement);
          currentStatement = '';
          inInsert = false;
        }
        continue;
      }
      continue;
    }

    // We're inside an INSERT statement
    currentStatement += '\n' + line;
    if (trimmed.endsWith(';')) {
      statements.push(currentStatement);
      currentStatement = '';
      inInsert = false;
    }
  }

  return statements;
}

function categorizeStatements(statements) {
  const tables = {
    s7b_user: [],
    s7b_section: [],
    s7b_tags: [],       // tags before tags_item
    s7b_article: [],
    s7b_news: [],
    s7b_tags_item: [],
  };

  for (const stmt of statements) {
    for (const tableName of Object.keys(tables)) {
      if (stmt.includes(`\`${tableName}\``) || stmt.includes(`'${tableName}'`)) {
        tables[tableName].push(stmt);
        break;
      }
    }
  }

  return tables;
}

// --- Main migration logic ---
async function runMigration(connection) {
  const results = {
    truncated: [],
    inserted: {},
    updated: {},
    errors: []
  };

  // Read the SQL dump file (bundled with the Lambda)
  const dumpPath = path.join(__dirname, 's7abtcom_s7abt_September2025.sql');
  console.log('Reading SQL dump from:', dumpPath);
  const sqlContent = fs.readFileSync(dumpPath, 'utf8');
  console.log('SQL dump size:', (sqlContent.length / 1024).toFixed(1), 'KB');

  // Extract and categorize INSERT statements
  const allStatements = extractInsertStatements(sqlContent);
  console.log('Total INSERT statements found:', allStatements.length);

  const tableStatements = categorizeStatements(allStatements);
  for (const [table, stmts] of Object.entries(tableStatements)) {
    console.log(`  ${table}: ${stmts.length} INSERT statements`);
  }

  // Step 1: Disable FK checks
  console.log('\n--- Step 1: Disable FK checks ---');
  await connection.query('SET FOREIGN_KEY_CHECKS = 0');
  await connection.query('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"');

  // Step 2: Truncate all target tables (child tables first)
  console.log('\n--- Step 2: Truncate tables ---');
  const truncateOrder = [
    's7b_tags_item',
    's7b_article_shares',
    's7b_tweets',
    's7b_comment',
    's7b_article',
    's7b_news',
    's7b_tags',
    's7b_section',
    's7b_user'
  ];

  for (const table of truncateOrder) {
    try {
      await connection.query(`TRUNCATE TABLE ${table}`);
      results.truncated.push(table);
      console.log(`  Truncated ${table}`);
    } catch (err) {
      // Table might not exist (e.g., tweets, article_shares)
      console.log(`  Skipped ${table}: ${err.message}`);
    }
  }

  // Step 3: Insert data in dependency order
  console.log('\n--- Step 3: Insert legacy data ---');
  const insertOrder = ['s7b_user', 's7b_section', 's7b_tags', 's7b_article', 's7b_news', 's7b_tags_item'];

  for (const table of insertOrder) {
    const stmts = tableStatements[table] || [];
    let rowCount = 0;

    for (const stmt of stmts) {
      try {
        const [result] = await connection.query(stmt);
        rowCount += result.affectedRows || 0;
      } catch (err) {
        const preview = stmt.substring(0, 120);
        results.errors.push({ table, error: err.message, statement: preview });
        console.error(`  ERROR in ${table}: ${err.message}`);
        console.error(`  Statement: ${preview}...`);
      }
    }

    results.inserted[table] = rowCount;
    console.log(`  ${table}: ${rowCount} rows inserted`);
  }

  // Step 4: Populate new columns
  console.log('\n--- Step 4: Populate new columns ---');

  // 4a: Users - set email and role
  try {
    const [userResult] = await connection.query(`
      UPDATE s7b_user
      SET s7b_user_email = s7b_user_username,
          s7b_user_role = CASE WHEN s7b_user_admin = 1 THEN 'admin' ELSE 'viewer' END
      WHERE s7b_user_email IS NULL OR s7b_user_email = ''
    `);
    results.updated.user_email_role = userResult.affectedRows;
    console.log(`  Users: ${userResult.affectedRows} rows updated (email + role)`);
  } catch (err) {
    results.errors.push({ table: 's7b_user', error: err.message, operation: 'update email/role' });
    console.error('  ERROR updating user email/role:', err.message);
  }

  // 4b: Sections - generate slugs
  try {
    const [sections] = await connection.query('SELECT s7b_section_id, s7b_section_title FROM s7b_section');
    let slugCount = 0;
    for (const section of sections) {
      const slug = generateSlug(section.s7b_section_title);
      if (slug) {
        await connection.query(
          'UPDATE s7b_section SET s7b_section_slug = ? WHERE s7b_section_id = ?',
          [slug, section.s7b_section_id]
        );
        slugCount++;
      }
    }
    results.updated.section_slugs = slugCount;
    console.log(`  Sections: ${slugCount} slugs generated`);
  } catch (err) {
    results.errors.push({ table: 's7b_section', error: err.message, operation: 'generate slugs' });
    console.error('  ERROR generating section slugs:', err.message);
  }

  // 4c: Tags - generate slugs
  try {
    const [tags] = await connection.query('SELECT s7b_tags_id, s7b_tags_name FROM s7b_tags');
    let slugCount = 0;
    for (const tag of tags) {
      const slug = generateSlug(tag.s7b_tags_name);
      if (slug) {
        await connection.query(
          'UPDATE s7b_tags SET s7b_tags_slug = ? WHERE s7b_tags_id = ?',
          [slug, tag.s7b_tags_id]
        );
        slugCount++;
      }
    }
    results.updated.tag_slugs = slugCount;
    console.log(`  Tags: ${slugCount} slugs generated`);
  } catch (err) {
    results.errors.push({ table: 's7b_tags', error: err.message, operation: 'generate slugs' });
    console.error('  ERROR generating tag slugs:', err.message);
  }

  // 4d: Articles - generate slugs
  try {
    const [articles] = await connection.query('SELECT s7b_article_id, s7b_article_title FROM s7b_article');
    let slugCount = 0;
    for (const article of articles) {
      const slug = generateSlug(article.s7b_article_title);
      if (slug) {
        await connection.query(
          'UPDATE s7b_article SET s7b_article_slug = ? WHERE s7b_article_id = ?',
          [slug, article.s7b_article_id]
        );
        slugCount++;
      }
    }
    results.updated.article_slugs = slugCount;
    console.log(`  Articles: ${slugCount} slugs generated`);
  } catch (err) {
    results.errors.push({ table: 's7b_article', error: err.message, operation: 'generate slugs' });
    console.error('  ERROR generating article slugs:', err.message);
  }

  // Step 5: Reset AUTO_INCREMENT values
  console.log('\n--- Step 5: Reset AUTO_INCREMENT ---');
  const autoIncrements = {
    s7b_user: 6,
    s7b_section: 10,
    s7b_tags: 164,
    s7b_article: 79,
    s7b_news: 10,
    s7b_tags_item: 1586
  };

  for (const [table, value] of Object.entries(autoIncrements)) {
    try {
      await connection.query(`ALTER TABLE ${table} AUTO_INCREMENT = ${value}`);
      console.log(`  ${table}: AUTO_INCREMENT = ${value}`);
    } catch (err) {
      console.error(`  ERROR resetting ${table} AUTO_INCREMENT: ${err.message}`);
    }
  }

  // Step 6: Re-enable FK checks
  console.log('\n--- Step 6: Re-enable FK checks ---');
  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  // Step 7: Verify row counts
  console.log('\n--- Step 7: Verification ---');
  const verifyTables = ['s7b_user', 's7b_section', 's7b_tags', 's7b_article', 's7b_news', 's7b_tags_item'];
  const verification = {};

  for (const table of verifyTables) {
    try {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      verification[table] = rows[0].count;
      console.log(`  ${table}: ${rows[0].count} rows`);
    } catch (err) {
      verification[table] = `ERROR: ${err.message}`;
    }
  }

  results.verification = verification;
  return results;
}

// --- Lambda Handler ---
exports.handler = async (event, context) => {
  console.log('=== Legacy Data Migration Started ===');
  console.log('Event:', JSON.stringify(event, null, 2));

  let connection;
  try {
    // Get DB credentials
    const credentials = await getDbCredentials();
    console.log('DB Host:', credentials.host);
    console.log('DB Name:', credentials.dbname || credentials.database);

    // Connect
    connection = await mysql.createConnection({
      host: credentials.host,
      port: credentials.port || 3306,
      user: credentials.username,
      password: credentials.password,
      database: credentials.dbname || credentials.database,
      multipleStatements: true,
      charset: 'utf8mb4'
    });

    console.log('Connected to database');

    // Run migration
    const results = await runMigration(connection);

    console.log('\n=== Migration Complete ===');
    console.log('Results:', JSON.stringify(results, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Migration completed successfully',
        results
      })
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Migration failed',
        error: error.message,
        stack: error.stack
      })
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};
