import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarios } from '@/lib/usuarios';
import { verificarPermisos } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  // Verificar que solo SuperAdmin pueda obtener lista de usuarios
  const { permitido, response } = await verificarPermisos(request, ['SuperAdmin']);
  
  if (!permitido) {
    return response;
  }

  try {
    const usuarios = await obtenerUsuarios();
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}