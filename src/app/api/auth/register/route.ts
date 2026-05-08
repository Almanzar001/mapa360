import { NextRequest, NextResponse } from 'next/server';
import { insforgeSignUp } from '@/lib/insforge-auth';
import { dbInsert, dbQuery } from '@/lib/insforge';
import { verificarPermisos } from '@/lib/middleware-auth';
import { Rol } from '@/types';

export async function POST(request: NextRequest) {
  const { permitido, response } = await verificarPermisos(request, ['SuperAdmin']);
  if (!permitido) return response!;

  try {
    const { email, password, nombre, rol } = await request.json();

    if (!email || !password || !nombre) {
      return NextResponse.json({ error: 'Email, contraseña y nombre son requeridos' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const rolesValidos: Rol[] = ['Admin', 'Editor', 'Viewer', 'add'];
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido. Roles permitidos: Admin, Editor, Viewer, add' }, { status: 400 });
    }

    // Crear usuario en InsForge Auth
    const session = await insforgeSignUp(email, password, nombre);
    if (!session) {
      return NextResponse.json({ error: 'Error al crear usuario en InsForge' }, { status: 400 });
    }

    // Verificar que no exista en tabla usuarios
    const existentes = await dbQuery('usuarios', { 'email': `eq.${email}`, limit: 1 });
    if (existentes.length > 0) {
      return NextResponse.json({ error: 'Ya existe un usuario con este email' }, { status: 409 });
    }

    // Insertar en tabla usuarios con rol
    await dbInsert('usuarios', {
      email,
      nombre,
      rol,
      estado: 'Activo',
      fecha_creacion: new Date().toISOString(),
      insforge_id: session.user?.id ?? null,
    });

    return NextResponse.json({ mensaje: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error en registro:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
