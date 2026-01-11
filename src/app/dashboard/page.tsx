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
import { MapPin, Plus, BarChart3, AlertCircle } from 'lucide-react';

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
  const [showFormularioEdicion, setShowFormularioEdicion] = useState(false);
  const [ubicacionAEditar, setUbicacionAEditar] = useState<Ubicacion | null>(null);

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!loading && !usuario) {
      router.push('/login');
    }
  }, [usuario, loading, router]);

  // Cargar ubicaciones
  useEffect(() => {
    if (usuario) {
      cargarUbicaciones();
    }
  }, [usuario]);

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
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as Categoria | 'Todas')}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="Todas">Todas las categorías</option>
            <option value="Mina">Minas ({ubicaciones.filter(u => u.categoria === 'Mina').length})</option>
            <option value="Hormigonera">Hormigoneras ({ubicaciones.filter(u => u.categoria === 'Hormigonera').length})</option>
            <option value="Permiso">Permisos ({ubicaciones.filter(u => u.categoria === 'Permiso').length})</option>
          </select>
          <button
            onClick={cargarUbicaciones}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-lg hover:bg-gray-50 transition-colors text-sm"
          >
            🔄
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-16 left-4 right-4 z-10 bg-red-50 border border-red-200 rounded-lg p-4">
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
              centro={ubicaciones.length > 0 ? 
                { lat: ubicaciones[0].latitud, lng: ubicaciones[0].longitud } : 
                { lat: 18.626560805395105, lng: -68.70765075761358 }
              }
              className="w-full h-full"
              filtroCategoria={filtroCategoria}
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