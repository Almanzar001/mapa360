'use client';

import React, { useState } from 'react';
import { X, Calendar, MapPin, Image, Camera, Tag, Clock, Edit, Trash2, AlertCircle, Navigation } from 'lucide-react';
import { Ubicacion } from '@/types';
import GaleriaImagenes from './GaleriaImagenes';
import { obtenerNombreCategoria, obtenerColorCategoria } from '@/lib/iconos-categoria';
import { calcularInfoVigencia, formatearVigencia, calcularFechaVencimiento, formatearFecha, obtenerColorProgreso } from '@/lib/vigencia-utils';

interface InfoPopupProps {
  ubicacion: Ubicacion;
  isOpen: boolean;
  onClose: () => void;
  onView360: (url: string) => void;
  onEdit?: (ubicacion: Ubicacion) => void;
  onDelete?: (ubicacion: Ubicacion) => void;
  userRole?: string;
}

const InfoPopup: React.FC<InfoPopupProps> = ({
  ubicacion,
  isOpen,
  onClose,
  onView360,
  onEdit,
  onDelete,
  userRole,
}) => {
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [imagenInicialGaleria, setImagenInicialGaleria] = useState(0);
  const [modalMapsAbierto, setModalMapsAbierto] = useState(false);
  
  if (!isOpen) return null;
  
  // Calcular información de vigencia solo si tiene permiso
  const infoVigencia = ubicacion.permiso === 'Tiene'
    ? calcularInfoVigencia(ubicacion.fechaEmision, ubicacion.vigencia)
    : null;
  const vigenciaFormateada = infoVigencia ? formatearVigencia(infoVigencia) : null;
  const fechaVencimiento = ubicacion.permiso === 'Tiene' && ubicacion.fechaEmision && ubicacion.vigencia
    ? calcularFechaVencimiento(ubicacion.fechaEmision, ubicacion.vigencia)
    : null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getEstadoColor = (estado: string) => {
    return estado === 'Activo'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const abrirNavegacion = () => {
    setModalMapsAbierto(true);
  };

  const abrirEnGoogleMaps = () => {
    const lat = ubicacion.latitud;
    const lng = ubicacion.longitud;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
    setModalMapsAbierto(false);
  };

  const abrirEnAppleMaps = () => {
    const lat = ubicacion.latitud;
    const lng = ubicacion.longitud;
    const url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    window.location.href = url;
    setModalMapsAbierto(false);
  };

  const abrirEnWaze = () => {
    const lat = ubicacion.latitud;
    const lng = ubicacion.longitud;
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, '_blank');
    setModalMapsAbierto(false);
  };

  const abrirEnMapasGenericos = () => {
    const lat = ubicacion.latitud;
    const lng = ubicacion.longitud;
    const url = `geo:${lat},${lng}?q=${lat},${lng}`;
    window.location.href = url;
    setModalMapsAbierto(false);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Popup Container */}
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{ubicacion.nombre}</h2>
              <div className="flex items-center mt-2 text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  {ubicacion.latitud.toFixed(6)}, {ubicacion.longitud.toFixed(6)}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={abrirNavegacion}
                className="p-2 hover:bg-green-100 rounded-full transition-colors group"
                title="Navegar hacia esta ubicación"
              >
                <Navigation className="w-5 h-5 text-green-600 group-hover:text-green-700" />
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(ubicacion)}
                  className="p-2 hover:bg-blue-100 rounded-full transition-colors group"
                  title="Editar ubicación"
                >
                  <Edit className="w-5 h-5 text-blue-600 group-hover:text-blue-700" />
                </button>
              )}
              {onDelete && userRole && ['Admin', 'SuperAdmin'].includes(userRole) && (
                <button
                  onClick={() => onDelete(ubicacion)}
                  className="p-2 hover:bg-red-100 rounded-full transition-colors group"
                  title="Eliminar ubicación"
                >
                  <Trash2 className="w-5 h-5 text-red-600 group-hover:text-red-700" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Cerrar"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">

            {/* Alerta de Sin Permiso */}
            {ubicacion.permiso === 'No Tiene' && (
              <div className="mb-6 p-4 rounded-lg border-2 bg-orange-50 border-orange-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                    Sin Permiso
                  </h3>
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="mt-2 text-orange-800 font-medium">
                  Esta ubicación no cuenta con permiso vigente.
                </p>
              </div>
            )}

            {/* Información de Vigencia - Destacada (solo si tiene permiso) */}
            {ubicacion.permiso === 'Tiene' && infoVigencia && (
              <div className={`mb-6 p-4 rounded-lg border-2 ${
                infoVigencia.estaVencido
                  ? 'bg-red-50 border-red-200'
                  : infoVigencia.estaCritico
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
              }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Estado de Vigencia
                </h3>
                <span className={`text-2xl ${vigenciaFormateada.color}`}>
                  {vigenciaFormateada.icono}
                </span>
              </div>
              
                <div className="space-y-3">
                  <p className={`text-xl font-bold ${vigenciaFormateada?.color}`}>
                    {vigenciaFormateada?.texto}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-4 h-4 mr-1 text-blue-600" />
                        <span className="text-blue-700 font-medium block">Fecha de Emisión:</span>
                      </div>
                      <span className="font-bold text-blue-900">{ubicacion.fechaEmision ? formatDate(ubicacion.fechaEmision) : 'N/A'}</span>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="text-gray-600 block">Vigencia Total:</span>
                      <span className="font-semibold">{ubicacion.vigencia || 0} días</span>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <span className="text-gray-600 block">Días Transcurridos:</span>
                      <span className="font-semibold">{infoVigencia?.diasTranscurridos || 0} días</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Progreso de Vigencia</span>
                      <span className="font-semibold">{infoVigencia?.porcentajeTranscurrido.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${infoVigencia ? obtenerColorProgreso(infoVigencia) : 'bg-gray-300'}`}
                        style={{ width: `${Math.min(100, infoVigencia?.porcentajeTranscurrido || 0)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded border text-center">
                    <span className="text-gray-600 text-sm block">Fecha de Vencimiento:</span>
                    <span className="font-semibold text-lg">{fechaVencimiento ? formatearFecha(fechaVencimiento) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Categoría y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Categoría
                  </label>
                  <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    {obtenerNombreCategoria(ubicacion.categoria)}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(ubicacion.estado)}`}>
                    {ubicacion.estado}
                  </span>
                </div>

                {ubicacion.codigo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                    <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {ubicacion.codigo}
                    </span>
                  </div>
                )}

              </div>

            </div>

            {/* Notas */}
            {ubicacion.notas && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  📝 Notas Adicionales
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{ubicacion.notas}</p>
                </div>
              </div>
            )}

            {/* Galería de Imágenes Convencionales */}
            {ubicacion.urlImagenes && ubicacion.urlImagenes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Image className="w-4 h-4 inline mr-1" />
                  Galería de Imágenes ({ubicacion.urlImagenes.length})
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ubicacion.urlImagenes.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`${ubicacion.nombre} - Imagen ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow cursor-pointer bg-gray-100"
                        style={{ minHeight: '96px', display: 'block' }}
                        onClick={() => {
                          setImagenInicialGaleria(index);
                          setGaleriaAbierta(true);
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vista 360° */}
            {ubicacion.urlFoto360 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Vista 360°
                </label>
                <div className="relative">
                  <div 
                    className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors cursor-pointer group"
                    onClick={() => {
                      console.log('Abriendo visor 360° con URL:', ubicacion.urlFoto360);
                      onView360(ubicacion.urlFoto360);
                    }}
                  >
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Explorar en 360°
                      </h3>
                      <p className="text-blue-700 text-sm">
                        Haz clic para abrir la vista inmersiva de este lugar
                      </p>
                    </div>
                    <div className="absolute top-3 right-3">
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        360°
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                ID: {ubicacion.id} • Última actualización: {formatDate(ubicacion.fechaEmision)}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Galería de Imágenes Modal */}
      <GaleriaImagenes
        imagenes={ubicacion.urlImagenes}
        isOpen={galeriaAbierta}
        onClose={() => setGaleriaAbierta(false)}
        titulo={`${ubicacion.nombre} - Galería`}
        imagenInicial={imagenInicialGaleria}
      />

      {/* Modal de Selección de Aplicación de Mapas */}
      {modalMapsAbierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
          onClick={() => setModalMapsAbierto(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Abrir en...
            </h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
              Selecciona la aplicación de mapas que prefieres usar
            </p>

            <div className="space-y-3">
              {/* Google Maps */}
              <button
                onClick={abrirEnGoogleMaps}
                className="w-full flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-200">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-700">Google Maps</h4>
                  <p className="text-xs text-gray-500">Abrir en Google Maps</p>
                </div>
                <Navigation className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </button>

              {/* Apple Maps */}
              <button
                onClick={abrirEnAppleMaps}
                className="w-full flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-gray-500 hover:bg-gray-50 transition-all group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-gray-200">
                  <span className="text-2xl">🍎</span>
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-gray-700">Apple Maps</h4>
                  <p className="text-xs text-gray-500">Abrir en Apple Maps</p>
                </div>
                <Navigation className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              </button>

              {/* Waze */}
              <button
                onClick={abrirEnWaze}
                className="w-full flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all group"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-cyan-200">
                  <span className="text-2xl">🚗</span>
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-cyan-700">Waze</h4>
                  <p className="text-xs text-gray-500">Abrir en Waze</p>
                </div>
                <Navigation className="w-5 h-5 text-gray-400 group-hover:text-cyan-600" />
              </button>

              {/* Otros (geo:) */}
              <button
                onClick={abrirEnMapasGenericos}
                className="w-full flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-200">
                  <span className="text-2xl">📍</span>
                </div>
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-green-700">Otras Apps</h4>
                  <p className="text-xs text-gray-500">Ver en otras aplicaciones</p>
                </div>
                <Navigation className="w-5 h-5 text-gray-400 group-hover:text-green-600" />
              </button>
            </div>

            <button
              onClick={() => setModalMapsAbierto(false)}
              className="w-full mt-6 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InfoPopup;