/**
 * Lambda Function for Database Initialization
 * This can be used as a CloudFormation Custom Resource
 * to automatically initialize the database after RDS is created
 */

const mysql = require('mysql2/promise');
const {
  SecretsManagerClient,
  GetSecretValueCommand
} = require('@aws-sdk/client-secrets-manager');

const secretsClient = new SecretsManagerClient({});

// Database schema SQL
const SCHEMA_SQL = `
-- Users Table
CREATE TABLE IF NOT EXISTS s7b_user (
    s7b_user_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_user_username VARCHAR(100) NOT NULL,
    s7b_user_password VARCHAR(200) NOT NULL,
    s7b_user_email VARCHAR(200) DEFAULT NULL,
    s7b_user_cognito_id VARCHAR(100) DEFAULT NULL,
    s7b_user_role VARCHAR(50) DEFAULT 'viewer',
    s7b_user_active TINYINT(4) DEFAULT 1,
    s7b_user_admin TINYINT(4) DEFAULT 0,
    s7b_user_image VARCHAR(100) DEFAULT NULL,
    s7b_user_twitter VARCHAR(200) DEFAULT NULL,
    s7b_user_facebook VARCHAR(200) DEFAULT NULL,
    s7b_user_linkedin VARCHAR(200) DEFAULT NULL,
    s7b_user_name VARCHAR(100) DEFAULT NULL,
    s7b_user_brief VARCHAR(200) DEFAULT NULL,
    s7b_user_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_user_updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (s7b_user_id),
    UNIQUE KEY idx_username (s7b_user_username),
    KEY idx_cognito_id (s7b_user_cognito_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sections Table
CREATE TABLE IF NOT EXISTS s7b_section (
    s7b_section_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_section_title VARCHAR(150) NOT NULL,
    s7b_section_slug VARCHAR(150) DEFAULT NULL,
    s7b_section_order INT(11) DEFAULT 0,
    s7b_section_group VARCHAR(100) DEFAULT NULL,
    s7b_section_active TINYINT(4) DEFAULT 1,
    s7b_section_description VARCHAR(500) DEFAULT NULL,
    s7b_section_logo VARCHAR(100) DEFAULT NULL,
    s7b_section_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_section_updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    s7b_section_deleted_at DATETIME DEFAULT NULL,
    PRIMARY KEY (s7b_section_id),
    KEY idx_section_active (s7b_section_active),
    KEY idx_section_order (s7b_section_order),
    KEY idx_section_slug (s7b_section_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags Table
CREATE TABLE IF NOT EXISTS s7b_tags (
    s7b_tags_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_tags_name VARCHAR(100) NOT NULL,
    s7b_tags_slug VARCHAR(100) DEFAULT NULL,
    s7b_tags_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_tags_updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (s7b_tags_id),
    KEY idx_tags_name (s7b_tags_name),
    KEY idx_tags_slug (s7b_tags_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Articles Table
CREATE TABLE IF NOT EXISTS s7b_article (
    s7b_article_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_article_title VARCHAR(150) NOT NULL,
    s7b_article_slug VARCHAR(200) DEFAULT NULL,
    s7b_article_description VARCHAR(300) DEFAULT NULL,
    s7b_article_image VARCHAR(100) DEFAULT NULL,
    s7b_article_div1 VARCHAR(100) DEFAULT NULL,
    s7b_article_div1_body TEXT DEFAULT NULL,
    s7b_article_div2 VARCHAR(100) DEFAULT NULL,
    s7b_article_div2_body TEXT DEFAULT NULL,
    s7b_article_div3 VARCHAR(100) DEFAULT NULL,
    s7b_article_div3_body TEXT DEFAULT NULL,
    s7b_article_div4 VARCHAR(100) DEFAULT NULL,
    s7b_article_div4_body TEXT DEFAULT NULL,
    s7b_article_div5 VARCHAR(100) DEFAULT NULL,
    s7b_article_div5_body TEXT DEFAULT NULL,
    s7b_article_add_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_article_updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    s7b_article_deleted_at DATETIME DEFAULT NULL,
    s7b_article_active TINYINT(4) DEFAULT 1,
    s7b_article_premium TINYINT(1) DEFAULT 0,
    s7b_article_views INT(11) DEFAULT 0,
    s7b_section_id INT(11) DEFAULT NULL,
    s7b_user_id INT(11) DEFAULT NULL,
    PRIMARY KEY (s7b_article_id),
    KEY idx_article_active (s7b_article_active),
    KEY idx_article_section (s7b_section_id),
    KEY idx_article_user (s7b_user_id),
    KEY idx_article_date (s7b_article_add_date),
    KEY idx_article_slug (s7b_article_slug),
    KEY idx_article_premium (s7b_article_premium)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- News Table
CREATE TABLE IF NOT EXISTS s7b_news (
    s7b_news_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_news_title VARCHAR(100) NOT NULL,
    s7b_news_body VARCHAR(2000) DEFAULT NULL,
    s7b_news_brief VARCHAR(200) DEFAULT NULL,
    s7b_news_image VARCHAR(100) DEFAULT NULL,
    s7b_news_logo VARCHAR(100) DEFAULT NULL,
    s7b_news_add_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_news_updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    s7b_news_deleted_at DATETIME DEFAULT NULL,
    s7b_news_active TINYINT(4) DEFAULT 1,
    s7b_news_show_width TINYINT(4) DEFAULT 0,
    s7b_user_id INT(11) DEFAULT NULL,
    PRIMARY KEY (s7b_news_id),
    KEY idx_news_active (s7b_news_active),
    KEY idx_news_date (s7b_news_add_date),
    KEY idx_news_user (s7b_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags Item Pivot Table
CREATE TABLE IF NOT EXISTS s7b_tags_item (
    s7b_tags_item_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_tags_id INT(11) NOT NULL,
    s7b_article_id INT(11) DEFAULT NULL,
    s7b_news_id INT(11) DEFAULT NULL,
    PRIMARY KEY (s7b_tags_item_id),
    KEY idx_tags_item_tag (s7b_tags_id),
    KEY idx_tags_item_article (s7b_article_id),
    KEY idx_tags_item_news (s7b_news_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Article Shares Table (tracks social sharing statistics)
CREATE TABLE IF NOT EXISTS s7b_article_shares (
    s7b_share_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_article_id INT(11) NOT NULL,
    s7b_share_platform VARCHAR(50) NOT NULL,
    s7b_share_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (s7b_share_id),
    KEY idx_share_article (s7b_article_id),
    KEY idx_share_platform (s7b_share_platform)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments Table
CREATE TABLE IF NOT EXISTS s7b_comment (
    s7b_comment_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_article_id INT(11) NOT NULL,
    s7b_comment_user_name VARCHAR(100) DEFAULT NULL,
    s7b_comment_user_email VARCHAR(200) DEFAULT NULL,
    s7b_comment_body TEXT DEFAULT NULL,
    s7b_comment_active TINYINT(4) DEFAULT 1,
    s7b_comment_add_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (s7b_comment_id),
    KEY idx_comment_article (s7b_article_id),
    KEY idx_comment_active (s7b_comment_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tweets Table (AI-generated tweet queue for social media automation)
CREATE TABLE IF NOT EXISTS s7b_tweets (
    s7b_tweet_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_article_id INT(11) DEFAULT NULL,
    s7b_tweet_text VARCHAR(300) NOT NULL,
    s7b_tweet_tone VARCHAR(50) DEFAULT NULL,
    s7b_tweet_hashtags VARCHAR(300) DEFAULT NULL,
    s7b_tweet_status ENUM('pending', 'scheduled', 'posted', 'failed') DEFAULT 'pending',
    s7b_tweet_scheduled_at DATETIME DEFAULT NULL,
    s7b_tweet_posted_at DATETIME DEFAULT NULL,
    s7b_tweet_twitter_id VARCHAR(100) DEFAULT NULL,
    s7b_tweet_twitter_url VARCHAR(300) DEFAULT NULL,
    s7b_tweet_error TEXT DEFAULT NULL,
    s7b_tweet_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_tweet_updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (s7b_tweet_id),
    KEY idx_tweet_article (s7b_article_id),
    KEY idx_tweet_status (s7b_tweet_status),
    KEY idx_tweet_scheduled (s7b_tweet_scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const SEED_SQL = `
-- Default Admin User
INSERT IGNORE INTO s7b_user (s7b_user_username, s7b_user_password, s7b_user_active, s7b_user_admin, s7b_user_name, s7b_user_brief)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, 1, 'Administrator', 'System Administrator');

-- Default Sections
INSERT IGNORE INTO s7b_section (s7b_section_title, s7b_section_slug, s7b_section_order, s7b_section_active)
VALUES
  ('Cloud Computing', 'cloud-computing', 1, 1),
  ('AWS', 'aws', 2, 1),
  ('Azure', 'azure', 3, 1),
  ('Google Cloud', 'google-cloud', 4, 1),
  ('رؤية 2030', 'vision-2030', 5, 1);

-- Default Tags
INSERT IGNORE INTO s7b_tags (s7b_tags_name, s7b_tags_slug)
VALUES
  ('Cloud', 'cloud'),
  ('AWS', 'aws'),
  ('Azure', 'azure'),
  ('Google Cloud', 'google-cloud'),
  ('Vision 2030', 'vision-2030'),
  ('رؤية 2030', 'رؤية-2030');
`;

async function getDbCredentials() {
  const secretArn = process.env.DB_SECRET_ARN;

  if (!secretArn) {
    throw new Error('DB_SECRET_ARN environment variable not set');
  }

  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await secretsClient.send(command);

  return JSON.parse(response.SecretString);
}

async function initializeDatabase(credentials) {
  const connection = await mysql.createConnection({
    host: credentials.host,
    port: credentials.port || 3306,
    user: credentials.username,
    password: credentials.password,
    database: credentials.dbname || credentials.database,
    multipleStatements: true
  });

  try {
    console.log('Creating tables...');
    await connection.query(SCHEMA_SQL);

    console.log('Seeding initial data...');
    await connection.query(SEED_SQL);

    // Verify tables
    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    console.log('Tables created:', tables.map(t => t.TABLE_NAME));

    return {
      success: true,
      tables: tables.map(t => t.TABLE_NAME)
    };
  } finally {
    await connection.end();
  }
}

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CloudFormation Custom Resource
  const requestType = event.RequestType;

  if (requestType === 'Delete') {
    // Don't drop tables on stack deletion
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Delete request - no action taken' })
    };
  }

  try {
    const credentials = await getDbCredentials();
    const result = await initializeDatabase(credentials);

    console.log('Database initialized successfully:', result);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'Database initialized successfully',
        tables: result.tables
      })
    };
  } catch (error) {
    console.error('Error initializing database:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
