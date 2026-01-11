import sharp from 'sharp';

export interface ImageUploadResult {
  url: string;
  id: string;
  width: number;
  height: number;
}

/**
 * Valida si una imagen es equirectangular (formato 360°)
 */
export function validarImagen360(width: number, height: number): boolean {
  const ratio = width / height;
  // Las imágenes 360° equirectangulares tienen una relación de aspecto de 2:1
  return Math.abs(ratio - 2) < 0.1; // Permitir pequeña variación
}

/**
 * Optimiza imagen 360° para web
 */
export async function optimizarImagen360(buffer: Buffer): Promise<Buffer> {
  // Obtener dimensiones originales
  const metadata = await sharp(buffer).metadata();
  const { width = 0, height = 0 } = metadata;
  
  // Determinar el tamaño óptimo manteniendo proporción 2:1
  let targetWidth = width;
  let targetHeight = height;
  
  // Si es muy grande, reducir manteniendo calidad para 360°
  if (width > 6144) {
    targetWidth = 6144;
    targetHeight = 3072;
  } else if (width > 4096) {
    targetWidth = 4096;
    targetHeight = 2048;
  }
  
  console.log(`Optimizando 360°: ${width}x${height} → ${targetWidth}x${targetHeight}`);
  
  return await sharp(buffer)
    .resize(targetWidth, targetHeight, {
      fit: 'fill', // Mantener exactamente 2:1 para 360°
      kernel: sharp.kernel.lanczos3 // Mejor algoritmo para redimensionar
    })
    .jpeg({
      quality: 85, // Mejor calidad para 360°
      progressive: true,
      mozjpeg: true, // Compresión más eficiente
      optimizeScans: true
    })
    .toBuffer();
}

/**
 * Optimiza imagen convencional
 */
export async function optimizarImagenConvencional(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(1200, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality: 85
    })
    .toBuffer();
}

/**
 * Sube imagen a NocoDB como attachment
 */
export async function subirImagenANocoDB(
  buffer: Buffer,
  fileName: string,
  isImage360: boolean = false
): Promise<ImageUploadResult> {
  try {
    const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL;
    const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
    const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID;

    // Validar que el buffer contiene una imagen válida
    let metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch (sharpError) {
      throw new Error('El archivo no es una imagen válida');
    }

    // Optimizar imagen según su tipo
    const optimizedBuffer = isImage360 
      ? await optimizarImagen360(buffer)
      : await optimizarImagenConvencional(buffer);

    // Crear FormData para el upload
    const formData = new FormData();
    const uint8Array = new Uint8Array(optimizedBuffer);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
    formData.append('file', blob, fileName);

    // Timeout mayor para imágenes 360°
    const controller = new AbortController();
    const timeoutMs = isImage360 ? 120000 : 45000; // 2 minutos para 360°
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${NOCODB_BASE_URL}/api/v1/db/storage/upload`, {
      method: 'POST',
      headers: {
        'xc-token': NOCODB_API_TOKEN || '',
      },
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al subir imagen: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Diferentes posibles estructuras de respuesta de NocoDB
    let imageUrl = '';
    let imageId = '';
    
    if (Array.isArray(result)) {
      // Si es un array
      imageUrl = result[0]?.signedUrl || result[0]?.url || result[0]?.path || '';
      imageId = result[0]?.id || result[0]?.title || '';
    } else if (result && typeof result === 'object') {
      // Si es un objeto directo
      imageUrl = result.signedUrl || result.url || result.path || '';
      imageId = result.id || result.title || '';
    }
    
    // Completar la URL con la base de NocoDB si es relativa
    const fullUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${NOCODB_BASE_URL}/${imageUrl}`;
    
    return {
      url: fullUrl,
      id: imageId,
      width: metadata?.width || 0,
      height: metadata?.height || 0,
    };
  } catch (error) {
    console.error('Error al subir imagen a NocoDB:', error);
    throw error; // Re-lanzar el error original para mejor debugging
  }
}