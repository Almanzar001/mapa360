'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface GaleriaImagenesProps {
  imagenes: string[];
  isOpen: boolean;
  onClose: () => void;
  titulo?: string;
  imagenInicial?: number;
}

const GaleriaImagenes: React.FC<GaleriaImagenesProps> = ({
  imagenes,
  isOpen,
  onClose,
  titulo = 'Galería de Imágenes',
  imagenInicial = 0,
}) => {
  const [imagenActual, setImagenActual] = useState(imagenInicial);
  const [zoom, setZoom] = useState(1);
  
  if (!isOpen) return null;

  const siguienteImagen = () => {
    setImagenActual((prev) => (prev + 1) % imagenes.length);
    setZoom(1); // Reset zoom al cambiar imagen
  };

  const imagenAnterior = () => {
    setImagenActual((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    setZoom(1); // Reset zoom al cambiar imagen
  };

  const irAImagen = (index: number) => {
    setImagenActual(index);
    setZoom(1);
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const descargarImagen = () => {
    const link = document.createElement('a');
    link.href = imagenes[imagenActual];
    link.download = `imagen_${imagenActual + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') imagenAnterior();
    if (e.key === 'ArrowRight') siguienteImagen();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="bg-gray-900 bg-opacity-90 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <p className="text-sm text-gray-300">
            Imagen {imagenActual + 1} de {imagenes.length}
          </p>
        </div>
        
        {/* Controles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Alejar"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <button
            onClick={zoomIn}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Acercar"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={descargarImagen}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Descargar"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-gray-600 mx-2"></div>
          
          <button
            onClick={onClose}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Imagen Principal */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <img
          src={imagenes[imagenActual]}
          alt={`Imagen ${imagenActual + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{ 
            transform: `scale(${zoom})`,
            cursor: zoom > 1 ? 'grab' : 'default'
          }}
          draggable={false}
        />
        
        {/* Navegación con flechas */}
        {imagenes.length > 1 && (
          <>
            <button
              onClick={imagenAnterior}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all text-white"
              title="Imagen anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={siguienteImagen}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all text-white"
              title="Siguiente imagen"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imagenes.length > 1 && (
        <div className="bg-gray-900 bg-opacity-90 p-4">
          <div className="flex justify-center space-x-2 overflow-x-auto max-w-full">
            {imagenes.map((imagen, index) => (
              <button
                key={index}
                onClick={() => irAImagen(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === imagenActual 
                    ? 'border-blue-500 ring-2 ring-blue-400 ring-opacity-50' 
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <img
                  src={imagen}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicadores de navegación */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {imagenes.length > 1 && imagenes.map((_, index) => (
          <button
            key={index}
            onClick={() => irAImagen(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === imagenActual ? 'bg-white' : 'bg-gray-500 hover:bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm text-center bg-black bg-opacity-50 px-3 py-1 rounded-lg">
        <span className="hidden md:inline">Usa las flechas del teclado para navegar • </span>
        <span>Click fuera para cerrar</span>
      </div>
    </div>
  );
};

export default GaleriaImagenes;