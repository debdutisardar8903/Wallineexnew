'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DownloadsPage() {
  const { user } = useAuth() || { user: null };
  const router = useRouter();
  
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingItems, setDownloadingItems] = useState(new Set());

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    // Simulate loading downloads from API
    const loadDownloads = async () => {
      setIsLoading(true);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock download data - in real app, this would come from API
        const mockDownloads = [
          {
            id: 'DL-001',
            productName: 'Premium Software Suite',
            orderNumber: '#12345',
            purchaseDate: '2024-10-15',
            fileSize: '2.5 GB',
            downloadCount: 2,
            maxDownloads: 5,
            expiryDate: '2025-10-15',
            downloadUrl: '/downloads/premium-software-suite.zip',
            status: 'available'
          },
          {
            id: 'DL-002',
            productName: 'Digital Photography Course',
            orderNumber: '#12344',
            purchaseDate: '2024-10-10',
            fileSize: '1.8 GB',
            downloadCount: 1,
            maxDownloads: 3,
            expiryDate: '2025-10-10',
            downloadUrl: '/downloads/photography-course.zip',
            status: 'available'
          },
          {
            id: 'DL-003',
            productName: 'E-book Collection',
            orderNumber: '#12343',
            purchaseDate: '2024-10-05',
            fileSize: '150 MB',
            downloadCount: 3,
            maxDownloads: 3,
            expiryDate: '2025-10-05',
            downloadUrl: '/downloads/ebook-collection.zip',
            status: 'expired'
          },
          {
            id: 'DL-004',
            productName: 'Music Production Templates',
            orderNumber: '#12342',
            purchaseDate: '2024-09-30',
            fileSize: '800 MB',
            downloadCount: 0,
            maxDownloads: 10,
            expiryDate: '2025-09-30',
            downloadUrl: '/downloads/music-templates.zip',
            status: 'available'
          }
        ];
        
        setDownloads(mockDownloads);
      } catch (error) {
        console.error('Failed to load downloads:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDownloads();
  }, [user, router]);

  const handleDownload = async (download) => {
    if (download.status !== 'available' || downloadingItems.has(download.id)) {
      return;
    }

    setDownloadingItems(prev => new Set([...prev, download.id]));

    try {
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would initiate the actual download here
      // window.open(download.downloadUrl, '_blank');
      
      // Update download count
      setDownloads(prev => prev.map(item => 
        item.id === download.id 
          ? { ...item, downloadCount: item.downloadCount + 1 }
          : item
      ));
      
      alert(`Download started for ${download.productName}`);
    } catch (error) {
      alert('Download failed. Please try again.');
    } finally {
      setDownloadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(download.id);
        return newSet;
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'limit_reached':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (download) => {
    if (download.downloadCount >= download.maxDownloads) {
      return 'Download Limit Reached';
    }
    if (download.status === 'expired') {
      return 'Expired';
    }
    return 'Available';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canDownload = (download) => {
    return download.status === 'available' && 
           download.downloadCount < download.maxDownloads &&
           !downloadingItems.has(download.id);
  };

  if (!user) {
    return (
      <div className="font-sans min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="font-sans min-h-screen bg-white pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your downloads...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-white pt-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Downloads</h1>
          <p className="text-gray-600">
            Access and download your purchased digital products.
          </p>
        </div>

        {/* Downloads List */}
        {downloads.length > 0 ? (
          <div className="space-y-6">
            {downloads.map((download) => (
              <div key={download.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Download Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="mb-4 sm:mb-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {download.productName}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Order: {download.orderNumber}</p>
                      <p>Purchased: {formatDate(download.purchaseDate)}</p>
                      <p>File Size: {download.fileSize}</p>
                      <p>Expires: {formatDate(download.expiryDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(download.status)}`}>
                      {getStatusText(download)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {download.downloadCount}/{download.maxDownloads} downloads used
                    </span>
                  </div>
                </div>

                {/* Download Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Download Usage</span>
                    <span>{Math.round((download.downloadCount / download.maxDownloads) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(download.downloadCount / download.maxDownloads) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleDownload(download)}
                    disabled={!canDownload(download)}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      canDownload(download)
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {downloadingItems.has(download.id) ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Downloading...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download
                      </div>
                    )}
                  </button>
                  
                  <button className="flex-1 sm:flex-none px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No downloads available</h3>
              <p className="text-gray-600 mb-6">
                You haven't purchased any digital products yet. Browse our digital collection to get started.
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Browse Digital Products
              </button>
            </div>
          </div>
        )}

        {/* Download Information */}
        {downloads.length > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Download Information</h3>
                <p className="text-sm text-blue-700">
                  You have {downloads.length} digital product{downloads.length !== 1 ? 's' : ''} available for download. 
                  Each product has a download limit and expiry date. Make sure to download your files before they expire.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
