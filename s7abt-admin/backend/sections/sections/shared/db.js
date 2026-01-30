const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'me-central-1'
});

let pool = null;
let dbConfig = null;

/**
 * Get database credentials from AWS Secrets Manager
 */
async function getDbCredentials() {
  if (dbConfig) {
    return dbConfig;
  }

  try {
    const secretArn = process.env.DATABASE_SECRET_ARN;
    
    if (!secretArn) {
      throw new Error('DATABASE_SECRET_ARN environment variable is not set');
    }

    const data = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
    
    if (!data.SecretString) {
      throw new Error('Secret string is empty');
    }

    dbConfig = JSON.parse(data.SecretString);
    return dbConfig;
  } catch (error) {
    console.error('Error retrieving database credentials:', error);
    throw error;
  }
}

/**
 * Get database connection pool
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
    database: credentials.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00'
  });

  return pool;
}

/**
 * Execute a query
 */
async function query(sql, params = []) {
  const pool = await getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Execute a query and return the first row
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Begin a transaction
 */
async function beginTransaction() {
  const pool = await getPool();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Commit a transaction
 */
async function commit(connection) {
  await connection.commit();
  connection.release();
}

/**
 * Rollback a transaction
 */
async function rollback(connection) {
  await connection.rollback();
  connection.release();
}

module.exports = {
  query,
  queryOne,
  beginTransaction,
  commit,
  rollback,
  getPool
};

