import { NextRequest, NextResponse } from 'next/server';
import { verificarPermisos } from '@/lib/middleware-auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Test endpoint called');
    
    const { permitido, usuario, response } = await verificarPermisos(request, ['SuperAdmin', 'Admin', 'Editor']);
    
    if (!permitido) {
      console.log('User not authorized');
      return response;
    }
    
    console.log('User authorized:', usuario?.email);
    
    return NextResponse.json({ 
      message: 'Test endpoint working',
      user: usuario 
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Test endpoint failed' },
      { status: 500 }
    );
  }
}