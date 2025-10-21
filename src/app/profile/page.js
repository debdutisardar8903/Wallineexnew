'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth() || { user: null, logout: () => {} };
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('orders');
  const [accountDetails, setAccountDetails] = useState({
    firstName: '',
    lastName: ''
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    // Pre-fill account details if user data exists
    if (user.firstName) {
      setAccountDetails({
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
    }
  }, [user, router]);

  const handleAccountDetailsChange = (e) => {
    const { name, value } = e.target;
    setAccountDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveAccountDetails = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Account details saved successfully!');
    } catch (error) {
      alert('Failed to save account details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const address = {
        id: Date.now(),
        ...newAddress
      };
      
      setAddresses(prev => [...prev, address]);
      setNewAddress({
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: ''
      });
      setShowAddAddressForm(false);
      alert('Address added successfully!');
    } catch (error) {
      alert('Failed to add address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
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

  const menuItems = [
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      id: 'downloads', 
      label: 'Download', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'address', 
      label: 'Address', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 'account', 
      label: 'Account Details', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    { 
      id: 'wishlist', 
      label: 'Wishlist', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Orders</h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-gray-600">No orders found</p>
              <p className="text-sm text-gray-500 mt-2">Your order history will appear here</p>
            </div>
          </div>
        );

      case 'downloads':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Downloads</h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⬇️</span>
              </div>
              <p className="text-gray-600">No downloads available</p>
              <p className="text-sm text-gray-500 mt-2">Your downloadable products will appear here</p>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Billing Address</h2>
                <p className="text-sm text-gray-600 mt-1">
                  The following addresses will be used on the checkout page by default.
                </p>
              </div>
              <button
                onClick={() => setShowAddAddressForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Add Billing Address
              </button>
            </div>

            {/* Address List */}
            {addresses.length > 0 ? (
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{address.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                    <p className="text-sm text-gray-600">{address.city}, {address.state} - {address.pincode}</p>
                    <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📍</span>
                </div>
                <p className="text-gray-600">No billing address found</p>
                <p className="text-sm text-gray-500 mt-2">Add your billing address for faster checkout</p>
              </div>
            )}

            {/* Add Address Form Modal */}
            {showAddAddressForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Add Billing Address</h3>
                    <button
                      onClick={() => setShowAddAddressForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={newAddress.name}
                        onChange={handleAddressChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <textarea
                        name="address"
                        value={newAddress.address}
                        onChange={handleAddressChange}
                        required
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={newAddress.city}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <input
                          type="text"
                          name="state"
                          value={newAddress.state}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                        <input
                          type="text"
                          name="pincode"
                          value={newAddress.pincode}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={newAddress.phone}
                          onChange={handleAddressChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddAddressForm(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {isLoading ? 'Adding...' : 'Add Address'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'account':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Details</h2>
            
            <form onSubmit={handleSaveAccountDetails} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={accountDetails.firstName}
                    onChange={handleAccountDetailsChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={accountDetails.lastName}
                    onChange={handleAccountDetailsChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </form>
          </div>
        );

      case 'wishlist':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Wishlist</h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">❤️</span>
              </div>
              <p className="text-gray-600">Your wishlist is empty</p>
              <p className="text-sm text-gray-500 mt-2">
                <button 
                  onClick={() => router.push('/wishlist')}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Browse products
                </button>
                {' '}to add items to your wishlist
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="font-sans min-h-screen bg-white pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Menu Grid */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'address') {
                      router.push('/address');
                    } else if (item.id === 'account') {
                      router.push('/account');
                    } else if (item.id === 'wishlist') {
                      router.push('/wishlist');
                    } else if (item.id === 'orders') {
                      router.push('/orders');
                    } else if (item.id === 'downloads') {
                      router.push('/downloads');
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-lg transition-colors duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-center">{item.icon}</div>
                  <span className="font-medium text-sm text-center">{item.label}</span>
                </button>
              ))}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center space-y-2 p-4 rounded-lg text-red-600 hover:bg-red-50 border-2 border-transparent transition-colors duration-200"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="font-medium text-sm text-center">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
