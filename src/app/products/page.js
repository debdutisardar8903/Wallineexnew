'use client';

import { useState, useEffect } from 'react';
import ProductGrid from '@/components/ProductGrid';
import { getAllProducts } from '@/lib/database';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');

  // Categories for filtering (matching your database structure)
  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'templates', name: 'Templates' },
    { id: 'courses', name: 'Courses' },
    { id: 'graphics', name: 'Graphics' },
    { id: 'audio', name: 'Audio' },
    { id: 'ebooks', name: 'eBooks' },
    { id: 'software', name: 'Software' },
    { id: 'electronics', name: 'Electronics' }
  ];

  // Sort options
  const sortOptions = [
    { id: 'name', name: 'Name (A-Z)' },
    { id: 'price-low', name: 'Price (Low to High)' },
    { id: 'price-high', name: 'Price (High to Low)' },
    { id: 'newest', name: 'Newest First' },
    { id: 'popular', name: 'Most Popular' }
  ];

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      
      try {
        // Fetch products from Firebase Realtime Database
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
          reviews: product.reviews,
          category: product.category?.toLowerCase() || 'other',
          isNew: product.isNew || false,
          description: product.description || product.longDescription || 'No description available'
        }));
        
        setProducts(transformedProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Filter products based on category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'newest':
        return b.isNew - a.isNew;
      case 'popular':
        return b.reviews - a.reviews;
      default:
        return 0;
    }
  });

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
      {/* Header Section */}
      <section className="pt-32 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-300"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-[-.01em] px-4">
              All Products
            </h1>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
          <p className="text-center text-gray-600 mb-8">
            Discover our complete collection of digital products and electronics.
          </p>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="px-4 mt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {sortedProducts.length} of {products.length} products
            {selectedCategory !== 'all' && (
              <span> in {categories.find(c => c.id === selectedCategory)?.name}</span>
            )}
            {searchQuery && (
              <span> matching "{searchQuery}"</span>
            )}
          </p>
        </div>
      </div>
    </section>

    {/* Products Grid */}
    <section className="px-4 mt-6">
      <div className="mx-auto max-w-6xl">
        {sortedProducts.length > 0 ? (
          <ProductGrid products={sortedProducts} />
        ) : (
        /* No Results */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No products match your search "${searchQuery}"`
                : `No products found in ${categories.find(c => c.id === selectedCategory)?.name}`
              }
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}
