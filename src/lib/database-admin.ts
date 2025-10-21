import { getDatabase } from 'firebase-admin/database';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    console.log('Initializing Firebase Admin SDK...');
    console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('Private Key exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    console.log('Database URL:', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);

    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

const adminDatabase = getDatabase();

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  productTitle: string;
  productCategory: string;
  price: number;
  downloadUrl: string;
  purchaseDate: string;
  status: 'completed' | 'processing' | 'failed';
  orderNumber: string;
}

// Server-side function to get user purchases using Firebase Admin SDK
export const getUserPurchasesAdmin = async (userId: string): Promise<Purchase[]> => {
  try {
    console.log('Fetching purchases for user:', userId);
    const userPurchasesRef = adminDatabase.ref(`userPurchases/${userId}`);
    const snapshot = await userPurchasesRef.once('value');
    
    if (snapshot.exists()) {
      const purchasesData = snapshot.val();
      const purchases = Object.values(purchasesData) as Purchase[];
      console.log('Found purchases:', purchases.length);
      return purchases;
    }
    
    console.log('No purchases found for user');
    return [];
  } catch (error) {
    console.error('Error getting user purchases (admin):', error);
    throw error;
  }
};
