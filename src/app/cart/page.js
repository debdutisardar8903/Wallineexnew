'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartCount } = useCart();
  const { user } = useAuth() || { user: null };
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discount = appliedCoupon ? subtotal * 0.10 : 0; // 10% discount for DIWALI10
  const total = subtotal - discount;

  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(id, newQuantity);
  };

  const handleApplyCoupon = (couponCode) => {
    if (couponCode === 'DIWALI10') {
      setAppliedCoupon(couponCode);
      setShowCoupons(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handleCheckout = () => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login page with checkout redirect
      router.push('/auth?redirect=/checkout');
      return;
    }

    // Note: Coupons are now session-only and must be manually applied on checkout page

    // Redirect to checkout page
    console.log('Redirecting to checkout page...');
    router.push('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="font-sans min-h-screen bg-white pt-24">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-white pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Cart Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{item.name}</h3>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
                          {item.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">₹{item.originalPrice}</span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">Quantity:</span>
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-2 hover:bg-gray-100 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="px-4 py-2 text-center min-w-[3rem]">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="p-2 hover:bg-gray-100 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="flex flex-col items-end space-y-2">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between items-center">
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
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* View Available Coupons */}
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

              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 mb-3"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : user ? (
                  'Proceed to Checkout'
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Login to Checkout
                  </div>
                )}
              </button>

              <Link
                href="/"
                className="block w-full text-center bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Continue Shopping
              </Link>
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
              {/* DIWALI5 Coupon */}
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
