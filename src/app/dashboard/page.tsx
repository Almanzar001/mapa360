'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import GoogleMap from '@/components/GoogleMap';
import InfoPopup from '@/components/InfoPopup';
import Visor360 from '@/components/Visor360';
import FormularioEdicion from '@/components/FormularioEdicion';
import { Ubicacion, Categoria } from '@/types';
import { MapPin, Plus, BarChart3, AlertCircle, Navigation } from 'lucide-react';

export default function DashboardPage() {
  const { usuario, loading } = useAuth();
  const router = useRouter();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<Ubicacion | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [show360, setShow360] = useState(false);
  const [imagen360Url, setImagen360Url] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | 'Todas'>('Todas');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [showFormularioEdicion, setShowFormularioEdicion] = useState(false);
  const [ubicacionAEditar, setUbicacionAEditar] = useState<Ubicacion | null>(null);
  const [centroMapa, setCentroMapa] = useState<{ lat: number; lng: number } | null>(null);

  // Redireccionar si no está autenticado o si es rol add
  useEffect(() => {
    if (!loading) {
      if (!usuario) {
        router.push('/login');
      } else if (usuario.rol === 'add') {
        // Rol add no tiene permiso de lectura, redirigir a agregar
        router.push('/admin');
      }
    }
  }, [usuario, loading, router]);

  // Cargar ubicaciones
  useEffect(() => {
    if (usuario) {
      cargarUbicaciones();
    }
  }, [usuario]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => setMostrarFiltros(false);
    if (mostrarFiltros) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mostrarFiltros]);

  const cargarUbicaciones = async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      const response = await fetch('/api/ubicaciones');
      if (!response.ok) {
        throw new Error('Error al cargar ubicaciones');
      }
      
      const data = await response.json();
      setUbicaciones(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error cargando ubicaciones:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleMarkerClick = (ubicacion: Ubicacion) => {
    setUbicacionSeleccionada(ubicacion);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setUbicacionSeleccionada(null);
  };

  const handleView360 = (url: string) => {
    setImagen360Url(url);
    setShow360(true);
    setShowPopup(false);
  };

  const handleClose360 = () => {
    setShow360(false);
    setImagen360Url('');
  };

  const handleEditarUbicacion = (ubicacion: Ubicacion) => {
    setUbicacionAEditar(ubicacion);
    setShowFormularioEdicion(true);
    setShowPopup(false);
  };

  const handleCloseFormularioEdicion = () => {
    setShowFormularioEdicion(false);
    setUbicacionAEditar(null);
  };

  const handleSaveUbicacion = (ubicacionActualizada: Ubicacion) => {
    setUbicaciones(prev => 
      prev.map(u => u.id === ubicacionActualizada.id ? ubicacionActualizada : u)
    );
    handleCloseFormularioEdicion();
    setTimeout(() => {
      cargarUbicaciones();
    }, 1000);
  };

  const handleEliminarUbicacion = async (ubicacion: Ubicacion) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${ubicacion.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ubicaciones/${ubicacion.id}/eliminar`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Eliminar de la lista local
        setUbicaciones(prev => prev.filter(u => u.id !== ubicacion.id));
        // Cerrar el popup si está abierto
        if (showPopup && ubicacionSeleccionada?.id === ubicacion.id) {
          setShowPopup(false);
          setUbicacionSeleccionada(null);
        }
        // Recargar ubicaciones para confirmar
        setTimeout(() => {
          cargarUbicaciones();
        }, 500);
      } else {
        const error = await response.json();
        alert(`Error al eliminar ubicación: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error al eliminar ubicación:', error);
      alert('Error de conexión al eliminar la ubicación');
    }
  };

  const centrarEnMiUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCentroMapa({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('No se pudo obtener tu ubicación. Verifica los permisos de ubicación.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null; // Se redirecciona en useEffect
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Map Controls - Floating Circular */}
        <div className="absolute top-16 md:top-4 right-4 z-10 flex flex-col space-y-3">
          {/* Category Filter Button */}
          <div className="relative">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Filtrar categorías"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            
            {/* Filter Dropdown */}
            {mostrarFiltros && (
              <div className="absolute top-14 right-0 bg-white rounded-lg shadow-lg border border-gray-300 py-1 min-w-[180px] z-20">
                <button
                  onClick={() => { setFiltroCategoria('Todas'); setMostrarFiltros(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filtroCategoria === 'Todas' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  Todas ({ubicaciones.length})
                </button>
                <button
                  onClick={() => { setFiltroCategoria('Mina'); setMostrarFiltros(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filtroCategoria === 'Mina' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  Minas ({ubicaciones.filter(u => u.categoria === 'Mina').length})
                </button>
                <button
                  onClick={() => { setFiltroCategoria('Hormigonera'); setMostrarFiltros(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filtroCategoria === 'Hormigonera' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  Hormigoneras ({ubicaciones.filter(u => u.categoria === 'Hormigonera').length})
                </button>
                <button
                  onClick={() => { setFiltroCategoria('Permiso'); setMostrarFiltros(false); }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filtroCategoria === 'Permiso' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  Permisos ({ubicaciones.filter(u => u.categoria === 'Permiso').length})
                </button>
              </div>
            )}
          </div>

          {/* Mi Ubicación Button */}
          <button
            onClick={centrarEnMiUbicacion}
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Centrar en mi ubicación"
          >
            <Navigation className="w-5 h-5 text-gray-600" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={cargarUbicaciones}
            className="w-12 h-12 bg-white rounded-full shadow-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            title="Actualizar ubicaciones"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-32 md:top-16 left-4 right-4 z-10 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error al cargar datos
                </h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Map Section - Full Screen */}
        <div className="flex-1">
          {loadingData ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Cargando mapa...</p>
              </div>
            </div>
          ) : (
            <GoogleMap
              ubicaciones={ubicaciones}
              onMarkerClick={handleMarkerClick}
              centro={
                centroMapa || 
                (ubicaciones.length > 0 ? 
                  { lat: ubicaciones[0].latitud, lng: ubicaciones[0].longitud } : 
                  { lat: 18.626560805395105, lng: -68.70765075761358 }
                )
              }
              className="w-full h-full"
              filtroCategoria={filtroCategoria}
              mostrarUbicacionUsuario={true}
            />
          )}
        </div>

        {/* Popups */}
        {ubicacionSeleccionada && (
          <InfoPopup
            ubicacion={ubicacionSeleccionada}
            isOpen={showPopup}
            onClose={handleClosePopup}
            onView360={handleView360}
            onEdit={usuario.rol !== 'Viewer' ? handleEditarUbicacion : undefined}
            onDelete={['Admin', 'SuperAdmin'].includes(usuario.rol) ? handleEliminarUbicacion : undefined}
            userRole={usuario.rol}
          />
        )}

        {imagen360Url && (
          <Visor360
            imageUrl={imagen360Url}
            isOpen={show360}
            onClose={handleClose360}
            title={ubicacionSeleccionada?.nombre || 'Vista 360°'}
          />
        )}

        {ubicacionAEditar && (
          <FormularioEdicion
            ubicacion={ubicacionAEditar}
            isOpen={showFormularioEdicion}
            onClose={handleCloseFormularioEdicion}
            onSave={handleSaveUbicacion}
          />
        )}
      </div>
    </DashboardLayout>
  );
}