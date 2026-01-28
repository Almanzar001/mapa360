import { Ubicacion, Categoria } from '@/types';
import { crearUbicacion, coordenadasToString, extraerLatitud, extraerLongitud } from './ubicacion-utils';
import { createProxyImageUrl } from './image-proxy';

const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL;
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN;
const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID;

const headers = {
  'Content-Type': 'application/json',
  'xc-token': NOCODB_API_TOKEN || '',
};

export async function obtenerUbicaciones(): Promise<Ubicacion[]> {
  try {
    // Agregar parámetro limit para obtener más de 25 registros (default de NocoDB)
    // Usar un número alto (1000) para obtener todas las ubicaciones
    const response = await fetch(`${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records?limit=1000`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();

    console.log('NocoDB GET response:', data.list?.length || 0, 'registros obtenidos');

    return data.list.map((row: any): Ubicacion => {
      // Parsear URLs de imágenes - NocoDB devuelve arrays directamente
      let urlImagenes: string[] = [];
      if (row.URL_Imagenes) {
        console.log('Raw URL_Imagenes data:', row.URL_Imagenes);
        if (Array.isArray(row.URL_Imagenes)) {
          // Ya es un array de objetos attachment de NocoDB - priorizar signedUrl
          urlImagenes = row.URL_Imagenes.map((img: any) => {
            let url = img.signedUrl || img.url || img.path;
            console.log('Raw image URL:', url);
            
            // Asegurar que sea una URL completa
            if (url && !url.startsWith('http')) {
              url = `${process.env.NOCODB_BASE_URL}${url}`;
            }
            
            // Aplicar proxy en producción
            const finalUrl = createProxyImageUrl(url);
            console.log('Final image URL:', finalUrl);
            return finalUrl;
          }).filter(Boolean);
        } else if (typeof row.URL_Imagenes === 'string') {
          try {
            const imagenesJson = JSON.parse(row.URL_Imagenes);
            urlImagenes = Array.isArray(imagenesJson) 
              ? imagenesJson.map((img: any) => {
                  let url = img.url || img.path || img;
                  if (url && !url.startsWith('http')) {
                    url = `${process.env.NOCODB_BASE_URL}${url}`;
                  }
                  return createProxyImageUrl(url);
                }).filter(Boolean)
              : [];
          } catch {
            urlImagenes = row.URL_Imagenes.split(',').map((url: string) => url.trim()).filter(Boolean);
          }
        }
      }

      // Parsear URL de foto 360
      let urlFoto360 = '';
      if (row.URL_Foto_360) {
        console.log('Raw URL_Foto_360 data:', row.URL_Foto_360);
        if (Array.isArray(row.URL_Foto_360) && row.URL_Foto_360.length > 0) {
          // Ya es un array de objetos attachment de NocoDB - priorizar signedUrl para acceso público
          let url = row.URL_Foto_360[0].signedUrl || row.URL_Foto_360[0].url || row.URL_Foto_360[0].path;
          console.log('Raw 360 URL:', url);
          // Asegurar que sea una URL completa
          if (url && !url.startsWith('http')) {
            url = `${process.env.NOCODB_BASE_URL}${url}`;
          }
          // Aplicar proxy en producción
          urlFoto360 = createProxyImageUrl(url);
          console.log('Final 360 URL:', urlFoto360);
        } else if (typeof row.URL_Foto_360 === 'string') {
          try {
            const foto360Json = JSON.parse(row.URL_Foto_360);
            if (Array.isArray(foto360Json) && foto360Json.length > 0) {
              let url = foto360Json[0].url || foto360Json[0].path || foto360Json[0];
              if (url && !url.startsWith('http')) {
                url = `${process.env.NOCODB_BASE_URL}${url}`;
              }
              urlFoto360 = createProxyImageUrl(url);
            } else {
              let url = foto360Json.url || foto360Json.path || foto360Json;
              if (url && !url.startsWith('http')) {
                url = `${process.env.NOCODB_BASE_URL}${url}`;
              }
              urlFoto360 = createProxyImageUrl(url);
            }
          } catch {
            urlFoto360 = row.URL_Foto_360;
          }
        }
      }

      // Manejar tanto el formato nuevo (Ubicacion) como el legacy (Latitud/Longitud)
      let ubicacion = '';
      if (row.Ubicacion) {
        // Formato nuevo
        ubicacion = row.Ubicacion;
      } else if (row.Latitud && row.Longitud) {
        // Formato legacy - convertir a nuevo formato
        ubicacion = coordenadasToString(parseFloat(row.Latitud), parseFloat(row.Longitud));
      }

      return crearUbicacion({
        id: row.Id?.toString() || '',
        nombre: row.Nombre || '',
        ubicacion,
        fechaEmision: row.Fecha_Emision || undefined,
        estado: (row.Estado as 'Activo' | 'Inactivo') || 'Inactivo',
        categoria: (row.Categoria as Categoria) || 'Permiso',
        vigencia: row.Vigencia ? parseInt(row.Vigencia) : undefined,
        permiso: row.Permiso || 'Tiene', // Default 'Tiene' si no se especifica
        urlImagenes,
        urlFoto360,
        notas: row.Notas || '',
      });
    });
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    return [];
  }
}

export async function agregarUbicacion(ubicacion: Omit<Ubicacion, 'id'>): Promise<boolean> {
  try {
    // Formatear attachments según el formato esperado por NocoDB
    let urlImagenesJson = null;
    if (ubicacion.urlImagenes.length > 0) {
      urlImagenesJson = JSON.stringify(ubicacion.urlImagenes.map(url => ({
        url: url,
        title: url.split('/').pop() || url,
        mimetype: 'image/jpeg',
        size: 0
      })));
    }

    let urlFoto360Json = null;
    if (ubicacion.urlFoto360) {
      urlFoto360Json = JSON.stringify([{
        url: ubicacion.urlFoto360,
        title: ubicacion.urlFoto360.split('/').pop() || ubicacion.urlFoto360,
        mimetype: 'image/jpeg',
        size: 0
      }]);
    }

    const data = {
      Nombre: ubicacion.nombre,
      Ubicacion: ubicacion.ubicacion, // Nuevo campo unificado
      Estado: ubicacion.estado,
      Categoria: ubicacion.categoria,
      Permiso: ubicacion.permiso,
      ...(ubicacion.fechaEmision && { Fecha_Emision: ubicacion.fechaEmision }),
      ...(ubicacion.vigencia && { Vigencia: ubicacion.vigencia }),
      URL_Imagenes: urlImagenesJson,
      URL_Foto_360: urlFoto360Json,
      Notas: ubicacion.notas || '',
    };

    // console.log('NocoDB - Datos a enviar:', data);

    const response = await fetch(`${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NocoDB - Error response:', errorText);
    }

    return response.ok;
  } catch (error) {
    console.error('Error al agregar ubicación:', error);
    return false;
  }
}

export async function actualizarUbicacion(id: string, ubicacion: Partial<Ubicacion>): Promise<boolean> {
  try {
    console.log('Actualizando ubicación con ID:', id, 'Datos:', ubicacion);
    
    // NocoDB requiere el ID como entero en el objeto de actualización
    const updateData = {
      Id: parseInt(id), // ID debe ser entero
      ...(ubicacion.nombre && { Nombre: ubicacion.nombre }),
      ...(ubicacion.ubicacion && { Ubicacion: ubicacion.ubicacion }),
      ...(ubicacion.fechaEmision !== undefined && { Fecha_Emision: ubicacion.fechaEmision }),
      ...(ubicacion.estado && { Estado: ubicacion.estado }),
      ...(ubicacion.categoria && { Categoria: ubicacion.categoria }),
      ...(ubicacion.vigencia !== undefined && { Vigencia: ubicacion.vigencia }),
      ...(ubicacion.permiso && { Permiso: ubicacion.permiso }),
      ...(ubicacion.urlImagenes && { URL_Imagenes: JSON.stringify(ubicacion.urlImagenes.map(url => ({ url, title: url.split('/').pop(), mimetype: 'image/jpeg', size: 0 }))) }),
      ...(ubicacion.urlFoto360 && { URL_Foto_360: JSON.stringify([{ url: ubicacion.urlFoto360, title: ubicacion.urlFoto360.split('/').pop(), mimetype: 'image/jpeg', size: 0 }]) }),
      ...(ubicacion.notas !== undefined && { Notas: ubicacion.notas }),
    };

    console.log('Datos a enviar a NocoDB (bulk format):', updateData);

    // NocoDB requiere formato de array para bulk update
    const url = `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`;
    console.log('URL de actualización (bulk):', url);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify([updateData]), // Enviar como array
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NocoDB - Error response:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('NocoDB - Actualización exitosa:', result);
    
    // Verificar que se actualizó correctamente
    return Array.isArray(result) && result.length > 0 && result[0].Id == id;
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    return false;
  }
}

export async function eliminarUbicacion(id: string): Promise<boolean> {
  try {
    console.log('Eliminando ubicación con ID:', id);
    
    const url = `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`;
    console.log('URL de eliminación:', url);
    
    // NocoDB requiere DELETE con array de IDs para bulk delete
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify([{ Id: parseInt(id) }]), // Enviar como array con ID como entero
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NocoDB - Error response:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('NocoDB - Eliminación exitosa:', result);
    
    // Verificar que se eliminó correctamente
    return true;
  } catch (error) {
    console.error('Error al eliminar ubicación:', error);
    return false;
  }
}