'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { database } from '@/lib/firebase';
import { ref, get, set, push } from 'firebase/database';
import { 
  createPaymentOrder, 
  initiateCashfreePayment, 
  loadCashfreeSDK, 
  generateOrderId,
  validateEmail,
  validatePhoneNumber,
  formatCurrency
} from '@/lib/payment';

function CheckoutForm() {
  const { user, loading } = useAuth() || { user: null, loading: true };
  const { cartItems = [], cartCount = 0, refreshCart } = useCart() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  
  // Coupon functionality
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [showCoupons, setShowCoupons] = useState(false);

  // Redirect if not logged in or no items in cart (only after auth loading is complete)
  useEffect(() => {
    // Don't redirect while authentication is still loading
    if (loading) {
      return;
    }
    
    if (!user) {
      router.push('/auth?redirect=/checkout');
      return;
    }
    if (cartItems.length === 0) {
      router.push('/cart');
      return;
    }
  }, [user, cartItems, router, loading]);

  // Refresh cart data when component loads and monitor changes
  useEffect(() => {
    console.log('Checkout page loaded, cart data:', { cartItems, cartCount });
    if (refreshCart && user) {
      console.log('Refreshing cart data...');
      setIsCartLoading(true);
      refreshCart().finally(() => {
        setTimeout(() => setIsCartLoading(false), 500); // Small delay to ensure data is loaded
      });
    } else if (cartItems.length > 0) {
      setIsCartLoading(false);
    }
  }, [user, refreshCart]);

  // Monitor cart changes and recalculate discount
  useEffect(() => {
    console.log('Cart items changed:', cartItems, 'Applied coupon:', appliedCoupon);
    
    // Set cart loading to false when we have cart items
    if (cartItems.length > 0) {
      setIsCartLoading(false);
    }
    
    // Recalculate discount when cart items change
    if (appliedCoupon === 'DIWALI10' && cartItems.length > 0) {
      const currentSubtotal = Array.isArray(cartItems) ? cartItems.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return total + (price * quantity);
      }, 0) : 0;
      console.log('Recalculating discount for subtotal:', currentSubtotal);
      setDiscount(currentSubtotal * 0.10);
    } else if (!appliedCoupon) {
      setDiscount(0);
    }
  }, [cartItems, appliedCoupon]);

  // Fetch and pre-fill customer details from database
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (user?.uid) {
        try {
          // Fetch user data from database
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setCustomerDetails(prev => ({
              ...prev,
              name: userData.fullName || userData.displayName || '',
              email: userData.email || user.email || '',
              phone: userData.phone || ''
            }));
          } else {
            // If no user data exists, just pre-fill email
            setCustomerDetails(prev => ({
              ...prev,
              email: user.email || ''
            }));
          }
        } catch (error) {
          console.error('Error fetching customer details:', error);
          // Fallback to just email
          setCustomerDetails(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      }
    };

    fetchCustomerDetails();
  }, [user]);

  // Note: Removed automatic coupon loading - users must manually apply coupons

  // Coupon functions
  const handleApplyCoupon = (couponCode) => {
    if (couponCode === 'DIWALI10') {
      setAppliedCoupon(couponCode);
      const currentSubtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      setDiscount(currentSubtotal * 0.10); // 10% discount
      setShowCoupons(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
  };

  // Calculate totals with safety checks
  const subtotal = Array.isArray(cartItems) ? cartItems.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return total + (price * quantity);
  }, 0) : 0;
  
  const total = subtotal - discount;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number formatting
    if (name === 'phone') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      // Limit to 10 digits after +91
      const phoneDigits = digits.slice(0, 10);
      setCustomerDetails(prev => ({
        ...prev,
        [name]: phoneDigits
      }));
    } else {
      setCustomerDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!customerDetails.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!customerDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(customerDetails.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!customerDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(customerDetails.phone)) {
      newErrors.phone = 'Phone number must be a valid Indian number (10 digits starting with 6-9)';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayNow = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Save/update customer details in users database
      if (user?.uid) {
        const userRef = ref(database, `users/${user.uid}`);
        const userSnapshot = await get(userRef);
        
        const currentTime = new Date().toISOString();
        const userData = {
          uid: user.uid,
          email: customerDetails.email,
          displayName: customerDetails.name,
          fullName: customerDetails.name,
          phone: customerDetails.phone,
          updatedAt: currentTime
        };

        if (userSnapshot.exists()) {
          // Update existing user data
          const existingData = userSnapshot.val();
          await set(userRef, {
            ...existingData,
            ...userData
          });
        } else {
          // Create new user data
          await set(userRef, {
            ...userData,
            createdAt: currentTime
          });
        }
      }

      // Generate order ID using payment system
      const orderId = generateOrderId();
      
      // Create payment order in Firebase database
      const paymentOrdersRef = ref(database, 'paymentOrders');
      const newOrderRef = push(paymentOrdersRef);
      
      // Create order data following database rules validation
      const orderData = {
        // Required fields (from database rules)
        id: newOrderRef.key,
        orderId: orderId,
        userId: user.uid,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        orderAmount: total,
        orderStatus: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Products must follow the validation rules
        products: cartItems.reduce((acc, item, index) => {
          acc[index] = {
            productId: item.id.toString(), // Required: string
            title: item.title || item.name, // Required: string
            price: item.price, // Required: number
            quantity: item.quantity // Required: number
          };
          return acc;
        }, {})
      };

      await set(newOrderRef, orderData);
      
      // Prepare payment order data for Cashfree
      const paymentOrderData = {
        orderId: orderId,
        orderAmount: total,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        productName: cartItems.length === 1 
          ? (cartItems[0].title || cartItems[0].name)
          : `${cartItems.length} items from Wallinexx`,
        productId: cartItems.length === 1 
          ? cartItems[0].id.toString()
          : 'multiple_items'
      };

      console.log('Creating Cashfree payment order:', paymentOrderData);
      
      // Create payment order with Cashfree
      const paymentResponse = await createPaymentOrder(paymentOrderData);
      
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Failed to create payment order');
      }

      console.log('Payment order created successfully:', paymentResponse);
      
      // Load Cashfree SDK and initiate payment
      await loadCashfreeSDK();
      
      // Update order with payment session ID following database rules
      const updatedOrderData = {
        // Required fields (maintain all required fields)
        id: orderData.id,
        orderId: orderData.orderId,
        userId: orderData.userId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        orderAmount: orderData.orderAmount,
        orderStatus: orderData.orderStatus,
        paymentStatus: orderData.paymentStatus,
        products: orderData.products,
        createdAt: orderData.createdAt,
        updatedAt: new Date().toISOString(),
        // Optional field (allowed by rules)
        paymentSessionId: paymentResponse.payment_session_id
      };
      
      await set(newOrderRef, updatedOrderData);
      
      console.log('Initiating Cashfree payment...');
      
      // Initiate Cashfree payment
      initiateCashfreePayment(paymentResponse.payment_session_id, orderId);
      
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while authentication is loading or while redirecting
  if (loading || (!user && !loading) || (cartItems.length === 0 && !isCartLoading)) {
    return (
      <div className="font-sans min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Loading...' : 
             !user ? 'Redirecting to login...' : 
             isCartLoading ? 'Loading cart data...' :
             'Loading checkout...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-white pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Complete your order details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Details Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Details</h2>
            
            <form onSubmit={handlePayNow} className="space-y-6">
              {/* Customer Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={customerDetails.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customerDetails.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="flex">
                  <div className="flex items-center px-3 py-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                    <span className="text-gray-700 font-medium">+91</span>
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={customerDetails.phone}
                    onChange={handleInputChange}
                    maxLength="10"
                    className={`flex-1 px-4 py-3 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter 10-digit phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={agreeToTerms}
                    onChange={(e) => {
                      setAgreeToTerms(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({
                          ...prev,
                          terms: ''
                        }));
                      }
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                    I have read and agree to the website{' '}
                    <a 
                      href="/terms-of-service" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-bold text-red-600 hover:text-red-800 underline"
                    >
                      terms and conditions
                    </a>
                    {' '}*
                  </label>
                </div>
                {errors.terms && (
                  <p className="text-sm text-red-600 ml-7">{errors.terms}</p>
                )}
              </div>

              {/* Pay Now Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing Payment...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay Now {formatCurrency(total || 0)}
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {isCartLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading cart items...</p>
                  </div>
                </div>
              ) : cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name || item.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{item.name || item.title}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm text-gray-600">₹{parseFloat(item.price).toFixed(2)} each</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No items in cart</p>
                </div>
              )}
            </div>

            {/* Coupon Section */}
            <div className="mb-4">
              <button
                onClick={() => setShowCoupons(true)}
                className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">View Available Coupons</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              {isCartLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600">Calculating totals...</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal ({cartCount || 0} items)</span>
                    <span className="font-medium">₹{(subtotal || 0).toFixed(2)}</span>
                  </div>
                  {appliedCoupon && discount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">Discount ({appliedCoupon})</span>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <span className="font-medium text-green-600">-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>₹{(total || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* UPI Payment Section */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Pay with UPI QR Code
              </h3>
              
              {/* UPI App Icons Slideshow */}
              <div className="mb-3 overflow-hidden">
                <div className="flex animate-pulse space-x-3">
                  {/* GPay */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm border flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 2065.9 2064.8" xmlns="http://www.w3.org/2000/svg">
                      <circle fill="#FFFFFF" cx="1032.4" cy="1032.4" r="1032.4"/>
                      <path fill="#6E7BF2" d="M1032.4,2064.8c-191.9,0.3-380-53.1-543.1-154.2l691.6-1900c122.4,17.6,240.7,57.2,349,116.9
                        c499.8,274.2,682.8,901.6,408.6,1401.5C1757.1,1859.8,1409.7,2065.2,1032.4,2064.8z"/>
                      <path fill="#4285F4" d="M682.2,1027.9c0.3-17.4-1.5-34.8-5.3-51.7H439.3v93.9h139.5c-5.3,33.3-24,62.9-51.7,82.1l-0.5,3.1l75.1,58.2
                        l5.2,0.5C654.6,1169.9,682.2,1105,682.2,1027.9"/>
                      <path fill="#34A853" d="M439.3,1275.3c68.3,0,125.7-22.5,167.6-61.3l-79.8-61.9c-25.9,17.4-56.6,26.2-87.7,25.3
                        c-65.6-0.4-123.6-42.8-144-105.2l-3,0.3l-78.1,60.4l-1,2.8C256.1,1221.4,343.6,1275.4,439.3,1275.3"/>
                      <path fill="#FBBC05" d="M295.3,1072.3c-5.5-16.1-8.4-33-8.4-50.1c0.1-17,2.9-33.9,8.2-50.1l-0.1-3.3l-79.1-61.4l-2.6,1.2
                        c-36,71.5-36,155.7,0,227.2L295.3,1072.3"/>
                      <path fill="#EB4335" d="M439.3,867.1c36.3-0.6,71.3,12.9,97.8,37.7l71.4-69.7c-45.8-43-106.5-66.5-169.3-65.8
                        c-95.7,0-183.2,53.9-226.1,139.5l81.8,63.5C315.5,909.9,373.6,867.5,439.3,867.1"/>
                      <path fill="#FFFFFF" d="M1080.5,1050.4v183.9h-58.8V780h155.9c37.5-0.8,73.9,13.3,101,39.3c53.1,48.9,56.5,131.7,7.5,184.8
                        c-2.4,2.6-4.9,5.1-7.5,7.5c-27.2,25.8-63.5,39.7-101,38.7L1080.5,1050.4L1080.5,1050.4z M1080.5,835.9v158.6h98.5
                        c21.8,0.7,42.9-7.8,58.1-23.5c30.7-29.5,31.6-78.2,2.1-108.9c-0.2-0.2-0.4-0.4-0.6-0.6c-0.5-0.5-1-1.1-1.5-1.5
                        c-15.1-16-36.2-24.7-58.1-24.1L1080.5,835.9z M1456.1,913.3c43.5,0,77.8,11.5,102.9,34.6c25.1,23,37.7,54.6,37.7,94.8v191.6h-56.2
                        v-43.2h-2.5c-24.3,35.5-56.7,53.3-97.2,53.3c-31.6,1-62.5-9.8-86.5-30.5c-22.5-18.8-35.3-46.8-34.8-76.1c-1-30,12.7-58.7,36.7-76.7
                        c24.5-19,57.2-28.5,98.1-28.5c29.9-1.1,59.6,5.4,86.2,19v-13.4c0.1-20-8.8-39-24.3-51.6c-15.6-13.9-35.8-21.5-56.7-21.2
                        c-31.4-0.7-60.9,14.9-77.9,41.2l-51.7-32.4C1358.1,933.6,1400.2,913.3,1456.1,913.3L1456.1,913.3z M1380,1139.1
                        c-0.1,15.1,7.2,29.3,19.4,38.1c13,10.2,29.2,15.5,45.7,15.2c24.8,0,48.5-9.8,66.1-27.3c18.5-16.1,29.2-39.5,29.2-64.1
                        c-18.4-14.5-43.9-21.8-76.7-21.8c-21.2-0.8-42.2,5.2-59.7,17.1C1389.3,1105.7,1380.3,1121.7,1380,1139.1L1380.1,1139.1z M1919.4,923.5
                        l-196.2,447.8h-60.7l72.8-156.7l-129.1-291.2h63.9l93.3,223.3h1.3l90.7-223.3L1919.4,923.5z"/>
                    </svg>
                  </div>
                  
                  {/* Paytm */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm border flex items-center justify-center">
                    <svg width="24" height="12" viewBox=".00544977 -.01327162 16.9763107 5.29327162" xmlns="http://www.w3.org/2000/svg">
                      <path d="m16.777 1.561a1.121 1.121 0 0 0 -1.058-.75h-.01c-.318 0-.604.132-.808.344a1.118 1.118 0 0 0 -.809-.344h-.01c-.28 0-.535.102-.73.271v-.086a.165.165 0 0 0 -.165-.153h-.75a.166.166 0 0 0 -.166.166v4.073c0 .092.074.166.166.166h.75a.165.165 0 0 0 .163-.143v-2.924l.001-.03a.273.273 0 0 1 .259-.25h.138a.276.276 0 0 1 .26.28l.003 2.91c0 .092.074.166.166.166h.75c.088 0 .16-.07.164-.158v-2.922a.275.275 0 0 1 .26-.28h.138c.163.014.26.137.26.28l.003 2.906c0 .092.075.166.166.166h.75a.166.166 0 0 0 .166-.166v-3.125c0-.213-.024-.304-.057-.397m-5.077-.707h-.43v-.697a.151.151 0 0 0 -.18-.149c-.475.131-.38.79-1.248.846h-.084a.174.174 0 0 0 -.036.004h-.002a.166.166 0 0 0 -.13.162v.75c0 .09.075.165.167.165h.453l-.001 3.18c0 .091.073.165.164.165h.741c.09 0 .164-.074.164-.164v-3.18h.42a.166.166 0 0 0 .166-.166v-.75a.166.166 0 0 0 -.164-.166" fill="#54c1f0"/>
                      <path d="m9.001.854h-.75a.166.166 0 0 0 -.165.166v1.55a.176.176 0 0 1 -.176.173h-.314a.176.176 0 0 1 -.176-.175l-.003-1.548a.166.166 0 0 0 -.166-.166h-.75a.166.166 0 0 0 -.165.166v1.7c0 .645.46 1.105 1.106 1.105 0 0 .485 0 .5.003a.175.175 0 0 1 .002.347l-.013.002-1.097.004a.166.166 0 0 0 -.165.166v.75c0 .091.074.165.165.165h1.227c.646 0 1.106-.46 1.106-1.106v-3.136a.166.166 0 0 0 -.166-.166m-7.259 1.374v.463a.176.176 0 0 1 -.176.176h-.476v-.927h.476c.097 0 .176.078.176.175zm.066-1.374h-1.64a.163.163 0 0 0 -.162.162v4.076c0 .09.067.164.151.166h.764a.166.166 0 0 0 .166-.166l.003-1.14h.718c.6 0 1.018-.417 1.018-1.02v-1.057c0-.603-.418-1.021-1.018-1.021m3.046 3.135v.117a.173.173 0 0 1 -.01.052.175.175 0 0 1 -.167.113h-.312c-.098 0-.177-.074-.177-.165v-.142-.5c0-.09.08-.164.177-.164h.312c.098 0 .177.074.177.165zm-.12-3.131h-1.04c-.092 0-.167.07-.167.155v.704c0 .09.08.165.177.165h.99c.079.012.14.07.15.158v.097c-.01.085-.07.147-.145.154h-.491c-.653 0-1.118.434-1.118 1.043v.872c0 .605.4 1.036 1.048 1.036h1.36c.244 0 .442-.185.442-.413v-2.845c0-.69-.355-1.126-1.206-1.126" fill="#233266"/>
                    </svg>
                  </div>
                  
                  {/* PhonePe */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm border flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 283 284" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M141.082 283.082C219 283.082 282.165 219.918 282.165 142C282.165 64.0822 219 0.91748 141.082 0.91748C63.1647 0.91748 0 64.0822 0 142C0 219.918 63.1647 283.082 141.082 283.082Z" fill="#5F259F"/>
                      <path d="M205.115 105.181C205.115 99.6662 200.386 94.9365 194.87 94.9365H175.956L132.608 45.2838C128.668 40.5542 122.363 38.979 116.059 40.5542L101.084 45.2838C98.7194 46.0735 97.9298 49.2238 99.5091 50.7989L146.797 95.7262H75.0672C72.7024 95.7262 71.1272 97.3013 71.1272 99.6662V107.546C71.1272 113.061 75.8568 117.791 81.3719 117.791H92.4063V155.624C92.4063 183.997 107.381 200.551 132.604 200.551C140.484 200.551 146.793 199.761 154.673 196.611V221.834C154.673 228.929 160.188 234.444 167.282 234.444H178.317C180.682 234.444 183.046 232.079 183.046 229.714V117.005H201.175C203.54 117.005 205.115 115.43 205.115 113.065V105.181ZM154.673 172.963C149.943 175.328 143.638 176.117 138.909 176.117C126.299 176.117 119.994 169.813 119.994 155.624V117.791H154.673V172.963Z" fill="white"/>
                    </svg>
                  </div>
                  
                  {/* BHIM */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm border flex items-center justify-center">
                    <svg width="20" height="26" viewBox="0 0 39 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24.7629 0.909754C24.8578 0.582386 25.304 0.539198 25.4599 0.842289L38.2458 25.6971C38.3758 25.9499 38.3199 26.2584 38.1094 26.4494L10.9399 51.1055C10.6585 51.3608 10.219 51.0864 10.3247 50.7215L24.7629 0.909754Z" fill="#008C44"/>
                      <path d="M15.3425 0.909754C15.4374 0.582386 15.8836 0.539198 16.0395 0.842289L28.8254 25.6971C28.9554 25.9499 28.8995 26.2584 28.689 26.4494L1.51947 51.1055C1.23811 51.3608 0.79855 51.0864 0.904322 50.7215L15.3425 0.909754Z" fill="#F47920"/>
                    </svg>
                  </div>
                  
                  {/* Banking App */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm border flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* UPI Note */}
              <p className="text-xs text-gray-600 leading-relaxed">
                It uses UPI apps like BHIM, Paytm, Google Pay, PhonePe or any Banking UPI app to make payment.
              </p>
            </div>

            {/* Privacy Policy Note */}
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
              <p>
                Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{' '}
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  privacy policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Modal */}
      {showCoupons && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Available Coupons</h3>
              <button
                onClick={() => setShowCoupons(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* DIWALI10 Coupon */}
              <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 bg-gradient-to-r from-orange-50 to-yellow-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      DIWALI10
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                      10% OFF
                    </span>
                  </div>
                  <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h4 className="font-semibold text-gray-900 mb-2">10% Discount on all Items in DIWALI SALE</h4>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Expires on: 25/10/2025</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Individual use only</span>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyCoupon('DIWALI10')}
                  disabled={appliedCoupon === 'DIWALI10'}
                  className={`w-full mt-4 font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${
                    appliedCoupon === 'DIWALI10'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {appliedCoupon === 'DIWALI10' ? 'Applied' : 'Apply'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">More coupons coming soon!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="font-sans min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
