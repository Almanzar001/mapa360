import { NextRequest, NextResponse } from 'next/server';
import { validarCredenciales } from '@/lib/usuarios';
import { crearToken, crearCookieDeAutenticacion } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar credenciales
    const usuario = await validarCredenciales(email, password);
    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciales inválidas o usuario inactivo' },
        { status: 401 }
      );
    }

    // Crear token JWT
    const token = await crearToken(usuario);

    // Crear respuesta con cookie
    const response = NextResponse.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      }
    });

    // Establecer cookie de autenticación
    response.headers.set('Set-Cookie', crearCookieDeAutenticacion(token));

    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}