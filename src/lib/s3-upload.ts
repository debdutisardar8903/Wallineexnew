import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_CONFIG, getS3Url } from './aws-config';
import { logFileOperation } from './database';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

// Upload image to S3
export const uploadImageToS3 = async (
  file: File,
  folder: string = S3_CONFIG.FOLDERS.PRODUCT_IMAGES
): Promise<UploadResult> => {
  try {
    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.'
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size too large. Please upload images smaller than 5MB.'
      };
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}${fileName}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
      ACL: 'public-read', // Make the file publicly accessible
    });

    await s3Client.send(command);

    const url = getS3Url(key);

    // Log the image upload operation
    await logFileOperation('upload', key, url, undefined, file.type, formatFileSize(file.size));

    return {
      success: true,
      url,
      key
    };
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    return {
      success: false,
      error: 'Failed to upload image. Please try again.'
    };
  }
};

// Upload product file to S3
export const uploadProductFileToS3 = async (
  file: File,
  folder: string = S3_CONFIG.FOLDERS.PRODUCT_FILES
): Promise<UploadResult> => {
  try {
    // Validate file size (max 100MB for product files)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size too large. Please upload files smaller than 100MB.'
      };
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}${fileName}`;

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload to S3 (private by default for security)
    const command = new PutObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
      // Product files are private - users get signed URLs after purchase
      ACL: 'private',
    });

    await s3Client.send(command);

    const url = getS3Url(key);

    // Log the product file upload operation
    await logFileOperation('upload', key, url, undefined, file.type, formatFileSize(file.size));

    return {
      success: true,
      url,
      key
    };
  } catch (error) {
    console.error('Error uploading product file to S3:', error);
    return {
      success: false,
      error: 'Failed to upload product file. Please try again.'
    };
  }
};

// Delete file from S3
export const deleteFileFromS3 = async (key: string): Promise<boolean> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

// Get file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Validate file type for product files
export const isValidProductFile = (file: File): boolean => {
  const allowedTypes = [
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    // Video
    'video/mp4',
    'video/avi',
    'video/mov',
    // Code files
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'text/plain',
  ];

  return allowedTypes.includes(file.type);
};
