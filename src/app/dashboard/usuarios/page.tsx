'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import GestionUsuarios from '@/components/GestionUsuarios';

export default function UsuariosPage() {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  // Redireccionar si no está autenticado o no es SuperAdmin
  useEffect(() => {
    if (!loading && !usuario) {
      router.push('/login');
    } else if (!loading && usuario && usuario.rol !== 'SuperAdmin') {
      router.push('/dashboard');
    }
  }, [usuario, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!usuario || usuario.rol !== 'SuperAdmin') {
    return null; // Se redirecciona en useEffect
  }

  return (
    <DashboardLayout>
      <GestionUsuarios usuarioActual={usuario} />
    </DashboardLayout>
  );
}