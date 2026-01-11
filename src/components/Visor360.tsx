'use client';

import React, { useEffect, useRef } from 'react';
import { X, RotateCcw, ZoomIn, ZoomOut, Maximize, Navigation } from 'lucide-react';

interface Visor360Props {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

declare global {
  interface Window {
    pannellum: any;
  }
}

const Visor360: React.FC<Visor360Props> = ({
  imageUrl,
  isOpen,
  onClose,
  title = 'Vista 360°',
}) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const pannellumInstance = useRef<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset estados
    setLoading(true);
    setError(null);
    
    if (!imageUrl) {
      setError('No hay imagen 360° disponible');
      setLoading(false);
      return;
    }

    // Cargar Pannellum dinámicamente
    const loadPannellum = async () => {
      // Cargar CSS de Pannellum
      if (!document.querySelector('#pannellum-css')) {
        const css = document.createElement('link');
        css.id = 'pannellum-css';
        css.rel = 'stylesheet';
        css.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
        document.head.appendChild(css);
      }

      // Cargar JS de Pannellum
      if (!window.pannellum) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
        script.onload = () => initViewer();
        document.head.appendChild(script);
      } else {
        initViewer();
      }
    };

    const initViewer = () => {
      if (viewerRef.current && window.pannellum && imageUrl) {
        try {
          console.log('Inicializando visor 360° con URL:', imageUrl);
          setLoading(true);
          setError(null);
          
          // Configuración de Pannellum
          const config = {
            type: 'equirectangular',
            panorama: imageUrl,
            autoLoad: true,
            autoRotate: 0,
            compass: true,
            northOffset: 0,
            showZoomCtrl: false,
            showFullscreenCtrl: false,
            showControls: false,
            mouseZoom: true,
            doubleClickZoom: true,
            keyboardZoom: true,
            draggable: true,
            dragConfirm: false,
            disableKeyboardCtrl: false,
            yaw: 0,
            pitch: 0,
            hfov: 100,
            minYaw: -180,
            maxYaw: 180,
            minPitch: -90,
            maxPitch: 90,
            minHfov: 50,
            maxHfov: 120,
          };
          
          console.log('Configurando Pannellum con:', config);
          pannellumInstance.current = window.pannellum.viewer(viewerRef.current, config);
          
          // Verificación periódica del estado de carga
          const checkLoadingInterval = setInterval(() => {
            const viewerDiv = viewerRef.current;
            if (viewerDiv) {
              // Buscar el canvas de Pannellum que indica que se está renderizando
              const canvas = viewerDiv.querySelector('canvas');
              if (canvas && canvas.width > 0 && canvas.height > 0) {
                console.log('Canvas de Pannellum detectado, imagen cargada');
                setLoading(false);
                setError(null);
                clearInterval(checkLoadingInterval);
              }
            }
          }, 500);
          
          // Limpiar intervalo después de 20 segundos
          setTimeout(() => {
            clearInterval(checkLoadingInterval);
          }, 20000);

          // Configurar eventos del visor
          if (pannellumInstance.current) {
            pannellumInstance.current.on('load', () => {
              console.log('Visor 360° cargado exitosamente');
              setLoading(false);
              setError(null);
            });

            pannellumInstance.current.on('error', (err: any) => {
              console.error('Error en el visor 360°:', err);
              setLoading(false);
              setError(`Error al cargar la imagen 360°: ${err}`);
            });
            
            // Timeout final más conservador (solo si realmente no hay contenido)
            setTimeout(() => {
              if (loading && viewerRef.current) {
                const canvas = viewerRef.current.querySelector('canvas');
                if (!canvas || canvas.width === 0) {
                  console.warn('Timeout final: no se detectó canvas válido');
                  setLoading(false);
                  setError('No se pudo cargar la imagen 360°. Verifica que la URL sea válida.');
                }
              }
            }, 20000);
          } else {
            setError('No se pudo crear la instancia de Pannellum');
            setLoading(false);
          }
          
        } catch (error) {
          console.error('Error inicializando Pannellum:', error);
          setLoading(false);
          setError('Error al inicializar el visor 360°');
        }
      } else if (!imageUrl) {
        setError('No hay imagen 360° disponible para esta ubicación');
        setLoading(false);
      }
    };

    loadPannellum();

    // Cleanup al cerrar
    return () => {
      if (pannellumInstance.current) {
        pannellumInstance.current.destroy();
        pannellumInstance.current = null;
      }
    };
  }, [isOpen, imageUrl]);

  // Controles del visor
  const zoomIn = () => {
    if (pannellumInstance.current) {
      const currentHfov = pannellumInstance.current.getHfov();
      pannellumInstance.current.setHfov(Math.max(currentHfov - 10, 50));
    }
  };

  const zoomOut = () => {
    if (pannellumInstance.current) {
      const currentHfov = pannellumInstance.current.getHfov();
      pannellumInstance.current.setHfov(Math.min(currentHfov + 10, 120));
    }
  };

  const resetView = () => {
    if (pannellumInstance.current) {
      pannellumInstance.current.setYaw(0);
      pannellumInstance.current.setPitch(0);
      pannellumInstance.current.setHfov(100);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Navigation className="w-6 h-6 mr-2" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        
        {/* Controles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomIn}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Acercar"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          
          <button
            onClick={zoomOut}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Alejar"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <button
            onClick={resetView}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Restablecer vista"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Pantalla completa"
          >
            <Maximize className="w-5 h-5" />
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

      {/* Visor 360° */}
      <div className="flex-1 relative">
        <div 
          ref={viewerRef} 
          className="w-full h-full"
        />
        
        {/* Loading/Error overlay */}
        {(loading || error) && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              {loading && (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Cargando vista 360°...</p>
                  <p className="text-sm text-gray-400 mt-2">URL: {imageUrl}</p>
                </>
              )}
              {error && (
                <>
                  <div className="text-red-400 text-6xl mb-4">⚠️</div>
                  <p className="text-red-300 mb-2">{error}</p>
                  <p className="text-sm text-gray-400">URL: {imageUrl}</p>
                  <button
                    onClick={() => window.open(imageUrl, '_blank')}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Abrir imagen en nueva ventana
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-gray-900 text-white p-3 text-sm">
        <div className="flex flex-wrap gap-4 justify-center">
          <span className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Arrastra para explorar
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Scroll para zoom
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            Doble clic para centrar
          </span>
        </div>
      </div>
    </div>
  );
};

export default Visor360;