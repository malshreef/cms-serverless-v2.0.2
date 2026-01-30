const db = require("./shared/db");
const { success, error } = require("./shared/response");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

// --- Configuration ---
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "<your-s3-bucket>";
const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * Delete a news item (hard delete) and its S3 image
 */
exports.handler = async (event) => {
  console.log("Delete news request:", JSON.stringify(event, null, 2));

  try {
    const newsId = event.pathParameters?.id;

    if (!newsId) {
      return error("MISSING_ID", "News ID is required", 400);
    }

    // 1. Check if news exists and get the image filename
    const [existing] = await db.query(
      "SELECT s7b_news_id, s7b_news_image FROM s7b_news WHERE s7b_news_id = ?",
      [newsId]
    );

    if (!existing || existing.length === 0) {
      return error("NOT_FOUND", "News not found", 404);
    }

    const newsItem = existing[0];

    // 2. Delete the image from S3 if it exists
    if (newsItem.s7b_news_image) {
      const imageKey = newsItem.s7b_news_image;
      console.log(`Deleting news image from S3: ${S3_BUCKET_NAME}/${imageKey}`);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: imageKey,
      });

      try {
        await s3Client.send(deleteCommand);
        console.log("S3 object deleted successfully.");
      } catch (s3Error) {
        console.error("Failed to delete S3 object, but proceeding with DB delete:", s3Error);
      }
    }

    // 3. Delete the news item from the database
    await db.query("DELETE FROM s7b_news WHERE s7b_news_id = ?", [newsId]);

    return success({
      message: "News item and associated image permanently deleted successfully",
      id: newsId,
    });

  } catch (err) {
    console.error("Error deleting news:", err);
    return error("DATABASE_ERROR", "Failed to delete news", 500);
  }
};

