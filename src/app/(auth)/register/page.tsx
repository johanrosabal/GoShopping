'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User as UserIcon, Globe, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import styles from '../Auth.module.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      await updateProfile(userCredential.user, {
        displayName: name
      });
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else {
        setError('Ocurrió un error al crear tu cuenta. Intenta de nuevo.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Crear Cuenta</h1>
          <p>Únete a la comunidad de compras más exclusiva.</p>
        </div>

        <form className={styles.form} onSubmit={handleRegister}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <label htmlFor="name">Nombre Completo</label>
            <div className={styles.inputWrapper}>
              <UserIcon className={styles.icon} size={18} />
              <input 
                id="name"
                type="text" 
                placeholder="Juan Pérez" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.icon} size={18} />
              <input 
                id="email"
                type="email" 
                placeholder="tu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.icon} size={18} />
              <input 
                id="password"
                type={showPassword ? 'text' : 'password'} 
                placeholder="Mínimo 6 caracteres" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button 
                type="button"
                className={styles.revealBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? <Loader2 className={styles.spinner} /> : <>Crear Cuenta <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className={styles.divider}>
          <span>o regístrate con</span>
        </div>

        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
          <Globe size={18} /> Google
        </button>

        <p className={styles.footerText}>
          ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
