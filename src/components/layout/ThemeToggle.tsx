'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      className={styles.toggle} 
      onClick={toggleTheme} 
      title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
      aria-label="Alternar tema"
      suppressHydrationWarning
    >
      <div className={`${styles.iconWrapper} ${theme === 'light' ? styles.light : styles.dark}`}>
        <Sun className={styles.sun} size={20} />
        <Moon className={styles.moon} size={20} />
      </div>
    </button>
  );
}
