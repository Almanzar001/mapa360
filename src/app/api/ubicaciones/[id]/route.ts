import { NextRequest, NextResponse } from 'next/server';
import { actualizarUbicacion } from '@/lib/nocodb';
import { validarUbicacion } from '@/lib/ubicacion-utils';
import { verificarPermisos } from '@/lib/middleware-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar que solo SuperAdmin, Admin o Editor puedan editar ubicaciones
  const { permitido, response } = await verificarPermisos(request, ['SuperAdmin', 'Admin', 'Editor']);
  if (!permitido) {
    return response;
  }

  try {
    const { id } = await params;
    const data = await request.json();
    
    // Validaciones
    if (!data.nombre || !data.ubicacion || !data.fechaEmision || !data.fechaFinalizacion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de ubicación
    if (!validarUbicacion(data.ubicacion)) {
      return NextResponse.json(
        { error: 'Formato de ubicación inválido. Use el formato: latitud,longitud' },
        { status: 400 }
      );
    }

    // Validar vigencia
    if (!data.vigencia || data.vigencia < 1) {
      return NextResponse.json(
        { error: 'La vigencia debe ser al menos 1 día' },
        { status: 400 }
      );
    }

    // Preparar datos para actualización
    const ubicacionActualizada = {
      id,
      nombre: data.nombre,
      ubicacion: data.ubicacion,
      fechaEmision: data.fechaEmision,
      fechaFinalizacion: data.fechaFinalizacion,
      estado: data.estado as 'Activo' | 'Inactivo',
      categoria: data.categoria as 'Mina' | 'Hormigonera' | 'Permiso',
      vigencia: parseInt(data.vigencia),
      notas: data.notas || '',
    };

    console.log('Actualizando ubicación:', id, ubicacionActualizada);

    // Actualizar en NocoDB
    const exito = await actualizarUbicacion(id, ubicacionActualizada);

    if (exito) {
      return NextResponse.json({ 
        mensaje: 'Ubicación actualizada exitosamente',
        ubicacion: ubicacionActualizada
      });
    } else {
      return NextResponse.json(
        { error: 'Error al actualizar en NocoDB' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en API actualizar ubicación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}