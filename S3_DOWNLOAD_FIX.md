# S3 Download Access Denied Fix

## Problem
When users click download, they get an "Access Denied" error from S3 because:
1. Product files are being accessed directly from S3 URLs
2. Files should be private and accessed through signed URLs
3. No proper authentication/authorization for downloads

## Solution Implemented

### 1. **Secure Download API** (`/api/download`)
- Created `/src/app/api/download/route.ts`
- Verifies user has purchased the product
- Generates signed URLs for secure access
- Files expire after 1 hour for security

### 2. **Private File Upload**
- Updated `s3-upload.ts` to upload product files as private
- Only product images remain public for display
- Product files require authentication to access

### 3. **Updated Orders Page**
- Modified download handler to use secure API
- Passes authentication token and user ID
- Proper error handling for failed downloads

## Required Setup

### 1. Install AWS SDK Packages
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Update S3 Bucket Policy
Your bucket policy should allow private access to product files:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pixelmart-storage/pixelmart/products/images/*"
    }
  ]
}
```

**Note:** Only images are public, files are private.

### 3. Environment Variables
Ensure these are set in `.env.local`:

```env
# AWS Configuration
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key_id
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_access_key
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_S3_BUCKET_NAME=pixelmart-storage

# Firebase Admin SDK (for server-side authentication)
FIREBASE_CLIENT_EMAIL=your-service-account@pixelmart-ce8ff.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# Firebase Client Configuration (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pixelmart-ce8ff.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pixelmart-ce8ff
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pixelmart-ce8ff.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://pixelmart-ce8ff-default-rtdb.firebaseio.com
```

### 3.1 Firebase Service Account Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Project Settings → Service Accounts
3. Click "Generate new private key"
4. Download the JSON file
5. Extract `client_email` and `private_key` from the JSON
6. Add them to your `.env.local` file

### 4. IAM Policy Update
Your IAM user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::pixelmart-storage/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::pixelmart-storage"
    }
  ]
}
```

## How It Works Now

### Before (Insecure):
```
User clicks download → Direct S3 URL → Access Denied
```

### After (Secure):
```
User clicks download → 
  ↓
Verify authentication → 
  ↓
Check purchase history → 
  ↓
Generate signed URL → 
  ↓
Secure download (1 hour expiry)
```

## Security Features

1. **Authentication Required**: Users must be logged in
2. **Purchase Verification**: Only purchased products can be downloaded
3. **Signed URLs**: Temporary access (1 hour expiry)
4. **Private Files**: Product files are not publicly accessible
5. **Audit Trail**: All download attempts are logged

## Testing

1. **Login** to your account
2. **Purchase** a product (complete payment)
3. **Go to Orders** page (`/orders`)
4. **Click Download** on a completed order
5. **File should download** successfully

## Troubleshooting

### Error: "Failed to generate download URL"
This is the main error you're encountering. Check the browser console and server logs for specific details:

**Common Causes:**
1. **Missing Environment Variables**
   - Check `.env.local` has all required variables
   - Verify Firebase Admin SDK credentials are correct
   - Ensure AWS credentials are valid

2. **Firebase Admin SDK Issues**
   - Download service account key from Firebase Console
   - Extract `client_email` and `private_key` correctly
   - Ensure private key includes proper line breaks (`\n`)

3. **AWS Credentials/Permissions**
   - Verify AWS access key and secret are correct
   - Check IAM user has required S3 permissions
   - Ensure S3 bucket exists and is accessible

4. **Database Issues**
   - Check if user has completed purchases
   - Verify purchase records have valid `downloadUrl`
   - Ensure `productId` matches between purchase and request

**Debug Steps:**
1. Check browser console for detailed error messages
2. Check server logs (terminal where you run `npm run dev`)
3. Verify environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_S3_BUCKET_NAME)`
4. Test AWS credentials with AWS CLI: `aws s3 ls s3://your-bucket-name`

### Error: "Product ID is required"
- Check that the purchase has a valid productId

### Error: "You have not purchased this product"
- Ensure the purchase status is 'completed'
- Check that the user ID matches the purchase record

### Error: "Download URL not found"
- Verify the product has a downloadUrl in the database
- Check that the S3 file exists at the specified key

### Error: "Invalid authentication token"
- Check Firebase Admin SDK setup
- Verify service account credentials
- Ensure user is properly logged in

### Error: "Failed to generate signed URL"
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure the S3 key exists
- Check IAM user has `s3:GetObject` permission

## Future Enhancements

1. **Firebase Admin SDK**: Proper token verification
2. **Download Limits**: Restrict number of downloads per purchase
3. **Download Analytics**: Track download statistics
4. **File Streaming**: Stream large files instead of redirect
5. **Watermarking**: Add user info to downloaded files

## Files Modified

1. `src/app/api/download/route.ts` - New secure download API
2. `src/lib/s3-upload.ts` - Updated to upload private files
3. `src/app/orders/page.tsx` - Updated download handler
4. `src/lib/aws-config.ts` - Added S3 key extraction utility

## Database Schema

The `Purchase` interface includes:
- `downloadUrl`: S3 URL for the product file
- `status`: Must be 'completed' for downloads
- `productId`: Links to the purchased product
- `userId`: Identifies the purchaser
