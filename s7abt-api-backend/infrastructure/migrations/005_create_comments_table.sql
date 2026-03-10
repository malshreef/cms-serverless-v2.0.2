-- Migration: 005_create_comments_table
-- Date: 2026-03-09
-- Description: Create comments table for article comments with moderation support

CREATE TABLE IF NOT EXISTS s7b_comment (
    s7b_comment_id INT(11) NOT NULL AUTO_INCREMENT,
    s7b_article_id INT(11) NOT NULL,
    s7b_comment_user_name VARCHAR(100) NOT NULL,
    s7b_comment_user_email VARCHAR(255) NOT NULL,
    s7b_comment_body TEXT NOT NULL,
    s7b_comment_add_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_comment_active TINYINT(1) DEFAULT 0 COMMENT '0=pending, 1=approved',
    s7b_comment_deleted_at DATETIME DEFAULT NULL,

    PRIMARY KEY (s7b_comment_id),
    INDEX idx_comment_article (s7b_article_id),
    INDEX idx_comment_active (s7b_comment_active),
    INDEX idx_comment_date (s7b_comment_add_date),

    CONSTRAINT fk_comment_article FOREIGN KEY (s7b_article_id)
        REFERENCES s7b_article(s7b_article_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
