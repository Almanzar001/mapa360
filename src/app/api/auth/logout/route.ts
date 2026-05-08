import { NextRequest, NextResponse } from 'next/server';
import { insforgeSignOut } from '@/lib/insforge-auth';
import { obtenerTokenDeCookies, crearCookieDeLogout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = obtenerTokenDeCookies(request);
    if (token) await insforgeSignOut(token);

    const response = NextResponse.json({ mensaje: 'Logout exitoso' });
    response.headers.set('Set-Cookie', crearCookieDeLogout());
    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
