import { NextRequest, NextResponse } from 'next/server';
import { subirImagenANocoDB, validarImagen360 } from '@/lib/images';
import { verificarPermisos } from '@/lib/middleware-auth';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  // Verificar que solo SuperAdmin, Admin, Editor o Add puedan subir imágenes
  const { permitido, response } = await verificarPermisos(request, ['SuperAdmin', 'Admin', 'Editor', 'Add']);
  if (!permitido) {
    return response;
  }

  try {
    const formData = await request.formData();

    // Obtener todas las imágenes convencionales del FormData
    const imagenes = formData.getAll('imagenes') as File[];

    // Obtener imagen 360 si existe
    const imagen360 = formData.get('imagen360') as File | null;

    if (imagenes.length === 0 && !imagen360) {
      return NextResponse.json(
        { error: 'No se encontraron imágenes para subir' },
        { status: 400 }
      );
    }

    const urls: string[] = [];
    let url360 = '';

    // Subir cada imagen convencional
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

    // Subir imagen 360° si existe
    if (imagen360 && imagen360.size > 0) {
      try {
        const buffer = Buffer.from(await imagen360.arrayBuffer());

        // Validar que sea imagen 360°
        const metadata = await sharp(buffer).metadata();
        if (!validarImagen360(metadata.width || 0, metadata.height || 0)) {
          return NextResponse.json(
            { error: 'La imagen 360° debe tener formato equirectangular (relación 2:1)' },
            { status: 400 }
          );
        }

        const fileName = `imagen_360_${Date.now()}.jpg`;
        const resultado = await subirImagenANocoDB(buffer, fileName, true);
        url360 = resultado.url;
      } catch (imageError) {
        console.error('Error al subir imagen 360°:', imageError);
        return NextResponse.json(
          { error: `Error al subir imagen 360°: ${imageError instanceof Error ? imageError.message : 'Error desconocido'}` },
          { status: 400 }
        );
      }
    }

    const response: any = {
      mensaje: `${urls.length} imagen(es) convencional(es) subida(s) exitosamente`,
      urls
    };

    if (url360) {
      response.mensaje += ` y 1 imagen 360° subida`;
      response.url360 = url360;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en API upload-images:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
