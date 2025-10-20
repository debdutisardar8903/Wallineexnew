'use client';

import { usePathname } from 'next/navigation';
import Header from './header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header on auth pages
  const hideHeader = pathname?.startsWith('/auth');
  
  if (hideHeader) {
    return null;
  }
  
  return <Header />;
}
