const AWS = require('aws-sdk');
const response = require('../shared/response');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'me-central-1',
  signatureVersion: 'v4'
});

/**
 * Generate a presigned URL for uploading images to S3
 */
exports.handler = async (event) => {
  try {
    console.log('Get image upload URL event:', JSON.stringify(event));

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return response.validationError([
        { field: 'fileName', message: 'File name is required' },
        { field: 'fileType', message: 'File type is required' }
      ]);
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return response.validationError([{
        field: 'fileType',
        message: 'Only image files are allowed (JPEG, PNG, GIF, WebP)'
      }]);
    }

    // Generate unique file key
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `articles/${new Date().getFullYear()}/${uniqueFileName}`;

    const bucketName = process.env.MEDIA_BUCKET;

    if (!bucketName) {
      throw new Error('MEDIA_BUCKET environment variable is not set');
    }

    // Generate presigned URL for PUT operation
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: bucketName,
      Key: s3Key,
      ContentType: fileType,
      Expires: 300 // URL expires in 5 minutes
      // Note: ACL removed - bucket policy handles public access
    });

    // Generate the public URL for accessing the file after upload
    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'me-central-1'}.amazonaws.com/${s3Key}`;

    return response.success({
      uploadUrl: presignedUrl,
      publicUrl: publicUrl,
      s3Key: s3Key,
      expiresIn: 300
    });

  } catch (error) {
    console.error('Error generating upload URL:', error);
    return response.error('Failed to generate upload URL', 500, error.message);
  }
};

