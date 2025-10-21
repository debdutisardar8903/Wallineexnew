'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="font-sans min-h-screen bg-white pt-24 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Go Back Home
          </Link>
          
          <div className="text-sm text-gray-500">
            <p>If you think this is an error, please contact support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
