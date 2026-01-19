import { NextRequest, NextResponse } from 'next/server';
import { actualizarUsuario, obtenerUsuarioPorId, obtenerUsuarioPorEmail } from '@/lib/usuarios';
import { verificarPermisos } from '@/lib/middleware-auth';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar que solo SuperAdmin pueda actualizar usuarios
  const { permitido, response } = await verificarPermisos(request, ['SuperAdmin']);

  if (!permitido) {
    return response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, email, rol, estado, password } = body;

    // Verificar que el usuario existe
    const usuarioExistente = await obtenerUsuarioPorId(id);
    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Si se está cambiando el email, verificar que no esté en uso
    if (email && email !== usuarioExistente.email) {
      const emailEnUso = await obtenerUsuarioPorEmail(email);
      if (emailEnUso) {
        return NextResponse.json(
          { error: 'El email ya está en uso por otro usuario' },
          { status: 400 }
        );
      }
    }

    // Validaciones
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Preparar datos para actualizar
    const datosActualizacion: any = {};

    if (nombre) datosActualizacion.nombre = nombre;
    if (email) datosActualizacion.email = email;
    if (rol) datosActualizacion.rol = rol;
    if (estado) datosActualizacion.estado = estado;

    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      const passwordHash = await bcrypt.hash(password, 12);
      datosActualizacion.password = passwordHash;
    }

    // Actualizar usuario
    const actualizado = await actualizarUsuario(id, datosActualizacion);

    if (!actualizado) {
      return NextResponse.json(
        { error: 'Error al actualizar usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      usuario: await obtenerUsuarioPorId(id)
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
