import { Ubicacion, Categoria } from '@/types';
import { crearUbicacion } from './ubicacion-utils';
import { dbQuery, dbInsert, dbUpdate, dbDelete } from './insforge';

interface UbicacionRow {
  id: string;
  nombre: string;
  ubicacion: string;
  codigo: string;
  fecha_emision: string | null;
  estado: 'Activo' | 'Inactivo';
  categoria: Categoria;
  vigencia: number | null;
  permiso: 'Tiene' | 'No Tiene';
  url_imagenes: string[];
  url_foto_360: string;
  notas: string;
}

function rowToUbicacion(row: UbicacionRow): Ubicacion {
  return crearUbicacion({
    id: row.id,
    nombre: row.nombre || '',
    ubicacion: row.ubicacion || '',
    codigo: row.codigo || '',
    fechaEmision: row.fecha_emision || undefined,
    estado: row.estado || 'Inactivo',
    categoria: row.categoria || 'Permiso',
    vigencia: row.vigencia ?? undefined,
    permiso: row.permiso || 'Tiene',
    urlImagenes: Array.isArray(row.url_imagenes) ? row.url_imagenes : [],
    urlFoto360: row.url_foto_360 || '',
    notas: row.notas || '',
  });
}

export async function obtenerUbicaciones(): Promise<Ubicacion[]> {
  try {
    const rows = await dbQuery<UbicacionRow>('ubicaciones', {
      order: 'nombre.asc',
      limit: 1000,
    });
    return rows.map(rowToUbicacion);
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    return [];
  }
}

export async function agregarUbicacion(ubicacion: Omit<Ubicacion, 'id'>): Promise<boolean> {
  try {
    await dbInsert('ubicaciones', {
      nombre: ubicacion.nombre,
      ubicacion: ubicacion.ubicacion,
      codigo: ubicacion.codigo || '',
      fecha_emision: ubicacion.fechaEmision || null,
      estado: ubicacion.estado,
      categoria: ubicacion.categoria,
      vigencia: ubicacion.vigencia ?? null,
      permiso: ubicacion.permiso,
      url_imagenes: ubicacion.urlImagenes,
      url_foto_360: ubicacion.urlFoto360 || '',
      notas: ubicacion.notas || '',
    });
    return true;
  } catch (error) {
    console.error('Error al agregar ubicación:', error);
    return false;
  }
}

export async function actualizarUbicacion(id: string, ubicacion: Partial<Ubicacion>): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {};
    if (ubicacion.nombre !== undefined) updateData.nombre = ubicacion.nombre;
    if (ubicacion.ubicacion !== undefined) updateData.ubicacion = ubicacion.ubicacion;
    if (ubicacion.codigo !== undefined) updateData.codigo = ubicacion.codigo;
    if (ubicacion.fechaEmision !== undefined) updateData.fecha_emision = ubicacion.fechaEmision || null;
    if (ubicacion.estado !== undefined) updateData.estado = ubicacion.estado;
    if (ubicacion.categoria !== undefined) updateData.categoria = ubicacion.categoria;
    if (ubicacion.vigencia !== undefined) updateData.vigencia = ubicacion.vigencia ?? null;
    if (ubicacion.permiso !== undefined) updateData.permiso = ubicacion.permiso;
    if (ubicacion.urlImagenes !== undefined) updateData.url_imagenes = ubicacion.urlImagenes;
    if (ubicacion.urlFoto360 !== undefined) updateData.url_foto_360 = ubicacion.urlFoto360;
    if (ubicacion.notas !== undefined) updateData.notas = ubicacion.notas;
    updateData.updated_at = new Date().toISOString();

    await dbUpdate('ubicaciones', id, updateData);
    return true;
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    return false;
  }
}

export async function eliminarUbicacion(id: string): Promise<boolean> {
  try {
    await dbDelete('ubicaciones', id);
    return true;
  } catch (error) {
    console.error('Error al eliminar ubicación:', error);
    return false;
  }
}
