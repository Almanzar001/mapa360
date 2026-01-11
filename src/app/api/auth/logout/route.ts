import { NextRequest, NextResponse } from 'next/server';
import { crearCookieDeLogout } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      mensaje: 'Logout exitoso'
    });

    // Limpiar cookie de autenticación
    response.headers.set('Set-Cookie', crearCookieDeLogout());

    return response;
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}