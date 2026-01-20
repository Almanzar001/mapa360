'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Ubicacion, Categoria } from '@/types';
import { Search, Filter, MapPin, Calendar, Tag, Eye, Edit, Trash2, AlertCircle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import { obtenerNombreCategoria } from '@/lib/iconos-categoria';
import { calcularInfoVigencia, formatearVigencia } from '@/lib/vigencia-utils';
import InfoPopup from '@/components/InfoPopup';
import Visor360 from '@/components/Visor360';
import FormularioEdicion from '@/components/FormularioEdicion';

export default function UbicacionesPage() {
  const { usuario, loading } = useAuth();
  const router = useRouter();
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [ubicacionesFiltradas, setUbicacionesFiltradas] = useState<Ubicacion[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<Categoria | 'Todas'>('Todas');
  const [filtroEstado, setFiltroEstado] = useState<'Activo' | 'Inactivo' | 'Todas'>('Todas');
  const [filtroPermiso, setFiltroPermiso] = useState<'Tiene' | 'No Tiene' | 'Todas'>('Todas');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Estados para modales
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<Ubicacion | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [show360, setShow360] = useState(false);
  const [imagen360Url, setImagen360Url] = useState('');
  const [showFormularioEdicion, setShowFormularioEdicion] = useState(false);
  const [ubicacionAEditar, setUbicacionAEditar] = useState<Ubicacion | null>(null);

  // Redireccionar si no está autenticado o no tiene permisos
  useEffect(() => {
    if (!loading) {
      if (!usuario) {
        router.push('/login');
      } else if (usuario.rol === 'add') {
        router.push('/admin');
      }
    }
  }, [usuario, loading, router]);

  // Cargar ubicaciones
  useEffect(() => {
    if (usuario && usuario.rol !== 'add') {
      cargarUbicaciones();
    }
  }, [usuario]);

  // Filtrar ubicaciones
  useEffect(() => {
    let resultado = [...ubicaciones];

    // Filtro de búsqueda
    if (busqueda) {
      resultado = resultado.filter(u =>
        u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.notas?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    // Filtro de categoría
    if (filtroCategoria !== 'Todas') {
      resultado = resultado.filter(u => u.categoria === filtroCategoria);
    }

    // Filtro de estado
    if (filtroEstado !== 'Todas') {
      resultado = resultado.filter(u => u.estado === filtroEstado);
    }

    // Filtro de permiso
    if (filtroPermiso !== 'Todas') {
      resultado = resultado.filter(u => u.permiso === filtroPermiso);
    }

    setUbicacionesFiltradas(resultado);
    setPaginaActual(1); // Reset a primera página al filtrar
  }, [busqueda, filtroCategoria, filtroEstado, filtroPermiso, ubicaciones]);

  const cargarUbicaciones = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/ubicaciones');
      if (!response.ok) throw new Error('Error al cargar ubicaciones');
      const data = await response.json();
      setUbicaciones(data);
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleVerDetalles = (ubicacion: Ubicacion) => {
    setUbicacionSeleccionada(ubicacion);
    setShowPopup(true);
  };

  const handleView360 = (url: string) => {
    setImagen360Url(url);
    setShow360(true);
    setShowPopup(false);
  };

  const handleEditarUbicacion = (ubicacion: Ubicacion) => {
    setUbicacionAEditar(ubicacion);
    setShowFormularioEdicion(true);
    setShowPopup(false);
  };

  const handleEliminarUbicacion = async (ubicacion: Ubicacion) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${ubicacion.nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ubicaciones/${ubicacion.id}/eliminar`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setUbicaciones(prev => prev.filter(u => u.id !== ubicacion.id));
        if (showPopup && ubicacionSeleccionada?.id === ubicacion.id) {
          setShowPopup(false);
          setUbicacionSeleccionada(null);
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error de conexión');
    }
  };

  const handleSaveUbicacion = (ubicacionActualizada: Ubicacion) => {
    setUbicaciones(prev =>
      prev.map(u => u.id === ubicacionActualizada.id ? ubicacionActualizada : u)
    );
    setShowFormularioEdicion(false);
    setUbicacionAEditar(null);
    setTimeout(cargarUbicaciones, 1000);
  };

  const exportarCSV = () => {
    const headers = ['Nombre', 'Categoría', 'Estado', 'Permiso', 'Latitud', 'Longitud', 'Fecha Emisión', 'Vigencia', 'Notas'];
    const rows = ubicacionesFiltradas.map(u => [
      u.nombre,
      u.categoria,
      u.estado,
      u.permiso,
      u.latitud,
      u.longitud,
      u.fechaEmision || 'N/A',
      u.vigencia || 'N/A',
      u.notas || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ubicaciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Paginación
  const indiceInicial = (paginaActual - 1) * itemsPorPagina;
  const indiceFinal = indiceInicial + itemsPorPagina;
  const ubicacionesPaginadas = ubicacionesFiltradas.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(ubicacionesFiltradas.length / itemsPorPagina);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!usuario || usuario.rol === 'add') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-blue-600" />
                Tabla de Ubicaciones
              </h1>
              <p className="text-gray-600 mt-1">
                {ubicacionesFiltradas.length} ubicaciones encontradas
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cargarUbicaciones}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </button>
              <button
                onClick={exportarCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Buscar
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o notas..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Categoría
              </label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value as Categoria | 'Todas')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Todas">Todas</option>
                <option value="Mina">Mina</option>
                <option value="Hormigonera">Hormigonera</option>
                <option value="Permiso">Permiso</option>
              </select>
            </div>

            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as 'Activo' | 'Inactivo' | 'Todas')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Todas">Todos</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Filtro Permiso - Nueva fila */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Permiso
              </label>
              <select
                value={filtroPermiso}
                onChange={(e) => setFiltroPermiso(e.target.value as 'Tiene' | 'No Tiene' | 'Todas')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Todas">Todos</option>
                <option value="Tiene">Tiene Permiso</option>
                <option value="No Tiene">No Tiene Permiso</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permiso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vigencia
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingData ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : ubicacionesPaginadas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron ubicaciones
                    </td>
                  </tr>
                ) : (
                  ubicacionesPaginadas.map((ubicacion) => {
                    const infoVigencia = ubicacion.permiso === 'Tiene' && ubicacion.fechaEmision && ubicacion.vigencia
                      ? calcularInfoVigencia(ubicacion.fechaEmision, ubicacion.vigencia)
                      : null;
                    const vigenciaFormateada = infoVigencia ? formatearVigencia(infoVigencia) : null;

                    return (
                      <tr key={ubicacion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{ubicacion.nombre}</div>
                              <div className="text-xs text-gray-500">
                                {ubicacion.latitud.toFixed(4)}, {ubicacion.longitud.toFixed(4)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {obtenerNombreCategoria(ubicacion.categoria)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            ubicacion.estado === 'Activo'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {ubicacion.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            ubicacion.permiso === 'Tiene'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {ubicacion.permiso === 'Tiene' ? '✓ Tiene' : '⚠ No Tiene'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {vigenciaFormateada ? (
                            <span className={vigenciaFormateada.color}>
                              {vigenciaFormateada.icono} {vigenciaFormateada.texto.substring(0, 20)}
                            </span>
                          ) : (
                            <span className="text-gray-500">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => handleVerDetalles(ubicacion)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {usuario.rol !== 'Viewer' && (
                              <button
                                onClick={() => handleEditarUbicacion(ubicacion)}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {['Admin', 'SuperAdmin'].includes(usuario.rol) && (
                              <button
                                onClick={() => handleEliminarUbicacion(ubicacion)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Mostrando {indiceInicial + 1} - {Math.min(indiceFinal, ubicacionesFiltradas.length)} de {ubicacionesFiltradas.length}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {ubicacionSeleccionada && (
        <InfoPopup
          ubicacion={ubicacionSeleccionada}
          isOpen={showPopup}
          onClose={() => setShowPopup(false)}
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
          onClose={() => setShow360(false)}
          title={ubicacionSeleccionada?.nombre || 'Vista 360°'}
        />
      )}

      {ubicacionAEditar && (
        <FormularioEdicion
          ubicacion={ubicacionAEditar}
          isOpen={showFormularioEdicion}
          onClose={() => {
            setShowFormularioEdicion(false);
            setUbicacionAEditar(null);
          }}
          onSave={handleSaveUbicacion}
        />
      )}
    </DashboardLayout>
  );
}
