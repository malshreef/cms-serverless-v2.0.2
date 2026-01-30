const mysql = require('mysql2/promise');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let pool = null;
let secretCache = null;
const SECRET_CACHE_TTL = 300000; // 5 minutes
let secretCacheTime = 0;

/**
 * Get database credentials from AWS Secrets Manager with caching
 */
async function getDbCredentials() {
  const now = Date.now();

  // Return cached secret if still valid
  if (secretCache && (now - secretCacheTime) < SECRET_CACHE_TTL) {
    return secretCache;
  }

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'me-central-1' });
  const secretName = process.env.DB_SECRET_NAME || 's7abt/database/credentials-dubai';

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    const secret = JSON.parse(response.SecretString);

    // Cache the secret
    secretCache = secret;
    secretCacheTime = now;

    return secret;
  } catch (error) {
    console.error('Error fetching database credentials:', error);
    throw error;
  }
}

/**
 * Get or create database connection pool
 */
async function getPool() {
  if (pool) {
    return pool;
  }

  const credentials = await getDbCredentials();

  pool = mysql.createPool({
    host: credentials.host,
    port: credentials.port || 3306,
    user: credentials.username,
    password: credentials.password,
    database: credentials.database || 's7abt',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 2,
    maxIdle: 2,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    connectTimeout: 10000,
    acquireTimeout: 10000,
  });

  pool.on('error', (err) => {
    console.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      pool = null;
    }
  });

  return pool;
}

/**
 * Execute a query
 */
async function query(sql, params = []) {
  const pool = await getPool();

  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a query and return only the first row
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get a connection for transactions
 */
async function getConnection() {
  const pool = await getPool();
  return await pool.getConnection();
}

/**
 * Begin a database transaction
 */
async function beginTransaction() {
  const connection = await getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Close pool
 */
async function closePool() {
  if (pool) {
    try {
      await pool.end();
      pool = null;
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  }
}

module.exports = {
  query,
  queryOne,
  getConnection,
  beginTransaction,
  closePool,
  getPool
};
