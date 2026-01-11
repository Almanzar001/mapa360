'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { SesionUsuario, Rol } from '@/types';

interface AuthContextType {
  usuario: SesionUsuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  verificarSesion: () => Promise<void>;
  tienePermiso: (rolesPermitidos: Rol[]) => boolean;
  esAdmin: () => boolean;
  puedeGestionarUsuarios: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const verificarSesion = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsuario(data.usuario);
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data.usuario);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setUsuario(null);
      router.push('/login');
    }
  };

  const tienePermiso = (rolesPermitidos: Rol[]): boolean => {
    if (!usuario) return false;
    return rolesPermitidos.includes(usuario.rol);
  };

  const esAdmin = (): boolean => {
    if (!usuario) return false;
    return ['SuperAdmin', 'Admin'].includes(usuario.rol);
  };

  const puedeGestionarUsuarios = (): boolean => {
    if (!usuario) return false;
    return usuario.rol === 'SuperAdmin';
  };

  useEffect(() => {
    verificarSesion();
  }, []);

  const value: AuthContextType = {
    usuario,
    loading,
    login,
    logout,
    verificarSesion,
    tienePermiso,
    esAdmin,
    puedeGestionarUsuarios,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};