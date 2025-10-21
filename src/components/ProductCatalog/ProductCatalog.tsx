'use client';

import { useState, useMemo, useEffect } from 'react';
import ProductCard from './ProductCard';
import { listenToProducts, Product } from '@/lib/database';
import { initializeProducts } from '@/lib/initializeProducts';

// Function to format price in INR
const formatPrice = (price: number): string => {
  return `₹${Math.round(price).toLocaleString()}`;
};

// Products will be loaded from Firebase

const categories = ["All", "Templates", "Courses", "Graphics", "Audio", "eBooks"];
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" }
];

export default function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Ensure we're on the client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load products from Firebase
  useEffect(() => {
    if (!isClient) return;

    const unsubscribe = listenToProducts((loadedProducts) => {
      setProducts(loadedProducts);
      setIsLoadingProducts(false);
      
      // No longer auto-initialize products - they will be managed through admin dashboard
      if (loadedProducts.length === 0) {
        console.log('No products found. Products can be added through the admin dashboard.');
      }
    });

    return () => unsubscribe();
  }, [isClient]);


  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "popular":
          return b.reviews - a.reviews;
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [selectedCategory, sortBy, searchQuery, products]);

  // Add formatted prices to products
  const productsWithFormattedPrices = useMemo(() => {
    return filteredAndSortedProducts.map(product => ({
      ...product,
      formattedPrice: formatPrice(product.price),
      formattedOriginalPrice: product.originalPrice ? formatPrice(product.originalPrice) : undefined
    }));
  }, [filteredAndSortedProducts]);

  if (!isClient || isLoadingProducts) {
    return (
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-16 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>


          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white min-w-[200px]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredAndSortedProducts.length} of {products.length} products
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Product Grid */}
        {productsWithFormattedPrices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productsWithFormattedPrices.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product as any}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {products.length === 0 ? 'No products available' : 'No products found'}
            </h3>
            <p className="text-gray-600">
              {products.length === 0 
                ? 'Products will appear here once they are added by administrators.' 
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        )}

        {/* Load More Button */}
        {productsWithFormattedPrices.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-8 py-3 rounded-xl transition-all duration-200 transform hover:scale-105">
              Load More Products
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
