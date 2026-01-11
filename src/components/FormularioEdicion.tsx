'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Upload, Camera, Tag, Calendar, MapPin, AlertCircle, CheckCircle, Clock, Edit } from 'lucide-react';
import { Ubicacion, Categoria } from '@/types';
import { validarUbicacion } from '@/lib/ubicacion-utils';
import { obtenerNombreCategoria } from '@/lib/iconos-categoria';

interface FormularioEdicionProps {
  ubicacion: Ubicacion;
  isOpen: boolean;
  onClose: () => void;
  onSave: (ubicacionActualizada: Ubicacion) => void;
}

const FormularioEdicion: React.FC<FormularioEdicionProps> = ({
  ubicacion,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    nombre: ubicacion.nombre,
    ubicacion: ubicacion.ubicacion,
    fechaEmision: ubicacion.fechaEmision,
    fechaFinalizacion: ubicacion.fechaFinalizacion,
    estado: ubicacion.estado,
    categoria: ubicacion.categoria,
    vigencia: ubicacion.vigencia,
    notas: ubicacion.notas || '',
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Actualizar formData cuando cambie la ubicación
  useEffect(() => {
    setFormData({
      nombre: ubicacion.nombre,
      ubicacion: ubicacion.ubicacion,
      fechaEmision: ubicacion.fechaEmision,
      fechaFinalizacion: ubicacion.fechaFinalizacion,
      estado: ubicacion.estado,
      categoria: ubicacion.categoria,
      vigencia: ubicacion.vigencia,
      notas: ubicacion.notas || '',
    });
  }, [ubicacion]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'vigencia' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      // Validaciones
      if (!formData.nombre || !formData.ubicacion || !formData.fechaEmision || !formData.fechaFinalizacion) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      // Validar formato de ubicación
      if (!validarUbicacion(formData.ubicacion)) {
        throw new Error('Formato de ubicación inválido. Use el formato: latitud,longitud (ej: 18.626,-68.707)');
      }

      if (formData.vigencia < 1) {
        throw new Error('La vigencia debe ser al menos 1 día');
      }

      // Enviar a API
      const response = await fetch(`/api/ubicaciones/${ubicacion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar ubicación');
      }

      setMensaje({ tipo: 'success', texto: '¡Ubicación actualizada exitosamente!' });
      
      // Crear objeto ubicación actualizada
      const ubicacionActualizada: Ubicacion = {
        ...ubicacion,
        ...formData,
      };

      // Notificar al componente padre
      onSave(ubicacionActualizada);

      // Cerrar después de un breve delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: error instanceof Error ? error.message : 'Error desconocido' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center">
            <Edit className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Editar Ubicación</h2>
              <p className="text-sm text-gray-600">Modifica la información de {ubicacion.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-100 rounded-full transition-colors"
            title="Cerrar"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Mensaje */}
          {mensaje && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              mensaje.tipo === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {mensaje.tipo === 'success' 
                ? <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                : <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              }
              <span className={mensaje.tipo === 'success' ? 'text-green-800' : 'text-red-800'}>
                {mensaje.texto}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Información Básica */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Lugar *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Ubicación (Latitud, Longitud) *
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="18.626,-68.707"
                    required
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Formato: latitud,longitud (separados por coma)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Permiso">{obtenerNombreCategoria('Permiso')}</option>
                    <option value="Mina">{obtenerNombreCategoria('Mina')}</option>
                    <option value="Hormigonera">{obtenerNombreCategoria('Hormigonera')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    name="fechaEmision"
                    value={formData.fechaEmision}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Fecha de Finalización *
                  </label>
                  <input
                    type="date"
                    name="fechaFinalizacion"
                    value={formData.fechaFinalizacion}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Vigencia (Días) *
                  </label>
                  <input
                    type="number"
                    name="vigencia"
                    value={formData.vigencia}
                    onChange={handleInputChange}
                    min="1"
                    max="3650"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número de días de vigencia desde la fecha de emisión
                  </p>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional sobre el lugar..."
              />
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioEdicion;