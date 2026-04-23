'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'client' | 'admin' | 'vendedor' | 'merchant_admin' | 'merchant_seller';
  merchantId?: string;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  isMerchant: boolean;
  isMerchantAdmin: boolean;
  isMerchantSeller: boolean;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            // Safety: ensure johan is always admin
            if (firebaseUser.email === 'johan.manuel.rosabal@gmail.com' && data.role !== 'admin') {
              await updateDoc(userDocRef, { role: 'admin' });
              setUserData({ ...data, role: 'admin' });
            } else {
              setUserData(data);
            }
          } else {
            const newUserData: UserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: firebaseUser.email === 'johan.manuel.rosabal@gmail.com' ? 'admin' : 'client',
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
          }
          setLoading(false);
        });

        return () => unsubDoc();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const isAdmin = userData?.role === 'admin';
  const isMerchantAdmin = userData?.role === 'merchant_admin';
  const isMerchantSeller = userData?.role === 'merchant_seller';
  const isMerchant = isMerchantAdmin || isMerchantSeller;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      isAdmin, 
      isMerchant,
      isMerchantAdmin,
      isMerchantSeller,
      logout, 
      loginWithGoogle 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
