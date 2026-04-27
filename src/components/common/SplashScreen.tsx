'use client';

import { useEffect, useState } from 'react';
import styles from './SplashScreen.module.css';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Duration of the splash
    const timer = setTimeout(() => {
      setIsFading(true);
      // Wait for fade out animation
      setTimeout(() => {
        setIsVisible(false);
      }, 800);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`${styles.overlay} ${isFading ? styles.fadeOut : ''}`}>
      <div className={styles.container}>
        <div className={styles.logoWrapper}>
          <div className={styles.logo}>
            <span className={styles.go}>Go</span>
            <span className={styles.shopping}>Shopping</span>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.slogan}>
            LA DEFINICIÓN DE EXCELENCIA
          </div>
        </div>
        
        <div className={styles.loader}>
          <div className={styles.progress}></div>
        </div>
      </div>
    </div>
  );
}
