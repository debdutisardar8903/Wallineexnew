'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { addToCart, Product, listenToProductReviews, Review } from '@/lib/database';

interface ProductCardProduct extends Product {
  formattedPrice?: string;
  formattedOriginalPrice?: string;
}

interface ProductCardProps {
  product: ProductCardProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCartOptions, setShowCartOptions] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const router = useRouter();
  const { user } = useAuth();

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Calculate average rating from reviews (same logic as product detail page)
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
  };

  const averageRating = calculateAverageRating();
  const totalReviews = reviews.length;

  // Listen to reviews for this product
  useEffect(() => {
    const unsubscribe = listenToProductReviews(product.id, (productReviews) => {
      setReviews(productReviews);
    });

    return () => unsubscribe();
  }, [product.id]);

  const handleCardClick = () => {
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking add to cart
    
    if (!user) {
      // Redirect to auth page with current page as redirect
      router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(user.uid, product, 1);
      setAddedToCart(true);
      setShowCartOptions(true);
      
      // Hide success message and cart options after 5 seconds
      setTimeout(() => {
        setAddedToCart(false);
        setShowCartOptions(false);
      }, 5000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {!imageError ? (
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              NEW
            </span>
          )}
          {product.isBestseller && (
            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              BESTSELLER
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-md transition-all duration-200 hover:scale-110">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* Category Tag */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-black/70 text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
          {product.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => {
              const isFilled = i < Math.floor(averageRating);
              const isHalfFilled = i === Math.floor(averageRating) && averageRating % 1 >= 0.5;
              
              return (
                <div key={i} className="relative">
                  <svg
                    className={`w-4 h-4 ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {isHalfFilled && (
                    <svg
                      className="w-4 h-4 text-yellow-400 absolute top-0 left-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      style={{ clipPath: 'inset(0 50% 0 0)' }}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
          <span className="text-sm text-gray-500">
            {averageRating > 0 ? averageRating.toFixed(1) : 'No rating'} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              {product.formattedPrice || `₹${Math.round(product.price).toLocaleString()}`}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {product.formattedOriginalPrice || `₹${Math.round(product.originalPrice).toLocaleString()}`}
              </span>
            )}
          </div>
          
          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
              addedToCart 
                ? 'bg-green-600 text-white' 
                : isAddingToCart 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-gray-900 hover:bg-black text-white'
            }`}
          >
            {addedToCart ? (
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Added!</span>
              </span>
            ) : isAddingToCart ? (
              'Adding...'
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>

      {/* Cart Options Message */}
      {showCartOptions && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
          <div className="bg-white rounded-xl p-6 mx-4 text-center shadow-2xl">
            <div className="flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Added to Cart!</h3>
            </div>
            <p className="text-gray-600 mb-4">What would you like to do next?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/cart');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Go to Cart
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/cart');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCartOptions(false);
                setAddedToCart(false);
              }}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
