const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const mysql = require('mysql2/promise');

let cachedDbConfig = null;

async function getDbConfig() {
  if (cachedDbConfig) {
    return cachedDbConfig;
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION
  });

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: process.env.DB_SECRET_ARN
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
  const dbConfig = await getDbConfig();

  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.dbname || dbConfig.database || 's7abt_dubai',
    charset: 'utf8mb4'
  });

  return connection;
}

module.exports = {
  getConnection
};

