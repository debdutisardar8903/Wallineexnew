'use client';

import { useState, useEffect } from 'react';
import ProductGrid from '@/components/ProductGrid';
import { getAllProducts } from '@/lib/database';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const fetchedProducts = await getAllProducts();
        
        // Transform database products to match ProductGrid interface
        const transformedProducts = fetchedProducts.map(product => ({
          id: product.id, // Keep original Firebase ID
          name: product.title, // Map title to name
          image: product.image,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : undefined,
          rating: product.rating,
          reviews: product.reviews
        }));
        
        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="font-sans">
        <section className="pt-24 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Video Banner */}
      <section className="pt-24 px-4">
        <div className="mx-auto max-w-6xl">
          <video
            className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-lg"
            autoPlay
            muted
            loop
            playsInline
          >
            <source
              src="https://pixelmart-storage.s3.ap-south-1.amazonaws.com/pixelmart/products/birthday!-Picwand.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* Telegram Channel Note */}
      <section className="px-4 mt-8">
        <div className="mx-auto max-w-6xl">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-left">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                i
              </div>
              <p className="text-sm/6 tracking-[-.01em]">
                <span className="text-red-600">Join our telegram Channel,</span>
                <span className="text-blue-800"> for Latest and Important Tool Updates and News only….  </span>
                <span 
                  className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline transition-colors duration-200"
                  onClick={() => window.open('https://t.me/wallineex', '_blank')}
                >
                  Click here to Join
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Best Selling Section */}
      <section className="px-4 mt-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-[-.01em] px-4">
              Best Selling
            </h1>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-4 mt-6">
        <div className="mx-auto max-w-6xl">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-600">
                Products will appear here once they are added to the database.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
