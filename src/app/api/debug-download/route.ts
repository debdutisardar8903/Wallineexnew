import { NextRequest, NextResponse } from 'next/server';
import { S3_CONFIG } from '@/lib/aws-config';

export async function GET(request: NextRequest) {
  try {
    // Test Firebase Admin SDK initialization
    let firebaseAdminStatus = 'not_tested';
    try {
      const { getUserPurchasesAdmin } = await import('@/lib/database-admin');
      firebaseAdminStatus = 'initialized';
    } catch (error) {
      firebaseAdminStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return NextResponse.json({
      awsConfigured: {
        accessKeyId: !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        bucketName: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      },
      firebaseConfigured: {
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        adminSdkStatus: firebaseAdminStatus,
      },
      s3Config: S3_CONFIG,
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
