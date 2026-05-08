import { NextRequest, NextResponse } from 'next/server';
import { insforgeGetUser } from '@/lib/insforge-auth';
import { obtenerUsuarioPorEmail } from '@/lib/usuarios';
import { obtenerTokenDeCookies } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = obtenerTokenDeCookies(request);
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar token con InsForge
    const insforgeUser = await insforgeGetUser(token);
    if (!insforgeUser) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    // Obtener rol y estado desde la tabla usuarios
    const usuario = await obtenerUsuarioPorEmail(insforgeUser.email);
    if (!usuario || usuario.estado !== 'Activo') {
      return NextResponse.json({ error: 'Usuario inactivo o sin acceso' }, { status: 403 });
    }

    return NextResponse.json({
      usuario: {
        id: insforgeUser.id,
        email: insforgeUser.email,
        nombre: usuario.nombre,
        rol: usuario.rol,
        estado: usuario.estado,
      },
    });
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
