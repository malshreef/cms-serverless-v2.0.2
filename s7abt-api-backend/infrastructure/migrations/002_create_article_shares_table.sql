-- Migration: Create article shares tracking table
-- Date: 2025-01-02
-- Description: Track article shares by platform for analytics

CREATE TABLE IF NOT EXISTS s7b_article_shares (
    s7b_share_id INT AUTO_INCREMENT PRIMARY KEY,
    s7b_article_id INT NOT NULL,
    s7b_share_platform ENUM('twitter', 'linkedin', 'whatsapp', 'copy') NOT NULL,
    s7b_share_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    s7b_share_ip VARCHAR(45) NULL,
    s7b_share_user_agent VARCHAR(500) NULL,

    INDEX idx_article_id (s7b_article_id),
    INDEX idx_platform (s7b_share_platform),
    INDEX idx_share_date (s7b_share_date),

    FOREIGN KEY (s7b_article_id) REFERENCES s7b_article(s7b_article_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment for documentation
ALTER TABLE s7b_article_shares COMMENT = 'Tracks article shares by platform (twitter, linkedin, whatsapp, copy link)';
