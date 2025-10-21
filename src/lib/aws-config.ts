import { S3Client } from '@aws-sdk/client-s3';

// AWS S3 Configuration
export const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

// S3 Bucket Configuration
export const S3_CONFIG = {
  BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'pixelmart-storage',
  REGION: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1',
  // Folder structure in S3
  FOLDERS: {
    PRODUCT_IMAGES: 'pixelmart/products/images/',
    PRODUCT_FILES: 'pixelmart/products/files/',
    THUMBNAILS: 'pixelmart/products/thumbnails/',
  }
};

// Generate S3 URL from key
export const getS3Url = (key: string): string => {
  return `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com/${key}`;
};

// Extract key from S3 URL
export const getS3KeyFromUrl = (url: string): string => {
  const urlParts = url.split('/');
  return urlParts.slice(3).join('/'); // Remove https://bucket.s3.region.amazonaws.com/
};
