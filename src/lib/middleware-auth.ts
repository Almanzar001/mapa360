import { NextRequest, NextResponse } from 'next/server';
import { insforgeGetUser } from './insforge-auth';
import { obtenerUsuarioPorEmail } from './usuarios';
import { obtenerTokenDeCookies } from './auth';
import { Rol } from '@/types';

export async function verificarAutenticacion(request: NextRequest): Promise<{
  autenticado: boolean;
  usuario?: { id: string; email: string; nombre: string; rol: Rol };
  response?: NextResponse;
}> {
  const token = obtenerTokenDeCookies(request);
  if (!token) {
    return { autenticado: false, response: NextResponse.redirect(new URL('/login', request.url)) };
  }

  const insforgeUser = await insforgeGetUser(token);
  if (!insforgeUser) {
    return { autenticado: false, response: NextResponse.redirect(new URL('/login', request.url)) };
  }

  const usuario = await obtenerUsuarioPorEmail(insforgeUser.email);
  if (!usuario || usuario.estado !== 'Activo') {
    return { autenticado: false, response: NextResponse.redirect(new URL('/login', request.url)) };
  }

  return {
    autenticado: true,
    usuario: { id: insforgeUser.id, email: insforgeUser.email, nombre: usuario.nombre, rol: usuario.rol },
  };
}

export async function verificarPermisos(
  request: NextRequest,
  rolesPermitidos: Rol[]
): Promise<{
  permitido: boolean;
  usuario?: { id: string; email: string; nombre: string; rol: Rol };
  response?: NextResponse;
}> {
  const { autenticado, usuario, response } = await verificarAutenticacion(request);
  if (!autenticado) return { permitido: false, response };

  if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
    return {
      permitido: false,
      response: NextResponse.json({ error: 'No tienes permisos para acceder a este recurso' }, { status: 403 }),
    };
  }

  return { permitido: true, usuario };
}
