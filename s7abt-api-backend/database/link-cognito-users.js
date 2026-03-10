/**
 * One-shot Lambda: Link Cognito users to DB records
 * Updates s7b_user_email and s7b_user_cognito_id for legacy users.
 * Deploy, invoke once, then delete.
 *
 * Configure the USER_MAPPINGS environment variable as a JSON array:
 * [{"userId": 1, "email": "user@example.com", "role": "admin"}]
 */
const mysql = require('mysql2/promise');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({});

async function getDbCredentials() {
  const command = new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN });
  const response = await secretsClient.send(command);
  return JSON.parse(response.SecretString);
}

exports.handler = async () => {
  const mappings = JSON.parse(process.env.USER_MAPPINGS || '[]');
  if (!mappings.length) {
    return { statusCode: 400, body: 'USER_MAPPINGS env var is empty or not set' };
  }

  const credentials = await getDbCredentials();
  const connection = await mysql.createConnection({
    host: credentials.host,
    port: credentials.port || 3306,
    user: credentials.username,
    password: credentials.password,
    database: credentials.dbname || credentials.database,
    charset: 'utf8mb4'
  });

  try {
    const results = [];
    for (const mapping of mappings) {
      const [result] = await connection.query(
        `UPDATE s7b_user SET
          s7b_user_email = ?,
          s7b_user_cognito_id = ?,
          s7b_user_role = ?
         WHERE s7b_user_id = ?`,
        [mapping.email, mapping.email, mapping.role || 'writer', mapping.userId]
      );
      results.push({ userId: mapping.userId, affectedRows: result.affectedRows });
    }

    // Verify
    const [users] = await connection.query(
      `SELECT s7b_user_id, s7b_user_username, s7b_user_email, s7b_user_cognito_id, s7b_user_role
       FROM s7b_user ORDER BY s7b_user_id`
    );

    const output = {
      updated: results,
      users: users.map(u => ({
        id: u.s7b_user_id,
        username: u.s7b_user_username,
        email: u.s7b_user_email,
        cognitoId: u.s7b_user_cognito_id,
        role: u.s7b_user_role
      }))
    };

    console.log('Result:', JSON.stringify(output, null, 2));
    return { statusCode: 200, body: JSON.stringify(output) };
  } finally {
    await connection.end();
  }
};
