import { NextRequest, NextResponse } from 'next/server';
import { verificarPermisos } from '@/lib/middleware-auth';
import { eliminarUbicacion } from '@/lib/nocodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar que solo Admin y SuperAdmin puedan eliminar ubicaciones
    const { permitido, response } = await verificarPermisos(request, ['Admin', 'SuperAdmin']);
    
    if (!permitido) {
      return response;
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de ubicación requerido' },
        { status: 400 }
      );
    }

    // Eliminar ubicación de NocoDB
    const eliminada = await eliminarUbicacion(id);
    
    if (!eliminada) {
      return NextResponse.json(
        { error: 'No se pudo eliminar la ubicación' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ubicación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar ubicación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}