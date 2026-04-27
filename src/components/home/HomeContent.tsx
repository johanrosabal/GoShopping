'use client';

import React from 'react';
import SplashScreen from '../common/SplashScreen';

interface HomeContentProps {
  children: React.ReactNode;
}

export default function HomeContent({ children }: HomeContentProps) {
  return (
    <>
      <SplashScreen />
      {children}
    </>
  );
}
