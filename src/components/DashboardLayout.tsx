'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, User, LogOut, Users, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { usuario, logout, puedeGestionarUsuarios } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Navegación según el rol del usuario
  const navigation = usuario?.rol === 'Add'
    ? [
        // Rol Add solo puede agregar ubicaciones
        { name: 'Agregar Ubicación', href: '/admin', icon: Settings },
      ]
    : [
        // Roles con permisos de lectura
        { name: 'Mapa Principal', href: '/dashboard', icon: MapPin },
        ...(usuario?.rol && ['SuperAdmin', 'Admin', 'Editor'].includes(usuario.rol)
          ? [{ name: 'Administrar Ubicaciones', href: '/admin', icon: Settings }]
          : []
        ),
        ...(puedeGestionarUsuarios() ? [{ name: 'Gestión de Usuarios', href: '/dashboard/usuarios', icon: Users }] : []),
      ];


  const handleLogout = async () => {
    await logout();
  };

  const userRoleColors = {
    SuperAdmin: 'bg-purple-100 text-purple-800',
    Admin: 'bg-red-100 text-red-800',
    Editor: 'bg-blue-100 text-blue-800',
    Viewer: 'bg-gray-100 text-gray-800',
    Add: 'bg-green-100 text-green-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0'
        }`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition ease-in-out duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          {/* Mobile sidebar content */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Mapa 360°</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full text-left group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`mr-4 flex-shrink-0 h-6 w-6 ${
                    pathname === item.href ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Mobile user section */}
          <div className="flex-shrink-0 flex justify-between items-center border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-900">{usuario?.nombre}</p>
                <p className="text-sm font-medium text-gray-500">{usuario?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-600 transition-colors p-2"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Mapa 360°</span>
            </div>
            
            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    pathname === item.href ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          
          {/* User section */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{usuario?.nombre}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    usuario ? userRoleColors[usuario.rol] : 'bg-gray-100 text-gray-800'
                  }`}>
                    {usuario?.rol}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar mobile */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;