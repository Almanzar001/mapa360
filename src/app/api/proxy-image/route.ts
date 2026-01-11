import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de imagen requerida' },
        { status: 400 }
      );
    }

    // Verificar que la URL sea de nuestro NocoDB
    const nocodb_base_url = process.env.NOCODB_BASE_URL;
    if (!imageUrl.startsWith(nocodb_base_url!)) {
      return NextResponse.json(
        { error: 'URL de imagen no válida' },
        { status: 403 }
      );
    }

    // Hacer fetch a la imagen con los headers de NocoDB
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'xc-token': process.env.NOCODB_API_TOKEN || '',
      },
    });

    if (!imageResponse.ok) {
      throw new Error(`Error al obtener imagen: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Crear respuesta con headers CORS apropiados
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error al servir imagen:', error);
    return NextResponse.json(
      { error: 'Error al obtener la imagen' },
      { status: 500 }
    );
  }
}