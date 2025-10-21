'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { verifyPayment } from '@/lib/payment';
import { database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

function PaymentSuccessForm() {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);
  
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (!orderId) {
      setError('No order ID found');
      setIsVerifying(false);
      return;
    }

    verifyPaymentStatus();
  }, [orderId]);

  const verifyPaymentStatus = async () => {
    try {
      console.log('Verifying payment for order:', orderId);
      
      // Verify payment with Cashfree
      const verification = await verifyPayment(orderId);
      
      if (!verification.success) {
        throw new Error(verification.error || 'Payment verification failed');
      }

      console.log('Payment verification result:', verification);
      
      // Check if payment is successful
      const isPaymentSuccess = verification.payment_status === 'SUCCESS' || 
                              verification.order_status === 'PAID';
      
      if (isPaymentSuccess) {
        setPaymentVerified(true);
        
        // Update order status in Firebase
        await updateOrderStatus(orderId, 'completed', 'paid');
        
        // Get order details from Firebase
        const orderData = await getOrderDetails(orderId);
        setOrderDetails(orderData);
        
        // Clear cart after successful payment
        if (clearCart) {
          clearCart();
        }
      } else {
        throw new Error('Payment not completed successfully');
      }
      
    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error.message);
      setPaymentVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const updateOrderStatus = async (orderId, orderStatus, paymentStatus) => {
    try {
      // Find and update the order in Firebase following database rules
      const ordersRef = ref(database, 'paymentOrders');
      const snapshot = await get(ordersRef);
      
      if (snapshot.exists()) {
        const orders = snapshot.val();
        
        // Find the order with matching orderId
        for (const [key, order] of Object.entries(orders)) {
          if (order.orderId === orderId) {
            const orderRef = ref(database, `paymentOrders/${key}`);
            
            // Update following database rules - ensure all required fields are present
            const updatedOrder = {
              // Required fields (from database rules)
              id: order.id,
              orderId: order.orderId,
              userId: order.userId,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              customerPhone: order.customerPhone,
              orderAmount: order.orderAmount,
              orderStatus: orderStatus, // Update to 'completed'
              paymentStatus: paymentStatus, // Update to 'paid'
              products: order.products,
              createdAt: order.createdAt,
              updatedAt: new Date().toISOString(),
              
              // Optional fields (preserve if they exist)
              ...(order.paymentSessionId && { paymentSessionId: order.paymentSessionId }),
              ...(orderStatus === 'completed' && { completedAt: new Date().toISOString() }),
              ...(order.paymentData && { paymentData: order.paymentData })
            };
            
            await set(orderRef, updatedOrder);
            console.log('Order status updated successfully:', updatedOrder);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  const getOrderDetails = async (orderId) => {
    try {
      const ordersRef = ref(database, 'paymentOrders');
      const snapshot = await get(ordersRef);
      
      if (snapshot.exists()) {
        const orders = snapshot.val();
        
        // Find the order with matching orderId
        for (const [key, order] of Object.entries(orders)) {
          if (order.orderId === orderId) {
            return order;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting order details:', error);
      return null;
    }
  };

  if (isVerifying) {
    return (
      <div className="font-sans min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentVerified) {
    return (
      <div className="font-sans min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error || 'Unable to verify your payment. Please contact support.'}</p>
          <div className="space-y-3">
            <Link
              href="/orders"
              className="block w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Check Orders
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50 pt-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-600 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100">Thank you for your purchase. Your order has been confirmed.</p>
          </div>

          {/* Order Details */}
          <div className="p-8">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium text-gray-900">{orderId}</p>
                </div>
                {orderDetails && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="font-medium text-gray-900">₹{orderDetails.orderAmount?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customer Name</p>
                      <p className="font-medium text-gray-900">{orderDetails.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{orderDetails.customerEmail}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Products */}
            {orderDetails?.products && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Purchased</h3>
                <div className="space-y-3">
                  {Object.values(orderDetails.products).map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{product.title}</p>
                        <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">₹{(product.price * product.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• You will receive an email confirmation shortly</li>
                <li>• Your digital products are now available in your account</li>
                <li>• You can download your purchases anytime from the Orders page</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/orders"
                className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                View My Orders
              </Link>
              <Link
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="font-sans min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment status...</p>
        </div>
      </div>
    }>
      <PaymentSuccessForm />
    </Suspense>
  );
}
