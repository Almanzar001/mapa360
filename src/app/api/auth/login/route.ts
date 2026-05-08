import { NextRequest, NextResponse } from 'next/server';
import { insforgeSignIn } from '@/lib/insforge-auth';
import { obtenerUsuarioPorEmail } from '@/lib/usuarios';
import { crearCookieDeAutenticacion } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    // Autenticar con InsForge
    const session = await insforgeSignIn(email, password);
    if (!session) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Obtener rol y estado desde la tabla usuarios
    const usuario = await obtenerUsuarioPorEmail(email);
    if (!usuario || usuario.estado !== 'Activo') {
      return NextResponse.json({ error: 'Usuario inactivo o sin acceso' }, { status: 403 });
    }

    const response = NextResponse.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: session.user.id,
        email: session.user.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });

    response.headers.set('Set-Cookie', crearCookieDeAutenticacion(session.accessToken));
    return response;
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
