import { database } from './firebase';
import { ref, set, get, push, remove, update, onValue, off, query, orderByChild, equalTo } from 'firebase/database';

// Database interfaces
export interface UserProfile {
  uid: string;
  fullName?: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string; // Primary image (for backward compatibility)
  images?: string[]; // Multiple images array
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestseller?: boolean;
  features: string[];
  specifications: { [key: string]: string };
  downloadSize: string;
  fileFormat: string;
  compatibility: string[];
  // Product file information
  productFileUrl?: string;
  productFileName?: string;
  productFileSize?: string;
  // S3 keys for file management
  imageKey?: string;
  imageKeys?: string[]; // Multiple image keys array
  productFileKey?: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface Review {
  id: string;
  userId: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  downloadSize: string;
  fileFormat: string;
  description: string;
  addedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
  image?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentOrder {
  id: string;
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderAmount: number;
  orderStatus: 'CREATED' | 'PAID' | 'FAILED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  products: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }[];
  paymentSessionId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// User Profile Operations
export const saveUserProfile = async (userProfile: UserProfile): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userProfile.uid}`);
    await set(userRef, {
      ...userProfile,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Product Operations
export const saveProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  try {
    const productsRef = ref(database, 'products');
    const newProductRef = push(productsRef);
    const productId = newProductRef.key!;
    
    await set(newProductRef, {
      ...product,
      id: productId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return productId;
  } catch (error) {
    console.error('Error saving product:', error);
    throw error;
  }
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  try {
    const productRef = ref(database, `products/${productId}`);
    const snapshot = await get(productRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      return Object.values(productsData) as Product[];
    }
    return [];
  } catch (error) {
    console.error('Error getting all products:', error);
    throw error;
  }
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  try {
    const productRef = ref(database, `products/${productId}`);
    await update(productRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    // Get product data first to clean up S3 files
    const productRef = ref(database, `products/${productId}`);
    const productSnapshot = await get(productRef);
    const productData = productSnapshot.val() as Product;
    
    // Log file deletion for cleanup
    if (productData) {
      // Delete primary image
      if (productData.imageKey) {
        await logFileOperation('delete', productData.imageKey, productData.image, 'Product deleted');
      }
      
      // Delete multiple images
      if (productData.imageKeys && productData.images) {
        for (let i = 0; i < productData.imageKeys.length; i++) {
          const key = productData.imageKeys[i];
          const url = productData.images[i];
          if (key && url) {
            await logFileOperation('delete', key, url, 'Product deleted');
          }
        }
      }
      
      // Delete product file
      if (productData.productFileKey) {
        await logFileOperation('delete', productData.productFileKey, productData.productFileUrl || '', 'Product deleted');
      }
    }
    
    // Delete product
    await remove(productRef);
    
    // Also remove product reviews
    const productReviewsRef = ref(database, `productReviews/${productId}`);
    await remove(productReviewsRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// File Management Operations
export const logFileOperation = async (
  operation: 'upload' | 'delete',
  fileKey: string,
  fileUrl: string,
  reason?: string,
  fileType?: string,
  fileSize?: string
): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    
    if (operation === 'upload') {
      const uploadLogRef = ref(database, `fileManagement/uploadLogs/${Date.now()}`);
      await set(uploadLogRef, {
        fileKey,
        url: fileUrl,
        uploadedAt: timestamp,
        fileType: fileType || 'unknown',
        fileSize: fileSize || 'unknown'
      });
    } else if (operation === 'delete') {
      const deleteLogRef = ref(database, `fileManagement/deletedFiles/${fileKey}`);
      await set(deleteLogRef, {
        key: fileKey,
        url: fileUrl,
        deletedAt: timestamp,
        reason: reason || 'Manual deletion'
      });
    }
  } catch (error) {
    console.error('Error logging file operation:', error);
    // Don't throw error for logging failures
  }
};

// Purchase Operations
export const savePurchase = async (purchase: Omit<Purchase, 'id'>): Promise<string> => {
  try {
    const purchasesRef = ref(database, 'purchases');
    const newPurchaseRef = push(purchasesRef);
    const purchaseId = newPurchaseRef.key!;
    
    await set(newPurchaseRef, {
      ...purchase,
      id: purchaseId
    });
    
    // Also save to user's purchases
    const userPurchaseRef = ref(database, `userPurchases/${purchase.userId}/${purchaseId}`);
    await set(userPurchaseRef, {
      ...purchase,
      id: purchaseId
    });
    
    return purchaseId;
  } catch (error) {
    console.error('Error saving purchase:', error);
    throw error;
  }
};

export const getUserPurchases = async (userId: string): Promise<Purchase[]> => {
  try {
    const userPurchasesRef = ref(database, `userPurchases/${userId}`);
    const snapshot = await get(userPurchasesRef);
    
    if (snapshot.exists()) {
      const purchasesData = snapshot.val();
      return Object.values(purchasesData) as Purchase[];
    }
    return [];
  } catch (error) {
    console.error('Error getting user purchases:', error);
    throw error;
  }
};

// Review Operations
export const saveReview = async (review: Omit<Review, 'id' | 'createdAt' | 'helpful'>): Promise<string> => {
  try {
    const reviewsRef = ref(database, 'reviews');
    const newReviewRef = push(reviewsRef);
    const reviewId = newReviewRef.key!;

    // Filter out undefined values for Firebase
    const reviewData: any = {
      ...review,
      id: reviewId,
      createdAt: new Date().toISOString(),
      helpful: 0
    };

    // Remove undefined values as Firebase doesn't accept them
    Object.keys(reviewData).forEach(key => {
      if (reviewData[key] === undefined) {
        console.log(`Removing undefined field: ${key}`);
        delete reviewData[key];
      }
    });

    console.log('Saving review data:', reviewData);

    // Save to main reviews collection
    await set(newReviewRef, reviewData);

    // Also save to product-specific reviews for easier querying
    const productReviewRef = ref(database, `productReviews/${review.productId}/${reviewId}`);
    await set(productReviewRef, reviewData);

    // Update product rating and review count
    await updateProductRating(review.productId);

    return reviewId;
  } catch (error) {
    console.error('Error saving review:', error);
    throw error;
  }
};

// Update product rating based on all reviews
export const updateProductRating = async (productId: string): Promise<void> => {
  try {
    const productReviewsRef = ref(database, `productReviews/${productId}`);
    const snapshot = await get(productReviewsRef);
    
    if (snapshot.exists()) {
      const reviews = Object.values(snapshot.val()) as Review[];
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      // Update product with new rating and review count
      const productRef = ref(database, `products/${productId}`);
      await update(productRef, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        reviews: totalReviews,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
    // Don't throw error for rating update failures
  }
};

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  try {
    const productReviewsRef = ref(database, `productReviews/${productId}`);
    const snapshot = await get(productReviewsRef);
    
    if (snapshot.exists()) {
      const reviewsData = snapshot.val();
      return Object.values(reviewsData) as Review[];
    }
    return [];
  } catch (error) {
    console.error('Error getting product reviews:', error);
    throw error;
  }
};

export const updateReviewHelpful = async (reviewId: string, productId: string): Promise<void> => {
  try {
    const reviewRef = ref(database, `reviews/${reviewId}`);
    const productReviewRef = ref(database, `productReviews/${productId}/${reviewId}`);
    
    // Get current helpful count
    const snapshot = await get(reviewRef);
    if (snapshot.exists()) {
      const currentHelpful = snapshot.val().helpful || 0;
      const updates = { helpful: currentHelpful + 1 };
      
      await update(reviewRef, updates);
      await update(productReviewRef, updates);
    }
  } catch (error) {
    console.error('Error updating review helpful:', error);
    throw error;
  }
};


// Real-time listeners
export const listenToProducts = (callback: (products: Product[]) => void): (() => void) => {
  const productsRef = ref(database, 'products');
  
  const unsubscribe = onValue(productsRef, (snapshot) => {
    if (snapshot.exists()) {
      const productsData = snapshot.val();
      const products = Object.values(productsData) as Product[];
      callback(products);
    } else {
      callback([]);
    }
  });
  
  return () => off(productsRef, 'value', unsubscribe);
};

export const listenToProductReviews = (productId: string, callback: (reviews: Review[]) => void): (() => void) => {
  const productReviewsRef = ref(database, `productReviews/${productId}`);
  
  const unsubscribe = onValue(productReviewsRef, (snapshot) => {
    if (snapshot.exists()) {
      const reviewsData = snapshot.val();
      const reviews = Object.values(reviewsData) as Review[];
      callback(reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } else {
      callback([]);
    }
  });
  
  return () => off(productReviewsRef, 'value', unsubscribe);
};

// Cart Operations
export const addToCart = async (userId: string, product: Product, quantity: number = 1): Promise<string> => {
  try {
    const cartRef = ref(database, `carts/${userId}`);
    const cartSnapshot = await get(cartRef);
    
    let cartItems: { [key: string]: CartItem } = {};
    if (cartSnapshot.exists()) {
      cartItems = cartSnapshot.val();
    }
    
    // Check if product already exists in cart
    const existingItem = Object.values(cartItems).find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update quantity if item exists
      const updatedItem = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
        addedAt: new Date().toISOString()
      };
      
      const itemRef = ref(database, `carts/${userId}/${existingItem.id}`);
      await set(itemRef, updatedItem);
      return existingItem.id;
    } else {
      // Add new item to cart
      const cartItemsRef = ref(database, `carts/${userId}`);
      const newItemRef = push(cartItemsRef);
      const itemId = newItemRef.key!;
      
      const cartItem: CartItem = {
        id: itemId,
        userId,
        productId: product.id,
        title: product.title,
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        quantity,
        downloadSize: product.downloadSize,
        fileFormat: product.fileFormat,
        description: product.description,
        addedAt: new Date().toISOString()
      };
      
      await set(newItemRef, cartItem);
      return itemId;
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

export const getCartItems = async (userId: string): Promise<CartItem[]> => {
  try {
    const cartRef = ref(database, `carts/${userId}`);
    const snapshot = await get(cartRef);
    
    if (snapshot.exists()) {
      const cartData = snapshot.val();
      return Object.values(cartData) as CartItem[];
    }
    return [];
  } catch (error) {
    console.error('Error getting cart items:', error);
    throw error;
  }
};

export const listenToCart = (userId: string, callback: (items: CartItem[]) => void): (() => void) => {
  const cartRef = ref(database, `carts/${userId}`);
  
  const unsubscribe = onValue(cartRef, (snapshot) => {
    if (snapshot.exists()) {
      const cartData = snapshot.val();
      const items = Object.values(cartData) as CartItem[];
      callback(items);
    } else {
      callback([]);
    }
  });

  return () => off(cartRef, 'value', unsubscribe);
};

export const updateCartItemQuantity = async (userId: string, itemId: string, quantity: number): Promise<void> => {
  try {
    if (quantity <= 0) {
      await removeFromCart(userId, itemId);
      return;
    }
    
    const itemRef = ref(database, `carts/${userId}/${itemId}`);
    await update(itemRef, {
      quantity,
      addedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

export const removeFromCart = async (userId: string, itemId: string): Promise<void> => {
  try {
    const itemRef = ref(database, `carts/${userId}/${itemId}`);
    await remove(itemRef);
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

export const clearCart = async (userId: string): Promise<void> => {
  try {
    const cartRef = ref(database, `carts/${userId}`);
    await remove(cartRef);
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

export const listenToUserPurchases = (userId: string, callback: (purchases: Purchase[]) => void): (() => void) => {
  const userPurchasesRef = ref(database, `userPurchases/${userId}`);
  
  const unsubscribe = onValue(userPurchasesRef, (snapshot) => {
    if (snapshot.exists()) {
      const purchasesData = snapshot.val();
      const purchases = Object.values(purchasesData) as Purchase[];
      callback(purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()));
    } else {
      callback([]);
    }
  });
  
  return () => off(userPurchasesRef, 'value', unsubscribe);
};

// Banner Operations
export const saveBanner = async (banner: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const bannersRef = ref(database, 'banners');
    const newBannerRef = push(bannersRef);
    const bannerId = newBannerRef.key!;

    const bannerData: Banner = {
      ...banner,
      id: bannerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(newBannerRef, bannerData);
    return bannerId;
  } catch (error) {
    console.error('Error saving banner:', error);
    throw error;
  }
};

export const updateBanner = async (bannerId: string, updates: Partial<Banner>): Promise<void> => {
  try {
    const bannerRef = ref(database, `banners/${bannerId}`);
    await update(bannerRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    throw error;
  }
};

export const deleteBanner = async (bannerId: string): Promise<void> => {
  try {
    const bannerRef = ref(database, `banners/${bannerId}`);
    await remove(bannerRef);
  } catch (error) {
    console.error('Error deleting banner:', error);
    throw error;
  }
};

export const getBanner = async (bannerId: string): Promise<Banner | null> => {
  try {
    const bannerRef = ref(database, `banners/${bannerId}`);
    const snapshot = await get(bannerRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Banner;
    }
    return null;
  } catch (error) {
    console.error('Error getting banner:', error);
    throw error;
  }
};

export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const bannersRef = ref(database, 'banners');
    const snapshot = await get(bannersRef);
    
    if (snapshot.exists()) {
      const bannersData = snapshot.val();
      const banners = Object.values(bannersData) as Banner[];
      return banners.sort((a, b) => a.order - b.order);
    }
    return [];
  } catch (error) {
    console.error('Error getting banners:', error);
    throw error;
  }
};

export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const banners = await getAllBanners();
    return banners.filter(banner => banner.isActive);
  } catch (error) {
    console.error('Error getting active banners:', error);
    throw error;
  }
};

export const listenToBanners = (callback: (banners: Banner[]) => void): (() => void) => {
  const bannersRef = ref(database, 'banners');
  
  const unsubscribe = onValue(bannersRef, (snapshot) => {
    if (snapshot.exists()) {
      const bannersData = snapshot.val();
      const banners = Object.values(bannersData) as Banner[];
      callback(banners.sort((a, b) => a.order - b.order));
    } else {
      callback([]);
    }
  });
  
  return () => off(bannersRef, 'value', unsubscribe);
};

// Payment Order Operations
export const savePaymentOrder = async (paymentOrder: Omit<PaymentOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const ordersRef = ref(database, 'paymentOrders');
    const newOrderRef = push(ordersRef);
    const orderId = newOrderRef.key!;

    const orderData: PaymentOrder = {
      ...paymentOrder,
      id: orderId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await set(newOrderRef, orderData);
    return orderId;
  } catch (error) {
    console.error('Error saving payment order:', error);
    throw error;
  }
};

export const updatePaymentOrder = async (orderId: string, updates: Partial<PaymentOrder>): Promise<void> => {
  try {
    const orderRef = ref(database, `paymentOrders/${orderId}`);
    await update(orderRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating payment order:', error);
    throw error;
  }
};

export const getPaymentOrder = async (orderId: string): Promise<PaymentOrder | null> => {
  try {
    const orderRef = ref(database, `paymentOrders/${orderId}`);
    const snapshot = await get(orderRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as PaymentOrder;
    }
    return null;
  } catch (error) {
    console.error('Error getting payment order:', error);
    throw error;
  }
};

export const getPaymentOrderByOrderId = async (orderIdString: string): Promise<PaymentOrder | null> => {
  try {
    console.log('Searching for payment order with orderId:', orderIdString);
    
    // Try to query using orderEqualTo for better performance and permissions
    const ordersRef = ref(database, 'paymentOrders');
    const ordersQuery = query(ordersRef, orderByChild('orderId'), equalTo(orderIdString));
    
    try {
      const snapshot = await get(ordersQuery);
      
      if (snapshot.exists()) {
        const orders = snapshot.val();
        console.log('Found orders with query:', Object.keys(orders));
        const orderArray = Object.values(orders) as PaymentOrder[];
        const order = orderArray[0]; // Should be only one match
        console.log('Found matching order:', order ? 'Yes' : 'No');
        return order || null;
      }
    } catch (queryError) {
      console.log('Query failed, trying direct read approach:', queryError);
      
      // Fallback: try to read all orders (requires broader permissions)
      try {
        const snapshot = await get(ordersRef);
        
        if (snapshot.exists()) {
          const orders = snapshot.val();
          console.log('All payment orders:', Object.keys(orders));
          const orderArray = Object.values(orders) as PaymentOrder[];
          console.log('Order IDs in database:', orderArray.map(o => o.orderId));
          const order = orderArray.find(order => order.orderId === orderIdString);
          console.log('Found matching order:', order ? 'Yes' : 'No');
          return order || null;
        }
      } catch (readError) {
        console.error('Both query and direct read failed:', readError);
        throw readError;
      }
    }
    
    console.log('No payment orders found in database');
    return null;
  } catch (error) {
    console.error('Error getting payment order by orderId:', error);
    throw error;
  }
};

export const getUserPaymentOrders = async (userId: string): Promise<PaymentOrder[]> => {
  try {
    const ordersRef = ref(database, 'paymentOrders');
    const snapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const orders = snapshot.val();
      const orderArray = Object.values(orders) as PaymentOrder[];
      return orderArray
        .filter(order => order.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error('Error getting user payment orders:', error);
    throw error;
  }
};

// Complete payment and create purchases
export const completePayment = async (orderId: string, paymentData: any, userId?: string): Promise<void> => {
  try {
    console.log('Completing payment for order:', orderId);
    
    let order: PaymentOrder | null = null;
    
    // If we have userId, try to find the order in user's orders first
    if (userId) {
      try {
        const userOrdersRef = ref(database, `paymentOrders`);
        const userOrdersQuery = query(userOrdersRef, orderByChild('userId'), equalTo(userId));
        const userSnapshot = await get(userOrdersQuery);
        
        if (userSnapshot.exists()) {
          const userOrders = Object.values(userSnapshot.val()) as PaymentOrder[];
          order = userOrders.find(o => o.orderId === orderId) || null;
          console.log('Found order in user orders:', order ? 'Yes' : 'No');
        }
      } catch (userQueryError) {
        console.log('User-specific query failed, trying general approach:', userQueryError);
      }
    }
    
    // If not found by user, try general search
    if (!order) {
      order = await getPaymentOrderByOrderId(orderId);
    }
    
    if (!order) {
      console.error('Payment order not found in database for orderId:', orderId);
      // Try to get all orders for debugging
      try {
        const ordersRef = ref(database, 'paymentOrders');
        const snapshot = await get(ordersRef);
        if (snapshot.exists()) {
          const allOrders = Object.values(snapshot.val()) as PaymentOrder[];
          console.log('All available order IDs:', allOrders.map(o => o.orderId));
        }
      } catch (debugError) {
        console.error('Error getting debug info:', debugError);
      }
      throw new Error(`Payment order not found for orderId: ${orderId}`);
    }

    console.log('Found order:', order);

    // Update payment order status
    const orderRef = ref(database, `paymentOrders/${order.id}`);
    const updateData = {
      orderStatus: 'PAID',
      paymentStatus: 'SUCCESS',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentData: paymentData // Store payment response data
    };
    
    console.log('Updating order with:', updateData);
    await update(orderRef, updateData);

    // Create purchase records for each product
    console.log('Creating purchase records for products:', order.products);
    const purchasesRef = ref(database, `userPurchases/${order.userId}`);
    
    for (const product of order.products) {
      const purchaseId = push(purchasesRef).key!;
      const purchaseData: Purchase = {
        id: purchaseId,
        userId: order.userId,
        productId: product.productId,
        productTitle: product.title,
        productCategory: '', // Will be filled from product data
        price: product.price,
        downloadUrl: '', // Will be filled from product data
        purchaseDate: new Date().toISOString(),
        status: 'completed',
        orderNumber: orderId
      };

      // Get product details to fill missing data
      try {
        const productRef = ref(database, `products/${product.productId}`);
        const productSnapshot = await get(productRef);
        
        if (productSnapshot.exists()) {
          const productData = productSnapshot.val() as Product;
          purchaseData.productCategory = productData.category;
          purchaseData.downloadUrl = productData.productFileUrl || '';
        }
      } catch (error) {
        console.error('Error fetching product details for purchase:', error);
        // Continue with default values
      }

      console.log('Creating purchase record:', purchaseData);
      await set(ref(database, `userPurchases/${order.userId}/${purchaseId}`), purchaseData);
    }

    // Clear user's cart after successful payment
    console.log('Clearing user cart');
    const cartRef = ref(database, `carts/${order.userId}`);
    await remove(cartRef);
    
    console.log('Payment completion successful');

  } catch (error) {
    console.error('Error completing payment:', error);
    throw error;
  }
};
