/**
 * Lambda Function: Content Creation Trigger
 * 
 * This function is triggered by DynamoDB Streams when new content is created
 * It sends push notifications to all subscribed users
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

const SEND_NOTIFICATION_FUNCTION = process.env.SEND_NOTIFICATION_FUNCTION;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://admin.s7abt.com';

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const records = event.Records || [];
    const notifications = [];

    for (const record of records) {
      // Only process INSERT events
      if (record.eventName !== 'INSERT') {
        continue;
      }

      const newImage = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      const tableName = record.eventSourceARN.split('/')[1];

      let notification = null;

      // Determine notification based on table
      if (tableName.includes('articles')) {
        notification = createArticleNotification(newImage);
      } else if (tableName.includes('news')) {
        notification = createNewsNotification(newImage);
      } else if (tableName.includes('tags')) {
        notification = createTagNotification(newImage);
      } else if (tableName.includes('sections')) {
        notification = createSectionNotification(newImage);
      }

      if (notification) {
        notifications.push(notification);
      }
    }

    // Send all notifications
    const sendPromises = notifications.map(notification => 
      sendNotification(notification)
    );

    const results = await Promise.allSettled(sendPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Triggered ${successful} notifications, ${failed} failed`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: notifications.length,
        successful,
        failed
      })
    };

  } catch (error) {
    console.error('Error processing records:', error);
    throw error;
  }
};

/**
 * Create notification for new article
 */
function createArticleNotification(article) {
  const titleAr = article.title_ar || article.title || 'New Article';
  const titleEn = article.title_en || article.title || 'New Article';
  
  return {
    type: 'articles',
    title: 'مقال جديد | New Article',
    body: `${titleAr} | ${titleEn}`,
    url: `${FRONTEND_URL}/articles/${article.id}`,
    id: article.id,
    imageUrl: article.image_url || article.featured_image
  };
}

/**
 * Create notification for news
 */
function createNewsNotification(news) {
  const titleAr = news.title_ar || news.title || 'News Update';
  const titleEn = news.title_en || news.title || 'News Update';
  
  return {
    type: 'news',
    title: 'خبر جديد | News Update',
    body: `${titleAr} | ${titleEn}`,
    url: `${FRONTEND_URL}/news/${news.id}`,
    id: news.id,
    imageUrl: news.image_url || news.thumbnail
  };
}

/**
 * Create notification for new tag
 */
function createTagNotification(tag) {
  const nameAr = tag.name_ar || tag.name || 'New Tag';
  const nameEn = tag.name_en || tag.name || 'New Tag';
  
  return {
    type: 'tags',
    title: 'وسم جديد | New Tag',
    body: `${nameAr} | ${nameEn}`,
    url: `${FRONTEND_URL}/tags/${tag.id}`,
    id: tag.id
  };
}

/**
 * Create notification for new section
 */
function createSectionNotification(section) {
  const nameAr = section.name_ar || section.name || 'New Section';
  const nameEn = section.name_en || section.name || 'New Section';
  
  return {
    type: 'sections',
    title: 'قسم جديد | New Section',
    body: `${nameAr} | ${nameEn}`,
    url: `${FRONTEND_URL}/sections/${section.id}`,
    id: section.id
  };
}

/**
 * Send notification by invoking the send notification Lambda
 */
async function sendNotification(notification) {
  const invokeParams = {
    FunctionName: SEND_NOTIFICATION_FUNCTION,
    InvocationType: 'Event', // Async invocation
    Payload: JSON.stringify({
      body: JSON.stringify(notification)
    })
  };

  return lambda.invoke(invokeParams).promise();
}
