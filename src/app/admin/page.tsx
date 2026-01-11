'use client';

import React, { useState, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Upload, MapPin, Calendar, Image as ImageIcon, Camera, Save, AlertCircle, CheckCircle, Tag } from 'lucide-react';
import { FormularioAdmin, Categoria } from '@/types';
import { validarUbicacion, coordenadasToString } from '@/lib/ubicacion-utils';
import { obtenerNombreCategoria } from '@/lib/iconos-categoria';

const AdminPage: React.FC = () => {
  const [formulario, setFormulario] = useState<FormularioAdmin>({
    nombre: '',
    ubicacion: '',
    fechaEmision: '',
    fechaFinalizacion: '',
    estado: 'Activo',
    categoria: 'Permiso',
    vigencia: 365, // Default 1 año
    imagenesConvencionales: [],
    imagen360: null,
    notas: '',
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [previewImagenes, setPreviewImagenes] = useState<string[]>([]);
  const [preview360, setPreview360] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const image360InputRef = useRef<HTMLInputElement>(null);

  // Manejar cambios en inputs de texto
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar carga de imágenes convencionales
  const handleImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setFormulario(prev => ({
        ...prev,
        imagenesConvencionales: [...prev.imagenesConvencionales, ...files]
      }));

      // Crear previews
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImagenes(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Manejar carga de imagen 360°
  const handleImagen360Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setMensaje({ tipo: 'error', texto: 'Por favor selecciona una imagen válida' });
        return;
      }

      setFormulario(prev => ({
        ...prev,
        imagen360: file
      }));

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview360(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Validar dimensiones (opcional)
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        if (Math.abs(ratio - 2) > 0.1) {
          setMensaje({ 
            tipo: 'error', 
            texto: 'La imagen 360° debe tener formato equirectangular (relación 2:1)' 
          });
        } else {
          setMensaje(null);
        }
      };
      img.src = URL.createObjectURL(file);
    }
  };

  // Eliminar imagen convencional
  const removeImagen = (index: number) => {
    setFormulario(prev => ({
      ...prev,
      imagenesConvencionales: prev.imagenesConvencionales.filter((_, i) => i !== index)
    }));
    setPreviewImagenes(prev => prev.filter((_, i) => i !== index));
  };

  // Eliminar imagen 360°
  const removeImagen360 = () => {
    setFormulario(prev => ({ ...prev, imagen360: null }));
    setPreview360('');
    if (image360InputRef.current) {
      image360InputRef.current.value = '';
    }
  };

  // Obtener ubicación actual
  const obtenerUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const ubicacionStr = coordenadasToString(position.coords.latitude, position.coords.longitude);
          setFormulario(prev => ({
            ...prev,
            ubicacion: ubicacionStr
          }));
          setMensaje({ tipo: 'success', texto: 'Ubicación obtenida exitosamente' });
        },
        (error) => {
          setMensaje({ tipo: 'error', texto: 'Error al obtener ubicación: ' + error.message });
        }
      );
    } else {
      setMensaje({ tipo: 'error', texto: 'Geolocalización no es compatible con este navegador' });
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      // Validaciones
      if (!formulario.nombre || !formulario.ubicacion || 
          !formulario.fechaEmision || !formulario.fechaFinalizacion) {
        throw new Error('Por favor completa todos los campos requeridos');
      }

      // Validar formato de ubicación
      if (!validarUbicacion(formulario.ubicacion)) {
        throw new Error('Formato de ubicación inválido. Use el formato: latitud,longitud (ej: 18.626,-68.707)');
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('nombre', formulario.nombre);
      formData.append('ubicacion', formulario.ubicacion);
      formData.append('fechaEmision', formulario.fechaEmision);
      formData.append('fechaFinalizacion', formulario.fechaFinalizacion);
      formData.append('estado', formulario.estado);
      formData.append('categoria', formulario.categoria);
      formData.append('vigencia', formulario.vigencia.toString());
      formData.append('notas', formulario.notas);

      // Agregar imágenes convencionales
      formulario.imagenesConvencionales.forEach((imagen, index) => {
        formData.append(`imagen_${index}`, imagen);
      });

      // Agregar imagen 360°
      if (formulario.imagen360) {
        formData.append('imagen360', formulario.imagen360);
      }

      // Enviar a API con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

      try {
        const response = await fetch('/api/ubicaciones/agregar', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = 'Error al guardar ubicación';
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Ubicación guardada exitosamente:', result);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('La operación tardó demasiado tiempo. Verifique su conexión e intente de nuevo.');
        }
        throw fetchError;
      }

      setMensaje({ tipo: 'success', texto: '¡Ubicación agregada exitosamente!' });
      
      // Limpiar formulario
      setFormulario({
        nombre: '',
        ubicacion: '',
        fechaEmision: '',
        fechaFinalizacion: '',
        estado: 'Activo',
        categoria: 'Permiso',
        vigencia: 365,
        imagenesConvencionales: [],
        imagen360: null,
        notas: '',
      });
      setPreviewImagenes([]);
      setPreview360('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (image360InputRef.current) image360InputRef.current.value = '';

    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: error instanceof Error ? error.message : 'Error desconocido' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute rolesPermitidos={['SuperAdmin', 'Admin', 'Editor']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600 mt-1">Agrega nuevas ubicaciones al mapa interactivo</p>
            </div>
          </div>
        </div>

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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          
          {/* Información Básica */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Lugar *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Proyecto Residencial Las Flores"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación (Latitud, Longitud) *
                </label>
                <input
                  type="text"
                  name="ubicacion"
                  value={formulario.ubicacion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="18.626,-68.707"
                  required
                />
                <p className="text-gray-500 text-sm mt-1">
                  Formato: latitud,longitud (separados por coma)
                </p>
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={obtenerUbicacionActual}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Usar mi ubicación actual
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Emisión *
                </label>
                <input
                  type="date"
                  name="fechaEmision"
                  value={formulario.fechaEmision}
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
                  value={formulario.fechaFinalizacion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏱️ Vigencia (Días) *
                </label>
                <input
                  type="number"
                  name="vigencia"
                  value={formulario.vigencia}
                  onChange={handleInputChange}
                  min="1"
                  max="3650"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="365"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número de días de vigencia desde la fecha de emisión
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Categoría *
                </label>
                <select
                  name="categoria"
                  value={formulario.categoria}
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
                  Estado
                </label>
                <select
                  name="estado"
                  value={formulario.estado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Imágenes Convencionales */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              <ImageIcon className="w-5 h-5 inline mr-2" />
              Imágenes Convencionales
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImagenesChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Arrastra y suelta imágenes aquí, o{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  haz clic para seleccionar
                </button>
              </p>
              <p className="text-gray-500 text-sm">PNG, JPG hasta 10MB cada una</p>
            </div>

            {/* Preview de imágenes */}
            {previewImagenes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {previewImagenes.map((src, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImagen(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Imagen 360° */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              <Camera className="w-5 h-5 inline mr-2" />
              Imagen 360° (Opcional)
            </h2>
            
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
              <input
                type="file"
                ref={image360InputRef}
                onChange={handleImagen360Change}
                accept="image/*"
                className="hidden"
              />
              <Camera className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-blue-900 mb-2">
                Selecciona una imagen 360° en formato equirectangular
              </p>
              <button
                type="button"
                onClick={() => image360InputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Seleccionar Imagen 360°
              </button>
              <p className="text-blue-600 text-sm mt-2">
                La imagen debe tener una relación de aspecto de 2:1 (ej: 4096x2048px)
              </p>
            </div>

            {/* Preview de imagen 360° */}
            {preview360 && (
              <div className="relative mt-4">
                <img
                  src={preview360}
                  alt="Preview 360°"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImagen360}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
                <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                  360°
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              name="notas"
              value={formulario.notas}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Información adicional sobre el lugar..."
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
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
                  Guardar Ubicación
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default AdminPage;