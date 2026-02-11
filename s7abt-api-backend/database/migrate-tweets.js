const mysql = require('mysql2/promise');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.handler = async (event) => {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const secretName = process.env.DB_SECRET_ARN || 's7abt/database/credentials';
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
  const creds = JSON.parse(response.SecretString);

  const connection = await mysql.createConnection({
    host: creds.host,
    port: creds.port || 3306,
    user: creds.username,
    password: creds.password,
    database: creds.dbname || creds.database,
    multipleStatements: true
  });

  const sql = `
    DROP TABLE IF EXISTS s7b_tweets;

    CREATE TABLE s7b_tweets (
      s7b_tweet_id VARCHAR(36) NOT NULL,
      s7b_article_id INT(11) DEFAULT NULL,
      s7b_tweet_text VARCHAR(300) NOT NULL,
      s7b_tweet_tone VARCHAR(50) DEFAULT NULL,
      s7b_tweet_hashtags TEXT DEFAULT NULL,
      s7b_tweet_sequence INT DEFAULT NULL,
      s7b_tweet_total_in_batch INT DEFAULT NULL,
      s7b_tweet_status ENUM('pending', 'scheduled', 'posted', 'failed') DEFAULT 'pending',
      s7b_tweet_scheduled_time DATETIME DEFAULT NULL,
      s7b_tweet_posted_time DATETIME DEFAULT NULL,
      s7b_tweet_twitter_id VARCHAR(100) DEFAULT NULL,
      s7b_tweet_twitter_url VARCHAR(300) DEFAULT NULL,
      s7b_tweet_error_message TEXT DEFAULT NULL,
      s7b_article_title VARCHAR(500) DEFAULT NULL,
      s7b_article_url VARCHAR(500) DEFAULT NULL,
      s7b_tweet_likes INT DEFAULT 0,
      s7b_tweet_retweets INT DEFAULT 0,
      s7b_tweet_replies INT DEFAULT 0,
      s7b_tweet_impressions INT DEFAULT 0,
      s7b_tweet_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      s7b_tweet_updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      s7b_tweet_deleted_at DATETIME DEFAULT NULL,
      PRIMARY KEY (s7b_tweet_id),
      KEY idx_tweet_article (s7b_article_id),
      KEY idx_tweet_status (s7b_tweet_status),
      KEY idx_tweet_scheduled (s7b_tweet_scheduled_time),
      KEY idx_tweet_deleted (s7b_tweet_deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.query(sql);
  await connection.end();

  return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Tweets table recreated with correct schema' }) };
};
