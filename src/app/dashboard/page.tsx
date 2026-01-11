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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Principal</h1>
            <p className="mt-1 text-sm text-gray-600">
              Bienvenido, {usuario.nombre}. Aquí puedes gestionar las ubicaciones del mapa.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={cargarUbicaciones}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              🔄 Actualizar
            </button>
            {usuario.rol !== 'Viewer' && (
              <a
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Ubicación
              </a>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Ubicaciones
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {ubicaciones.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {ubicaciones.filter(u => u.estado === 'Activo').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inactivos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {ubicaciones.filter(u => u.estado === 'Inactivo').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">360°</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Con Vista 360°
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {ubicaciones.filter(u => u.urlFoto360).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                🗺️ Mapa Interactivo
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por categoría:
                </label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value as Categoria | 'Todas')}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  <option value="Todas">Todas las categorías</option>
                  <option value="Mina">Minas ({ubicaciones.filter(u => u.categoria === 'Mina').length})</option>
                  <option value="Hormigonera">Hormigoneras ({ubicaciones.filter(u => u.categoria === 'Hormigonera').length})</option>
                  <option value="Permiso">Permisos ({ubicaciones.filter(u => u.categoria === 'Permiso').length})</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            {loadingData ? (
              <div className="h-[70vh] flex items-center justify-center">
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
                className="w-full h-[70vh] rounded-lg"
                filtroCategoria={filtroCategoria}
              />
            )}
          </div>
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