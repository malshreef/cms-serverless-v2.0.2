-- ============================================
-- S7abt CMS - Tweets Table Migration
-- ============================================
-- Run this SQL on your RDS MySQL database to create the tweets table
-- Required for the tweet automation feature
-- ============================================

CREATE TABLE IF NOT EXISTS `s7b_tweets` (
  `s7b_tweet_id` VARCHAR(36) NOT NULL,
  `s7b_article_id` INT UNSIGNED NULL,
  `s7b_article_title` VARCHAR(500) NULL,
  `s7b_article_url` VARCHAR(1000) NULL,
  `s7b_tweet_text` TEXT NOT NULL,
  `s7b_tweet_tone` ENUM('professional', 'friendly', 'engaging', 'informative', 'casual') DEFAULT 'professional',
  `s7b_tweet_hashtags` JSON NULL,
  `s7b_tweet_sequence` TINYINT UNSIGNED DEFAULT 1,
  `s7b_tweet_total_in_batch` TINYINT UNSIGNED DEFAULT 1,
  `s7b_tweet_status` ENUM('pending', 'scheduled', 'posted', 'failed') DEFAULT 'pending',
  `s7b_tweet_scheduled_time` TIMESTAMP NULL,
  `s7b_tweet_posted_time` TIMESTAMP NULL,
  `s7b_tweet_twitter_id` VARCHAR(50) NULL,
  `s7b_tweet_twitter_url` VARCHAR(500) NULL,
  `s7b_tweet_error_message` TEXT NULL,
  `s7b_tweet_likes` INT UNSIGNED DEFAULT 0,
  `s7b_tweet_retweets` INT UNSIGNED DEFAULT 0,
  `s7b_tweet_replies` INT UNSIGNED DEFAULT 0,
  `s7b_tweet_impressions` INT UNSIGNED DEFAULT 0,
  `s7b_tweet_created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `s7b_tweet_updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `s7b_tweet_deleted_at` TIMESTAMP NULL,
  PRIMARY KEY (`s7b_tweet_id`),
  INDEX `idx_article_id` (`s7b_article_id`),
  INDEX `idx_status` (`s7b_tweet_status`),
  INDEX `idx_scheduled_time` (`s7b_tweet_scheduled_time`),
  INDEX `idx_deleted_at` (`s7b_tweet_deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key if articles table exists
-- ALTER TABLE `s7b_tweets`
--   ADD CONSTRAINT `fk_tweet_article`
--   FOREIGN KEY (`s7b_article_id`) REFERENCES `s7b_article`(`s7b_article_id`)
--   ON DELETE SET NULL;
