'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { database } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

function PaymentFailureForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [orderDetails, setOrderDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const orderId = searchParams.get('order_id');
  const errorMessage = searchParams.get('error');

  useEffect(() => {
    if (orderId) {
      getOrderDetails();
      updateOrderStatus();
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  const getOrderDetails = async () => {
    try {
      const ordersRef = ref(database, 'paymentOrders');
      const snapshot = await get(ordersRef);
      
      if (snapshot.exists()) {
        const orders = snapshot.val();
        
        // Find the order with matching orderId
        for (const [key, order] of Object.entries(orders)) {
          if (order.orderId === orderId) {
            setOrderDetails(order);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error getting order details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    try {
      // Find and update the order in Firebase following database rules
      const ordersRef = ref(database, 'paymentOrders');
      const snapshot = await get(ordersRef);
      
      if (snapshot.exists()) {
        const orders = snapshot.val();
        
        // Find and update the order with matching orderId
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
              orderStatus: 'failed', // Update to 'failed'
              paymentStatus: 'failed', // Update to 'failed'
              products: order.products,
              createdAt: order.createdAt,
              updatedAt: new Date().toISOString(),
              
              // Optional fields (preserve if they exist)
              ...(order.paymentSessionId && { paymentSessionId: order.paymentSessionId }),
              ...(order.completedAt && { completedAt: order.completedAt }),
              // Add failure reason as paymentData (since failureReason is not in rules)
              paymentData: {
                ...(order.paymentData || {}),
                failureReason: errorMessage || 'Payment failed',
                failedAt: new Date().toISOString()
              }
            };
            
            await set(orderRef, updatedOrder);
            console.log('Order status updated to failed:', updatedOrder);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleRetryPayment = () => {
    // Redirect back to checkout with the same items
    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <div className="font-sans min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50 pt-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Failure Header */}
          <div className="bg-red-600 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
            <p className="text-red-100">Unfortunately, your payment could not be processed.</p>
          </div>

          {/* Error Details */}
          <div className="p-8">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Error Details</h3>
                <p className="text-red-800">{decodeURIComponent(errorMessage)}</p>
              </div>
            )}

            {/* Order Information */}
            {orderId && (
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-medium text-gray-900">{orderId}</p>
                  </div>
                  {orderDetails && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-medium text-gray-900">₹{orderDetails.orderAmount?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Customer Name</p>
                        <p className="font-medium text-gray-900">{orderDetails.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Payment Failed
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Failed Items */}
            {orderDetails?.products && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Items in Failed Order</h3>
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

            {/* Common Reasons */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Common Reasons for Payment Failure</h3>
              <ul className="text-yellow-800 space-y-1">
                <li>• Insufficient funds in your account</li>
                <li>• Incorrect card details or expired card</li>
                <li>• Network connectivity issues</li>
                <li>• Bank declined the transaction</li>
                <li>• Daily transaction limit exceeded</li>
              </ul>
            </div>

            {/* What to do next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">What can you do?</h3>
              <ul className="text-blue-800 space-y-1">
                <li>• Check your card details and try again</li>
                <li>• Ensure you have sufficient balance</li>
                <li>• Try using a different payment method</li>
                <li>• Contact your bank if the issue persists</li>
                <li>• Reach out to our support team for assistance</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRetryPayment}
                className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Retry Payment
              </button>
              <Link
                href="/cart"
                className="flex-1 bg-gray-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors text-center"
              >
                Back to Cart
              </Link>
              <Link
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Support Contact */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-2">Need help? Contact our support team</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@wallinexx.com"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  support@wallinexx.com
                </a>
                <a
                  href="tel:+919876543210"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  +91 98765 43210
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="font-sans min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment status...</p>
        </div>
      </div>
    }>
      <PaymentFailureForm />
    </Suspense>
  );
}
