'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Globe, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import styles from '../Auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Obtener el rol directamente para decidir la redirección
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();

      if (userData?.role === 'admin') {
        router.push('/admin');
      } else if (userData?.role === 'merchant_admin') {
        router.push('/merchant/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('El correo o la contraseña son incorrectos. Verifica tus datos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else {
        setError('Ocurrió un error inesperado al iniciar sesión.');
        console.error('Login Error:', err.code, err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // Ignorar si el usuario simplemente cerró la ventana
        console.log('Inicio de sesión cancelado por el usuario.');
      } else {
        setError('Error al iniciar sesión con Google. Intenta de nuevo.');
        console.error(err);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Bienvenido</h1>
          <p>Ingresa tus credenciales para acceder a tu cuenta elite.</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          {error && <div className={styles.error}>{error}</div>}
          
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
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            {loading ? <Loader2 className={styles.spinner} /> : <>Entrar <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className={styles.divider}>
          <span>o continúa con</span>
        </div>

        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
          <Globe size={18} /> Google
        </button>

        <p className={styles.footerText}>
          ¿No tienes una cuenta? <Link href="/register">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
}
