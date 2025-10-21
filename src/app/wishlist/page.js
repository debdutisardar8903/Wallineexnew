'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (item) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
      originalPrice: item.originalPrice
    };

    addToCart(cartItem);
    removeFromWishlist(item.id);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 4.5);
    const hasHalfStar = (rating || 4.5) % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-fill">
              <stop offset="50%" stopColor="currentColor"/>
              <stop offset="50%" stopColor="transparent"/>
            </linearGradient>
          </defs>
          <path fill="url(#half-fill)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
        </svg>
      );
    }

    return stars;
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="font-sans min-h-screen bg-white pt-24">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h1>
            <p className="text-gray-600 mb-8">Save items you love to buy them later.</p>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">{wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} in your wishlist</p>
          </div>
          <button
            onClick={clearWishlist}
            className="text-sm text-red-600 hover:text-red-700 font-medium px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            Clear All
          </button>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 group">
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Remove from Wishlist Button */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-500 hover:text-red-600 p-2 rounded-full shadow-sm transition-colors duration-200 opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Product Info */}
              <div className="p-4">
                {/* Product Name */}
                <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-2 tracking-[-.01em]">
                  {item.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex items-center">
                    {renderStars(4.5)}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">
                    (4.5)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                  {item.originalPrice && (
                    <span className="text-xs text-gray-500 line-through">
                      ₹{item.originalPrice}
                    </span>
                  )}
                  <span className="font-bold text-gray-900 text-sm">
                    ₹{item.price}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Move to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
