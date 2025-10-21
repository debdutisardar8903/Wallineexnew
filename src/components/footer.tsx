'use client';

import { useState } from 'react';
import Link from 'next/link';
import ClientOnly from './ClientOnly';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleEmailSignup = (e) => {
    e.preventDefault();
    if (email) {
      // Handle email signup logic here
      console.log('Email signup:', email);
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="px-4 pb-4">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto bg-gray-900 text-white rounded-2xl px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors duration-200">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Deals
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-300 hover:text-white transition-colors duration-200">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            
            {/* Social Media Links */}
            <div className="space-y-3 mb-6">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>
              
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C3.85 14.81 3.016 13.28 3.016 11.5c0-1.781.834-3.31 2.11-4.191.875-.807 2.026-1.297 3.323-1.297 1.297 0 2.448.49 3.323 1.297 1.276.881 2.11 2.41 2.11 4.191 0 1.78-.834 3.31-2.11 4.191-.875.807-2.026 1.297-3.323 1.297zm7.83-9.758c-.384 0-.734-.126-1.013-.329-.279-.203-.279-.329-.279-.329s0-.126.279-.329c.279-.203.629-.329 1.013-.329.384 0 .734.126 1.013.329.279.203.279.329.279.329s0 .126-.279.329c-.279.203-.629.329-1.013.329z"/>
                </svg>
                <span>Instagram</span>
              </a>
              
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <span>YouTube</span>
              </a>
              
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X (Twitter)</span>
              </a>
            </div>

            {/* Email Signup */}
            <div>
              <h4 className="text-sm font-medium mb-3">Email Signup</h4>
              <ClientOnly>
                <form onSubmit={handleEmailSignup} className="space-y-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubscribed}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-green-600 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
                  >
                    {isSubscribed ? 'Subscribed!' : 'Subscribe'}
                  </button>
                </form>
              </ClientOnly>
            </div>
          </div>
        </div>

        {/* Bottom Footer - Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2025 Wallineex Digital Store. All Rights Reserved.
            </p>
            
            {/* Additional Links */}
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors duration-200">
                Privacy
              </Link>
              <Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors duration-200">
                Terms
              </Link>
              <Link href="/sitemap" className="text-gray-400 hover:text-white transition-colors duration-200">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
