# Production URLs Configuration

## Environment Variables

Add these to your `.env.local` file for production deployment:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=https://wallineex-backend.onrender.com

# Frontend URL (for payment redirects)
NEXT_PUBLIC_FRONTEND_URL=https://pixel-mart-store.netlify.app

# Firebase Configuration (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pixelmart-ce8ff.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pixelmart-ce8ff
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pixelmart-ce8ff.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://pixelmart-ce8ff-default-rtdb.firebaseio.com

# Firebase Admin SDK (for server-side)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@pixelmart-ce8ff.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# AWS S3 Configuration
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=your_access_key_id
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=your_secret_access_key
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_S3_BUCKET_NAME=pixelmart-storage
```

## Payment Flow URLs

### Backend API Endpoints:
- **Create Order**: `https://wallineex-backend.onrender.com/api/create-order`
- **Verify Payment**: `https://wallineex-backend.onrender.com/api/verify-payment`
- **Payment Webhook**: `https://wallineex-backend.onrender.com/api/payment-webhook`

### Frontend Redirect URLs:
- **Payment Success**: `https://pixel-mart-store.netlify.app/payment-success?order_id={orderId}`
- **Payment Failure**: `https://pixel-mart-store.netlify.app/payment-failure?order_id={orderId}`

## Deployment Notes

1. **Netlify Deployment**: Set environment variables in Netlify dashboard
2. **Backend Deployment**: Ensure backend is deployed and accessible at the specified URL
3. **CORS Configuration**: Backend should allow requests from `https://pixel-mart-store.netlify.app`
4. **SSL/HTTPS**: Both frontend and backend must use HTTPS for payment processing

## Testing

- **Development**: Uses localhost URLs as fallback
- **Production**: Uses the configured production URLs
- **Payment Gateway**: Automatically switches between sandbox/production based on NODE_ENV
