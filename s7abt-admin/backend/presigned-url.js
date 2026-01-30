const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { success, error } = require('../shared/response');
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'me-central-1' });
const BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || 's7abt-media';

/**
 * Generate presigned URL for uploading images to S3
 */
exports.handler = async (event) => {
  console.log('Presigned URL request:', JSON.stringify(event, null, 2));

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      fileName,
      fileType,
      folder = 'news' // news, articles, users, etc.
    } = body;

    // Validation
    if (!fileName || !fileType) {
      return error('MISSING_FIELDS', 'fileName and fileType are required', 400);
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return error('INVALID_FILE_TYPE', 'Only image files are allowed (JPEG, PNG, GIF, WebP)', 400);
    }

    // Generate unique file name
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;
    const s3Key = `${folder}/${uniqueFileName}`;

    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      // Add metadata
      Metadata: {
        'original-name': fileName,
        'uploaded-at': new Date().toISOString()
      }
    });

    // Generate presigned URL (valid for 5 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Construct the final public URL (after upload)
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'me-central-1'}.amazonaws.com/${s3Key}`;

    return success({
      uploadUrl: presignedUrl,
      fileKey: s3Key,
      publicUrl: publicUrl,
      expiresIn: 300
    });

  } catch (err) {
    console.error('Error generating presigned URL:', err);
    return error('PRESIGNED_URL_ERROR', 'Failed to generate upload URL', 500);
  }
};

