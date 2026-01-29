import { NextRequest, NextResponse } from 'next/server';
import { agregarUbicacion } from '@/lib/nocodb';
import { subirImagenANocoDB, validarImagen360 } from '@/lib/images';
import { validarUbicacion, crearUbicacion } from '@/lib/ubicacion-utils';
import { verificarPermisos } from '@/lib/middleware-auth';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  // Verificar que solo SuperAdmin, Admin, Editor o Add puedan crear ubicaciones
  const { permitido, response } = await verificarPermisos(request, ['SuperAdmin', 'Admin', 'Editor', 'add']);
  if (!permitido) {
    return response;
  }

  try {
    const formData = await request.formData();
    
    // Extraer datos del formulario
    const nombre = formData.get('nombre') as string;
    const ubicacion = formData.get('ubicacion') as string;
    const codigo = formData.get('codigo') as string || '';
    const fechaEmision = formData.get('fechaEmision') as string || '';
    const estado = formData.get('estado') as 'Activo' | 'Inactivo';
    const categoria = formData.get('categoria') as 'Mina' | 'Hormigonera' | 'Permiso';
    const permiso = formData.get('permiso') as 'Tiene' | 'No Tiene';
    const vigenciaStr = formData.get('vigencia') as string;
    const vigencia = vigenciaStr ? parseInt(vigenciaStr) : undefined;
    const notas = formData.get('notas') as string || '';

    // Procesar imágenes convencionales
    const imagenesConvencionales: File[] = [];
    let index = 0;
    while (formData.get(`imagen_${index}`)) {
      imagenesConvencionales.push(formData.get(`imagen_${index}`) as File);
      index++;
    }

    // Procesar imagen 360°
    const imagen360 = formData.get('imagen360') as File | null;

    // Validaciones
    if (!nombre || !ubicacion || !categoria || !permiso) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar campos específicos si tiene permiso
    if (permiso === 'Tiene' && (!fechaEmision || !vigencia)) {
      return NextResponse.json(
        { error: 'Fecha de emisión y vigencia son requeridas cuando tiene permiso' },
        { status: 400 }
      );
    }

    // Validar formato de ubicación
    if (!validarUbicacion(ubicacion)) {
      return NextResponse.json(
        { error: 'Formato de ubicación inválido. Use el formato: latitud,longitud' },
        { status: 400 }
      );
    }

    // Subir imágenes convencionales
    const urlImagenes: string[] = [];
    for (let i = 0; i < imagenesConvencionales.length; i++) {
      const imagen = imagenesConvencionales[i];
      if (imagen && imagen.size > 0) {
        try {
          const buffer = Buffer.from(await imagen.arrayBuffer());
          const fileName = `imagen_convencional_${Date.now()}_${i}.jpg`;
          const resultado = await subirImagenANocoDB(buffer, fileName, false);
          urlImagenes.push(resultado.url);
        } catch (imageError) {
          console.error(`Error al subir imagen ${i}:`, imageError);
          return NextResponse.json(
            { error: `Error al subir imagen ${i + 1}: ${imageError instanceof Error ? imageError.message : 'Error desconocido'}` },
            { status: 400 }
          );
        }
      }
    }

    // Subir imagen 360° si existe
    let urlFoto360 = '';
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
        urlFoto360 = resultado.url;
      } catch (imageError) {
        console.error('Error al subir imagen 360°:', imageError);
        return NextResponse.json(
          { error: `Error al subir imagen 360°: ${imageError instanceof Error ? imageError.message : 'Error desconocido'}` },
          { status: 400 }
        );
      }
    }

    // Debug: log de los datos que se van a guardar
    console.log('Datos a guardar:', {
      nombre,
      ubicacion,
      codigo,
      fechaEmision,
      estado,
      categoria,
      permiso,
      vigencia,
      urlImagenes,
      urlFoto360,
      notas,
    });

    // Guardar en NocoDB - usar crearUbicacion para manejar computed properties
    const ubicacionObj = crearUbicacion({
      nombre,
      ubicacion,
      codigo,
      fechaEmision,
      estado,
      categoria,
      permiso,
      vigencia,
      urlImagenes,
      urlFoto360,
      notas,
    });

    const exito = await agregarUbicacion(ubicacionObj);

    if (exito) {
      return NextResponse.json({ mensaje: 'Ubicación agregada exitosamente' });
    } else {
      return NextResponse.json(
        { error: 'Error al guardar en NocoDB' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en API agregar ubicación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}