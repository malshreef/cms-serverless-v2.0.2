-- =====================================================
-- S7ABT CMS Database Schema
-- Version: 2.0.2
-- Description: Complete database schema for S7abt CMS
-- =====================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS s7abt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE s7abt;

-- =====================================================
-- Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS s7b_user (
    s7b_user_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_user_username VARCHAR(100) NOT NULL,
    s7b_user_password VARCHAR(200) NOT NULL,
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
    UNIQUE KEY idx_username (s7b_user_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Sections Table
-- =====================================================
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

-- =====================================================
-- Tags Table
-- =====================================================
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

-- =====================================================
-- Articles Table
-- =====================================================
CREATE TABLE IF NOT EXISTS s7b_article (
    s7b_article_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_article_title VARCHAR(150) NOT NULL,
    s7b_article_slug VARCHAR(200) DEFAULT NULL,
    s7b_article_description VARCHAR(300) DEFAULT NULL,
    s7b_article_image VARCHAR(100) DEFAULT NULL,

    -- Multi-section content structure
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

    -- Metadata
    s7b_article_add_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_article_updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    s7b_article_deleted_at DATETIME DEFAULT NULL,
    s7b_article_active TINYINT(4) DEFAULT 1,
    s7b_article_premium TINYINT(1) DEFAULT 0,
    s7b_article_views INT(11) DEFAULT 0,

    -- Foreign Keys
    s7b_section_id INT(11) DEFAULT NULL,
    s7b_user_id INT(11) DEFAULT NULL,

    PRIMARY KEY (s7b_article_id),
    KEY idx_article_active (s7b_article_active),
    KEY idx_article_section (s7b_section_id),
    KEY idx_article_user (s7b_user_id),
    KEY idx_article_date (s7b_article_add_date),
    KEY idx_article_slug (s7b_article_slug),
    KEY idx_article_premium (s7b_article_premium),
    CONSTRAINT fk_article_section FOREIGN KEY (s7b_section_id) REFERENCES s7b_section(s7b_section_id) ON DELETE SET NULL,
    CONSTRAINT fk_article_user FOREIGN KEY (s7b_user_id) REFERENCES s7b_user(s7b_user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- News Table
-- =====================================================
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
    KEY idx_news_user (s7b_user_id),
    CONSTRAINT fk_news_user FOREIGN KEY (s7b_user_id) REFERENCES s7b_user(s7b_user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tags Item (Pivot Table for Articles/News to Tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS s7b_tags_item (
    s7b_tags_item_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_tags_id INT(11) NOT NULL,
    s7b_article_id INT(11) DEFAULT NULL,
    s7b_news_id INT(11) DEFAULT NULL,
    PRIMARY KEY (s7b_tags_item_id),
    KEY idx_tags_item_tag (s7b_tags_id),
    KEY idx_tags_item_article (s7b_article_id),
    KEY idx_tags_item_news (s7b_news_id),
    CONSTRAINT fk_tags_item_tag FOREIGN KEY (s7b_tags_id) REFERENCES s7b_tags(s7b_tags_id) ON DELETE CASCADE,
    CONSTRAINT fk_tags_item_article FOREIGN KEY (s7b_article_id) REFERENCES s7b_article(s7b_article_id) ON DELETE CASCADE,
    CONSTRAINT fk_tags_item_news FOREIGN KEY (s7b_news_id) REFERENCES s7b_news(s7b_news_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert Default Data
-- =====================================================

-- Default Admin User (password: admin123 - should be changed immediately)
-- Password hash is bcrypt hash of 'admin123'
INSERT INTO s7b_user (s7b_user_username, s7b_user_password, s7b_user_active, s7b_user_admin, s7b_user_name, s7b_user_brief)
SELECT 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, 1, 'Administrator', 'System Administrator'
WHERE NOT EXISTS (SELECT 1 FROM s7b_user WHERE s7b_user_username = 'admin');

-- Default Sections
INSERT INTO s7b_section (s7b_section_title, s7b_section_slug, s7b_section_order, s7b_section_active, s7b_section_description)
SELECT 'Cloud Computing', 'cloud-computing', 1, 1, 'Articles about cloud computing technologies'
WHERE NOT EXISTS (SELECT 1 FROM s7b_section WHERE s7b_section_slug = 'cloud-computing');

INSERT INTO s7b_section (s7b_section_title, s7b_section_slug, s7b_section_order, s7b_section_active, s7b_section_description)
SELECT 'AWS', 'aws', 2, 1, 'Amazon Web Services tutorials and guides'
WHERE NOT EXISTS (SELECT 1 FROM s7b_section WHERE s7b_section_slug = 'aws');

INSERT INTO s7b_section (s7b_section_title, s7b_section_slug, s7b_section_order, s7b_section_active, s7b_section_description)
SELECT 'Azure', 'azure', 3, 1, 'Microsoft Azure tutorials and guides'
WHERE NOT EXISTS (SELECT 1 FROM s7b_section WHERE s7b_section_slug = 'azure');

INSERT INTO s7b_section (s7b_section_title, s7b_section_slug, s7b_section_order, s7b_section_active, s7b_section_description)
SELECT 'Google Cloud', 'google-cloud', 4, 1, 'Google Cloud Platform tutorials and guides'
WHERE NOT EXISTS (SELECT 1 FROM s7b_section WHERE s7b_section_slug = 'google-cloud');

INSERT INTO s7b_section (s7b_section_title, s7b_section_slug, s7b_section_order, s7b_section_active, s7b_section_description)
SELECT 'رؤية 2030', 'vision-2030', 5, 1, 'مقالات حول رؤية المملكة العربية السعودية 2030'
WHERE NOT EXISTS (SELECT 1 FROM s7b_section WHERE s7b_section_slug = 'vision-2030');

-- Default Tags
INSERT INTO s7b_tags (s7b_tags_name, s7b_tags_slug)
SELECT 'Cloud', 'cloud'
WHERE NOT EXISTS (SELECT 1 FROM s7b_tags WHERE s7b_tags_slug = 'cloud');

INSERT INTO s7b_tags (s7b_tags_name, s7b_tags_slug)
SELECT 'AWS', 'aws'
WHERE NOT EXISTS (SELECT 1 FROM s7b_tags WHERE s7b_tags_slug = 'aws');

INSERT INTO s7b_tags (s7b_tags_name, s7b_tags_slug)
SELECT 'Azure', 'azure'
WHERE NOT EXISTS (SELECT 1 FROM s7b_tags WHERE s7b_tags_slug = 'azure');

INSERT INTO s7b_tags (s7b_tags_name, s7b_tags_slug)
SELECT 'Google Cloud', 'google-cloud'
WHERE NOT EXISTS (SELECT 1 FROM s7b_tags WHERE s7b_tags_slug = 'google-cloud');

INSERT INTO s7b_tags (s7b_tags_name, s7b_tags_slug)
SELECT 'Vision 2030', 'vision-2030'
WHERE NOT EXISTS (SELECT 1 FROM s7b_tags WHERE s7b_tags_slug = 'vision-2030');

INSERT INTO s7b_tags (s7b_tags_name, s7b_tags_slug)
SELECT 'رؤية 2030', 'رؤية-2030'
WHERE NOT EXISTS (SELECT 1 FROM s7b_tags WHERE s7b_tags_slug = 'رؤية-2030');

-- =====================================================
-- Verification
-- =====================================================
SELECT 'Database schema created successfully!' AS status;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 's7abt';
