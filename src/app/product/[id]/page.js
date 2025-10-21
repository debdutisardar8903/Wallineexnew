'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { getProduct, saveReview, listenToProductReviews, addToCart, getUserProfile } from '@/lib/database';

// Products will be loaded from Firebase

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { addToCart: addToCartContext, refreshCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState(0);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showCartOptions, setShowCartOptions] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // Calculate rating breakdown from reviews
  const calculateRatingBreakdown = () => {
    if (reviews.length === 0) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      breakdown[review.rating]++;
    });
    
    return breakdown;
  };

  // Calculate average rating from reviews
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
  };

  const ratingBreakdown = calculateRatingBreakdown();
  const totalReviews = reviews.length;
  const averageRating = calculateAverageRating();

  useEffect(() => {
    const productId = params.id;
    
    // Load product
    getProduct(productId).then((foundProduct) => {
      console.log('Product loaded:', foundProduct);
      console.log('Product image URL:', foundProduct?.image);
      setProduct(foundProduct);
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error loading product:', error);
      setIsLoading(false);
    });

    // Listen to reviews
    const unsubscribe = listenToProductReviews(productId, (productReviews) => {
      setReviews(productReviews);
    });

    return () => unsubscribe();
  }, [params.id]);

  // Keyboard navigation for full screen modal
  const handleKeyDown = useCallback((e) => {
    if (!isFullScreenOpen || !product) return;

    // Create array of all available images for keyboard navigation
    const allImages = [product.image];
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        if (img && img !== product.image && !allImages.includes(img)) {
          allImages.push(img);
        }
      });
    }

    switch (e.key) {
      case 'Escape':
        setIsFullScreenOpen(false);
        break;
      case 'ArrowLeft':
        if (fullScreenImageIndex > 0) {
          setFullScreenImageIndex(prev => prev - 1);
        }
        break;
      case 'ArrowRight':
        if (fullScreenImageIndex < allImages.length - 1) {
          setFullScreenImageIndex(prev => prev + 1);
        }
        break;
    }
  }, [isFullScreenOpen, fullScreenImageIndex, product]);

  // Add keyboard event listeners
  useEffect(() => {
    if (isFullScreenOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullScreenOpen, handleKeyDown]);

  const handleSubmitReview = async () => {
    if (!user || !product || newReview.rating === 0 || !newReview.comment.trim()) {
      return;
    }

    setIsSubmittingReview(true);
    try {
      // Fetch user profile to get full name
      const userProfile = await getUserProfile(user.uid);
      const userName = userProfile?.fullName || userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'Anonymous';

      const reviewData = {
        userId: user.uid,
        productId: product.id,
        userName: userName,
        rating: newReview.rating,
        comment: newReview.comment.trim()
      };

      // Only include userAvatar if it exists
      if (user.photoURL) {
        reviewData.userAvatar = user.photoURL;
      }

      await saveReview(reviewData);

      setNewReview({ rating: 0, comment: '' });
      setReviewSubmitted(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setReviewSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Error submitting review:', error);
      // You could add a toast notification here for user feedback
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user || !product) {
      if (!user) {
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    setIsAddingToCart(true);
    try {
      // Create cart item matching ProductGrid format
      const cartItem = {
        id: product.id.toString(),
        name: product.title, // ProductGrid uses 'name', but product details has 'title'
        price: product.price,
        image: product.image,
        quantity: quantity,
        originalPrice: product.originalPrice
      };

      await addToCartContext(cartItem);
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

  // Wishlist functionality matching ProductGrid
  const handleWishlistClick = () => {
    if (!user || !product) {
      if (!user) {
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    const wishlistItem = {
      id: product.id.toString(),
      name: product.title,
      price: product.price,
      image: product.image,
      originalPrice: product.originalPrice
    };

    if (isInWishlist(product.id.toString())) {
      removeFromWishlist(product.id.toString());
    } else {
      addToWishlist(wishlistItem);
    }
  };

  const handleBuyNow = async () => {
    console.log('Buy Now clicked!', { user, product, quantity });
    
    if (!user || !product) {
      if (!user) {
        console.log('No user, redirecting to auth');
        router.push(`/auth?redirect=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    setIsBuyingNow(true);
    try {
      console.log('Adding to cart...');
      // Create cart item matching ProductGrid format
      const cartItem = {
        id: product.id.toString(),
        name: product.title,
        price: product.price,
        image: product.image,
        quantity: quantity,
        originalPrice: product.originalPrice
      };

      // Add product to cart using cart context
      await addToCartContext(cartItem);
      
      console.log('Product added to cart, refreshing...');
      // Refresh cart to ensure it's updated
      if (refreshCart) {
        await refreshCart();
      }
      
      console.log('Navigating to checkout...');
      // Navigate directly to checkout page
      router.push('/checkout');
    } catch (error) {
      console.error('Error adding to cart for buy now:', error);
      alert('Failed to process. Please try again.');
    } finally {
      setIsBuyingNow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-900 hover:bg-black text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white">
      
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <button onClick={() => router.push('/')} className="hover:text-gray-900">
                Home
              </button>
              <span>/</span>
              <span className="text-gray-900">{product.title}</span>
            </div>
          </nav>

          {(() => {
            // Create array of all available images (avoid duplication)
            const allImages = [product.image];
            if (product.images && product.images.length > 0) {
              product.images.forEach(img => {
                if (img && img !== product.image && !allImages.includes(img)) {
                  allImages.push(img);
                }
              });
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Product Images */}
                <div className="space-y-4">
                  <div className="aspect-video bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 relative group cursor-pointer">
                    <Image
                      src={allImages[selectedImage] || product.image}
                      alt={product.title}
                      fill
                      className="object-cover"
                      priority
                      onError={(e) => {
                        console.error('Image failed to load:', allImages[selectedImage] || product.image);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', allImages[selectedImage] || product.image);
                      }}
                    />
                    
                    {/* View Icon Overlay */}
                    <div 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center"
                      onClick={() => {
                        setFullScreenImageIndex(selectedImage);
                        setIsFullScreenOpen(true);
                      }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur-sm rounded-full p-3">
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Image counter */}
                    {allImages.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded">
                        {selectedImage + 1} / {allImages.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Images */}
                  {allImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {allImages.slice(0, 4).map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <button
                            onClick={() => setSelectedImage(index)}
                            className={`aspect-video bg-white rounded-lg overflow-hidden border-2 transition-colors relative w-full ${
                              selectedImage === index ? 'border-gray-900' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Image
                              src={imageUrl}
                              alt={`${product.title} view ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {index === 0 && (
                              <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                                Main
                              </div>
                            )}
                          </button>
                          
                          {/* View Icon for Thumbnail */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullScreenImageIndex(index);
                              setIsFullScreenOpen(true);
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/70 hover:bg-black/90 text-white rounded-full p-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      
                      {/* Show "more images" indicator if there are more than 4 */}
                      {allImages.length > 4 && (
                        <div className="aspect-video bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-600">+{allImages.length - 4}</div>
                            <div className="text-xs text-gray-500">more</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Info */}
            <div className="space-y-6">
              {/* Badges */}
              <div className="flex items-center gap-2">
                {product.isNew && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                    NEW
                  </span>
                )}
                {product.isBestseller && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full">
                    BESTSELLER
                  </span>
                )}
                {discountPercentage > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">
                    {discountPercentage}% OFF
                  </span>
                )}
              </div>

              {/* Title and Category */}
              <div>
                <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
                <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => {
                    const isFilled = i < Math.floor(averageRating);
                    const isHalfFilled = i === Math.floor(averageRating) && averageRating % 1 >= 0.5;
                    
                    return (
                      <div key={i} className="relative">
                        <svg
                          className={`w-5 h-5 ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        {isHalfFilled && (
                          <svg
                            className="w-5 h-5 text-yellow-400 absolute top-0 left-0"
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
                <span className="text-sm text-gray-600">
                  {averageRating > 0 ? averageRating : 'No rating'} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">₹{product.originalPrice}</span>
                )}
              </div>

              {/* Purchase Button */}
              <div className="space-y-4">
                {user ? (
                  <>
                    <button 
                      onClick={handleBuyNow}
                      disabled={isBuyingNow}
                      className="w-full bg-green-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isBuyingNow ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Pay Now ₹{product.price.toFixed(2)}
                        </div>
                      )}
                    </button>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                      >
                        {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                      </button>
                      <button 
                        onClick={handleWishlistClick}
                        className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
                          product && isInWishlist(product.id.toString())
                            ? 'border-red-500 bg-red-50 text-red-500 hover:bg-red-100' 
                            : 'border-gray-300 bg-white text-gray-700 hover:border-red-500 hover:text-red-500'
                        }`}
                        title={product && isInWishlist(product.id.toString()) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <svg className="w-6 h-6" fill={product && isInWishlist(product.id.toString()) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    {showCartOptions && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <h3 className="text-lg font-semibold text-green-800">Added to Cart!</h3>
                        </div>
                        <p className="text-green-700 text-center mb-4">
                          {quantity} item{quantity > 1 ? 's' : ''} added successfully. What would you like to do next?
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => router.push('/cart')}
                            className="flex-1 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Go to Cart
                          </button>
                          <button
                            onClick={() => router.push('/cart')}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            Proceed to Checkout
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setShowCartOptions(false);
                            setAddedToCart(false);
                          }}
                          className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-sm text-blue-800 mb-3">Please log in to purchase</p>
                      <div className="flex items-center justify-center space-x-2">
                        <Link 
                          href={`/auth?redirect=${encodeURIComponent(pathname)}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Login
                        </Link>
                        <span className="text-blue-600">or</span>
                        <Link 
                          href={`/auth?redirect=${encodeURIComponent(pathname)}`}
                          className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
                        >
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="bg-white rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Product Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Download Size:</span>
                    <span className="ml-2 font-medium">{product.downloadSize}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">File Format:</span>
                    <span className="ml-2 font-medium">{product.fileFormat}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
          })()}

          {/* Product Description */}
          <div className="mt-16">
            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Product Description</h3>
              <div className="prose prose-lg max-w-none">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-200/50 shadow-sm">
                  <div 
                    className="text-gray-800 leading-relaxed text-base prose prose-base max-w-none [&>*:first-child]:first-letter:text-4xl [&>*:first-child]:first-letter:font-bold [&>*:first-child]:first-letter:text-gray-900 [&>*:first-child]:first-letter:mr-2 [&>*:first-child]:first-letter:float-left [&>*:first-child]:first-letter:leading-none"
                    dangerouslySetInnerHTML={{ __html: product.longDescription }}
                  />
                </div>
                <div className="space-y-4 text-gray-600">
                  <p>
                    This product has been carefully crafted to meet the highest standards of quality and usability. 
                    Whether you're a beginner or an experienced professional, you'll find everything you need to 
                    get started right away.
                  </p>
                  
                  <p>
                    Our team has put extensive effort into ensuring that every detail is perfect, from the initial 
                    design concept to the final implementation. You can trust that you're getting a premium product 
                    that will serve you well for years to come.
                  </p>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <strong>Important:</strong> This is a digital product. You will receive download links immediately after purchase. 
                          No physical items will be shipped.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-8">
            <div className="bg-white rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Features */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Features</h3>
                  <ul className="space-y-2">
                    {product.features?.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specifications */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h3>
                  <div className="space-y-3">
                    {Object.entries(product.specifications || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews & Ratings */}
          <div className="mt-8">
            <div className="bg-white rounded-2xl p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-8">Reviews & Ratings</h3>
              
              {/* Rating Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {/* Overall Rating */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {averageRating > 0 ? averageRating : '0.0'}
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(5)].map((_, i) => {
                      const isFilled = i < Math.floor(averageRating);
                      const isHalfFilled = i === Math.floor(averageRating) && averageRating % 1 >= 0.5;
                      
                      return (
                        <div key={i} className="relative">
                          <svg
                            className={`w-6 h-6 ${isFilled ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          {isHalfFilled && (
                            <svg
                              className="w-6 h-6 text-yellow-400 absolute top-0 left-0"
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
                  <p className="text-gray-600">Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                  {totalReviews === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No reviews yet</p>
                  )}
                </div>

                {/* Rating Breakdown */}
                <div className="md:col-span-2">
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = ratingBreakdown[stars];
                      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-8">{stars} ★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-16">{count} ({percentage}%)</span>
                        </div>
                      );
                    })}
                  </div>
                  {totalReviews === 0 && (
                    <p className="text-sm text-gray-500 mt-4">No reviews yet. Be the first to review this product!</p>
                  )}
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
{reviews.length > 0 ? (
                  reviews.map((review) => {
                    // Generate initials from userName
                    const initials = review.userName
                      .split(' ')
                      .map(name => name.charAt(0))
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    
                    // Generate a consistent color based on user ID
                    const colors = [
                      'from-blue-500 to-purple-600',
                      'from-green-500 to-blue-600',
                      'from-purple-500 to-pink-600',
                      'from-red-500 to-orange-600',
                      'from-indigo-500 to-purple-600',
                      'from-teal-500 to-green-600'
                    ];
                    const colorIndex = review.userId.charCodeAt(0) % colors.length;
                    
                    // Format date
                    const reviewDate = new Date(review.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    let timeAgo = '';
                    if (diffDays === 1) timeAgo = '1 day ago';
                    else if (diffDays < 7) timeAgo = `${diffDays} days ago`;
                    else if (diffDays < 30) timeAgo = `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
                    else timeAgo = `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''} ago`;
                    
                    return (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start gap-4">
                          {review.userAvatar ? (
                            <img 
                              src={review.userAvatar} 
                              alt={review.userName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className={`w-12 h-12 bg-gradient-to-br ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold`}>
                              {initials}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <svg 
                                    key={i} 
                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                    fill="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">{timeAgo}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">
                              {review.comment}
                            </p>
                            <div className="flex items-center gap-4 mt-3">
                              <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                Helpful ({review.helpful || 0})
                              </button>
                              {user && user.uid !== review.userId && (
                                <button className="text-sm text-gray-500 hover:text-gray-700">Reply</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No reviews yet</p>
                    <p className="text-sm text-gray-400 mt-1">Be the first to share your experience with this product</p>
                  </div>
                )}
              </div>

              {/* Load More Reviews */}
              <div className="text-center mt-8">
                <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium px-6 py-3 rounded-lg transition-colors">
                  Load More Reviews
                </button>
              </div>

              {/* Write a Review */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h4>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setNewReview(prev => ({ ...prev, rating: i + 1 }))}
                          className={`transition-colors ${
                            i < newReview.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                          }`}
                        >
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                    {newReview.rating > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        {newReview.rating} star{newReview.rating !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                    <textarea
                      rows={4}
                      value={newReview.comment}
                      onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                      placeholder="Share your experience with this product..."
                    ></textarea>
                  </div>
                  
                  {!user && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-sm text-blue-800 mb-3">Please log in to submit a review</p>
                        <div className="flex items-center justify-center space-x-2">
                          <Link 
                            href={`/auth?redirect=${encodeURIComponent(pathname)}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Login
                          </Link>
                          <span className="text-blue-600">or</span>
                          <Link 
                            href={`/auth?redirect=${encodeURIComponent(pathname)}`}
                            className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
                          >
                            Sign Up
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {reviewSubmitted && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-sm text-green-800">Thank you! Your review has been submitted successfully.</p>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleSubmitReview}
                    disabled={!user || newReview.rating === 0 || !newReview.comment.trim() || isSubmittingReview}
                    className="bg-gray-900 hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-lg transition-colors"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* Full Screen Image Modal */}
      {isFullScreenOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {(() => {
              // Create array of all available images for full screen
              const allImages = [product.image];
              if (product.images && product.images.length > 0) {
                product.images.forEach(img => {
                  if (img && img !== product.image && !allImages.includes(img)) {
                    allImages.push(img);
                  }
                });
              }

              return (
                <>
                  {/* Close Button */}
                  <button
                    onClick={() => setIsFullScreenOpen(false)}
                    className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Previous Button */}
                  {allImages.length > 1 && fullScreenImageIndex > 0 && (
                    <button
                      onClick={() => setFullScreenImageIndex(prev => Math.max(0, prev - 1))}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Next Button */}
                  {allImages.length > 1 && fullScreenImageIndex < allImages.length - 1 && (
                    <button
                      onClick={() => setFullScreenImageIndex(prev => Math.min(allImages.length - 1, prev + 1))}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Full Screen Image */}
                  <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
                    <Image
                      src={allImages[fullScreenImageIndex] || product.image}
                      alt={`${product.title} - Full view ${fullScreenImageIndex + 1}`}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Image Info */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm font-medium">{product.title}</div>
                      {allImages.length > 1 && (
                        <div className="text-xs text-gray-300 mt-1">
                          {fullScreenImageIndex + 1} of {allImages.length}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Navigation */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/50 p-2 rounded-lg">
                      {allImages.map((imageUrl, index) => (
                        <button
                          key={index}
                          onClick={() => setFullScreenImageIndex(index)}
                          className={`w-12 h-8 rounded overflow-hidden border-2 transition-colors ${
                            fullScreenImageIndex === index ? 'border-white' : 'border-gray-400 hover:border-gray-200'
                          }`}
                        >
                          <Image
                            src={imageUrl}
                            alt={`Thumbnail ${index + 1}`}
                            width={48}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
