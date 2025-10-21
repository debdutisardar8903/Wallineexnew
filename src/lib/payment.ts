'use client';

export interface PaymentOrder {
  orderId: string;
  orderAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productId: string;
}

export interface PaymentResponse {
  success: boolean;
  order_token?: string;
  payment_session_id?: string;
  order_id?: string;
  order_status?: string;
  error?: string;
}

export interface PaymentVerification {
  success: boolean;
  order_status?: string;
  payment_status?: string;
  order_data?: any;
  error?: string;
}

// Generate order ID in the format: OD12345678901100
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `OD${timestamp.slice(-10)}${random}`;
};

// Get backend URL from environment
const getBackendUrl = (): string => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://wallineex-backend.onrender.com';
};

// Get frontend URL from environment
const getFrontendUrl = (): string => {
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://pixel-mart-store.netlify.app';
};

// Create payment order
export const createPaymentOrder = async (orderData: PaymentOrder): Promise<PaymentResponse> => {
  try {
    console.log('Creating payment order:', orderData);
    
    const response = await fetch(`${getBackendUrl()}/api/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderData.orderId,
        orderAmount: orderData.orderAmount,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        wallpaperName: orderData.productName, // Using wallpaperName for compatibility
        wallpaperId: orderData.productId,
        returnUrl: `${getFrontendUrl()}/payment-success?order_id=${orderData.orderId}`,
        notifyUrl: `${getBackendUrl()}/api/payment-webhook`
      }),
    });

    const result = await response.json();
    console.log('Payment order response:', result);

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create payment order');
    }

    return result;
  } catch (error) {
    console.error('Error creating payment order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment order'
    };
  }
};

// Verify payment status
export const verifyPayment = async (orderId: string): Promise<PaymentVerification> => {
  try {
    console.log('Verifying payment for order:', orderId);
    
    const response = await fetch(`${getBackendUrl()}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId }),
    });

    const result = await response.json();
    console.log('Payment verification response:', result);

    if (!response.ok) {
      throw new Error(result.error || 'Failed to verify payment');
    }

    // Enhanced status checking - check multiple possible locations for status
    const orderStatus = result.order_status || result.order_data?.order_status;
    const paymentStatus = result.payment_status || result.order_data?.payment_status;
    const isPaid = orderStatus === 'PAID' || paymentStatus === 'SUCCESS';
    
    const enhancedResult = {
      ...result,
      order_status: orderStatus,
      payment_status: isPaid ? 'SUCCESS' : (paymentStatus || 'PENDING'),
      // Ensure order_data is available
      order_data: result.order_data || {
        order_status: orderStatus,
        order_amount: result.order_amount,
        order_id: result.order_id
      }
    };

    console.log('Enhanced verification result:', enhancedResult);
    return enhancedResult;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify payment'
    };
  }
};

// Initialize Cashfree checkout
export const initiateCashfreePayment = (paymentSessionId: string, orderId: string): void => {
  try {
    // Check if Cashfree SDK is loaded
    if (typeof window !== 'undefined' && (window as any).Cashfree) {
      const cashfree = (window as any).Cashfree({
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      });

      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        redirectTarget: '_self'
      };

      console.log('Initiating Cashfree payment with options:', checkoutOptions);
      
      cashfree.checkout(checkoutOptions).then((result: any) => {
        console.log('Cashfree checkout result:', result);
        if (result.error) {
          console.error('Payment failed:', result.error);
          // Redirect to failure page
          window.location.href = `/payment-failure?order_id=${orderId}&error=${encodeURIComponent(result.error.message)}`;
        }
        if (result.redirect) {
          console.log('Payment completed, redirecting...');
          // Payment completed, will redirect automatically
        }
      }).catch((error: any) => {
        console.error('Cashfree checkout error:', error);
        window.location.href = `/payment-failure?order_id=${orderId}&error=${encodeURIComponent(error.message)}`;
      });
    } else {
      console.error('Cashfree SDK not loaded');
      alert('Payment system not available. Please try again later.');
    }
  } catch (error) {
    console.error('Error initiating payment:', error);
    alert('Failed to initiate payment. Please try again.');
  }
};

// Load Cashfree SDK
export const loadCashfreeSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'));
      return;
    }

    // Check if already loaded
    if ((window as any).Cashfree) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = process.env.NODE_ENV === 'production' 
      ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
      : 'https://sdk.cashfree.com/js/v3/cashfree.js'; // Same URL for both environments
    
    script.onload = () => {
      console.log('Cashfree SDK loaded successfully');
      resolve();
    };
    
    script.onerror = () => {
      console.error('Failed to load Cashfree SDK');
      reject(new Error('Failed to load Cashfree SDK'));
    };

    document.head.appendChild(script);
  });
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Validate phone number (Indian format)
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Validate email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
