import { NextRequest, NextResponse } from 'next/server';
import { obtenerUbicaciones } from '@/lib/nocodb';
import { verificarAutenticacion } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  // Verificar autenticación
  const { autenticado, response } = await verificarAutenticacion(request);
  if (!autenticado) {
    return response;
  }

  try {
    const ubicaciones = await obtenerUbicaciones();
    return NextResponse.json(ubicaciones);
  } catch (error) {
    console.error('Error en API ubicaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener ubicaciones' },
      { status: 500 }
    );
  }
}