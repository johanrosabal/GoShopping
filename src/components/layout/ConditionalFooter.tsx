'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const isMerchant = pathname?.startsWith('/merchant');
  
  // Ocultar en landing pages de comerciantes
  const reservedRoutes = [
    '/admin', '/merchant', '/login', '/register', 
    '/cart', '/checkout', '/product', '/profile', 
    '/orders', '/search', '/catalog', '/ofertas', 
    '/vender', '/api'
  ];

  const isReserved = reservedRoutes.some(route => pathname?.startsWith(route));
  const isHome = pathname === '/';
  const isMerchantLanding = !isHome && !isReserved && pathname?.split('/').filter(Boolean).length === 1;

  if (isAdmin || isMerchant || isMerchantLanding) return null;

  return <Footer />;
}
