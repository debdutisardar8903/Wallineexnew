'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { 
  listenToProducts, 
  saveProduct, 
  updateProduct, 
  deleteProduct,
  Product,
  getAllProducts,
  listenToBanners,
  saveBanner,
  updateBanner,
  deleteBanner,
  Banner
} from '@/lib/database';
import { validateProductData, calculateProductStats } from '@/lib/adminUtils';
import ImageUpload from '@/components/Admin/ImageUpload';
import MultipleImageUpload from '@/components/Admin/MultipleImageUpload';
import ProductFileUpload from '@/components/Admin/ProductFileUpload';

interface ProductFormData {
  title: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice: number;
  category: string;
  image: string;
  images: string[];
  features: string[];
  specifications: { [key: string]: string };
  downloadSize: string;
  fileFormat: string;
  compatibility: string[];
  isNew: boolean;
  isBestseller: boolean;
  // Product file fields
  productFileUrl: string;
  productFileName: string;
  productFileSize: string;
  // S3 keys
  imageKey: string;
  imageKeys: string[];
  productFileKey: string;
}

const initialFormData: ProductFormData = {
  title: '',
  description: '',
  longDescription: '',
  price: 0,
  originalPrice: 0,
  category: '',
  image: '',
  images: [],
  features: ['', '', '', '', '', ''],
  specifications: {
    'File Format': '',
    'Pages Included': '',
    'Browser Support': '',
    'Framework': ''
  },
  downloadSize: '',
  fileFormat: '',
  compatibility: [''],
  isNew: false,
  isBestseller: false,
  // Product file fields
  productFileUrl: '',
  productFileName: '',
  productFileSize: '',
  // S3 keys
  imageKey: '',
  imageKeys: [],
  productFileKey: ''
};

const categories = ['Templates', 'Courses', 'Graphics', 'Audio', 'eBooks'];

interface BannerFormData {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
  image: string;
  isActive: boolean;
  order: number;
  imageKey: string;
}

const initialBannerFormData: BannerFormData = {
  title: '',
  description: '',
  buttonText: 'Learn More',
  buttonLink: '/',
  backgroundColor: 'bg-gradient-to-r from-blue-500 to-purple-600',
  image: '',
  isActive: true,
  order: 1,
  imageKey: ''
};

const backgroundOptions = [
  { value: 'bg-gradient-to-r from-blue-500 to-purple-600', label: 'Blue to Purple' },
  { value: 'bg-gradient-to-r from-green-500 to-teal-600', label: 'Green to Teal' },
  { value: 'bg-gradient-to-r from-orange-500 to-red-600', label: 'Orange to Red' },
  { value: 'bg-gradient-to-r from-pink-500 to-rose-600', label: 'Pink to Rose' },
  { value: 'bg-gradient-to-r from-purple-500 to-indigo-600', label: 'Purple to Indigo' },
  { value: 'bg-gradient-to-r from-yellow-500 to-orange-600', label: 'Yellow to Orange' }
];

export default function AdminDashboard() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Banner management state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerFormData, setBannerFormData] = useState<BannerFormData>(initialBannerFormData);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [bannerValidationErrors, setBannerValidationErrors] = useState<string[]>([]);
  
  // Rich text editor ref
  const longDescriptionRef = useRef<HTMLTextAreaElement>(null);

  // Rich text insertion function
  const insertRichText = (tag: string) => {
    const textarea = longDescriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.longDescription.substring(start, end);
    
    let insertText = '';
    
    switch (tag) {
      case 'h1':
        insertText = `<h1>${selectedText || 'Heading 1'}</h1>`;
        break;
      case 'h2':
        insertText = `<h2>${selectedText || 'Heading 2'}</h2>`;
        break;
      case 'h3':
        insertText = `<h3>${selectedText || 'Heading 3'}</h3>`;
        break;
      case 'p':
        insertText = `<p>${selectedText || 'Paragraph text'}</p>`;
        break;
      case 'strong':
        insertText = `<strong>${selectedText || 'Bold text'}</strong>`;
        break;
      case 'em':
        insertText = `<em>${selectedText || 'Italic text'}</em>`;
        break;
      case 'ol':
        insertText = `<ol>\n  <li>${selectedText || 'List item 1'}</li>\n  <li>List item 2</li>\n</ol>`;
        break;
      case 'ul':
        insertText = `<ul>\n  <li>${selectedText || 'List item 1'}</li>\n  <li>List item 2</li>\n</ul>`;
        break;
      case 'br':
        insertText = '<br>';
        break;
      default:
        return;
    }

    const newText = formData.longDescription.substring(0, start) + insertText + formData.longDescription.substring(end);
    handleInputChange('longDescription', newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + insertText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/auth');
      return;
    }

    if (isAdmin) {
      const unsubscribeProducts = listenToProducts((loadedProducts) => {
        setProducts(loadedProducts);
        setIsLoadingProducts(false);
      });

      const unsubscribeBanners = listenToBanners((loadedBanners) => {
        setBanners(loadedBanners);
      });

      return () => {
        unsubscribeProducts();
        unsubscribeBanners();
      };
    }
  }, [user, loading, isAdmin, router]);

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures
    }));
  };

  const handleSpecificationChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }));
  };

  const handleCompatibilityChange = (index: number, value: string) => {
    const newCompatibility = [...formData.compatibility];
    newCompatibility[index] = value;
    setFormData(prev => ({
      ...prev,
      compatibility: newCompatibility
    }));
  };

  const addCompatibilityField = () => {
    setFormData(prev => ({
      ...prev,
      compatibility: [...prev.compatibility, '']
    }));
  };

  const removeCompatibilityField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      compatibility: prev.compatibility.filter((_, i) => i !== index)
    }));
  };

  const handleMultipleImagesUpload = (urls: string[], keys: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: urls,
      imageKeys: keys,
      // Set first image as primary image for backward compatibility
      image: urls[0] || '',
      imageKey: keys[0] || ''
    }));
  };

  const handleRemoveMultipleImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      const newKeys = prev.imageKeys.filter((_, i) => i !== index);
      
      return {
        ...prev,
        images: newImages,
        imageKeys: newKeys,
        // Update primary image if we removed the first one
        image: newImages[0] || '',
        imageKey: newKeys[0] || ''
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    
    const productData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== ''),
      compatibility: formData.compatibility.filter(c => c.trim() !== ''),
      rating: editingProduct?.rating || 0,
      reviews: editingProduct?.reviews || 0,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate product data
    const errors = validateProductData(productData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await saveProduct(productData);
      }

      setFormData(initialFormData);
      setShowAddForm(false);
      setEditingProduct(null);
      setValidationErrors([]);
    } catch (error) {
      console.error('Error saving product:', error);
      setValidationErrors(['Failed to save product. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      longDescription: product.longDescription,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      category: product.category,
      image: product.image,
      images: product.images || [],
      features: [...product.features, '', '', '', '', '', ''].slice(0, 6),
      specifications: product.specifications,
      downloadSize: product.downloadSize,
      fileFormat: product.fileFormat,
      compatibility: product.compatibility,
      isNew: product.isNew || false,
      isBestseller: product.isBestseller || false,
      // Product file fields
      productFileUrl: product.productFileUrl || '',
      productFileName: product.productFileName || '',
      productFileSize: product.productFileSize || '',
      // S3 keys
      imageKey: product.imageKey || '',
      imageKeys: product.imageKeys || [],
      productFileKey: product.productFileKey || ''
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) {
      try {
        await deleteProduct(product.id);
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  // Banner handlers
  const handleBannerInputChange = (field: keyof BannerFormData, value: any) => {
    setBannerFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerValidationErrors([]);
    
    // Basic validation
    const errors: string[] = [];
    if (!bannerFormData.title.trim()) errors.push('Title is required');
    if (!bannerFormData.description.trim()) errors.push('Description is required');
    if (!bannerFormData.buttonText.trim()) errors.push('Button text is required');
    if (!bannerFormData.buttonLink.trim()) errors.push('Button link is required');
    
    if (errors.length > 0) {
      setBannerValidationErrors(errors);
      return;
    }

    setIsSavingBanner(true);

    try {
      const bannerData = {
        title: bannerFormData.title,
        description: bannerFormData.description,
        buttonText: bannerFormData.buttonText,
        buttonLink: bannerFormData.buttonLink,
        backgroundColor: bannerFormData.backgroundColor,
        image: bannerFormData.image,
        isActive: bannerFormData.isActive,
        order: bannerFormData.order
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData);
      } else {
        await saveBanner(bannerData);
      }

      setBannerFormData(initialBannerFormData);
      setShowBannerForm(false);
      setEditingBanner(null);
      setBannerValidationErrors([]);
    } catch (error) {
      console.error('Error saving banner:', error);
      setBannerValidationErrors(['Failed to save banner. Please try again.']);
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner);
    setBannerFormData({
      title: banner.title,
      description: banner.description,
      buttonText: banner.buttonText,
      buttonLink: banner.buttonLink,
      backgroundColor: banner.backgroundColor,
      image: banner.image || '',
      isActive: banner.isActive,
      order: banner.order,
      imageKey: ''
    });
    setShowBannerForm(true);
  };

  const handleCancelBanner = () => {
    setBannerFormData(initialBannerFormData);
    setShowBannerForm(false);
    setEditingBanner(null);
    setBannerValidationErrors([]);
  };

  const handleDeleteBanner = async (banner: Banner) => {
    if (window.confirm(`Are you sure you want to delete "${banner.title}"? This action cannot be undone.`)) {
      try {
        await deleteBanner(banner.id);
      } catch (error) {
        console.error('Error deleting banner:', error);
        alert('Failed to delete banner. Please try again.');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading || isLoadingProducts) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-900 hover:bg-black text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                <p className="text-gray-600">Manage products and monitor your digital marketplace</p>
              </div>
              <div className="flex items-center space-x-6">
                {/* Product Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{products.length}</div>
                    <div className="text-xs text-gray-600">Products</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{products.filter(p => p.isNew).length}</div>
                    <div className="text-xs text-gray-600">New</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{products.filter(p => p.isBestseller).length}</div>
                    <div className="text-xs text-gray-600">Bestsellers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{new Set(products.map(p => p.category)).size}</div>
                    <div className="text-xs text-gray-600">Categories</div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Product</span>
                  </button>
                  <button
                    onClick={() => setShowBannerForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Manage Banners</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[150px]"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add/Edit Product Form */}
          {showAddForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₹)</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Download Size</label>
                    <input
                      type="text"
                      value={formData.downloadSize}
                      onChange={(e) => handleInputChange('downloadSize', e.target.value)}
                      placeholder="e.g., 25 MB"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">File Format</label>
                    <input
                      type="text"
                      value={formData.fileFormat}
                      onChange={(e) => handleInputChange('fileFormat', e.target.value)}
                      placeholder="e.g., ZIP Archive"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Multiple Image Upload */}
                <MultipleImageUpload
                  currentImages={formData.images}
                  currentImageKeys={formData.imageKeys}
                  onImagesUpload={handleMultipleImagesUpload}
                  onImageRemove={handleRemoveMultipleImage}
                  label="Product Images"
                  maxImages={5}
                  required
                />

                {/* Single Image Upload (Legacy - for backward compatibility) */}
                <div className="border-t pt-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">Legacy Single Image Upload</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Use the multiple image upload above. This single image upload is kept for backward compatibility.
                        </p>
                      </div>
                    </div>
                  </div>
                  <ImageUpload
                    currentImageUrl={formData.image}
                    onImageUpload={(url, key) => {
                      handleInputChange('image', url);
                      if (key) handleInputChange('imageKey', key);
                    }}
                    onImageRemove={() => {
                      handleInputChange('image', '');
                      handleInputChange('imageKey', '');
                    }}
                    label="Primary Product Image (Legacy)"
                    required={false}
                  />
                </div>

                {/* Product File Upload */}
                <ProductFileUpload
                  currentFileUrl={formData.productFileUrl}
                  currentFileName={formData.productFileName}
                  onFileUpload={(url, fileName, fileSize, key) => {
                    handleInputChange('productFileUrl', url);
                    handleInputChange('productFileName', fileName);
                    handleInputChange('productFileSize', fileSize);
                    if (key) handleInputChange('productFileKey', key);
                  }}
                  onFileRemove={() => {
                    handleInputChange('productFileUrl', '');
                    handleInputChange('productFileName', '');
                    handleInputChange('productFileSize', '');
                    handleInputChange('productFileKey', '');
                  }}
                  label="Product Download File"
                  required
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Long Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Long Description (Rich Text)
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      Use the toolbar to add HTML formatting
                    </span>
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {/* Rich Text Toolbar */}
                    <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertRichText('h1')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                        title="Heading 1"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRichText('h2')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRichText('h3')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-medium"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <div className="w-px bg-gray-300 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => insertRichText('p')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                        title="Paragraph"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRichText('strong')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRichText('em')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
                        title="Italic"
                      >
                        I
                      </button>
                      <div className="w-px bg-gray-300 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => insertRichText('ol')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                        title="Numbered List"
                      >
                        1.
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRichText('ul')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                        title="Bullet List"
                      >
                        •
                      </button>
                      <button
                        type="button"
                        onClick={() => insertRichText('br')}
                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                        title="Line Break"
                      >
                        ↵
                      </button>
                    </div>
                    
                    {/* Rich Text Editor */}
                    <textarea
                      ref={longDescriptionRef}
                      value={formData.longDescription}
                      onChange={(e) => handleInputChange('longDescription', e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 border-0 focus:ring-0 focus:outline-none resize-none"
                      placeholder="Use the toolbar above to add HTML formatting like <h1>Heading</h1>, <p>Paragraph</p>, <strong>Bold</strong>, <em>Italic</em>, <ol><li>Numbered list</li></ol>, etc."
                      required
                    />
                  </div>
                  
                  {/* Preview Section */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[100px]">
                      {formData.longDescription ? (
                        <div 
                          className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-600 prose-ol:text-gray-700 prose-ul:text-gray-700 prose-li:text-gray-700"
                          dangerouslySetInnerHTML={{ __html: formData.longDescription }}
                        />
                      ) : (
                        <p className="text-gray-400 italic">Preview will appear here as you type...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <input
                        key={index}
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(index, e.target.value)}
                        placeholder={`Feature ${index + 1}`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ))}
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.specifications).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-600 mb-1">{key}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleSpecificationChange(key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compatibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compatibility</label>
                  <div className="space-y-2">
                    {formData.compatibility.map((comp, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={comp}
                          onChange={(e) => handleCompatibilityChange(index, e.target.value)}
                          placeholder={`Compatibility ${index + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {formData.compatibility.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCompatibilityField(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCompatibilityField}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      + Add Compatibility
                    </button>
                  </div>
                </div>

                {/* Flags */}
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => handleInputChange('isNew', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mark as New</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isBestseller}
                      onChange={(e) => handleInputChange('isBestseller', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mark as Bestseller</span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {isSaving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add/Edit Banner Form */}
          {showBannerForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>

              {/* Validation Errors */}
              {bannerValidationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {bannerValidationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleBannerSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={bannerFormData.title}
                      onChange={(e) => handleBannerInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Text</label>
                    <input
                      type="text"
                      value={bannerFormData.buttonText}
                      onChange={(e) => handleBannerInputChange('buttonText', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Button Link</label>
                    <input
                      type="text"
                      value={bannerFormData.buttonLink}
                      onChange={(e) => handleBannerInputChange('buttonLink', e.target.value)}
                      placeholder="e.g., /products or https://example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <select
                      value={bannerFormData.backgroundColor}
                      onChange={(e) => handleBannerInputChange('backgroundColor', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {backgroundOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={bannerFormData.order}
                      onChange={(e) => handleBannerInputChange('order', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bannerFormData.isActive}
                        onChange={(e) => handleBannerInputChange('isActive', e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active (visible on website)</span>
                    </label>
                  </div>
                </div>

                {/* Banner Image Upload */}
                <ImageUpload
                  currentImageUrl={bannerFormData.image}
                  onImageUpload={(url, key) => {
                    handleBannerInputChange('image', url);
                    if (key) handleBannerInputChange('imageKey', key);
                  }}
                  onImageRemove={() => {
                    handleBannerInputChange('image', '');
                    handleBannerInputChange('imageKey', '');
                  }}
                  label="Banner Image (Optional - recommended size: 1200x400px)"
                  required={false}
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={bannerFormData.description}
                    onChange={(e) => handleBannerInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                  <div className={`relative h-32 rounded-lg overflow-hidden ${bannerFormData.backgroundColor} flex items-center justify-center`}>
                    {bannerFormData.image && (
                      <div className="absolute inset-0">
                        <img
                          src={bannerFormData.image}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                      </div>
                    )}
                    <div className="relative text-center text-white px-4">
                      <h3 className="text-lg font-bold mb-1">{bannerFormData.title || 'Banner Title'}</h3>
                      <p className="text-sm opacity-90 mb-2">{bannerFormData.description || 'Banner description'}</p>
                      <span className="inline-block bg-white text-gray-900 text-xs font-medium px-3 py-1 rounded-full">
                        {bannerFormData.buttonText || 'Button Text'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelBanner}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingBanner}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {isSavingBanner ? 'Saving...' : (editingBanner ? 'Update Banner' : 'Add Banner')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Banner Management */}
          {!showAddForm && !showBannerForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Banner Management</h2>
                <div className="text-sm text-gray-600">
                  {banners.length} banner{banners.length !== 1 ? 's' : ''} total, {banners.filter(b => b.isActive).length} active
                </div>
              </div>
              
              {banners.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No banners found</h3>
                  <p className="text-gray-600 mb-4">Create your first banner to get started.</p>
                  <button
                    onClick={() => setShowBannerForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
                  >
                    Add First Banner
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {banners.map((banner) => (
                    <div key={banner.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className={`relative h-32 ${banner.backgroundColor} flex items-center justify-center`}>
                        {banner.image && (
                          <div className="absolute inset-0">
                            <img
                              src={banner.image}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40"></div>
                          </div>
                        )}
                        <div className="relative text-center text-white px-2">
                          <h3 className="text-sm font-bold mb-1 truncate">{banner.title}</h3>
                          <p className="text-xs opacity-90 line-clamp-2">{banner.description}</p>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Order: {banner.order}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(banner.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditBanner(banner)}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium py-2 px-3 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(banner)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium py-2 px-3 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Products ({filteredProducts.length})
              </h2>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or add a new product.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0">
                              <img className="h-12 w-12 rounded-lg object-cover" src={product.image} alt={product.title} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.title}</div>
                              <div className="text-sm text-gray-500">{product.description.substring(0, 50)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">₹{Math.round(product.price).toLocaleString()}</span>
                            {product.originalPrice && (
                              <span className="text-gray-500 line-through">₹{Math.round(product.originalPrice).toLocaleString()}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="text-yellow-400">★</span>
                            <span className="ml-1">{product.rating}</span>
                            <span className="ml-1 text-gray-500">({product.reviews})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {product.isNew && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                New
                              </span>
                            )}
                            {product.isBestseller && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Bestseller
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(product)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
