-- =============================================================================
-- MariaDB Full-Text Search Migration
-- Run this SQL on your RDS MariaDB instance to enable full-text search
-- =============================================================================

-- Step 1: Check if FULLTEXT index already exists (run this first to verify)
SHOW INDEX FROM articles WHERE Index_type = 'FULLTEXT';

-- Step 2: Add FULLTEXT index to articles table
-- This enables fast full-text searching on title, brief, and body
-- Note: This may take a few minutes depending on table size
ALTER TABLE articles
ADD FULLTEXT INDEX ft_article_search (
    s7b_article_title,
    s7b_article_brief,
    s7b_article_body
);

-- Step 3: (Optional) Add FULLTEXT index to tags for tag-based search
-- Check if tags table exists first
ALTER TABLE tags
ADD FULLTEXT INDEX ft_tags_search (s7b_tags_name);

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Verify the index was created
SHOW INDEX FROM articles WHERE Index_type = 'FULLTEXT';

-- Test the FULLTEXT search (replace 'سحابة' with any Arabic/English term)
SELECT
    s7b_article_id,
    s7b_article_title,
    MATCH(s7b_article_title, s7b_article_brief, s7b_article_body)
        AGAINST('سحابة' IN NATURAL LANGUAGE MODE) as relevance
FROM articles
WHERE MATCH(s7b_article_title, s7b_article_brief, s7b_article_body)
    AGAINST('سحابة' IN NATURAL LANGUAGE MODE)
ORDER BY relevance DESC
LIMIT 10;

-- =============================================================================
-- Rollback (if needed)
-- =============================================================================
-- DROP INDEX ft_article_search ON articles;
-- DROP INDEX ft_tags_search ON tags;
