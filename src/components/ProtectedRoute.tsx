'use client';

import React, { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Rol } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  rolesPermitidos?: Rol[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  rolesPermitidos = ['SuperAdmin', 'Admin', 'Editor', 'Viewer'],
  redirectTo = '/login' 
}) => {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!usuario) {
        router.push(redirectTo);
      } else if (!rolesPermitidos.includes(usuario.rol)) {
        // Redirigir a /admin si es rol add, sino a /dashboard
        const destino = usuario.rol === 'add' ? '/admin' : '/dashboard';
        router.push(destino);
      }
    }
  }, [usuario, loading, router, rolesPermitidos, redirectTo]);

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

  if (!usuario) {
    return null;
  }

  if (!rolesPermitidos.includes(usuario.rol)) {
    const destino = usuario.rol === 'add' ? '/admin' : '/dashboard';
    const textoBoton = usuario.rol === 'add' ? 'Ir a Agregar Ubicación' : 'Ir al Dashboard';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta página.</p>
          <button
            onClick={() => router.push(destino)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {textoBoton}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;