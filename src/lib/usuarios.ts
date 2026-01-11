import { Usuario, UsuarioRegistro, Rol, EstadoUsuario } from '@/types';
import bcrypt from 'bcryptjs';

const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
const NOCODB_USUARIOS_TABLE_ID = process.env.NOCODB_USUARIOS_TABLE_ID || 'usuarios_table_id';

const headers = {
  'Content-Type': 'application/json',
  'xc-token': NOCODB_API_TOKEN || '',
};

export async function obtenerUsuarios(): Promise<Usuario[]> {
  try {
    const response = await fetch(`${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_USUARIOS_TABLE_ID}/records`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    return data.list.map((row: any): Usuario => ({
      id: row.Id?.toString() || '',
      email: row.Email || '',
      nombre: row.Nombre || '',
      rol: (row.Rol as Rol) || 'Viewer',
      estado: (row.Estado as EstadoUsuario) || 'Activo',
      fechaCreacion: row.FechaCreacion || '',
      ultimoAcceso: row.UltimoAcceso || '',
    }));
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return [];
  }
}

export async function obtenerUsuarioPorEmail(email: string): Promise<Usuario | null> {
  try {
    const response = await fetch(
      `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_USUARIOS_TABLE_ID}/records?where=(Email,eq,${encodeURIComponent(email)})`, 
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.list && data.list.length > 0) {
      const row = data.list[0];
      return {
        id: row.Id?.toString() || '',
        email: row.Email || '',
        nombre: row.Nombre || '',
        rol: (row.Rol as Rol) || 'Viewer',
        estado: (row.Estado as EstadoUsuario) || 'Activo',
        fechaCreacion: row.FechaCreacion || '',
        ultimoAcceso: row.UltimoAcceso || '',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener usuario por email:', error);
    return null;
  }
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  try {
    const response = await fetch(
      `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_USUARIOS_TABLE_ID}/records?where=(Id,eq,${id})`, 
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.list && data.list.length > 0) {
      const row = data.list[0];
      return {
        id: row.Id?.toString() || '',
        email: row.Email || '',
        nombre: row.Nombre || '',
        rol: (row.Rol as Rol) || 'Viewer',
        estado: (row.Estado as EstadoUsuario) || 'Activo',
        fechaCreacion: row.FechaCreacion || '',
        ultimoAcceso: row.UltimoAcceso || '',
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    return null;
  }
}

export async function crearUsuario(datosUsuario: UsuarioRegistro): Promise<boolean> {
  try {
    // Validar que el email no exista
    const usuarioExistente = await obtenerUsuarioPorEmail(datosUsuario.email);
    if (usuarioExistente) {
      throw new Error('Ya existe un usuario con este email');
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(datosUsuario.password, 12);

    const data = {
      Email: datosUsuario.email,
      Password: passwordHash,
      Nombre: datosUsuario.nombre,
      Rol: datosUsuario.rol,
      Estado: 'Activo',
      FechaCreacion: new Date().toISOString(),
    };

    const response = await fetch(`${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_USUARIOS_TABLE_ID}/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NocoDB - Error al crear usuario:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return false;
  }
}

export async function actualizarUltimoAcceso(id: string): Promise<boolean> {
  try {
    const updateData = {
      Id: parseInt(id),
      UltimoAcceso: new Date().toISOString(),
    };

    const response = await fetch(`${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_USUARIOS_TABLE_ID}/records`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify([updateData]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NocoDB - Error al actualizar último acceso:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al actualizar último acceso:', error);
    return false;
  }
}

export async function validarCredenciales(email: string, password: string): Promise<Usuario | null> {
  try {
    // Obtener usuario con password
    const response = await fetch(
      `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_USUARIOS_TABLE_ID}/records?where=(Email,eq,${encodeURIComponent(email)})`, 
      { headers }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.list || data.list.length === 0) {
      return null;
    }

    const row = data.list[0];
    
    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, row.Password);
    if (!passwordValida) {
      return null;
    }

    // Verificar que el usuario esté activo
    if (row.Estado !== 'Activo') {
      return null;
    }

    // Actualizar último acceso
    await actualizarUltimoAcceso(row.Id?.toString());

    return {
      id: row.Id?.toString() || '',
      email: row.Email || '',
      nombre: row.Nombre || '',
      rol: (row.Rol as Rol) || 'Viewer',
      estado: (row.Estado as EstadoUsuario) || 'Activo',
      fechaCreacion: row.FechaCreacion || '',
      ultimoAcceso: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error al validar credenciales:', error);
    return null;
  }
}

export async function actualizarUsuario(id: string, datos: Partial<Usuario>): Promise<boolean> {
  try {
    const updateData = {
      Id: parseInt(id),
      ...(datos.nombre && { Nombre: datos.nombre }),
      ...(datos.email && { Email: datos.email }),
      ...(datos.rol && { Rol: datos.rol }),
      ...(datos.estado && { Estado: datos.estado }),
    };

    const response = await fetch(`${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_USUARIOS_TABLE_ID}/records`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify([updateData]),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NocoDB - Error al actualizar usuario:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return false;
  }
}

// Utilidades para verificar permisos
export function tienePermisoLectura(rol: Rol): boolean {
  return ['SuperAdmin', 'Admin', 'Editor', 'Viewer'].includes(rol);
}

export function tienePermisoEscritura(rol: Rol): boolean {
  return ['SuperAdmin', 'Admin', 'Editor'].includes(rol);
}

export function tienePermisoAdmin(rol: Rol): boolean {
  return ['SuperAdmin', 'Admin'].includes(rol);
}

export function puedeGestionarUsuarios(rol: Rol): boolean {
  return rol === 'SuperAdmin'; // Solo SuperAdmin puede gestionar usuarios
}

export function esSuperAdmin(rol: Rol): boolean {
  return rol === 'SuperAdmin';
}