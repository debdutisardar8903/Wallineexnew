'use client';

import { usePathname } from 'next/navigation';
import Footer from './footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on these pages
  const hideFooter = pathname?.startsWith('/auth') || 
                     pathname === '/cart' || 
                     pathname === '/wishlist' ||
                     pathname === '/checkout';
  
  if (hideFooter) {
    return null;
  }
  
  return <Footer />;
}
