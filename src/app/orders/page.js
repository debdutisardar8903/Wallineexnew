'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { database, auth } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';

export default function OrdersPage() {
  const { user } = useAuth() || { user: null };
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingItems, setDownloadingItems] = useState(new Set());

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    // Fetch orders from Firebase Realtime Database (paymentOrders)
    const loadOrders = async () => {
      setIsLoading(true);
      
      try {
        if (!user?.uid) {
          setOrders([]);
          return;
        }

        // Fetch payment orders for the current user using indexed query
        // Following database rules: indexed on userId for efficient querying
        const paymentOrdersRef = ref(database, 'paymentOrders');
        const userOrdersQuery = query(
          paymentOrdersRef,
          orderByChild('userId'),
          equalTo(user.uid)
        );
        
        const paymentOrdersSnapshot = await get(userOrdersQuery);
        
        if (paymentOrdersSnapshot.exists()) {
          const paymentOrdersData = paymentOrdersSnapshot.val();
          
          // Get products data to fetch images and details
          const productsRef = ref(database, 'products');
          const productsSnapshot = await get(productsRef);
          const productsData = productsSnapshot.exists() ? productsSnapshot.val() : {};
          
          // Transform orders (already filtered by userId from query)
          const userOrders = [];
          
          Object.entries(paymentOrdersData).forEach(([orderKey, order]) => {
            // Orders are already filtered by userId from the query
            // Map order status to display status
            const getDisplayStatus = (orderStatus, paymentStatus) => {
                if (paymentStatus === 'paid' && orderStatus === 'completed') {
                  return 'Delivered';
                } else if (paymentStatus === 'failed' || orderStatus === 'failed') {
                  return 'Failed';
                } else if (orderStatus === 'pending') {
                  return 'Processing';
                } else {
                  return 'Processing';
                }
              };

              // Transform products object to items array
              const items = [];
              if (order.products) {
                Object.values(order.products).forEach(product => {
                  // Get full product details from products database
                  const productData = productsData[product.productId];
                  
                  const item = {
                    id: product.productId,
                    name: product.title || productData?.title || 'Unknown Product',
                    price: product.price || productData?.price || 0,
                    quantity: product.quantity || 1,
                    image: productData?.image || '/api/placeholder/100/100',
                    downloadUrl: productData?.productFileUrl, // Use product file URL for downloads
                    category: productData?.category,
                    productId: product.productId,
                    // Only show download for completed/paid orders
                    canDownload: order.paymentStatus === 'paid' && order.orderStatus === 'completed'
                  };
                  
                  items.push(item);
                });
              }

              const transformedOrder = {
                id: orderKey,
                orderId: order.orderId,
                orderNumber: order.orderId, // Use orderId as order number
                date: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                status: getDisplayStatus(order.orderStatus, order.paymentStatus),
                total: order.orderAmount || 0,
                items: items,
                paymentStatus: order.paymentStatus,
                orderStatus: order.orderStatus,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                completedAt: order.completedAt,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt
              };
              
              userOrders.push(transformedOrder);
          });
          
          // Sort by creation date (newest first)
          userOrders.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
          
          setOrders(userOrders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
  }, [user, router]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = async (item) => {
    if (downloadingItems.has(item.id) || !item.downloadUrl) {
      if (!item.downloadUrl) {
        alert('Download URL not available for this product.');
      }
      return;
    }

    setDownloadingItems(prev => new Set([...prev, item.id]));

    try {
      // Get the user's authentication token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('Please log in to download files.');
        return;
      }

      const token = await currentUser.getIdToken();
      
      // Call the API endpoint to get a signed download URL
      const response = await fetch(`/api/download?productId=${encodeURIComponent(item.id)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const data = await response.json();
      
      if (data.success && data.downloadUrl) {
        // Open the signed URL for download
        window.open(data.downloadUrl, '_blank');
      } else {
        throw new Error('Failed to get download URL');
      }
      
      // Short delay to show downloading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  if (!user) {
    return (
      <div className="font-sans min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="font-sans min-h-screen bg-white pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-white pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600">
            View and track your order history and current purchases.
          </p>
        </div>

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-200">
                  <div className="mb-2 sm:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order {order.orderNumber}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on {formatDate(order.date)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          ₹{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                        {item.canDownload && item.downloadUrl && (
                          <button
                            onClick={() => handleDownload(item)}
                            disabled={downloadingItems.has(item.id)}
                            className={`flex items-center px-3 py-1 text-xs rounded-lg transition-colors duration-200 ${
                              downloadingItems.has(item.id)
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                          {downloadingItems.has(item.id) ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </>
                          )}
                          </button>
                        )}
                        {!item.canDownload && (
                          <span className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-600">
                            {order.status === 'Failed' ? 'Payment Failed' : 'Processing'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  <button className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    View Details
                  </button>
                  {order.status.toLowerCase() === 'delivered' && (
                    <button className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      Reorder
                    </button>
                  )}
                  {(order.status.toLowerCase() === 'shipped' || order.status.toLowerCase() === 'processing') && (
                    <button className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      Track Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Start Shopping
              </button>
            </div>
          </div>
        )}

        {/* Order Summary */}
        {orders.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Order Information</h3>
                <p className="text-sm text-blue-700">
                  You have {orders.length} order{orders.length !== 1 ? 's' : ''} in your history. 
                  Click "View Details" to see more information about each order or track your shipments.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
