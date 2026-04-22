'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Product } from '@/lib/services/products';
import { useAuth } from './AuthContext';
import { saveCartToCloud, getCartFromCloud } from '@/lib/services/cart';
import { getEffectivePrice } from '@/lib/services/products';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const isInitialMount = useRef(true);

  // 1. Initial Load (Local Storage)
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Error loading cart:", e);
      }
    }
  }, []);

  // 2. Handle Login / Sync with Cloud
  useEffect(() => {
    if (authLoading) return;

    const syncWithCloud = async () => {
      if (user) {
        const cloudCart = await getCartFromCloud(user.uid);
        
        if (cloudCart) {
          // Merge logic: Combine local and cloud
          setCart(prevLocalCart => {
            const merged = [...cloudCart];
            
            prevLocalCart.forEach(localItem => {
              const cloudItemIndex = merged.findIndex(item => item.id === localItem.id);
              if (cloudItemIndex > -1) {
                // If exists in both, keep the larger quantity or local (you chose merge)
                merged[cloudItemIndex].quantity = Math.max(merged[cloudItemIndex].quantity, localItem.quantity);
              } else {
                merged.push(localItem);
              }
            });
            
            return merged;
          });
        }
      }
    };

    syncWithCloud();
  }, [user, authLoading]);

  // 3. Persist Changes (Local + Cloud)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    if (user) {
      saveCartToCloud(user.uid, cart);
    }
  }, [cart, user]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true); // Open drawer automatically for better UX
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, item) => total + (getEffectivePrice(item) * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <ThemeTransitionWrapper>
      <CartContext.Provider value={{ 
        cart, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        isCartOpen, 
        setIsCartOpen,
        cartTotal,
        cartCount
      }}>
        {children}
      </CartContext.Provider>
    </ThemeTransitionWrapper>
  );
}

// Small helper to ensure context shifts don't jitter during theme transitions
function ThemeTransitionWrapper({ children }: { children: React.ReactNode }) {
  return <div style={{ transition: 'var(--transition)' }}>{children}</div>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
