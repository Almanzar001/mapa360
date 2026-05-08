import { Usuario, Rol, EstadoUsuario } from '@/types';
import { dbQuery, dbInsert, dbUpdate } from './insforge';

interface UsuarioRow {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  estado: EstadoUsuario;
  fecha_creacion: string;
  ultimo_acceso: string | null;
}

function rowToUsuario(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    email: row.email || '',
    nombre: row.nombre || '',
    rol: row.rol || 'Viewer',
    estado: row.estado || 'Activo',
    fechaCreacion: row.fecha_creacion || '',
    ultimoAcceso: row.ultimo_acceso || '',
  };
}

export async function obtenerUsuarios(): Promise<Usuario[]> {
  try {
    const rows = await dbQuery<UsuarioRow>('usuarios', { order: 'nombre.asc' });
    return rows.map(rowToUsuario);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}

export async function obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
  try {
    const rows = await dbQuery<UsuarioRow>('usuarios', { 'email': `eq.${email}`, limit: 1 });
    return rows.length > 0 ? rowToUsuario(rows[0]) : null;
  } catch (error) {
    console.error('Error al obtener usuario por email:', error);
    return null;
  }
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  try {
    const rows = await dbQuery<UsuarioRow>('usuarios', { 'id': `eq.${id}`, limit: 1 });
    return rows.length > 0 ? rowToUsuario(rows[0]) : null;
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    return null;
  }
}

export async function crearUsuario(datos: { email: string; nombre: string; rol: Rol; insforge_id?: string }): Promise<boolean> {
  try {
    const existente = await obtenerUsuarioPorEmail(datos.email);
    if (existente) throw new Error('Ya existe un usuario con este email');

    await dbInsert('usuarios', {
      email: datos.email,
      nombre: datos.nombre,
      rol: datos.rol,
      estado: 'Activo',
      fecha_creacion: new Date().toISOString(),
      insforge_id: datos.insforge_id ?? null,
    });
    return true;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return false;
  }
}

export async function actualizarUltimoAcceso(id: string): Promise<boolean> {
  try {
    await dbUpdate('usuarios', id, { ultimo_acceso: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error('Error al actualizar último acceso:', error);
    return false;
  }
}


export async function actualizarUsuario(id: string, datos: Partial<Usuario> & { password?: string }): Promise<boolean> {
  try {
    const updateData: Record<string, unknown> = {};
    if (datos.nombre) updateData.nombre = datos.nombre;
    if (datos.email) updateData.email = datos.email;
    if (datos.rol) updateData.rol = datos.rol;
    if (datos.estado) updateData.estado = datos.estado;
    if (datos.password) updateData.password = datos.password;

    await dbUpdate('usuarios', id, updateData);
    return true;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return false;
  }
}

export function tienePermisoLectura(rol: Rol): boolean {
  return ['SuperAdmin', 'Admin', 'Editor', 'Viewer'].includes(rol);
}

export function tienePermisoEscritura(rol: Rol): boolean {
  return ['SuperAdmin', 'Admin', 'Editor'].includes(rol);
}

export function tienePermisoCrear(rol: Rol): boolean {
  return ['SuperAdmin', 'Admin', 'Editor', 'add'].includes(rol);
}

export function tienePermisoAdmin(rol: Rol): boolean {
  return ['SuperAdmin', 'Admin'].includes(rol);
}

export function puedeGestionarUsuarios(rol: Rol): boolean {
  return rol === 'SuperAdmin';
}

export function esSuperAdmin(rol: Rol): boolean {
  return rol === 'SuperAdmin';
}

export function esSoloAgregar(rol: Rol): boolean {
  return rol === 'add';
}
