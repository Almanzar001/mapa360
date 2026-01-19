import { NextRequest, NextResponse } from 'next/server';
import { subirImagenANocoDB } from '@/lib/images';
import { verificarPermisos } from '@/lib/middleware-auth';

export async function POST(request: NextRequest) {
  // Verificar que solo SuperAdmin, Admin o Editor puedan subir imágenes
  const { permitido, response } = await verificarPermisos(request, ['SuperAdmin', 'Admin', 'Editor']);
  if (!permitido) {
    return response;
  }

  try {
    const formData = await request.formData();

    // Obtener todas las imágenes del FormData
    const imagenes = formData.getAll('imagenes') as File[];

    if (imagenes.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron imágenes para subir' },
        { status: 400 }
      );
    }

    const urls: string[] = [];

    // Subir cada imagen
    for (let i = 0; i < imagenes.length; i++) {
      const imagen = imagenes[i];

      if (!imagen || imagen.size === 0) {
        continue;
      }

      try {
        const buffer = Buffer.from(await imagen.arrayBuffer());
        const fileName = `imagen_${Date.now()}_${i}.jpg`;
        const resultado = await subirImagenANocoDB(buffer, fileName, false);
        urls.push(resultado.url);
      } catch (imageError) {
        console.error(`Error al subir imagen ${i}:`, imageError);
        return NextResponse.json(
          { error: `Error al subir imagen ${i + 1}: ${imageError instanceof Error ? imageError.message : 'Error desconocido'}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      mensaje: `${urls.length} imagen(es) subida(s) exitosamente`,
      urls
    });

  } catch (error) {
    console.error('Error en API upload-images:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
