-- Migration: Add premium column to articles table
-- Date: 2025-10-09
-- Description: Add premium flag to support premium articles feature

-- Add premium column
ALTER TABLE s7b_article 
ADD COLUMN s7b_article_premium TINYINT(1) DEFAULT 0 AFTER s7b_article_image;

-- Add index for performance
CREATE INDEX idx_article_premium ON s7b_article(s7b_article_premium);

-- Add composite index for common queries
CREATE INDEX idx_article_premium_active ON s7b_article(s7b_article_premium, s7b_article_active);

-- Mark some articles as premium (example)
UPDATE s7b_article 
SET s7b_article_premium = 1 
WHERE s7b_article_id IN (1, 2, 3, 4, 77, 64);

-- Verify the changes
SELECT 
  s7b_article_id as id,
  s7b_article_title as title,
  s7b_article_premium as premium
FROM s7b_article 
WHERE s7b_article_premium = 1;

-- Show indexes
SHOW INDEXES FROM s7b_article WHERE Key_name LIKE '%premium%';

