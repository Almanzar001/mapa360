// Utilidades para manejar ubicaciones como string unificado

/**
 * Convierte coordenadas separadas a string unificado
 */
export function coordenadasToString(latitud: number, longitud: number): string {
  return `${latitud},${longitud}`;
}

/**
 * Extrae latitud de string de ubicación
 */
export function extraerLatitud(ubicacion: string): number {
  const partes = ubicacion.split(',');
  return parseFloat(partes[0]) || 0;
}

/**
 * Extrae longitud de string de ubicación
 */
export function extraerLongitud(ubicacion: string): number {
  const partes = ubicacion.split(',');
  return parseFloat(partes[1]) || 0;
}

/**
 * Valida que el formato de ubicación sea correcto
 */
export function validarUbicacion(ubicacion: string): boolean {
  const partes = ubicacion.split(',');
  if (partes.length !== 2) return false;
  
  const lat = parseFloat(partes[0]);
  const lng = parseFloat(partes[1]);
  
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}

/**
 * Formatea ubicación para mostrar
 */
export function formatearUbicacion(ubicacion: string): string {
  const lat = extraerLatitud(ubicacion);
  const lng = extraerLongitud(ubicacion);
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Crea objeto de ubicación con getters para compatibilidad
 */
export function crearUbicacion(data: any): any {
  const ubicacionObj = {
    ...data,
    get latitud(): number {
      return extraerLatitud(this.ubicacion);
    },
    get longitud(): number {
      return extraerLongitud(this.ubicacion);
    }
  };
  
  return ubicacionObj;
}