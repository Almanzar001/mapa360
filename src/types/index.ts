// Tipos para la aplicación Mapa 360°

export type Categoria = 'Mina' | 'Hormigonera' | 'Permiso';

// Tipos para sistema de usuarios y autenticación
export type Rol = 'SuperAdmin' | 'Admin' | 'Editor' | 'Viewer';
export type EstadoUsuario = 'Activo' | 'Inactivo';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  estado: EstadoUsuario;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

export interface UsuarioLogin {
  email: string;
  password: string;
}

export interface UsuarioRegistro {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
}

export interface SesionUsuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  estado: EstadoUsuario;
}

export interface Ubicacion {
  id: string;
  nombre: string;
  ubicacion: string;      // Formato: "latitud,longitud" ej: "18.626,-68.707"
  fechaEmision: string;
  fechaFinalizacion: string;
  estado: 'Activo' | 'Inactivo';
  categoria: Categoria;   // Nueva categoría
  vigencia: number;       // Días de vigencia del permiso
  urlImagenes: string[];  // URLs de imágenes convencionales
  urlFoto360: string;     // URL de imagen 360°
  notas?: string;
  
  // Propiedades calculadas para compatibilidad
  get latitud(): number;
  get longitud(): number;
}

export interface SheetRow {
  ID: string;
  Nombre: string;
  Latitud: string;
  Longitud: string;
  Fecha_Emision: string;
  Fecha_Finalizacion: string;
  Estado: string;
  URL_Imagenes: string;
  URL_Foto_360: string;
  Notas?: string;
}

export interface MapaProps {
  ubicaciones: Ubicacion[];
  onMarkerClick?: (ubicacion: Ubicacion) => void;
  centro?: { lat: number; lng: number };
}

export interface PopupProps {
  ubicacion: Ubicacion;
  isOpen: boolean;
  onClose: () => void;
  onView360: (url: string) => void;
}

export interface Visor360Props {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface FormularioAdmin {
  nombre: string;
  ubicacion: string;       // Campo unificado "latitud,longitud" 
  fechaEmision: string;
  fechaFinalizacion: string;
  estado: 'Activo' | 'Inactivo';
  categoria: Categoria;    // Nueva categoría
  vigencia: number;        // Días de vigencia
  imagenesConvencionales: File[];
  imagen360: File | null;
  notas: string;
}