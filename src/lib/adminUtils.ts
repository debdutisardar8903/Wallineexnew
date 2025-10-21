import { Product } from './database';

// Helper function to validate product data before saving
export const validateProductData = (productData: Partial<Product>): string[] => {
  const errors: string[] = [];

  if (!productData.title?.trim()) {
    errors.push('Title is required');
  }

  if (!productData.description?.trim()) {
    errors.push('Description is required');
  }

  if (!productData.longDescription?.trim()) {
    errors.push('Long description is required');
  }

  if (!productData.category?.trim()) {
    errors.push('Category is required');
  }

  if (!productData.price || productData.price <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (!productData.image?.trim()) {
    errors.push('Image URL is required');
  }

  if (!productData.downloadSize?.trim()) {
    errors.push('Download size is required');
  }

  if (!productData.fileFormat?.trim()) {
    errors.push('File format is required');
  }

  if (!productData.features || productData.features.filter(f => f.trim()).length === 0) {
    errors.push('At least one feature is required');
  }

  if (!productData.compatibility || productData.compatibility.filter(c => c.trim()).length === 0) {
    errors.push('At least one compatibility item is required');
  }

  return errors;
};

// Helper function to generate a sample product template
export const createEmptyProduct = (): Omit<Product, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    title: '',
    description: '',
    longDescription: '',
    price: 0,
    originalPrice: 0,
    category: '',
    image: '',
    rating: 0,
    reviews: 0,
    isNew: false,
    isBestseller: false,
    features: ['', '', '', '', '', ''],
    specifications: {
      'File Format': '',
      'Pages Included': '',
      'Browser Support': '',
      'Framework': ''
    },
    downloadSize: '',
    fileFormat: '',
    compatibility: ['']
  };
};

// Helper function to format product data for display
export const formatProductForDisplay = (product: Product) => {
  return {
    ...product,
    formattedPrice: `$${product.price.toFixed(2)}`,
    formattedOriginalPrice: product.originalPrice ? `$${product.originalPrice.toFixed(2)}` : null,
    discountPercentage: product.originalPrice 
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0,
    featuresCount: product.features.length,
    compatibilityCount: product.compatibility.length
  };
};

// Helper function to check if user is admin
export const isAdminUser = (email: string | null | undefined): boolean => {
  return email === 'admin.743245da@gmail.com';
};

// Helper function to generate product slug for URLs
export const generateProductSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Helper function to validate image URL
export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  } catch {
    return false;
  }
};

// Helper function to calculate product statistics
export const calculateProductStats = (products: Product[]) => {
  const totalProducts = products.length;
  const totalCategories = new Set(products.map(p => p.category)).size;
  const averagePrice = products.length > 0 
    ? products.reduce((sum, p) => sum + p.price, 0) / products.length 
    : 0;
  const averageRating = products.length > 0 
    ? products.reduce((sum, p) => sum + p.rating, 0) / products.length 
    : 0;
  const totalReviews = products.reduce((sum, p) => sum + p.reviews, 0);
  const newProducts = products.filter(p => p.isNew).length;
  const bestsellers = products.filter(p => p.isBestseller).length;

  return {
    totalProducts,
    totalCategories,
    averagePrice: Math.round(averagePrice * 100) / 100,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    newProducts,
    bestsellers
  };
};
