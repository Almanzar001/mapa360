'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (usuario) {
        // Si está autenticado, ir al dashboard
        router.push('/dashboard');
      } else {
        // Si no está autenticado, ir al login
        router.push('/login');
      }
    }
  }, [usuario, loading, router]);

  // Mostrar página de carga mientras verifica autenticación
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
}