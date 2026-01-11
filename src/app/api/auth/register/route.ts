import { NextRequest, NextResponse } from 'next/server';
import { crearUsuario } from '@/lib/usuarios';
import { UsuarioRegistro } from '@/types';
import { verificarPermisos } from '@/lib/middleware-auth';

export async function POST(request: NextRequest) {
  // Verificar que solo SuperAdmin pueda crear usuarios
  const { permitido, response } = await verificarPermisos(request, ['SuperAdmin']);
  if (!permitido) {
    return response;
  }
  try {
    const datosUsuario: UsuarioRegistro = await request.json();

    // Validaciones básicas
    if (!datosUsuario.email || !datosUsuario.password || !datosUsuario.nombre) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(datosUsuario.email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (datosUsuario.password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar rol - SuperAdmin no puede crear otro SuperAdmin
    if (!['Admin', 'Editor', 'Viewer'].includes(datosUsuario.rol)) {
      return NextResponse.json(
        { error: 'Rol inválido. Solo se pueden crear usuarios: Admin, Editor, Viewer' },
        { status: 400 }
      );
    }

    // Crear usuario
    const exito = await crearUsuario(datosUsuario);
    if (!exito) {
      return NextResponse.json(
        { error: 'Error al crear usuario. Posiblemente el email ya existe.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      mensaje: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}