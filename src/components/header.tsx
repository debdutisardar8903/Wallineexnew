'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isSearchOpen]);

  const handleLogout = async () => {
    await logout();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results page or handle search
      console.log('Searching for:', searchQuery);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Focus on search input when opening
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
      }, 100);
    }
  };

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 transition-all duration-500 ease-in-out">
      <div
        className={`
          mx-auto transition-all duration-500 ease-in-out
          ${isScrolled 
            ? 'max-w-4xl bg-white/30 backdrop-blur-md shadow-lg rounded-full px-6 py-3' 
            : 'max-w-6xl bg-white/20 backdrop-blur-sm shadow-md rounded-full px-8 py-3'
          }
        `}
      >
        <div className="flex items-center justify-between">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/next.svg"
                alt="Wallineex Logo"
                width={120}
                height={32}
                className="h-8 w-auto brightness-100"
              />
            </Link>
          </div>

          {/* Center - Navigation Menus */}
          <nav className="hidden md:flex items-center justify-center space-x-8 flex-1">
            <Link 
              href="/products" 
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              Products
            </Link>
            {/* Categories Dropdown */}
            <div className="relative group">
              <button 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200 flex items-center space-x-1"
                onMouseEnter={() => setIsCategoriesMenuOpen(true)}
                onMouseLeave={() => setIsCategoriesMenuOpen(false)}
              >
                <span>Categories</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isCategoriesMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Categories Dropdown Menu */}
              <div 
                className={`absolute left-0 top-8 w-48 bg-white rounded-lg shadow-lg border transition-all duration-200 py-2 z-50 ${
                  isCategoriesMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onMouseEnter={() => setIsCategoriesMenuOpen(true)}
                onMouseLeave={() => setIsCategoriesMenuOpen(false)}
              >
                <Link 
                  href="/categories/ebooks" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  eBooks
                </Link>
                <Link 
                  href="/categories/courses" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Courses
                </Link>
                <Link 
                  href="/categories/templates" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Templates
                </Link>
                <Link 
                  href="/categories/digital-tools" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Digital Tools
                </Link>
                <Link 
                  href="/categories/music-audio" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Music & Audio
                </Link>
                <Link 
                  href="/categories/graphics-design" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Graphics & Design
                </Link>
              </div>
            </div>
            {/* Company Dropdown */}
            <div className="relative group">
              <button 
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200 flex items-center space-x-1"
                onMouseEnter={() => setIsCompanyMenuOpen(true)}
                onMouseLeave={() => setIsCompanyMenuOpen(false)}
              >
                <span>Company</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isCompanyMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              <div 
                className={`absolute left-0 top-8 w-48 bg-white rounded-lg shadow-lg border transition-all duration-200 py-2 z-50 ${
                  isCompanyMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onMouseEnter={() => setIsCompanyMenuOpen(true)}
                onMouseLeave={() => setIsCompanyMenuOpen(false)}
              >
                <Link 
                  href="/about" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  About Us
                </Link>
                <Link 
                  href="/contact" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Contact
                </Link>
                <Link 
                  href="/privacy-policy" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms-of-service" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Terms of Service
                </Link>
                <Link 
                  href="/refund-policy" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                >
                  Refund Policy
                </Link>
              </div>
            </div>
            <button 
              key="search-button"
              onClick={toggleSearch}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 hover:bg-gray-100 rounded-lg"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </nav>

          {/* Right Side - Wishlist, Cart, Auth */}
          <div className="flex items-center space-x-4">
            {/* Wishlist Icon */}
            <Link 
              href="/wishlist"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 hover:bg-gray-100 rounded-lg relative block"
              aria-label="Wishlist"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {/* Wishlist Badge */}
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <Link 
              href="/cart"
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 hover:bg-gray-100 rounded-lg relative block"
              aria-label="Shopping Cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.00014 14H18.1359C19.1487 14 19.6551 14 20.0582 13.8112C20.4134 13.6448 20.7118 13.3777 20.9163 13.0432C21.1485 12.6633 21.2044 12.16 21.3163 11.1534L21.9013 5.88835C21.9355 5.58088 21.9525 5.42715 21.9031 5.30816C21.8597 5.20366 21.7821 5.11697 21.683 5.06228C21.5702 5 21.4155 5 21.1062 5H4.50014M2 2H3.24844C3.51306 2 3.64537 2 3.74889 2.05032C3.84002 2.09463 3.91554 2.16557 3.96544 2.25376C4.02212 2.35394 4.03037 2.48599 4.04688 2.7501L4.95312 17.2499C4.96963 17.514 4.97788 17.6461 5.03456 17.7462C5.08446 17.8344 5.15998 17.9054 5.25111 17.9497C5.35463 18 5.48694 18 5.75156 18H19M7.5 21.5H7.51M16.5 21.5H16.51M8 21.5C8 21.7761 7.77614 22 7.5 22C7.22386 22 7 21.7761 7 21.5C7 21.2239 7.22386 21 7.5 21C7.77614 21 8 21.2239 8 21.5ZM17 21.5C17 21.7761 16.7761 22 16.5 22C16.2239 22 16 21.7761 16 21.5C16 21.2239 16.2239 21 16.5 21C16.7761 21 17 21.2239 17 21.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {/* Cart Badge */}
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Authentication */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Profile Icon */}
                <div className="relative group">
                  {user.photoURL ? (
                    <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-black hover:border-gray-700 transition-all duration-200">
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-base">${user.email?.charAt(0).toUpperCase()}</div>`;
                          }
                        }}
                      />
                    </button>
                  ) : (
                    <button className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-base">
                      {user.email?.charAt(0).toUpperCase()}
                    </button>
                  )}
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Profile
                    </Link>
                    <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Orders
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 font-medium">
                        Admin Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/auth?redirect=${encodeURIComponent(pathname)}`}
                  className="px-3 py-1.5 md:px-4 md:py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200 flex-shrink-0"
                >
                  Login
                </Link>
                <Link 
                  href={`/auth/signup?redirect=${encodeURIComponent(pathname)}`}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-900 hover:bg-black text-white font-medium rounded-lg transition-colors duration-200 flex-shrink-0"
                >
                  Sign Up
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Search Popup Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Search Products</h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, categories, or keywords..."
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Press Enter to search or ESC to close</p>
                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
