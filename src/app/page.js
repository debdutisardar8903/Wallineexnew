'use client';

import ProductGrid from '@/components/ProductGrid';

export default function Home() {
  return (
    <div className="font-sans">
      {/* Video Banner */}
      <section className="pt-24 px-4">
        <div className="mx-auto max-w-6xl">
          <video
            className="w-full h-48 sm:h-56 md:h-64 object-cover rounded-lg"
            autoPlay
            muted
            loop
            playsInline
          >
            <source
              src="https://ebundletools.in/wp-content/uploads/2025/10/diwali-banner-ebundletools.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* Telegram Channel Note */}
      <section className="px-4 mt-8">
        <div className="mx-auto max-w-6xl">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-left">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                i
              </div>
              <p className="text-sm/6 tracking-[-.01em]">
                <span className="text-red-600">Join our telegram Channel,</span>
                <span className="text-blue-800"> for Latest and Important Tool Updates and News only….  </span>
                <span 
                  className="text-blue-600 hover:text-blue-800 cursor-pointer hover:underline transition-colors duration-200"
                  onClick={() => window.open('https://t.me/your_channel', '_blank')}
                >
                  Click here to Join
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Best Selling Section */}
      <section className="px-4 mt-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-[-.01em] px-4">
              Best Selling
            </h1>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="px-4 mt-6">
        <div className="mx-auto max-w-6xl">
          <ProductGrid products={sampleProducts} />
        </div>
      </section>
    </div>
  );
}

// Sample products data
const sampleProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    price: 99.99,
    originalPrice: 149.99,
    discount: 33,
    rating: 4.5,
    reviews: 128
  },
  {
    id: 2,
    name: "Smart Watch Series 5",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    price: 299.99,
    originalPrice: 399.99,
    discount: 25,
    rating: 4.8,
    reviews: 256
  },
  {
    id: 3,
    name: "Bluetooth Speaker",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    price: 79.99,
    rating: 4.3,
    reviews: 89
  },
  {
    id: 4,
    name: "Laptop Stand Adjustable",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    price: 49.99,
    originalPrice: 69.99,
    discount: 29,
    rating: 4.6,
    reviews: 167
  },
  {
    id: 5,
    name: "USB-C Hub Multi-Port",
    image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop",
    price: 39.99,
    rating: 4.2,
    reviews: 94
  },
  {
    id: 6,
    name: "Wireless Charging Pad",
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop",
    price: 29.99,
    originalPrice: 39.99,
    discount: 25,
    rating: 4.4,
    reviews: 73
  },
  {
    id: 7,
    name: "Gaming Mouse RGB",
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop",
    price: 59.99,
    rating: 4.7,
    reviews: 142
  },
  {
    id: 8,
    name: "Mechanical Keyboard",
    image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop",
    price: 129.99,
    originalPrice: 179.99,
    discount: 28,
    rating: 4.9,
    reviews: 203
  }
];
