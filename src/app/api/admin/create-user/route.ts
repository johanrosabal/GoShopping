import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  console.log("API: Iniciando proceso de creación de usuario...");
  try {
    const body = await request.json();
    const { email, password, displayName, role, merchantId } = body;

    console.log("API: Recibida solicitud para:", email);

    if (!adminAuth || !adminDb) {
      console.error("API: Firebase Admin no está inicializado correctamente.");
      return NextResponse.json({ error: 'Servicio de autenticación no disponible' }, { status: 500 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y password son requeridos' }, { status: 400 });
    }

    // 1. Crear el usuario en Firebase Authentication (Admin SDK)
    console.log("API: Intentando crear usuario en Auth...");
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
      disabled: false,
    });
    console.log("API: Usuario creado en Auth con UID:", userRecord.uid);

    // 2. Crear o Actualizar el perfil en Firestore
    console.log("API: Actualizando perfil en Firestore...");
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: role || 'merchant_admin',
      merchantId: merchantId || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      uid: userRecord.uid,
      message: 'Usuario creado exitosamente' 
    });

  } catch (error: any) {
    console.error('API Error:', error);
    // IMPORTANTE: Siempre devolver JSON
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor',
      code: error.code || 'unknown_error'
    }, { status: error.status || 500 });
  }
}
