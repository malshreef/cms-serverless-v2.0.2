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
 * Pool is reused across Lambda invocations (warm starts)
 */
async function getPool() {
  // Return existing pool if available
  if (pool) {
    return pool;
  }

  const credentials = await getDbCredentials();

  // Create connection pool with optimized settings
  pool = mysql.createPool({
    host: credentials.host,
    port: credentials.port || 3306,
    user: credentials.username,
    password: credentials.password,
    database: credentials.database || 's7abt',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 2, // Low limit for Lambda (max 2 connections per function)
    maxIdle: 2, // Maximum idle connections
    idleTimeout: 60000, // Close idle connections after 60 seconds
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Connection timeout settings
    connectTimeout: 10000, // 10 seconds
    acquireTimeout: 10000, // 10 seconds
    // Automatically handle connection errors
    onConnectionConnect: (connection) => {
      console.log('Database connection established');
    },
    onConnectionRelease: (connection) => {
      // Connection returned to pool
    }
  });

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      // Connection was closed, reset pool
      pool = null;
    }
  });

  return pool;
}

/**
 * Execute a query with automatic connection management
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise} Query results
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
 * @param {string} sql - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise} First row or null
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get a connection from the pool for transactions
 * IMPORTANT: Must call connection.release() when done!
 * @returns {Promise<Connection>} Database connection
 */
async function getConnection() {
  const pool = await getPool();
  return await pool.getConnection();
}

/**
 * Begin a database transaction
 * Returns a connection with transaction methods
 * IMPORTANT: Must call commit() or rollback() and then release()!
 * @returns {Promise<Connection>} Database connection with transaction started
 */
async function beginTransaction() {
  const connection = await getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Close all connections in the pool
 * Call this at the end of Lambda execution if needed
 */
async function closePool() {
  if (pool) {
    try {
      await pool.end();
      pool = null;
      console.log('Database pool closed');
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
