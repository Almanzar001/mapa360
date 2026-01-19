'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Upload, Camera, Tag, Calendar, MapPin, AlertCircle, CheckCircle, Clock, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
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
  const [loadingMessage, setLoadingMessage] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Estados para gestión de imágenes
  const [imagenesActuales, setImagenesActuales] = useState<string[]>(ubicacion.urlImagenes || []);
  const [nuevasImagenes, setNuevasImagenes] = useState<File[]>([]);
  const [previewNuevasImagenes, setPreviewNuevasImagenes] = useState<string[]>([]);

  // Estados para gestión de imagen 360
  const [imagen360Actual, setImagen360Actual] = useState<string>(ubicacion.urlFoto360 || '');
  const [nuevaImagen360, setNuevaImagen360] = useState<File | null>(null);
  const [previewNuevaImagen360, setPreviewNuevaImagen360] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagen360InputRef = useRef<HTMLInputElement>(null);

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
    setImagenesActuales(ubicacion.urlImagenes || []);
    setNuevasImagenes([]);
    setPreviewNuevasImagenes([]);
    setImagen360Actual(ubicacion.urlFoto360 || '');
    setNuevaImagen360(null);
    setPreviewNuevaImagen360('');
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

  // Función para comprimir imagen 360° en el frontend
  const compressImage360 = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Determinar tamaño objetivo manteniendo proporción 2:1
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (img.width > 4096) {
          targetWidth = 4096;
          targetHeight = 2048;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Dibujar imagen redimensionada
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        // Convertir a blob con compresión
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Error al comprimir imagen'));
          }
        }, 'image/jpeg', 0.8); // 80% calidad
      };

      img.onerror = () => reject(new Error('Error al cargar imagen para compresión'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Función para comprimir imágenes convencionales
  const compressConventionalImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Redimensionar manteniendo proporción pero limitando tamaño máximo
        let targetWidth = img.width;
        let targetHeight = img.height;

        const maxDimension = 2048; // Tamaño máximo para imágenes convencionales

        if (img.width > maxDimension || img.height > maxDimension) {
          if (img.width > img.height) {
            targetWidth = maxDimension;
            targetHeight = (img.height / img.width) * maxDimension;
          } else {
            targetHeight = maxDimension;
            targetWidth = (img.width / img.height) * maxDimension;
          }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Dibujar imagen redimensionada con mejor calidad
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        // Convertir a blob con buena compresión
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Error al comprimir imagen'));
          }
        }, 'image/jpeg', 0.85); // 85% calidad para buena visualización
      };

      img.onerror = () => reject(new Error('Error al cargar imagen para compresión'));
      img.src = URL.createObjectURL(file);
    });
  };

  // Manejar eliminación de imagen existente
  const handleEliminarImagenActual = (index: number) => {
    setImagenesActuales(prev => prev.filter((_, i) => i !== index));
  };

  // Manejar selección de nuevas imágenes
  const handleNuevasImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNuevasImagenes(prev => [...prev, ...files]);

      // Crear previews
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewNuevasImagenes(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Manejar eliminación de nueva imagen (antes de subir)
  const handleEliminarNuevaImagen = (index: number) => {
    setNuevasImagenes(prev => prev.filter((_, i) => i !== index));
    setPreviewNuevasImagenes(prev => prev.filter((_, i) => i !== index));
  };

  // Manejar eliminación de imagen 360 actual
  const handleEliminarImagen360Actual = () => {
    setImagen360Actual('');
  };

  // Manejar carga de nueva imagen 360
  const handleNuevaImagen360Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setMensaje({ tipo: 'error', texto: 'Por favor selecciona una imagen válida' });
        return;
      }

      setNuevaImagen360(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewNuevaImagen360(e.target?.result as string);
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

  // Manejar eliminación de nueva imagen 360 (antes de subir)
  const handleEliminarNuevaImagen360 = () => {
    setNuevaImagen360(null);
    setPreviewNuevaImagen360('');
    if (imagen360InputRef.current) {
      imagen360InputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setLoadingMessage('Validando datos...');

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

      // Array final de URLs de imágenes (empezar con las actuales que no se eliminaron)
      let urlImagenesFinales = [...imagenesActuales];
      let urlFoto360Final = imagen360Actual;

      // Límites para compresión condicional
      const maxSizeConvencional = 5 * 1024 * 1024; // 5MB límite antes de comprimir
      const maxSize360 = 50 * 1024 * 1024; // 50MB límite absoluto
      const compress360Threshold = 15 * 1024 * 1024; // 15MB para comprimir 360

      // Si hay nuevas imágenes convencionales, procesarlas y subirlas
      if (nuevasImagenes.length > 0) {
        setLoadingMessage('Optimizando imágenes...');

        const formDataUpload = new FormData();
        const imagenesOptimizadas: File[] = [];

        // Comprimir solo si son muy grandes
        for (let i = 0; i < nuevasImagenes.length; i++) {
          const originalFile = nuevasImagenes[i];
          const size = originalFile.size;
          console.log(`Imagen ${i + 1}: ${(size / 1024 / 1024).toFixed(2)}MB`);

          if (size > maxSizeConvencional) {
            setLoadingMessage(`Comprimiendo imagen ${i + 1}/${nuevasImagenes.length} para mejor rendimiento...`);
            try {
              const compressedFile = await compressConventionalImage(originalFile);
              imagenesOptimizadas.push(compressedFile);
              console.log(`Imagen ${i + 1} comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
            } catch (error) {
              console.error('Error al comprimir imagen:', error);
              throw new Error(`Error al comprimir imagen ${i + 1}. Intenta con una imagen más pequeña.`);
            }
          } else {
            imagenesOptimizadas.push(originalFile);
          }
        }

        // Agregar imágenes optimizadas al FormData
        imagenesOptimizadas.forEach(img => {
          formDataUpload.append('imagenes', img);
        });

        setLoadingMessage('Subiendo imágenes al servidor...');

        // Subir imágenes
        const uploadResponse = await fetch('/api/ubicaciones/upload-images', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir las imágenes');
        }

        const uploadData = await uploadResponse.json();

        // Agregar las nuevas URLs al array final
        if (uploadData.urls && Array.isArray(uploadData.urls)) {
          urlImagenesFinales = [...urlImagenesFinales, ...uploadData.urls];
        }
      }

      // Si hay nueva imagen 360, procesarla y subirla
      if (nuevaImagen360) {
        const size = nuevaImagen360.size;
        console.log(`Imagen 360°: ${(size / 1024 / 1024).toFixed(2)}MB`);

        if (size > maxSize360) {
          throw new Error(`Imagen 360° es muy grande (${(size / 1024 / 1024).toFixed(1)}MB). Máximo 50MB.`);
        }

        let imagen360Optimizada = nuevaImagen360;

        // Comprimir si es mayor a 15MB
        if (size > compress360Threshold) {
          console.warn('⚠️ Imagen 360° grande detectada - comprimiendo...');
          setLoadingMessage('Comprimiendo imagen 360° para optimizar carga...');

          try {
            const compressedFile = await compressImage360(nuevaImagen360);
            imagen360Optimizada = compressedFile;
            console.log(`Imagen 360° comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          } catch (error) {
            console.error('Error al comprimir imagen 360°:', error);
            throw new Error('Error al comprimir imagen 360°. Intenta con una imagen más pequeña.');
          }
        }

        setLoadingMessage('Subiendo imagen 360° al servidor...');

        const formData360 = new FormData();
        formData360.append('imagen360', imagen360Optimizada);

        const upload360Response = await fetch('/api/ubicaciones/upload-images', {
          method: 'POST',
          body: formData360,
        });

        if (!upload360Response.ok) {
          throw new Error('Error al subir la imagen 360°');
        }

        const upload360Data = await upload360Response.json();

        // Actualizar URL de foto 360
        if (upload360Data.url360) {
          urlFoto360Final = upload360Data.url360;
        }
      }

      setLoadingMessage('Actualizando ubicación...');

      // Enviar a API con el array completo de imágenes y la foto 360
      const response = await fetch(`/api/ubicaciones/${ubicacion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          urlImagenes: urlImagenesFinales,
          urlFoto360: urlFoto360Final,
        }),
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
        urlImagenes: urlImagenesFinales,
        urlFoto360: urlFoto360Final,
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
      setLoadingMessage('');
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

            {/* Gestión de Imágenes */}
            <div className="mb-6 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-blue-600" />
                Gestión de Imágenes
              </h3>

              {/* Imágenes Actuales */}
              {imagenesActuales.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imágenes Actuales ({imagenesActuales.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {imagenesActuales.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarImagenActual(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nuevas Imágenes (Preview) */}
              {previewNuevasImagenes.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevas Imágenes a Subir ({previewNuevasImagenes.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {previewNuevasImagenes.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Nueva imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-green-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarNuevaImagen(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded">
                          Nueva
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón para agregar nuevas imágenes */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNuevasImagenesChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center"
                >
                  <Upload className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-gray-700">Agregar Más Imágenes</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Total de imágenes: {imagenesActuales.length + nuevasImagenes.length}
                </p>
              </div>
            </div>

            {/* Gestión de Imagen 360° */}
            <div className="mb-6 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-purple-600" />
                Imagen 360°
              </h3>

              {/* Imagen 360 Actual */}
              {imagen360Actual && !previewNuevaImagen360 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen 360° Actual
                  </label>
                  <div className="relative group max-w-md">
                    <img
                      src={imagen360Actual}
                      alt="Imagen 360° actual"
                      className="w-full h-32 object-cover rounded-lg border-2 border-purple-200"
                    />
                    <button
                      type="button"
                      onClick={handleEliminarImagen360Actual}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Eliminar imagen 360°"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Nueva Imagen 360 (Preview) */}
              {previewNuevaImagen360 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Imagen 360° a Subir
                  </label>
                  <div className="relative group max-w-md">
                    <img
                      src={previewNuevaImagen360}
                      alt="Nueva imagen 360°"
                      className="w-full h-32 object-cover rounded-lg border-2 border-green-300"
                    />
                    <button
                      type="button"
                      onClick={handleEliminarNuevaImagen360}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Eliminar imagen 360°"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                      Nueva
                    </div>
                  </div>
                </div>
              )}

              {/* Botón para cambiar/agregar imagen 360 */}
              <div>
                <input
                  ref={imagen360InputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleNuevaImagen360Change}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imagen360InputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center justify-center"
                >
                  <Camera className="w-5 h-5 mr-2 text-purple-600" />
                  <span className="text-gray-700">
                    {imagen360Actual || previewNuevaImagen360 ? 'Cambiar' : 'Agregar'} Imagen 360°
                  </span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Formato equirectangular (relación 2:1) • Máximo 50MB
                </p>
              </div>
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
                    {loadingMessage || 'Guardando...'}
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