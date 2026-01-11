import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { SesionUsuario } from '@/types';

const secretKey = process.env.JWT_SECRET || 'tu-clave-secreta-super-segura-cambiala-en-produccion';
const key = new TextEncoder().encode(secretKey);

export async function crearToken(usuario: SesionUsuario): Promise<string> {
  return await new SignJWT({ 
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    estado: usuario.estado
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verificarToken(token: string): Promise<SesionUsuario | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    return {
      id: payload.id as string,
      email: payload.email as string,
      nombre: payload.nombre as string,
      rol: payload.rol as 'SuperAdmin' | 'Admin' | 'Editor' | 'Viewer',
      estado: payload.estado as 'Activo' | 'Inactivo',
    };
  } catch (error) {
    console.error('Error al verificar token:', error);
    return null;
  }
}

export function obtenerTokenDeCookies(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies.token || null;
}

export function crearCookieDeAutenticacion(token: string): string {
  return `token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
}

export function crearCookieDeLogout(): string {
  return `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
}