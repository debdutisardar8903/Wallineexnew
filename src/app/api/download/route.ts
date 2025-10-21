import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_CONFIG, getS3KeyFromUrl } from '@/lib/aws-config';
import { getUserPurchasesAdmin } from '@/lib/database-admin';
import { auth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the user's authentication token with Firebase Admin
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Check if user has purchased this product
    console.log('Checking purchases for user:', userId, 'product:', productId);
    const userPurchases = await getUserPurchasesAdmin(userId);
    console.log('User purchases found:', userPurchases.length);
    
    const hasPurchased = userPurchases.some(
      purchase => purchase.productId === productId && purchase.status === 'completed'
    );

    if (!hasPurchased) {
      console.log('User has not purchased product or purchase not completed');
      return NextResponse.json(
        { error: 'You have not purchased this product or the purchase is not completed' },
        { status: 403 }
      );
    }

    // Find the purchase to get the download URL
    const purchase = userPurchases.find(
      p => p.productId === productId && p.status === 'completed'
    );

    if (!purchase || !purchase.downloadUrl) {
      console.log('Purchase found but no download URL:', purchase);
      return NextResponse.json(
        { error: 'Download URL not found for this product' },
        { status: 404 }
      );
    }

    console.log('Found purchase with download URL:', purchase.downloadUrl);

    // Extract S3 key from the download URL
    const s3Key = getS3KeyFromUrl(purchase.downloadUrl);
    console.log('Extracted S3 key:', s3Key);
    console.log('Using bucket:', S3_CONFIG.BUCKET_NAME);

    // Generate a signed URL for secure download (valid for 1 hour)
    try {
      const command = new GetObjectCommand({
        Bucket: S3_CONFIG.BUCKET_NAME,
        Key: s3Key,
      });

      console.log('Generating signed URL for bucket:', S3_CONFIG.BUCKET_NAME, 'key:', s3Key);
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      console.log('Successfully generated signed URL');

      return NextResponse.json({
        success: true,
        downloadUrl: signedUrl,
        expiresIn: 3600, // 1 hour
      });
    } catch (s3Error) {
      console.error('S3 signed URL generation error:', s3Error);
      return NextResponse.json(
        { error: `Failed to generate signed URL: ${s3Error instanceof Error ? s3Error.message : 'Unknown S3 error'}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: `Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
