import { saveProduct, Product } from './database';

// Empty sample products array - all products will be managed through admin dashboard
const sampleProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [];

export const initializeProducts = async (): Promise<void> => {
  try {
    console.log('Initializing products in database...');
    
    for (const product of sampleProducts) {
      const productWithTimestamps = {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const productId = await saveProduct(productWithTimestamps);
      console.log(`Saved product: ${product.title} with ID: ${productId}`);
    }
    
    console.log('All products initialized successfully!');
  } catch (error) {
    console.error('Error initializing products:', error);
    throw error;
  }
};

export { sampleProducts };
