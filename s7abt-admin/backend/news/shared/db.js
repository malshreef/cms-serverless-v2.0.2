const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const mysql = require('mysql2/promise');

let cachedDbConfig = null;
let cachedConnection = null;

async function getDbConfig() {
  if (cachedDbConfig) {
    return cachedDbConfig;
  }

  // Get secret ARN from either variable name
  const secretArn = process.env.DB_SECRET_ARN || process.env.DATABASE_SECRET_ARN;

  // Option 1: Use direct environment variables (for testing/development)
  if (!secretArn) {
    console.warn('⚠️  DB_SECRET_ARN/DATABASE_SECRET_ARN not set, using direct environment variables');
    
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}. ` +
        `Either set DB_SECRET_ARN or set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME`
      );
    }

    cachedDbConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };
    
    console.log(`✓ Using direct connection to ${cachedDbConfig.host}:${cachedDbConfig.port}/${cachedDbConfig.database}`);
    return cachedDbConfig;
  }

  // Option 2: Use AWS Secrets Manager (recommended for production)
  console.log('✓ Using AWS Secrets Manager for database credentials');
  
  // AWS_REGION is automatically set by Lambda runtime
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION
  });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretArn
      })
    );

    cachedDbConfig = JSON.parse(response.SecretString);
    console.log(`✓ Retrieved credentials from Secrets Manager`);
    return cachedDbConfig;
  } catch (error) {
    console.error('❌ Error fetching database credentials from Secrets Manager:', error);
    throw new Error(
      `Failed to get database credentials: ${error.message}. ` +
      `Make sure DB_SECRET_ARN is correct and Lambda has Secrets Manager permissions.`
    );
  }
}

async function getConnection() {
  if (cachedConnection) {
    try {
      await cachedConnection.ping();
      return cachedConnection;
    } catch (error) {
      console.log('Connection lost, reconnecting...');
      cachedConnection = null;
    }
  }

  const dbConfig = await getDbConfig();

  try {
    cachedConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port || 3306,
      user: dbConfig.username || dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.dbname || dbConfig.database || 's7abt_dubai',
      charset: 'utf8mb4',
      connectTimeout: 10000
    });

    console.log('✓ Database connection established');
    return cachedConnection;
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    throw new Error(
      `Database connection failed: ${error.message}. ` +
      `Check database host, credentials, and security groups.`
    );
  }
}

/**
 * Execute a query and return all results
 */
async function query(sql, params = []) {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query(sql, params);
    return rows;
  } catch (error) {
    console.error('❌ Query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return the first result
 */
async function queryOne(sql, params = []) {
  try {
    const connection = await getConnection();
    const [rows] = await connection.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('❌ QueryOne error:', error);
    throw error;
  }
}

module.exports = {
  getConnection,
  query,
  queryOne
};
