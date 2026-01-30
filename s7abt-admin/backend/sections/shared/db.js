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

  if (!secretArn) {
    throw new Error('Missing DB_SECRET_ARN or DATABASE_SECRET_ARN environment variable');
  }

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
    return cachedDbConfig;
  } catch (error) {
    console.error('Error fetching database credentials:', error);
    throw error;
  }
}

async function getConnection() {
  if (cachedConnection) {
    return cachedConnection;
  }

  const dbConfig = await getDbConfig();

  cachedConnection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    charset: 'utf8mb4'
  });

  return cachedConnection;
}

/**
 * Execute a query and return all results
 */
async function query(sql, params = []) {
  const connection = await getConnection();
  const [rows] = await connection.execute(sql, params);
  return rows;
}

/**
 * Execute a query and return the first result
 */
async function queryOne(sql, params = []) {
  const connection = await getConnection();
  const [rows] = await connection.execute(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

module.exports = {
  getConnection,
  query,
  queryOne
};
