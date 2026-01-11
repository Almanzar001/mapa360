import { NextRequest, NextResponse } from 'next/server';
import { obtenerTokenDeCookies, verificarToken } from '@/lib/auth';
import { obtenerUsuarioPorId } from '@/lib/usuarios';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de cookies
    const token = obtenerTokenDeCookies(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticación no encontrado' },
        { status: 401 }
      );
    }

    // Verificar token
    const datosToken = await verificarToken(token);
    if (!datosToken) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 401 }
      );
    }

    // Obtener datos actualizados del usuario
    const usuario = await obtenerUsuarioPorId(datosToken.id);
    if (!usuario || usuario.estado !== 'Activo') {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        estado: usuario.estado,
      }
    });
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}