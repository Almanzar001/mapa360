'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Ubicacion, Categoria } from '@/types';
import { obtenerIconoPorCategoria, obtenerColorCategoria, obtenerNombreCategoria } from '@/lib/iconos-categoria';
import { calcularInfoVigencia, formatearVigencia } from '@/lib/vigencia-utils';

declare global {
  interface Window {
    google: any;
    googleMapsLoaded?: boolean;
  }
}

interface GoogleMapProps {
  ubicaciones: Ubicacion[];
  onMarkerClick?: (ubicacion: Ubicacion) => void;
  centro?: { lat: number; lng: number };
  className?: string;
  filtroCategoria?: Categoria | 'Todas';
  mostrarUbicacionUsuario?: boolean;
}

const GoogleMap: React.FC<GoogleMapProps> = ({
  ubicaciones,
  onMarkerClick,
  centro = { lat: 18.626560805395105, lng: -68.70765075761358 }, // Centro en la ubicación existente
  className = 'w-full h-96',
  filtroCategoria = 'Todas',
  mostrarUbicacionUsuario = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<{ lat: number; lng: number } | null>(null);
  const [marcadorUsuario, setMarcadorUsuario] = useState<any>(null);

  // Cargar Google Maps dinámicamente
  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;
      
      // Verificar que Google Maps esté completamente disponible
      if (!window.google || !window.google.maps || !window.google.maps.Map) {
        console.log('Google Maps not ready yet, retrying...');
        setTimeout(initMap, 100);
        return;
      }

      try {
        const googleMap = new window.google.maps.Map(mapRef.current, {
          center: centro,
          zoom: 8,
          mapTypeId: 'roadmap',
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        // Agregar listener para errores de tiles
        googleMap.addListener('tilesloaded', () => {
          console.log('Map tiles loaded successfully');
        });

        // Detectar errores de autenticación
        (window as any).gm_authFailure = () => {
          setMapError('Error de autenticación de Google Maps. Verifica tu API Key.');
          console.error('Google Maps authentication failed');
        };

        // Escuchar cuando el mapa esté listo
        googleMap.addListener('idle', () => {
          setMapError(null);
        });

        setMap(googleMap);
        console.log('Google Maps initialized successfully');
      } catch (error) {
        console.error('Error al inicializar Google Maps:', error);
        setMapError(`Error al cargar el mapa: ${error}`);
      }
    };

    const loadGoogleMaps = () => {
      // Si ya está cargado, inicializar directamente
      if (window.google && window.google.maps && window.google.maps.Map) {
        initMap();
        return;
      }

      // Verificar si ya se está cargando
      if (window.googleMapsLoaded) {
        // Esperar a que termine de cargar
        const checkLoaded = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            initMap();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Verificar si el script ya existe
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        window.googleMapsLoaded = true;
        const checkLoaded = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            initMap();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Marcar como en proceso de carga
      window.googleMapsLoaded = true;

      // Crear callback global para cuando Google Maps termine de cargar
      (window as any).initGoogleMap = () => {
        initMap();
      };

      // Cargar script de Google Maps
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Error cargando Google Maps API');
        setMapError('Error al cargar Google Maps API');
        window.googleMapsLoaded = false;
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [centro]);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (mostrarUbicacionUsuario && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacionUsuario({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Error obteniendo ubicación del usuario:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    }
  }, [mostrarUbicacionUsuario]);

  // Crear marcador de ubicación del usuario
  useEffect(() => {
    if (!map || !ubicacionUsuario || !mostrarUbicacionUsuario) return;

    // Limpiar marcador anterior si existe
    if (marcadorUsuario) {
      marcadorUsuario.setMap(null);
    }

    // Crear icono personalizado para el usuario (más grande con icono de usuario)
    const iconoUsuario = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
          <!-- Sombra exterior -->
          <circle cx="24" cy="26" r="18" fill="rgba(0, 0, 0, 0.15)"/>
          <!-- Círculo principal azul -->
          <circle cx="24" cy="24" r="18" fill="#3B82F6" stroke="#FFFFFF" stroke-width="3"/>
          <!-- Icono de usuario -->
          <g transform="translate(24, 24)" fill="#FFFFFF">
            <!-- Cabeza -->
            <circle cx="0" cy="-4" r="5"/>
            <!-- Cuerpo -->
            <path d="M -7 8 Q -7 2, 0 2 Q 7 2, 7 8 L 7 10 L -7 10 Z"/>
          </g>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(48, 48),
      anchor: new window.google.maps.Point(24, 24),
    };

    // Crear marcador del usuario
    const nuevoMarcadorUsuario = new window.google.maps.Marker({
      position: ubicacionUsuario,
      map: map,
      title: 'Tu ubicación',
      icon: iconoUsuario,
      zIndex: 1000, // Asegurar que esté encima de otros marcadores
    });

    // Agregar InfoWindow
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div class="p-2 text-center">
          <h3 class="font-semibold text-blue-600">📍 Tu ubicación</h3>
          <p class="text-xs text-gray-600 mt-1">
            ${ubicacionUsuario.lat.toFixed(6)}, ${ubicacionUsuario.lng.toFixed(6)}
          </p>
        </div>
      `,
    });

    nuevoMarcadorUsuario.addListener('click', () => {
      infoWindow.open(map, nuevoMarcadorUsuario);
    });

    setMarcadorUsuario(nuevoMarcadorUsuario);

    return () => {
      if (nuevoMarcadorUsuario) {
        nuevoMarcadorUsuario.setMap(null);
      }
    };
  }, [map, ubicacionUsuario, mostrarUbicacionUsuario]);

  // Crear marcadores cuando cambian las ubicaciones
  useEffect(() => {
    if (!map) return;

    // Limpiar marcadores existentes
    markers.forEach(marker => marker.setMap(null));

    // Filtrar ubicaciones por categoría
    const ubicacionesFiltradas = filtroCategoria === 'Todas' 
      ? ubicaciones 
      : ubicaciones.filter(u => u.categoria === filtroCategoria);
    
    const newMarkers = ubicacionesFiltradas.map(ubicacion => {
      // Calcular información de vigencia usando las utilidades
      const infoVigencia = calcularInfoVigencia(ubicacion.fechaEmision, ubicacion.vigencia);
      
      // Determinar color del marcador basado en vigencia y estado
      let iconColor, borderColor;
      // Si no tiene permiso, usar naranja brillante independientemente del estado
      if (ubicacion.permiso === 'No Tiene') {
        iconColor = '#FF8C00'; // Naranja brillante para sin permiso
        borderColor = '#FF6600';
      } else if (ubicacion.estado === 'Inactivo') {
        iconColor = '#EF4444'; // Rojo para inactivo
        borderColor = '#DC2626';
      } else if (infoVigencia.estaVencido) {
        iconColor = '#EF4444'; // Rojo para vencido
        borderColor = '#DC2626';
      } else if (infoVigencia.estaCritico) {
        iconColor = '#EAB308'; // Amarillo para crítico (7 días o menos)
        borderColor = '#CA8A04';
      } else {
        iconColor = '#10B981'; // Verde para todo lo demás
        borderColor = '#047857';
      }

      // Crear icono SVG personalizado según categoría
      const icon = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(obtenerIconoPorCategoria(ubicacion.categoria, iconColor, borderColor, ubicacion.permiso))}`,
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20),
      };

      const marker = new window.google.maps.Marker({
        position: { lat: ubicacion.latitud, lng: ubicacion.longitud },
        map: map,
        title: ubicacion.nombre,
        icon: icon,
        animation: window.google.maps.Animation.DROP,
      });

      // Agregar evento de click
      marker.addListener('click', () => {
        onMarkerClick?.(ubicacion);
      });

      // Determinar texto y color para el estado
      let estadoTexto, estadoColor;
      if (ubicacion.estado === 'Inactivo') {
        estadoTexto = 'Inactivo';
        estadoColor = 'text-red-600';
      } else if (infoVigencia.estaVencido) {
        estadoTexto = 'Expirado';
        estadoColor = 'text-red-600';
      } else if (infoVigencia.estaCritico) {
        estadoTexto = 'Crítico';
        estadoColor = 'text-yellow-600';
      } else {
        estadoTexto = 'Activo';
        estadoColor = 'text-green-600';
      }
      
      const nombreCategoria = obtenerNombreCategoria(ubicacion.categoria);
      const vigenciaFormateada = formatearVigencia(infoVigencia);
      
      // Agregar tooltip al hacer hover
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${ubicacion.nombre}</h3>
            <p class="text-sm text-blue-600 font-medium">${nombreCategoria}</p>
            <p class="text-sm text-gray-600">
              Estado: <span class="font-medium ${estadoColor}">${estadoTexto}</span>
            </p>
            <p class="text-xs ${vigenciaFormateada.color} font-medium">
              ${vigenciaFormateada.icono} ${vigenciaFormateada.texto}
            </p>
            <p class="text-xs text-gray-500 mt-1">Click para más detalles</p>
          </div>
        `,
      });

      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker);
      });

      marker.addListener('mouseout', () => {
        infoWindow.close();
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Ajustar vista para mostrar todos los marcadores si hay ubicaciones
    if (ubicaciones.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      ubicaciones.forEach(ubicacion => {
        bounds.extend({ lat: ubicacion.latitud, lng: ubicacion.longitud });
      });
      map.fitBounds(bounds);

      // Si solo hay un marcador, establecer un zoom específico
      if (ubicaciones.length === 1) {
        map.setZoom(15);
      }
    }
  }, [map, ubicaciones, onMarkerClick]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg shadow-lg"
        style={{ minHeight: '400px' }}
      />
      

      {/* Error indicator */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200">
          <div className="text-center p-4">
            <div className="text-red-600 mb-2">⚠️ Error del Mapa</div>
            <div className="text-sm text-red-700 mb-3">{mapError}</div>
            <div className="text-xs text-gray-600">
              <strong>Soluciones:</strong><br/>
              1. Verifica que el API Key sea válido<br/>
              2. Habilita "Maps JavaScript API" en Google Cloud<br/>
              3. Configura restricciones HTTP para localhost:3000
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {!map && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-pulse text-gray-600 mb-2">Cargando Google Maps...</div>
            <div className="text-xs text-gray-500">
              Si el mapa no carga, verifica la configuración del API Key
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;