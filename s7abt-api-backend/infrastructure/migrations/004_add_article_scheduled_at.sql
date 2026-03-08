-- Migration 004: Add scheduled publishing support
-- Adds s7b_article_scheduled_at column for scheduling future article publication

ALTER TABLE s7b_article
  ADD COLUMN s7b_article_scheduled_at DATETIME DEFAULT NULL
  AFTER s7b_article_active;

-- Index for the scheduler Lambda to efficiently find due articles
CREATE INDEX idx_article_scheduled ON s7b_article (s7b_article_scheduled_at, s7b_article_active);
